const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('=== Testing Employee Login ===');
    
    // Simulate employee login
    const email = 'employee@example.com';
    const password = 'password123';

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

    console.log('Found user:', user);

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isValidPassword);

    if (isValidPassword) {
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      console.log('Generated token:', token);

      // Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded);

      // Simulate auth middleware
      const authUser = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        }
      });

      console.log('User from auth middleware:', authUser);

      // Test filtering
      const where = {};
      if (authUser.role === 'EMPLOYEE') {
        where.userId = authUser.id;
        console.log('Filtering for employee - userId:', authUser.id);
      } else {
        console.log('Admin user - showing all expenses');
      }

      const expenses = await prisma.expense.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });

      console.log('Expenses found:', expenses.length);
      expenses.forEach(expense => {
        console.log(`  - ₹${expense.amount} by ${expense.user.name} (${expense.user.email})`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin(); 