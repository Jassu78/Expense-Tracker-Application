const { z } = require('zod');

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

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

const expenseStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

const expenseFilterSchema = z.object({
  category: z.enum(['TRAVEL', 'FOOD', 'EQUIPMENT', 'OFFICE_SUPPLIES', 'SOFTWARE', 'TRAINING', 'OTHER']).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1)).optional(),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(100)).optional(),
});

// User validation schemas
const userSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  role: z.enum(['EMPLOYEE', 'ADMIN']).default('EMPLOYEE'),
});

const userUpdateSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  role: z.enum(['EMPLOYEE', 'ADMIN']).optional(),
});

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse({
        ...req.body,
        ...req.query,
        ...req.params,
      });
      
      // Replace request data with validated data
      req.body = { ...req.body, ...validatedData };
      req.query = { ...req.query, ...validatedData };
      req.params = { ...req.params, ...validatedData };
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid request data',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

// Specific validation middlewares
const validateLogin = validate(loginSchema);
const validateExpense = validate(expenseSchema);
const validateExpenseStatus = validate(expenseStatusSchema);
const validateExpenseFilter = validate(expenseFilterSchema);
const validateUser = validate(userSchema);
const validateUserUpdate = validate(userUpdateSchema);

module.exports = {
  validate,
  validateLogin,
  validateExpense,
  validateExpenseStatus,
  validateExpenseFilter,
  validateUser,
  validateUserUpdate,
}; 