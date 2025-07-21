const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
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

// Get audit logs with pagination
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, action, userId, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};

    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    // Get audit logs with pagination
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
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
        orderBy: { timestamp: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      error: 'Failed to fetch audit logs',
      message: 'An error occurred while fetching audit logs',
    });
  }
});

// Get audit log statistics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build where clause for date filtering
    const where = {};
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const [
      totalLogs,
      actionStats,
      userStats,
    ] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { id: true },
      }),
      prisma.auditLog.groupBy({
        by: ['userId'],
        where,
        _count: { id: true },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const stats = {
      totalLogs,
      actionBreakdown: actionStats.map(stat => ({
        action: stat.action,
        count: stat._count.id,
      })),
      userBreakdown: userStats.map(stat => ({
        user: stat.user,
        count: stat._count.id,
      })),
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch audit statistics',
      message: 'An error occurred while fetching audit statistics',
    });
  }
});

// Get recent activity (last 24 hours)
router.get('/recent', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentLogs = await prisma.auditLog.findMany({
      where: {
        timestamp: {
          gte: yesterday,
        },
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
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    res.json({ recentLogs });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      error: 'Failed to fetch recent activity',
      message: 'An error occurred while fetching recent activity',
    });
  }
});



// Export audit logs to CSV
router.get('/export', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('Export audit logs request received');
    const { action, userId, startDate, endDate } = req.query;

    // Build where clause
    const where = {};
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    // Get all audit logs with user details
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Define CSV headers
    const headers = [
      { id: 'id', title: 'ID' },
      { id: 'action', title: 'Action' },
      { id: 'description', title: 'Description' },
      { id: 'timestamp', title: 'Timestamp' },
      { id: 'userName', title: 'User Name' },
      { id: 'userEmail', title: 'User Email' },
    ];

    // Transform data for CSV
    const csvData = logs.map(log => ({
      id: log.id,
      action: log.action,
      description: log.description,
      timestamp: new Date(log.timestamp).toLocaleString(),
      userName: log.user.name,
      userEmail: log.user.email,
    }));

    const csvContent = createCsvContent(csvData, headers);
    console.log('CSV content length:', csvContent.length);

    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);

    console.log('Sending CSV response');
    res.send(csvContent);

    // Create audit log for the export
    await prisma.auditLog.create({
      data: {
        action: 'AUDIT_EXPORT',
        description: `Exported ${logs.length} audit logs to CSV`,
        userId: req.user.id,
      },
    });
  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({
      error: 'Failed to export audit logs',
      message: 'An error occurred while exporting audit logs',
    });
  }
});

module.exports = router; 