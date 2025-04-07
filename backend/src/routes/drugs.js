const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../database/init');
const { auth, authorize } = require('../middleware/auth');
const authMiddleware = [auth, authorize(['drugstore_manager'])];

// Get all drugs
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching all drugs...');
    
    db.all('SELECT * FROM drugs ORDER BY name', [], (err, drugs) => {
      if (err) {
        console.error('Error fetching drugs:', err);
        return res.status(500).json({ message: 'Server error fetching drugs' });
      }
      
      console.log(`Successfully fetched ${drugs.length} drugs`);
      res.json(drugs);
    });
  } catch (error) {
    console.error('Unexpected error in GET /drugs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new drug
router.post('/', authMiddleware, [
  body('name').notEmpty().withMessage('Drug name is required'),
  body('description').optional(),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a non-negative number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation error',
        errors: errors.array() 
      });
    }

    const { name, description, quantity, price } = req.body;
    const drugPrice = price || 0.00; // Default price if not provided

    console.log(`Adding new drug: ${name}, quantity: ${quantity}, price: ${drugPrice}`);

    db.run(
      'INSERT INTO drugs (name, description, quantity, price) VALUES (?, ?, ?, ?)',
      [name, description, quantity, drugPrice],
      function(err) {
        if (err) {
          console.error('Error adding drug:', err);
          return res.status(500).json({ 
            message: 'Server error adding drug',
            error: err.message 
          });
        }
        
        console.log(`Successfully added drug with ID: ${this.lastID}`);
        res.status(201).json({
          id: this.lastID,
          name,
          description,
          quantity,
          price: drugPrice
        });
      }
    );
  } catch (error) {
    console.error('Unexpected error in POST /drugs:', error);
    res.status(500).json({ 
      message: 'Server error adding drug',
      error: error.message 
    });
  }
});

// Update drug quantity
router.patch('/:drugId', authMiddleware, [
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { drugId } = req.params;
    const { quantity } = req.body;

    console.log(`Updating drug ${drugId} quantity to ${quantity}`);

    db.run(
      'UPDATE drugs SET quantity = ? WHERE id = ?',
      [quantity, drugId],
      function(err) {
        if (err) {
          console.error('Error updating drug quantity:', err);
          return res.status(500).json({ message: 'Server error updating drug quantity' });
        }
        
        if (this.changes === 0) {
          console.log(`No drug found with ID: ${drugId}`);
          return res.status(404).json({ message: 'Drug not found' });
        }
        
        console.log(`Successfully updated drug ${drugId} quantity`);
        res.json({ message: 'Drug quantity updated successfully' });
      }
    );
  } catch (error) {
    console.error('Unexpected error in PATCH /drugs/:drugId:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent prescriptions with drugs
router.get('/recent-prescriptions', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching recent prescriptions with drugs...');
    
    db.all(`
      SELECT 
        p.id as prescription_id,
        p.date,
        u.name as patient_name,
        d.name as drug_name,
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
      JOIN users u ON p.patient_id = u.id
      ORDER BY p.date DESC
      LIMIT 50
    `, [], (err, prescriptions) => {
      if (err) {
        console.error('Error fetching recent prescriptions:', err);
        return res.status(500).json({ message: 'Server error fetching recent prescriptions' });
      }
      
      console.log(`Successfully fetched ${prescriptions.length} recent prescriptions`);
      res.json(prescriptions);
    });
  } catch (error) {
    console.error('Unexpected error in GET /drugs/recent-prescriptions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark prescription drug as sold
router.patch('/prescription-drugs/:prescriptionDrugId/sold', authMiddleware, async (req, res) => {
  try {
    const { prescriptionDrugId } = req.params;
    
    console.log(`Marking prescription drug ${prescriptionDrugId} as sold`);

    db.get('SELECT * FROM prescription_drugs WHERE id = ?', [prescriptionDrugId], (err, prescriptionDrug) => {
      if (err) {
        console.error('Error fetching prescription drug:', err);
        return res.status(500).json({ message: 'Server error fetching prescription drug' });
      }

      if (!prescriptionDrug) {
        console.log(`No prescription drug found with ID: ${prescriptionDrugId}`);
        return res.status(404).json({ message: 'Prescription drug not found' });
      }

      if (prescriptionDrug.is_sold) {
        console.log(`Prescription drug ${prescriptionDrugId} is already marked as sold`);
        return res.status(400).json({ message: 'Drug already marked as sold' });
      }

      db.run('BEGIN TRANSACTION');

      // Update prescription drug status
      db.run(
        'UPDATE prescription_drugs SET is_sold = 1 WHERE id = ?',
        [prescriptionDrugId],
        function(err) {
          if (err) {
            console.error('Error updating prescription drug status:', err);
            db.run('ROLLBACK');
            return res.status(500).json({ message: 'Server error updating prescription drug status' });
          }

          // Update drug quantity
          db.run(
            'UPDATE drugs SET quantity = quantity - ? WHERE id = ?',
            [prescriptionDrug.quantity, prescriptionDrug.drug_id],
            function(err) {
              if (err) {
                console.error('Error updating drug quantity:', err);
                db.run('ROLLBACK');
                return res.status(500).json({ message: 'Server error updating drug quantity' });
              }

              db.run('COMMIT');
              console.log(`Successfully marked prescription drug ${prescriptionDrugId} as sold`);
              res.json({ message: 'Drug marked as sold successfully' });
            }
          );
        }
      );
    });
  } catch (error) {
    console.error('Unexpected error in PATCH /drugs/prescription-drugs/:prescriptionDrugId/sold:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete drug
router.delete('/:drugId', authMiddleware, async (req, res) => {
  try {
    const { drugId } = req.params;
    
    console.log(`Attempting to delete drug with ID: ${drugId}`);

    db.run(
      'DELETE FROM drugs WHERE id = ?',
      [drugId],
      function(err) {
        if (err) {
          console.error('Error deleting drug:', err);
          return res.status(500).json({ message: 'Server error deleting drug' });
        }
        
        if (this.changes === 0) {
          console.log(`No drug found with ID: ${drugId}`);
          return res.status(404).json({ message: 'Drug not found' });
        }
        
        console.log(`Successfully deleted drug with ID: ${drugId}`);
        res.json({ message: 'Drug deleted successfully' });
      }
    );
  } catch (error) {
    console.error('Unexpected error in DELETE /drugs/:drugId:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update drug details (not just quantity)
router.patch('/:drugId', [auth, authorize(['drugstore_manager'])], [
  body('name').optional(),
  body('description').optional(),
  body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('price').optional(),
  body('expiry_date').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { drugId } = req.params;
    const updateData = req.body;
    
    console.log(`Updating drug ID ${drugId} with:`, updateData);
    
    // Build the SET clause dynamically based on the fields provided
    const updateFields = [];
    const values = [];
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && ['name', 'description', 'quantity', 'price', 'expiry_date'].includes(key)) {
        updateFields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }
    
    // Add the drugId as the last parameter
    values.push(drugId);
    
    const query = `UPDATE drugs SET ${updateFields.join(', ')} WHERE id = ?`;
    console.log('Executing query:', query);

    db.run(
      query,
      values,
      function(err) {
        if (err) {
          console.error('Error updating drug:', err);
          return res.status(500).json({ message: 'Server error' });
        }
        
        if (this.changes === 0) {
          console.log(`No drug found with ID: ${drugId}`);
          return res.status(404).json({ message: 'Drug not found' });
        }
        
        console.log(`Successfully updated drug with ID: ${drugId}`);
        res.json({ message: 'Drug updated successfully' });
      }
    );
  } catch (error) {
    console.error('Unexpected error in PATCH /drugs/:drugId:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 