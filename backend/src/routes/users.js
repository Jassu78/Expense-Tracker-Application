const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateUser, validateUserUpdate } = require('../middleware/validation');

const router = express.Router();
const prisma = new PrismaClient();

// Get all users (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (page - 1) * limit;

    // Build where clause for search
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              expenses: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: 'An error occurred while fetching users',
    });
  }
});

// Create new user (Admin only)
router.post('/', authenticateToken, requireAdmin, validateUser, async (req, res) => {
  try {
    const { email, password, name, role = 'EMPLOYEE' } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists',
        message: 'A user with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'USER_CREATED',
        description: `User ${email} created by admin`,
        userId: req.user.id,
      },
    });

    res.status(201).json({
      message: 'User created successfully',
      user,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      error: 'Failed to create user',
      message: 'An error occurred while creating the user',
    });
  }
});

// Update user (Admin only)
router.put('/:id', authenticateToken, requireAdmin, validateUserUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, role, password } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The requested user does not exist',
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return res.status(400).json({
          error: 'Email already exists',
          message: 'A user with this email already exists',
        });
      }
    }

    // Prepare update data
    const updateData = {
      email: email || existingUser.email,
      name: name || existingUser.name,
      role: role || existingUser.role,
    };

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'USER_UPDATED',
        description: `User ${updatedUser.email} updated by admin`,
        userId: req.user.id,
      },
    });

    res.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: 'An error occurred while updating the user',
    });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The requested user does not exist',
      });
    }

    // Prevent admin from deleting themselves
    if (user.id === req.user.id) {
      return res.status(400).json({
        error: 'Cannot delete yourself',
        message: 'You cannot delete your own account',
      });
    }

    // Delete user (this will cascade delete their expenses and audit logs)
    await prisma.user.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'USER_DELETED',
        description: `User ${user.email} deleted by admin`,
        userId: req.user.id,
      },
    });

    res.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: 'An error occurred while deleting the user',
    });
  }
});

// Get user by ID (Admin only)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            expenses: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'The requested user does not exist',
      });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
      message: 'An error occurred while fetching the user',
    });
  }
});

module.exports = router; 