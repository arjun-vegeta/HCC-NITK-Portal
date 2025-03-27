const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../database/init');
const { auth, authorize } = require('../middleware/auth');
const studentAuth = authorize(['student']);
const doctorAuth = authorize(['doctor']);

// Book appointment
router.post('/', studentAuth, [
  body('slot_id').isInt().withMessage('Slot ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { slot_id } = req.body;
    const patient_id = req.user.userId;

    // Check if slot exists and is available
    db.get(
      'SELECT * FROM slots WHERE id = ? AND is_available = 1',
      [slot_id],
      (err, slot) => {
        if (err) {
          return res.status(500).json({ message: 'Server error' });
        }

        if (!slot) {
          return res.status(404).json({ message: 'Slot not found or not available' });
        }

        // Check if slot is already booked
        db.get(
          'SELECT * FROM appointments WHERE slot_id = ?',
          [slot_id],
          (err, existingAppointment) => {
            if (err) {
              return res.status(500).json({ message: 'Server error' });
            }

            if (existingAppointment) {
              return res.status(400).json({ message: 'Slot is already booked' });
            }

            // Create appointment
            db.run(
              'INSERT INTO appointments (slot_id, patient_id) VALUES (?, ?)',
              [slot_id, patient_id],
              function(err) {
                if (err) {
                  return res.status(500).json({ message: 'Server error' });
                }

                res.status(201).json({
                  id: this.lastID,
                  message: 'Appointment booked successfully'
                });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student's appointments
router.get('/student/:studentId', studentAuth, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Check if the requesting user is the student
    if (req.user.userId !== parseInt(studentId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    db.all(`
      SELECT 
        a.*,
        s.date,
        s.time,
        u.name as doctor_name,
        u.email as doctor_email
      FROM appointments a
      JOIN slots s ON a.slot_id = s.id
      JOIN doctors d ON s.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE a.patient_id = ?
      ORDER BY s.date, s.time
    `, [studentId], (err, appointments) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }
      res.json(appointments);
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctor's appointments
router.get('/doctor/:doctorId', doctorAuth, async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Check if the requesting user is the doctor
    if (req.user.userId !== parseInt(doctorId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    db.all(`
      SELECT 
        a.*,
        s.date,
        s.time,
        u.name as patient_name,
        u.email as patient_email,
        u.batch,
        u.branch
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

// Cancel appointment
router.delete('/:appointmentId', studentAuth, async (req, res) => {
  try {
    const { appointmentId } = req.params;

    // Check if the appointment belongs to the student
    db.get(
      'SELECT * FROM appointments WHERE id = ? AND patient_id = ?',
      [appointmentId, req.user.userId],
      (err, appointment) => {
        if (err) {
          return res.status(500).json({ message: 'Server error' });
        }

        if (!appointment) {
          return res.status(404).json({ message: 'Appointment not found or access denied' });
        }

        // Delete appointment
        db.run(
          'DELETE FROM appointments WHERE id = ?',
          [appointmentId],
          function(err) {
            if (err) {
              return res.status(500).json({ message: 'Server error' });
            }
            res.json({ message: 'Appointment cancelled successfully' });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 