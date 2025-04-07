const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../database/init');
const { auth, authorize } = require('../middleware/auth');

// Define auth middleware with roles
const studentAuth = [auth, authorize(['student'])];
const doctorAuth = [auth, authorize(['doctor'])];
const receptionistAuth = [auth, authorize(['receptionist'])];

// Book appointment
router.post('/', auth, authorize(['student']), [
  body('slot_id').isInt().withMessage('Slot ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { slot_id } = req.body;
    const patient_id = req.user.id;

    // Check if slot exists and is available
    db.get(
      'SELECT * FROM doctor_slots WHERE id = ? AND is_available = 1',
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
          'SELECT * FROM appointments WHERE doctor_id = ? AND date = ? AND time = ?',
          [slot.doctor_id, slot.date, slot.time],
          (err, existingAppointment) => {
            if (err) {
              return res.status(500).json({ message: 'Server error' });
            }

            if (existingAppointment) {
              return res.status(400).json({ message: 'Slot is already booked' });
            }

            // Create appointment
            db.run(
              'INSERT INTO appointments (patient_id, doctor_id, date, time, status) VALUES (?, ?, ?, ?, ?)',
              [patient_id, slot.doctor_id, slot.date, slot.time, 'scheduled'],
              function(err) {
                if (err) {
                  console.error('Error creating appointment:', err);
                  return res.status(500).json({ message: 'Server error' });
                }

                // Mark slot as unavailable
                db.run(
                  'UPDATE doctor_slots SET is_available = 0 WHERE id = ?',
                  [slot_id],
                  function(err) {
                    if (err) {
                      console.error('Error updating slot availability:', err);
                    }
                  }
                );

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
    console.error('Error in POST /appointments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student's appointments
router.get('/student/:studentId', auth, authorize(['student']), async (req, res) => {
  try {
    const { studentId } = req.params;

    // Check if the requesting user is the student
    if (req.user.id !== parseInt(studentId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    db.all(`
      SELECT 
        a.*,
        d.name as doctor_name,
        d.email as doctor_email
      FROM appointments a
      JOIN users d ON a.doctor_id = d.id
      WHERE a.patient_id = ?
      ORDER BY a.date, a.time
    `, [studentId], (err, appointments) => {
      if (err) {
        console.error('Error in GET /appointments/student:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      res.json(appointments);
    });
  } catch (error) {
    console.error('Error in GET /appointments/student:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctor's appointments
router.get('/doctor/:doctorId', auth, authorize(['doctor']), async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Check if the requesting user is the doctor
    if (req.user.id !== parseInt(doctorId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    db.all(`
      SELECT 
        a.*,
        u.name as patient_name,
        u.email as patient_email,
        u.batch,
        u.branch
      FROM appointments a
      JOIN users u ON a.patient_id = u.id
      WHERE a.doctor_id = ?
      ORDER BY a.date, a.time
    `, [doctorId], (err, appointments) => {
      if (err) {
        console.error('Error in GET /appointments/doctor:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      res.json(appointments);
    });
  } catch (error) {
    console.error('Error in GET /appointments/doctor:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel appointment
router.delete('/:appointmentId', auth, authorize(['student']), async (req, res) => {
  try {
    const { appointmentId } = req.params;

    // Check if the appointment belongs to the student
    db.get(
      'SELECT * FROM appointments WHERE id = ? AND patient_id = ?',
      [appointmentId, req.user.id],
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

// Get all appointments (receptionist only)
router.get('/all', receptionistAuth, async (req, res) => {
  try {
    console.log('GET /appointments/all - Request received from user:', req.user ? { id: req.user.id, role: req.user.role } : 'No user');
    
    // Let's dump the token and authorization header for debugging
    const authHeader = req.header('Authorization');
    console.log('Authorization header:', authHeader ? `Present (${authHeader.substring(0, 15)}...)` : 'Missing');

    // First handle any potential missing user case explicitly
    if (!req.user) {
      console.log('GET /appointments/all - No user object in request');
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify the role again manually as a double-check
    console.log(`GET /appointments/all - User role: ${req.user.role}, expected: receptionist`);
    
    if (req.user.role !== 'receptionist') {
      console.log(`User role '${req.user.role}' is not authorized for this endpoint`);
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log('GET /appointments/all - Authorization passed, running query');
    
    db.all(`
      SELECT 
        a.id,
        a.patient_id,
        a.doctor_id,
        a.date,
        a.time,
        a.status,
        p.name as patient_name,
        p.email as patient_email,
        p.batch,
        p.branch,
        d.name as doctor_name
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN users d ON a.doctor_id = d.id
      ORDER BY a.date, a.time
    `, [], (err, appointments) => {
      if (err) {
        console.error('Database error in appointments/all:', err);
        return res.status(500).json({ message: 'Server error' });
      }
      console.log(`GET /appointments/all - Found ${appointments ? appointments.length : 0} appointments`);
      res.json(appointments || []);
    });
  } catch (error) {
    console.error('Error in appointments/all:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 