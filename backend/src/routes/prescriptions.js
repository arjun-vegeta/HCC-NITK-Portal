const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../database/init');
const { auth, authorize } = require('../middleware/auth');
const doctorAuth = authorize(['doctor']);
const patientAuth = authorize(['student']);

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
    const doctor_id = req.user.userId;

    db.run('BEGIN TRANSACTION');

    // Create prescription
    db.run(
      'INSERT INTO prescriptions (doctor_id, patient_id, notes) VALUES (?, ?, ?)',
      [doctor_id, patient_id, notes],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ message: 'Server error' });
        }

        const prescription_id = this.lastID;
        const stmt = db.prepare(`
          INSERT INTO prescription_drugs 
          (prescription_id, drug_id, quantity, morning, noon, evening, night, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        drugs.forEach(drug => {
          stmt.run([
            prescription_id,
            drug.drug_id,
            drug.quantity,
            drug.morning,
            drug.noon,
            drug.evening,
            drug.night,
            drug.notes
          ]);
        });

        stmt.finalize();
        db.run('COMMIT');

        res.status(201).json({
          id: prescription_id,
          message: 'Prescription created successfully'
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get patient's prescriptions
router.get('/patient/:patientId', patientAuth, async (req, res) => {
  try {
    const { patientId } = req.params;

    // Check if the requesting user is the patient
    if (req.user.userId !== parseInt(patientId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    db.all(`
      SELECT 
        p.*,
        u.name as doctor_name,
        GROUP_CONCAT(
          json_object(
            'drug_id', pd.drug_id,
            'drug_name', d.name,
            'quantity', pd.quantity,
            'morning', pd.morning,
            'noon', pd.noon,
            'evening', pd.evening,
            'night', pd.night,
            'notes', pd.notes,
            'is_sold', pd.is_sold
          )
        ) as drugs
      FROM prescriptions p
      JOIN users u ON p.doctor_id = u.id
      LEFT JOIN prescription_drugs pd ON p.id = pd.prescription_id
      LEFT JOIN drugs d ON pd.drug_id = d.id
      WHERE p.patient_id = ?
      GROUP BY p.id
      ORDER BY p.date DESC
    `, [patientId], (err, prescriptions) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }

      // Parse the drugs JSON string
      prescriptions = prescriptions.map(p => ({
        ...p,
        drugs: p.drugs ? JSON.parse(`[${p.drugs}]`) : []
      }));

      res.json(prescriptions);
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctor's prescriptions
router.get('/doctor/:doctorId', doctorAuth, async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Check if the requesting user is the doctor
    if (req.user.userId !== parseInt(doctorId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    db.all(`
      SELECT 
        p.*,
        u.name as patient_name,
        GROUP_CONCAT(
          json_object(
            'drug_id', pd.drug_id,
            'drug_name', d.name,
            'quantity', pd.quantity,
            'morning', pd.morning,
            'noon', pd.noon,
            'evening', pd.evening,
            'night', pd.night,
            'notes', pd.notes,
            'is_sold', pd.is_sold
          )
        ) as drugs
      FROM prescriptions p
      JOIN users u ON p.patient_id = u.id
      LEFT JOIN prescription_drugs pd ON p.id = pd.prescription_id
      LEFT JOIN drugs d ON pd.drug_id = d.id
      WHERE p.doctor_id = ?
      GROUP BY p.id
      ORDER BY p.date DESC
    `, [doctorId], (err, prescriptions) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }

      // Parse the drugs JSON string
      prescriptions = prescriptions.map(p => ({
        ...p,
        drugs: p.drugs ? JSON.parse(`[${p.drugs}]`) : []
      }));

      res.json(prescriptions);
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 