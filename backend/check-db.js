const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('=== Checking Users ===');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });
    
    users.forEach(user => {
      console.log(`User: ${user.name} (${user.email}) - Role: ${user.role} - ID: ${user.id}`);
    });

    console.log('\n=== Checking Expenses ===');
    const expenses = await prisma.expense.findMany({
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

    expenses.forEach(expense => {
      console.log(`Expense: ₹${expense.amount} by ${expense.user.name} (${expense.user.email}) - Status: ${expense.status}`);
    });

    console.log('\n=== Employee Filter Test ===');
    const employee = users.find(u => u.role === 'EMPLOYEE');
    if (employee) {
      console.log(`Testing filter for employee: ${employee.name} (ID: ${employee.id})`);
      
      const employeeExpenses = await prisma.expense.findMany({
        where: { userId: employee.id },
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
      
      console.log(`Employee expenses count: ${employeeExpenses.length}`);
      employeeExpenses.forEach(expense => {
        console.log(`  - ₹${expense.amount} (${expense.status})`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase(); 