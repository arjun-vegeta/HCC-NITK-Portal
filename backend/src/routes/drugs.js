const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../database/init');
const { auth, authorize } = require('../middleware/auth');
const authMiddleware = authorize(['drugstore_manager']);

// Get all drugs
router.get('/', async (req, res) => {
  try {
    db.all('SELECT * FROM drugs ORDER BY name', [], (err, drugs) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }
      res.json(drugs);
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new drug
router.post('/', authMiddleware, [
  body('name').notEmpty().withMessage('Drug name is required'),
  body('description').optional(),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, quantity } = req.body;

    db.run(
      'INSERT INTO drugs (name, description, quantity) VALUES (?, ?, ?)',
      [name, description, quantity],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Server error' });
        }
        res.status(201).json({
          id: this.lastID,
          name,
          description,
          quantity
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update drug quantity
router.patch('/:drugId', authMiddleware, [
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { drugId } = req.params;
    const { quantity } = req.body;

    db.run(
      'UPDATE drugs SET quantity = ? WHERE id = ?',
      [quantity, drugId],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Server error' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ message: 'Drug not found' });
        }
        res.json({ message: 'Drug quantity updated successfully' });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent prescriptions with drugs
router.get('/recent-prescriptions', authMiddleware, async (req, res) => {
  try {
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
        return res.status(500).json({ message: 'Server error' });
      }
      res.json(prescriptions);
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark prescription drug as sold
router.patch('/prescription-drugs/:prescriptionDrugId/sold', authMiddleware, async (req, res) => {
  try {
    const { prescriptionDrugId } = req.params;

    db.get('SELECT * FROM prescription_drugs WHERE id = ?', [prescriptionDrugId], (err, prescriptionDrug) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }

      if (!prescriptionDrug) {
        return res.status(404).json({ message: 'Prescription drug not found' });
      }

      if (prescriptionDrug.is_sold) {
        return res.status(400).json({ message: 'Drug already marked as sold' });
      }

      db.run('BEGIN TRANSACTION');

      // Update prescription drug status
      db.run(
        'UPDATE prescription_drugs SET is_sold = 1 WHERE id = ?',
        [prescriptionDrugId],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ message: 'Server error' });
          }

          // Update drug quantity
          db.run(
            'UPDATE drugs SET quantity = quantity - ? WHERE id = ?',
            [prescriptionDrug.quantity, prescriptionDrug.drug_id],
            function(err) {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ message: 'Server error' });
              }

              db.run('COMMIT');
              res.json({ message: 'Drug marked as sold successfully' });
            }
          );
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 