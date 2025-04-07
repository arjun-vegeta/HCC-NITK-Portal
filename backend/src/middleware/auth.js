const jwt = require('jsonwebtoken');
const db = require('../database/init');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const auth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    console.log('Auth header:', authHeader ? `Present (${authHeader.substring(0, 20)}...)` : 'Missing');
    console.log('Request path:', req.path);
    
    if (!authHeader) {
      console.log('Auth middleware: No Authorization header for path', req.path);
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Remove any whitespace in header and ensure proper format
    const token = authHeader.replace(/^\s*Bearer\s+/, '').trim();
    if (!token) {
      console.log('Auth middleware: Empty token after Bearer prefix removal');
      return res.status(401).json({ message: 'Token is missing' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('Decoded token:', decoded);
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    if (!decoded || !decoded.userId) {
      console.error('Decoded token missing userId:', decoded);
      return res.status(401).json({ message: 'Invalid token structure' });
    }
    
    // Get user from database using decoded.userId
    db.get('SELECT * FROM users WHERE id = ?', [decoded.userId], (err, user) => {
      if (err) {
        console.error('Database error in auth middleware:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (!user) {
        console.log('User not found with id:', decoded.userId);
        return res.status(401).json({ message: 'User not found' });
      }

      console.log('User authenticated:', { id: user.id, role: user.role });
      
      // Add user to request object
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        // Keep the original userId from token for compatibility
        userId: decoded.userId
      };
      
      next();
    });
  } catch (error) {
    console.error('Unexpected error in auth middleware:', error);
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

// Role-based authorization middleware
const authorize = (roles) => {
  // Convert single role to array if needed
  const roleArray = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    console.log('Authorization check - User:', req.user ? { id: req.user.id, role: req.user.role } : 'No user');
    console.log('Authorization check - Required roles:', roleArray);
    
    if (!req.user) {
      console.log('Authorization failed - No user provided');
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roleArray.includes(req.user.role)) {
      console.log(`Authorization failed - User role '${req.user.role}' not in allowed roles:`, roleArray);
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log('Authorization successful');
    next();
  };
};

module.exports = { auth, authorize }; 