const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const moment = require('moment');

const router = express.Router();
const prisma = new PrismaClient();

// Comprehensive analytics endpoint for the frontend
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const endDate = new Date();
    const startDate = moment().subtract(parseInt(days), 'days').toDate();

    // Build where clause for date filtering
    const where = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Role-based filtering
    if (req.user.role === 'EMPLOYEE') {
      where.userId = req.user.id;
    }

    // Get summary statistics
    const [
      totalExpenses,
      pendingExpenses,
      approvedExpenses,
      rejectedExpenses,
      totalAmount,
      averageAmount,
    ] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.count({ where: { ...where, status: 'PENDING' } }),
      prisma.expense.count({ where: { ...where, status: 'APPROVED' } }),
      prisma.expense.count({ where: { ...where, status: 'REJECTED' } }),
      prisma.expense.aggregate({
        where,
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where,
        _avg: { amount: true },
      }),
    ]);

    // Get category breakdown
    const categoryData = await prisma.expense.groupBy({
      by: ['category'],
      where,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    const categoryBreakdown = categoryData.map(item => ({
      category: item.category,
      totalAmount: parseFloat(item._sum.amount || 0),
      count: item._count.id,
    }));

    // Get monthly trends
    const expenses = await prisma.expense.findMany({
      where,
      select: {
        amount: true,
        date: true,
        category: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Group by month
    const monthlyData = {};
    const currentDate = moment(startDate);

    // Initialize all months with zero values
    while (currentDate.isSameOrBefore(endDate, 'month')) {
      const monthKey = currentDate.format('YYYY-MM');
      monthlyData[monthKey] = {
        month: currentDate.format('MMMM YYYY'),
        total: 0,
        count: 0,
        categories: {},
      };
      currentDate.add(1, 'month');
    }

    // Aggregate expenses by month
    expenses.forEach(expense => {
      const monthKey = moment(expense.date).format('YYYY-MM');
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].total += parseFloat(expense.amount);
        monthlyData[monthKey].count += 1;
        
        // Track by category
        if (!monthlyData[monthKey].categories[expense.category]) {
          monthlyData[monthKey].categories[expense.category] = 0;
        }
        monthlyData[monthKey].categories[expense.category] += parseFloat(expense.amount);
      }
    });

    const monthlyTrends = Object.values(monthlyData);

    // Get top spenders
    const topSpenders = await prisma.expense.groupBy({
      by: ['userId'],
      where,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
      take: 5,
    });

    // Get user details for each spender
    const topSpendersWithDetails = await Promise.all(
      topSpenders.map(async (spender) => {
        const user = await prisma.user.findUnique({
          where: { id: spender.userId },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });

        return {
          user,
          totalAmount: parseFloat(spender._sum.amount || 0),
          expenseCount: spender._count.id,
        };
      })
    );

    const summary = {
      totalExpenses,
      pendingExpenses,
      approvedExpenses,
      rejectedExpenses,
      totalAmount: parseFloat(totalAmount._sum.amount || 0),
      averageAmount: parseFloat(averageAmount._avg.amount || 0),
      approvalRate: totalExpenses > 0 ? (approvedExpenses / totalExpenses) : 0,
    };

    res.json({
      summary,
      categoryBreakdown,
      monthlyTrends,
      topSpenders: topSpendersWithDetails,
    });
  } catch (error) {
    console.error('Get comprehensive analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics',
      message: 'An error occurred while fetching analytics data',
    });
  }
});

// Get category-wise expenses (for bar chart)
router.get('/categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build where clause for date filtering
    const where = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const categoryData = await prisma.expense.groupBy({
      by: ['category'],
      where,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    const formattedData = categoryData.map(item => ({
      category: item.category,
      totalAmount: parseFloat(item._sum.amount || 0),
      count: item._count.id,
    }));

    res.json({
      data: formattedData,
      total: formattedData.reduce((sum, item) => sum + item.totalAmount, 0),
    });
  } catch (error) {
    console.error('Get category analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch category analytics',
      message: 'An error occurred while fetching category data',
    });
  }
});

// Get monthly expense trends (for line chart)
router.get('/trends', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const endDate = new Date();
    const startDate = moment().subtract(parseInt(months), 'months').toDate();

    // Get all expenses within the date range
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
        date: true,
        category: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Group by month
    const monthlyData = {};
    const currentDate = moment(startDate);

    // Initialize all months with zero values
    while (currentDate.isSameOrBefore(endDate, 'month')) {
      const monthKey = currentDate.format('YYYY-MM');
      monthlyData[monthKey] = {
        month: currentDate.format('MMMM YYYY'),
        total: 0,
        count: 0,
        categories: {},
      };
      currentDate.add(1, 'month');
    }

    // Aggregate expenses by month
    expenses.forEach(expense => {
      const monthKey = moment(expense.date).format('YYYY-MM');
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].total += parseFloat(expense.amount);
        monthlyData[monthKey].count += 1;
        
        // Track by category
        if (!monthlyData[monthKey].categories[expense.category]) {
          monthlyData[monthKey].categories[expense.category] = 0;
        }
        monthlyData[monthKey].categories[expense.category] += parseFloat(expense.amount);
      }
    });

    const formattedData = Object.values(monthlyData);

    res.json({
      data: formattedData,
      summary: {
        totalAmount: formattedData.reduce((sum, item) => sum + item.total, 0),
        totalCount: formattedData.reduce((sum, item) => sum + item.count, 0),
        averagePerMonth: formattedData.reduce((sum, item) => sum + item.total, 0) / formattedData.length,
      },
    });
  } catch (error) {
    console.error('Get trends analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch trends analytics',
      message: 'An error occurred while fetching trends data',
    });
  }
});

// Get expense summary statistics
router.get('/summary-old', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build where clause for date filtering
    const where = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [
      totalExpenses,
      pendingExpenses,
      approvedExpenses,
      rejectedExpenses,
      totalAmount,
      averageAmount,
    ] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.count({ where: { ...where, status: 'PENDING' } }),
      prisma.expense.count({ where: { ...where, status: 'APPROVED' } }),
      prisma.expense.count({ where: { ...where, status: 'REJECTED' } }),
      prisma.expense.aggregate({
        where,
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where,
        _avg: { amount: true },
      }),
    ]);

    const summary = {
      totalExpenses,
      pendingExpenses,
      approvedExpenses,
      rejectedExpenses,
      totalAmount: parseFloat(totalAmount._sum.amount || 0),
      averageAmount: parseFloat(averageAmount._avg.amount || 0),
      approvalRate: totalExpenses > 0 ? (approvedExpenses / totalExpenses) * 100 : 0,
    };

    res.json({ summary });
  } catch (error) {
    console.error('Get summary analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch summary analytics',
      message: 'An error occurred while fetching summary data',
    });
  }
});

// Get top spenders
router.get('/top-spenders', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 5, startDate, endDate } = req.query;

    // Build where clause for date filtering
    const where = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const topSpenders = await prisma.expense.groupBy({
      by: ['userId'],
      where,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
      take: parseInt(limit),
    });

    // Get user details for each spender
    const spendersWithDetails = await Promise.all(
      topSpenders.map(async (spender) => {
        const user = await prisma.user.findUnique({
          where: { id: spender.userId },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });

        return {
          user,
          totalAmount: parseFloat(spender._sum.amount || 0),
          expenseCount: spender._count.id,
        };
      })
    );

    res.json({ topSpenders: spendersWithDetails });
  } catch (error) {
    console.error('Get top spenders error:', error);
    res.status(500).json({
      error: 'Failed to fetch top spenders',
      message: 'An error occurred while fetching top spenders data',
    });
  }
});

module.exports = router; 