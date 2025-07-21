const express = require('express');
const multer = require('multer');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireEmployee, requireAdmin } = require('../middleware/auth');
const { validateExpense, validateExpenseStatus, validateExpenseFilter } = require('../middleware/validation');
// Simple CSV helper function
const createCsvContent = (data, headers) => {
  const csvHeaders = headers.map(h => h.title).join(',');
  const csvRows = data.map(row => 
    headers.map(h => {
      const value = row[h.id];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  return [csvHeaders, ...csvRows].join('\n');
};

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'));
    }
  },
});

// Get expenses (filtered by role)
router.get('/', authenticateToken, validateExpenseFilter, async (req, res) => {
  try {
    const { category, status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};

    // Role-based filtering
    if (req.user.role === 'EMPLOYEE') {
      where.userId = req.user.id;
    }

    // Apply filters
    if (category) where.category = category;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    // Get expenses with pagination
    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.expense.count({ where }),
    ]);



    res.json({
      expenses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      error: 'Failed to fetch expenses',
      message: 'An error occurred while fetching expenses',
    });
  }
});

// Create new expense
router.post('/', authenticateToken, requireEmployee, upload.single('receipt'), validateExpense, async (req, res) => {
  try {
    console.log('Received expense data:', req.body);
    const { amount, category, date, notes } = req.body;
    const receiptUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        category,
        date: new Date(date),
        notes,
        receiptUrl,
        userId: req.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'EXPENSE_CREATED',
        description: `Expense created - ₹${amount} for ${category}`,
        userId: req.user.id,
      },
    });

    res.status(201).json({
      message: 'Expense created successfully',
      expense,
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      error: 'Failed to create expense',
      message: 'An error occurred while creating the expense',
    });
  }
});

// Update expense (Edit functionality)
router.put('/:id', authenticateToken, upload.single('receipt'), async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, category, date, notes } = req.body;

    // Get the existing expense
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!existingExpense) {
      return res.status(404).json({
        error: 'Expense not found',
        message: 'The requested expense does not exist',
      });
    }

    // Check permissions
    if (req.user.role === 'EMPLOYEE' && existingExpense.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only edit your own expenses',
      });
    }

    // Validate the expense data manually
    try {
      const { z } = require('zod');
      const expenseSchema = z.object({
        amount: z.string().transform((val) => {
          const num = parseFloat(val);
          if (isNaN(num) || num <= 0) {
            throw new Error('Amount must be a positive number');
          }
          if (num < 0.01) {
            throw new Error('Amount must be at least ₹0.01');
          }
          if (num > 100000) {
            throw new Error('Amount cannot exceed ₹100,000');
          }
          return num;
        }),
        category: z.enum(['TRAVEL', 'FOOD', 'EQUIPMENT', 'OFFICE_SUPPLIES', 'SOFTWARE', 'TRAINING', 'OTHER']),
        date: z.string().datetime('Invalid date format'),
        notes: z.string().optional(),
      });
      
      expenseSchema.parse({ amount, category, date, notes });
    } catch (error) {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.message,
      });
    }

    // Prepare update data
    const updateData = {
      amount: parseFloat(amount),
      category,
      date: new Date(date),
      notes: notes || '',
      status: 'PENDING', // Reset to pending for re-approval
    };

    // Handle file upload if provided
    if (req.file) {
      updateData.receiptUrl = `/uploads/${req.file.filename}`;
    }

    // Update the expense
    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'EXPENSE_UPDATED',
        description: `Expense ${id} updated - ₹${amount} for ${category}`,
        userId: req.user.id,
      },
    });

    res.json({
      message: 'Expense updated successfully',
      expense: updatedExpense,
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      error: 'Failed to update expense',
      message: 'An error occurred while updating the expense',
    });
  }
});

// Update expense status (Admin only)
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    // Validate status
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Status must be either APPROVED or REJECTED',
      });
    }

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!expense) {
      return res.status(404).json({
        error: 'Expense not found',
        message: 'The requested expense does not exist',
      });
    }

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: { 
        status,
        ...(reason && { rejectionReason: reason })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'EXPENSE_STATUS_UPDATED',
        description: `Expense ${id} status changed to ${status}${reason ? ` - Reason: ${reason}` : ''}`,
        userId: req.user.id,
      },
    });

    res.json({
      message: 'Expense status updated successfully',
      expense: updatedExpense,
    });
  } catch (error) {
    console.error('Update expense status error:', error);
    res.status(500).json({
      error: 'Failed to update expense status',
      message: 'An error occurred while updating the expense status',
    });
  }
});

// Export expenses to CSV
router.get('/export', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('Export expenses request received');
    const { category, status, startDate, endDate } = req.query;

    // Build where clause
    const where = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    // Get all expenses with user details
    const expenses = await prisma.expense.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Define CSV headers
    const headers = [
      { id: 'id', title: 'ID' },
      { id: 'amount', title: 'Amount' },
      { id: 'category', title: 'Category' },
      { id: 'date', title: 'Date' },
      { id: 'notes', title: 'Notes' },
      { id: 'status', title: 'Status' },
      { id: 'userName', title: 'Employee Name' },
      { id: 'userEmail', title: 'Employee Email' },
      { id: 'createdAt', title: 'Created At' },
    ];

    // Transform data for CSV
    const csvData = expenses.map(expense => ({
      id: expense.id,
      amount: expense.amount,
      category: expense.category,
      date: new Date(expense.date).toLocaleDateString(),
      notes: expense.notes || '',
      status: expense.status,
      userName: expense.user.name,
      userEmail: expense.user.email,
      createdAt: new Date(expense.createdAt).toLocaleDateString(),
    }));

    const csvContent = createCsvContent(csvData, headers);
    console.log('CSV content length:', csvContent.length);

    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="expenses-${new Date().toISOString().split('T')[0]}.csv"`);

    console.log('Sending CSV response');
    res.send(csvContent);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'EXPENSE_EXPORT',
        description: `Exported ${expenses.length} expenses to CSV`,
        userId: req.user.id,
      },
    });
  } catch (error) {
    console.error('Export expenses error:', error);
    res.status(500).json({
      error: 'Failed to export expenses',
      message: 'An error occurred while exporting expenses',
    });
  }
});

// Get expense by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!expense) {
      return res.status(404).json({
        error: 'Expense not found',
        message: 'The requested expense does not exist',
      });
    }

    // Check if user has access to this expense
    if (req.user.role === 'EMPLOYEE' && expense.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this expense',
      });
    }

    res.json({ expense });
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      error: 'Failed to fetch expense',
      message: 'An error occurred while fetching the expense',
    });
  }
});

module.exports = router; 