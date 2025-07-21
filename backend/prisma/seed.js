const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  // Create employee user
  const employeePassword = await bcrypt.hash('password123', 10);
  const employee = await prisma.user.upsert({
    where: { email: 'employee@example.com' },
    update: {},
    create: {
      email: 'employee@example.com',
      password: employeePassword,
      name: 'John Employee',
      role: 'EMPLOYEE',
    },
  });

  // Create sample expenses for employee
  const sampleExpenses = [
    {
      amount: 150.50,
      category: 'TRAVEL',
      date: new Date('2024-01-15'),
      notes: 'Uber rides for client meetings',
      status: 'APPROVED',
      userId: employee.id,
    },
    {
      amount: 75.25,
      category: 'FOOD',
      date: new Date('2024-01-20'),
      notes: 'Team lunch during project kickoff',
      status: 'PENDING',
      userId: employee.id,
    },
    {
      amount: 299.99,
      category: 'EQUIPMENT',
      date: new Date('2024-01-25'),
      notes: 'New wireless headphones for calls',
      status: 'APPROVED',
      userId: employee.id,
    },
    {
      amount: 45.00,
      category: 'OFFICE_SUPPLIES',
      date: new Date('2024-02-01'),
      notes: 'Notebooks and pens',
      status: 'PENDING',
      userId: employee.id,
    },
    {
      amount: 89.99,
      category: 'SOFTWARE',
      date: new Date('2024-02-05'),
      notes: 'Annual subscription for design software',
      status: 'APPROVED',
      userId: employee.id,
    },
    {
      amount: 250.00,
      category: 'TRAVEL',
      date: new Date('2024-02-10'),
      notes: 'Flight tickets for conference',
      status: 'REJECTED',
      rejectionReason: 'Conference attendance not pre-approved by management',
      userId: employee.id,
    },
  ];

  for (const expense of sampleExpenses) {
    await prisma.expense.create({
      data: expense,
    });
  }

  // Create audit logs
  const auditLogs = [
    {
      action: 'USER_CREATED',
      description: 'Admin user created',
      userId: admin.id,
    },
    {
      action: 'USER_CREATED',
      description: 'Employee user created',
      userId: employee.id,
    },
    {
      action: 'EXPENSE_CREATED',
      description: 'Travel expense created - ₹150.50',
      userId: employee.id,
    },
    {
      action: 'EXPENSE_STATUS_UPDATED',
      description: 'Expense rejected - Reason: Conference attendance not pre-approved by management',
      userId: admin.id,
    },
    {
      action: 'EXPENSE_STATUS_UPDATED',
      description: 'Travel expense approved',
      userId: admin.id,
    },
  ];

  for (const log of auditLogs) {
    await prisma.auditLog.create({
      data: log,
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('👤 Admin user: admin@example.com / password123');
  console.log('👤 Employee user: employee@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 