const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearExpenses() {
  try {
    const deleted = await prisma.expense.deleteMany();
    console.log('Deleted expenses:', deleted.count);
    const count = await prisma.expense.count();
    console.log('Expenses count after deletion:', count);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearExpenses(); 