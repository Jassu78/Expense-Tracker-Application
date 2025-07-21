const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAuth() {
  try {
    // Get the employee user
    const employee = await prisma.user.findUnique({
      where: { email: 'employee@example.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });

    console.log('Employee user:', employee);

    // Create a JWT token for the employee
    const token = jwt.sign(
      { userId: employee.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Generated token:', token);

    // Decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    // Simulate the auth middleware
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });

    console.log('User from token:', user);

    // Test the filtering logic
    const where = {};
    if (user.role === 'EMPLOYEE') {
      where.userId = user.id;
      console.log('Filtering for employee - userId:', user.id);
    } else {
      console.log('Admin user - showing all expenses');
    }

    console.log('Where clause:', JSON.stringify(where, null, 2));

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

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth(); 