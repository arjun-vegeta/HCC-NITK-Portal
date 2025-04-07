const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../database/init');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register user
router.post('/register', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Name is required'),
  body('role').isIn(['student', 'doctor', 'drugstore_manager', 'receptionist']).withMessage('Invalid role'),
  body('batch').optional(),
  body('branch').optional(),
  body('specialization').optional()
], async (req, res) => {
  try {
    console.log('Registration attempt:', {
      email: req.body.email,
      name: req.body.name,
      role: req.body.role,
      // Don't log password for security
    });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, role, batch, branch, specialization } = req.body;

    // Check if user already exists
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (user) {
        console.log('User already exists:', email);
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user
        db.run(
          'INSERT INTO users (email, password, name, role, batch, branch, specialization) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [email, hashedPassword, name, role, batch, branch, specialization],
          function(err) {
            if (err) {
              console.error('Error inserting user:', err);
              return res.status(500).json({ message: 'Server error' });
            }

            // Create JWT token
            const token = jwt.sign(
              { userId: this.lastID, role },
              JWT_SECRET,
              { expiresIn: '24h' }
            );

            console.log('User registered successfully:', {
              id: this.lastID,
              email,
              name,
              role
            });

            res.status(201).json({
              token,
              user: {
                id: this.lastID,
                email,
                name,
                role,
                batch,
                branch,
                specialization
              }
            });
          }
        );
      } catch (hashError) {
        console.error('Password hashing error:', hashError);
        return res.status(500).json({ message: 'Server error during password processing' });
      }
    });
  } catch (error) {
    console.error('Unhandled error in registration:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    console.log('Login attempt:', { email: req.body.email });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        console.error('Database error in login:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (!user) {
        console.log('User not found:', email);
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      console.log('User found:', { id: user.id, email: user.email, role: user.role });
      
      try {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          console.log('Password does not match for user:', email);
          return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Check if user has a valid role
        if (!user.role) {
          console.error('User has no role assigned:', user.id);
          return res.status(400).json({ message: 'Account role is missing. Please contact administrator.' });
        }
        
        const validRoles = ['student', 'doctor', 'receptionist', 'drugstore_manager'];
        if (!validRoles.includes(user.role)) {
          console.error('User has invalid role:', user.role);
          return res.status(400).json({ message: 'Invalid account role. Please contact administrator.' });
        }

        console.log('Login successful for:', { id: user.id, email: user.email, role: user.role });
        
        // Create and sign JWT token
        const token = jwt.sign(
          { userId: user.id, role: user.role },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        // Prepare response with user data (excluding password)
        const userData = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          batch: user.batch,
          branch: user.branch,
          specialization: user.specialization
        };
        
        console.log('Sending response with user data:', userData);

        // Send success response
        res.json({
          token,
          user: userData
        });
      } catch (bcryptError) {
        console.error('Bcrypt error during password comparison:', bcryptError);
        return res.status(500).json({ message: 'Error verifying credentials' });
      }
    });
  } catch (error) {
    console.error('Unhandled error in login:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user route
router.get('/me', (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded token in /me endpoint:', decoded);
    
    // Make sure the token contains a userId
    if (!decoded || !decoded.userId) {
      console.error('Invalid token format, userId missing:', decoded);
      return res.status(401).json({ message: 'Invalid token format' });
    }
    
    db.get('SELECT * FROM users WHERE id = ?', [decoded.userId], (err, user) => {
      if (err) {
        console.error('Database error in /me endpoint:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (!user) {
        console.log('User not found with id:', decoded.userId);
        return res.status(401).json({ message: 'User not found' });
      }
      
      console.log('Found user in /me endpoint:', { id: user.id, email: user.email, role: user.role });
      
      // Check if role exists and is valid
      if (!user.role) {
        console.error('User has no role assigned:', user.id);
        return res.status(400).json({ message: 'Account role is missing. Please contact administrator.' });
      }
      
      const validRoles = ['student', 'doctor', 'receptionist', 'drugstore_manager'];
      if (!validRoles.includes(user.role)) {
        console.error('User has invalid role:', user.role);
        return res.status(400).json({ message: 'Invalid account role. Please contact administrator.' });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    });
  } catch (error) {
    console.error('Token verification error in /me endpoint:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router; 