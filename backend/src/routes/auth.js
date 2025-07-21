const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { validateLogin } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Login route
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'USER_LOGIN',
        description: `User ${user.email} logged in`,
        userId: user.id,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login',
    });
  }
});

// Logout route
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'USER_LOGOUT',
        description: `User ${req.user.email} logged out`,
        userId: req.user.id,
      },
    });

    res.json({
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: 'An error occurred during logout',
    });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: req.user,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      error: 'Failed to get user information',
      message: 'An error occurred while fetching user data',
    });
  }
});

module.exports = router; 