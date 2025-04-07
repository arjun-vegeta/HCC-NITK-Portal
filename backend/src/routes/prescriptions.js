const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../database/init');
const { auth, authorize } = require('../middleware/auth');
const doctorAuth = [auth, authorize(['doctor'])];
const patientAuth = [auth, authorize(['student'])];

// Create new prescription
router.post('/', doctorAuth, [
  body('patient_id').isInt().withMessage('Patient ID is required'),
  body('notes').optional(),
  body('drugs').isArray().withMessage('Drugs must be an array'),
  body('drugs.*.drug_id').isInt().withMessage('Drug ID is required'),
  body('drugs.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('drugs.*.morning').isBoolean().withMessage('Morning flag must be boolean'),
  body('drugs.*.noon').isBoolean().withMessage('Noon flag must be boolean'),
  body('drugs.*.evening').isBoolean().withMessage('Evening flag must be boolean'),
  body('drugs.*.night').isBoolean().withMessage('Night flag must be boolean'),
  body('drugs.*.notes').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { patient_id, notes, drugs } = req.body;
    const doctor_id = req.user.id;
    
    // Get current date in YYYY-MM-DD format for SQLite
    const currentDate = new Date().toISOString().split('T')[0];
    
    console.log(`Creating prescription: doctor=${doctor_id}, patient=${patient_id}, drugs=${drugs.length}`);

    db.run('BEGIN TRANSACTION');

    // Create prescription with current date and "pending" status
    db.run(
      'INSERT INTO prescriptions (doctor_id, patient_id, notes, date, status) VALUES (?, ?, ?, ?, ?)',
      [doctor_id, patient_id, notes, currentDate, 'pending'],
      function(err) {
        if (err) {
          console.error('Error creating prescription:', err);
          db.run('ROLLBACK');
          return res.status(500).json({ message: 'Server error' });
        }

        const prescription_id = this.lastID;
        console.log(`Created prescription with ID: ${prescription_id}`);
        
        const stmt = db.prepare(`
          INSERT INTO prescription_drugs 
          (prescription_id, drug_id, quantity, morning, noon, evening, night, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        try {
          drugs.forEach(drug => {
            console.log('Adding drug to prescription:', {
              prescription_id: prescription_id,
              drug_id: drug.drug_id,
              quantity: drug.quantity,
              morning: drug.morning ? 1 : 0,
              noon: drug.noon ? 1 : 0,
              evening: drug.evening ? 1 : 0,
              night: drug.night ? 1 : 0,
              notes: drug.notes || ''
            });
            
            stmt.run([
              prescription_id,
              drug.drug_id,
              drug.quantity,
              drug.morning ? 1 : 0,
              drug.noon ? 1 : 0,
              drug.evening ? 1 : 0,
              drug.night ? 1 : 0,
              drug.notes || ''
            ], function(err) {
              if (err) {
                console.error('Error adding drug to prescription:', err);
                throw err;
              }
            });
          });

          stmt.finalize();
          db.run('COMMIT');

          console.log(`Successfully added ${drugs.length} drugs to prescription ${prescription_id}`);
          res.status(201).json({
            id: prescription_id,
            message: 'Prescription created successfully'
          });
        } catch (stmtError) {
          console.error('Error adding drugs to prescription:', stmtError);
          db.run('ROLLBACK');
          return res.status(500).json({ message: 'Error adding drugs to prescription' });
        }
      }
    );
  } catch (error) {
    console.error('Server error in prescription creation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending prescriptions for drugstore manager
router.get('/pending', [auth, authorize(['drugstore_manager'])], async (req, res) => {
  try {
    console.log('Fetching pending prescriptions for drugstore manager');
    
    const query = `
      SELECT 
        pd.id as prescription_drug_id,
        p.id as prescription_id, 
        p.date,
        u_patient.name as patient_name,
        u_doctor.name as doctor_name,
        d.name as drug_name,
        d.id as drug_id,
        pd.quantity,
        pd.morning,
        pd.noon,
        pd.evening,
        pd.night,
        pd.notes,
        pd.is_sold
      FROM prescription_drugs pd
      JOIN prescriptions p ON pd.prescription_id = p.id
      JOIN drugs d ON pd.drug_id = d.id
      JOIN users u_patient ON p.patient_id = u_patient.id
      JOIN doctors doc ON p.doctor_id = doc.id
      JOIN users u_doctor ON doc.id = u_doctor.id
      WHERE pd.is_sold = 0 AND p.status = 'pending'
      ORDER BY p.date DESC
    `;

    db.all(query, [], (err, prescriptions) => {
      if (err) {
        console.error('Error fetching pending prescriptions:', err);
        return res.status(500).json({ 
          message: 'Server error fetching pending prescriptions',
          error: err.message 
        });
      }
      
      console.log(`Found ${prescriptions.length} pending prescriptions`);
      res.json(prescriptions);
    });
  } catch (error) {
    console.error('Unexpected error in GET /prescriptions/pending:', error);
    res.status(500).json({ 
      message: 'Server error fetching pending prescriptions',
      error: error.message 
    });
  }
});

// Get patient's prescriptions
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;

    // Check if the requesting user is the patient or a doctor/receptionist
    if (req.user.id !== parseInt(patientId) && 
        !['doctor', 'receptionist'].includes(req.user.role)) {
      console.log(`User ${req.user.id} (${req.user.role}) tried to access prescriptions for patient ${patientId}`);
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log(`Fetching prescriptions for patient ID: ${patientId}`);
    
    // Include patient name in the query
    db.all(`
      SELECT p.*, u.name as doctor_name
      FROM prescriptions p
      JOIN users u ON p.doctor_id = u.id
      WHERE p.patient_id = ?
      ORDER BY p.date DESC
    `, [patientId], (err, prescriptions) => {
      if (err) {
        console.error('Error fetching patient prescriptions:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      // If prescriptions is empty, return an empty array
      if (!prescriptions || prescriptions.length === 0) {
        console.log('No prescriptions found for patient ID:', patientId);
        return res.json([]);
      }
      
      console.log(`Found ${prescriptions.length} prescriptions for patient`);
      
      // Process each prescription to get its drugs separately
      const prescriptionIds = prescriptions.map(p => p.id);
      
      // Format prescriptions for initial response
      const formattedPrescriptions = prescriptions.map(p => ({
        ...p,
        drugs: []
      }));
      
      // Get drugs for these prescriptions
      if (prescriptionIds.length > 0) {
        const placeholders = prescriptionIds.map(() => '?').join(',');
        
        db.all(`
          SELECT pd.*, d.name as drug_name, pd.prescription_id
          FROM prescription_drugs pd
          JOIN drugs d ON pd.drug_id = d.id
          WHERE pd.prescription_id IN (${placeholders})
        `, prescriptionIds, (drugsErr, allDrugs) => {
          if (drugsErr) {
            console.error('Error fetching prescription drugs for patient:', drugsErr);
            return res.status(500).json({ message: 'Server error' });
          }
          
          // Add drugs to their respective prescriptions
          formattedPrescriptions.forEach(prescription => {
            prescription.drugs = allDrugs.filter(drug => 
              drug.prescription_id === prescription.id
            );
          });
          
          res.json(formattedPrescriptions);
        });
      } else {
        res.json(formattedPrescriptions);
      }
    });
  } catch (error) {
    console.error('Unexpected error in /patient/:patientId:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctor's prescriptions
router.get('/doctor/:doctorId', doctorAuth, async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Check if the requesting user is the doctor
    if (req.user.id !== parseInt(doctorId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log(`Fetching prescriptions for doctor ID: ${doctorId}`);
    
    // Include patient name in the query
    db.all(`
      SELECT p.*, u.name as patient_name
      FROM prescriptions p
      JOIN users u ON p.patient_id = u.id
      WHERE p.doctor_id = ?
      ORDER BY p.date DESC
    `, [doctorId], (err, prescriptions) => {
      if (err) {
        console.error('Error fetching prescriptions:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      // If prescriptions is empty, return an empty array
      if (!prescriptions || prescriptions.length === 0) {
        console.log('No prescriptions found for doctor ID:', doctorId);
        return res.json([]);
      }

      console.log(`Found ${prescriptions.length} prescriptions`);
      
      // Process each prescription to get its drugs separately
      const prescriptionIds = prescriptions.map(p => p.id);
      
      // Format prescriptions for initial response
      const formattedPrescriptions = prescriptions.map(p => ({
        ...p,
        drugs: []
      }));
      
      // Get drugs for these prescriptions
      if (prescriptionIds.length > 0) {
        const placeholders = prescriptionIds.map(() => '?').join(',');
        
        db.all(`
          SELECT pd.*, d.name as drug_name, pd.prescription_id
          FROM prescription_drugs pd
          JOIN drugs d ON pd.drug_id = d.id
          WHERE pd.prescription_id IN (${placeholders})
        `, prescriptionIds, (drugsErr, allDrugs) => {
          if (drugsErr) {
            console.error('Error fetching prescription drugs:', drugsErr);
            return res.status(500).json({ message: 'Server error' });
          }
          
          // Add drugs to their respective prescriptions
          formattedPrescriptions.forEach(prescription => {
            prescription.drugs = allDrugs.filter(drug => 
              drug.prescription_id === prescription.id
            );
          });
          
          res.json(formattedPrescriptions);
        });
      } else {
        res.json(formattedPrescriptions);
      }
    });
  } catch (error) {
    console.error('Unexpected error in /doctor/:doctorId:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get prescription details by ID
router.get('/:prescriptionId', auth, async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    console.log(`Fetching details for prescription ID: ${prescriptionId}`);

    // Get prescription details with patient and doctor info
    db.get(`
      SELECT 
        p.*,
        u_patient.name as patient_name,
        u_doctor.name as doctor_name
      FROM prescriptions p
      JOIN users u_patient ON p.patient_id = u_patient.id
      JOIN doctors doc ON p.doctor_id = doc.id
      JOIN users u_doctor ON doc.id = u_doctor.id
      WHERE p.id = ?
    `, [prescriptionId], (err, prescription) => {
      if (err) {
        console.error('Error fetching prescription details:', err);
        return res.status(500).json({ 
          message: 'Server error fetching prescription details',
          error: err.message 
        });
      }

      if (!prescription) {
        console.log(`No prescription found with ID: ${prescriptionId}`);
        return res.status(404).json({ message: 'Prescription not found' });
      }

      console.log(`Found prescription: ${JSON.stringify(prescription)}`);

      // Get drugs for this prescription
      db.all(`
        SELECT 
          pd.*,
          d.name as drug_name,
          d.description as drug_description
        FROM prescription_drugs pd
        JOIN drugs d ON pd.drug_id = d.id
        WHERE pd.prescription_id = ?
      `, [prescriptionId], (drugsErr, drugs) => {
        if (drugsErr) {
          console.error('Error fetching prescription drugs:', drugsErr);
          return res.status(500).json({ 
            message: 'Server error fetching prescription drugs',
            error: drugsErr.message 
          });
        }

        console.log(`Found ${drugs.length} drugs for prescription ${prescriptionId}`);
        
        // Combine prescription and drugs data
        const prescriptionDetails = {
          ...prescription,
          drugs
        };

        res.json(prescriptionDetails);
      });
    });
  } catch (error) {
    console.error('Unexpected error in GET /prescriptions/:prescriptionId:', error);
    res.status(500).json({ 
      message: 'Server error fetching prescription details',
      error: error.message 
    });
  }
});

// Reject prescription
router.patch('/:prescriptionId/reject', [auth, authorize(['drugstore_manager'])], async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    
    console.log(`Rejecting prescription ID: ${prescriptionId}`);
    
    db.run(
      'UPDATE prescriptions SET status = ? WHERE id = ?',
      ['rejected', prescriptionId],
      function(err) {
        if (err) {
          console.error('Error rejecting prescription:', err);
          return res.status(500).json({ message: 'Server error rejecting prescription' });
        }
        
        if (this.changes === 0) {
          console.log(`No prescription found with ID: ${prescriptionId}`);
          return res.status(404).json({ message: 'Prescription not found' });
        }
        
        console.log(`Successfully rejected prescription ID: ${prescriptionId}`);
        res.json({ message: 'Prescription rejected successfully' });
      }
    );
  } catch (error) {
    console.error('Unexpected error in PATCH /prescriptions/:prescriptionId/reject:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 