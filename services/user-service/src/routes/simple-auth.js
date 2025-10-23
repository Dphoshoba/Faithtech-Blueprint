const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Simple registration without email verification
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Basic validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Simple email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Simple password check
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate JWT
    const token = jwt.sign({ 
      id: 'mock-user-id', 
      email: email 
    }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '24h' });

    // Mock user creation (no database)
    const user = {
      id: 'mock-user-id',
      email,
      firstName,
      lastName,
      password: hashedPassword
    };

    console.log('✅ User registered successfully:', email);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// Simple login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Mock login (no database check)
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Generate JWT
    const token = jwt.sign({ 
      id: 'mock-user-id', 
      email: email 
    }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '24h' });

    console.log('✅ User logged in successfully:', email);

    res.json({
      user: {
        id: 'mock-user-id',
        email: email,
        firstName: 'Test',
        lastName: 'User'
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

module.exports = router;
