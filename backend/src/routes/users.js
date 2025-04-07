const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../database/init');
const { auth, authorize } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

const receptionistAuth = authorize(['receptionist']);

// Create new user (receptionist only)
router.post('/', receptionistAuth, [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Name is required'),
  body('role').isIn(['student', 'doctor', 'receptionist', 'drugstore_manager']).withMessage('Invalid role'),
  body('batch').optional(),
  body('branch').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, role, batch, branch } = req.body;

    // Check if user already exists
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }

      if (user) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert user
      db.run(
        'INSERT INTO users (email, password, name, role, batch, branch) VALUES (?, ?, ?, ?, ?, ?)',
        [email, hashedPassword, name, role, batch, branch],
        function(err) {
          if (err) {
            return res.status(500).json({ message: 'Server error' });
          }

          // If user is a doctor, create doctor record
          if (role === 'doctor') {
            db.run(
              'INSERT INTO doctors (user_id, specialization) VALUES (?, ?)',
              [this.lastID, req.body.specialization || 'General Medicine']
            );
          }

          res.status(201).json({
            id: this.lastID,
            email,
            name,
            role,
            batch,
            branch
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (receptionist only, or doctors fetching students)
router.get('/', async (req, res) => {
  try {
    console.log('GET /users - Request received from user:', req.user ? { id: req.user.id, role: req.user.role } : 'No user');
    
    // First handle any potential missing user case explicitly
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { role } = req.query;
    
    // For doctor users, only allow fetching students
    if (req.user.role === 'doctor') {
      if (role !== 'student') {
        console.log(`Doctor tried to access non-student users`);
        return res.status(403).json({ message: 'Access denied: doctors can only fetch student data' });
      }
    } 
    // For other roles except receptionist, deny access
    else if (req.user.role !== 'receptionist') {
      console.log(`User role '${req.user.role}' is not authorized for this endpoint`);
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // First, check if the doctors table exists
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='doctors'", [], (tableErr, tableExists) => {
      if (tableErr) {
        console.error('Error checking for doctors table:', tableErr);
        return res.status(500).json({ message: 'Database error' });
      }
      
      // Simplify the query to avoid join issues
      let query = `
        SELECT 
          id,
          email,
          name,
          role,
          batch,
          branch,
          specialization
        FROM users
      `;
      
      const params = [];
      
      if (role) {
        query += ' WHERE role = ?';
        params.push(role);
      }
      
      query += ' ORDER BY name';
      
      console.log('Executing simplified SQL query:', query);
      console.log('With parameters:', params);
      
      db.all(query, params, (err, users) => {
        if (err) {
          console.error('Database error in GET /users:', err);
          return res.status(500).json({ message: 'Server error' });
        }
        
        // Remove passwords from response
        const usersWithoutPasswords = users.map(user => {
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        });
        
        console.log(`GET /users - Found ${users.length} users`);
        res.json(usersWithoutPasswords);
      });
    });
  } catch (error) {
    console.error('Error in GET /users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user (receptionist only)
router.patch('/:userId', receptionistAuth, [
  body('name').optional(),
  body('batch').optional(),
  body('branch').optional(),
  body('specialization').optional()
], async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, batch, branch, specialization } = req.body;

    // Update user
    db.run(
      'UPDATE users SET name = COALESCE(?, name), batch = COALESCE(?, batch), branch = COALESCE(?, branch) WHERE id = ?',
      [name, batch, branch, userId],
      function(err) {
        if (err) {
          return res.status(500).json({ message: 'Server error' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ message: 'User not found' });
        }

        // If specialization is provided, update doctor record
        if (specialization) {
          db.run(
            'UPDATE doctors SET specialization = ? WHERE user_id = ?',
            [specialization, userId]
          );
        }

        res.json({ message: 'User updated successfully' });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (receptionist only)
router.delete('/:userId', receptionistAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists and is not a receptionist
    db.get('SELECT role FROM users WHERE id = ?', [userId], (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.role === 'receptionist') {
        return res.status(403).json({ message: 'Cannot delete receptionist users' });
      }

      // Delete user (cascade will handle related records)
      db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
        if (err) {
          return res.status(500).json({ message: 'Server error' });
        }
        res.json({ message: 'User deleted successfully' });
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID
router.get('/:id', auth, (req, res) => {
  const { id } = req.params;

  // Only allow users to view their own profile or admin to view any profile
  if (req.user.id !== parseInt(id) && req.user.role !== 'receptionist') {
    return res.status(403).json({ message: 'Access denied' });
  }

  db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
});

// Update user
router.patch('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Only allow users to update their own profile or admin to update any profile
    if (req.user.id !== parseInt(id) && req.user.role !== 'receptionist') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if user exists
    db.get('SELECT * FROM users WHERE id = ?', [id], async (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // If password is being updated, hash it
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
      }

      // Build update query
      const updateFields = Object.keys(updates)
        .map(key => `${key} = ?`)
        .join(', ');
      
      const values = Object.values(updates);
      values.push(id);

      // Update user
      db.run(
        `UPDATE users SET ${updateFields} WHERE id = ?`,
        values,
        (err) => {
          if (err) {
            return res.status(500).json({ message: 'Server error' });
          }

          res.json({ message: 'User updated successfully' });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/:id', auth, authorize(['receptionist']), (req, res) => {
  // This is a duplicate route, comment it out as it's redundant with /:userId above
  res.status(500).json({ message: 'Duplicate route, use DELETE /users/:userId instead' });
});

module.exports = router; 