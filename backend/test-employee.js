const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEmployee() {
  try {
    console.log('=== Testing Employee Login and Expenses ===');
    
    // 1. Login as employee
    const email = 'employee@example.com';
    const password = 'password123';

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

    console.log('Employee user:', user);

    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isValidPassword);

    if (isValidPassword) {
      // 2. Generate JWT token
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

      // 3. Simulate expenses request
      const where = {};
      if (user.role === 'EMPLOYEE') {
        where.userId = user.id;
        console.log('Filtering for employee - userId:', user.id);
      }

      console.log('Where clause:', JSON.stringify(where, null, 2));

      // 4. Get expenses
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

      console.log('Total expenses found:', expenses.length);
      console.log('All expenses:');
      expenses.forEach((expense, index) => {
        console.log(`  ${index + 1}. ₹${expense.amount} by ${expense.user.name} (${expense.user.email}) - Status: ${expense.status}`);
      });

      // 5. Test analytics
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const analyticsWhere = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (user.role === 'EMPLOYEE') {
        analyticsWhere.userId = user.id;
      }

      const [
        totalExpenses,
        pendingExpenses,
        approvedExpenses,
        rejectedExpenses,
        totalAmount,
        averageAmount,
      ] = await Promise.all([
        prisma.expense.count({ where: analyticsWhere }),
        prisma.expense.count({ where: { ...analyticsWhere, status: 'PENDING' } }),
        prisma.expense.count({ where: { ...analyticsWhere, status: 'APPROVED' } }),
        prisma.expense.count({ where: { ...analyticsWhere, status: 'REJECTED' } }),
        prisma.expense.aggregate({
          where: analyticsWhere,
          _sum: { amount: true },
        }),
        prisma.expense.aggregate({
          where: analyticsWhere,
          _avg: { amount: true },
        }),
      ]);

      console.log('\n=== Analytics for Employee ===');
      console.log('Total expenses:', totalExpenses);
      console.log('Pending expenses:', pendingExpenses);
      console.log('Approved expenses:', approvedExpenses);
      console.log('Rejected expenses:', rejectedExpenses);
      console.log('Total amount:', parseFloat(totalAmount._sum.amount || 0));
      console.log('Average amount:', parseFloat(averageAmount._avg.amount || 0));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEmployee(); 