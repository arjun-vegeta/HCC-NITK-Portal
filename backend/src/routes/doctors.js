const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../database/init');
const { auth, authorize } = require('../middleware/auth');
const authMiddleware = authorize(['doctor', 'receptionist']);

// Get all doctors
router.get('/', async (req, res) => {
  try {
    db.all(`
      SELECT d.*, u.name, u.email 
      FROM doctors d 
      JOIN users u ON d.user_id = u.id
    `, [], (err, doctors) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }
      res.json(doctors);
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add doctor slots
router.post('/slots', authMiddleware, [
  body('date').isDate().withMessage('Please enter a valid date'),
  body('slots').isArray().withMessage('Slots must be an array'),
  body('slots.*.time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date, slots } = req.body;
    const doctorId = req.user.role === 'doctor' ? req.user.userId : req.body.doctorId;

    if (!doctorId && req.user.role === 'receptionist') {
      return res.status(400).json({ message: 'Doctor ID is required' });
    }

    const stmt = db.prepare('INSERT INTO slots (doctor_id, date, time, is_available) VALUES (?, ?, ?, 1)');
    
    slots.forEach(slot => {
      stmt.run([doctorId, date, slot.time]);
    });

    stmt.finalize();
    res.status(201).json({ message: 'Slots added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update slot availability
router.patch('/slots/:slotId', authMiddleware, [
  body('is_available').isBoolean().withMessage('is_available must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { slotId } = req.params;
    const { is_available } = req.body;

    db.run(
      'UPDATE slots SET is_available = ? WHERE id = ?',
      [is_available, slotId],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Server error' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ message: 'Slot not found' });
        }
        res.json({ message: 'Slot updated successfully' });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctor's slots for a specific date
router.get('/:doctorId/slots', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    db.all(
      'SELECT * FROM slots WHERE doctor_id = ? AND date = ? ORDER BY time',
      [doctorId, date],
      (err, slots) => {
        if (err) {
          return res.status(500).json({ message: 'Server error' });
        }
        res.json(slots);
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctor's appointments
router.get('/:doctorId/appointments', authMiddleware, async (req, res) => {
  try {
    const { doctorId } = req.params;

    db.all(`
      SELECT a.*, s.date, s.time, u.name as patient_name, u.email as patient_email
      FROM appointments a
      JOIN slots s ON a.slot_id = s.id
      JOIN users u ON a.patient_id = u.id
      WHERE s.doctor_id = ?
      ORDER BY s.date, s.time
    `, [doctorId], (err, appointments) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }
      res.json(appointments);
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 