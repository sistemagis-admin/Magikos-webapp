import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../plugins/database';

export async function getDashboardData(
  this: import('fastify').FastifyInstance,
  req: FastifyRequest<{ Querystring: { kostId?: string } }>,
  reply: FastifyReply
) {
  try {
    const user = req.session?.user;
    if (!user) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to view dashboard data.'
        }
      });
    }

    const isAdmin = (user as any).role === 'admin' || (user as any).role === 'SuperAdmin';
    const { kostId } = req.query;

    let targetKostIds: string[] = [];

    // Multi-tenant check: if non-admin, verify user has access only to their managed buildings
    if (!isAdmin) {
      const managedKosts = await prisma.kostManager.findMany({
        where: { userId: user.id },
        select: { kostId: true }
      });
      const allowedKostIds = managedKosts.map(m => m.kostId);

      if (allowedKostIds.length === 0) {
        // User manages no kosts, return empty metrics securely
        return reply.send({
          success: true,
          data: {
            kpis: {
              totalRooms: 0,
              occupiedRooms: 0,
              availableRooms: 0,
              occupancyRate: 0,
              monthlyRevenue: 0,
              outstandingRevenue: 0,
              rfidDoorsCount: 0,
              laundryCount: 0,
            },
            charts: {
              revenueGrowth: { labels: [], data: [] },
              occupancyDistribution: { labels: ['Occupied', 'Available'], data: [0, 0] },
            },
            recentRfidLogs: [],
            recentPayments: [],
            systemAlerts: [],
          }
        });
      }

      if (kostId) {
        if (!allowedKostIds.includes(kostId)) {
          return reply.status(403).send({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You do not have permission to view dashboard data for this kost building.'
            }
          });
        }
        targetKostIds = [kostId];
      } else {
        targetKostIds = allowedKostIds;
      }
    } else {
      if (kostId) {
        targetKostIds = [kostId];
      }
    }

    // Prepare scoped where clause
    const kostFilter = targetKostIds.length > 0 ? { in: targetKostIds } : undefined;
    const roomWhere = kostFilter ? { kostId: kostFilter } : {};
    const paymentWhereBase = kostFilter ? { kostId: kostFilter } : {};
    const rfidWhere = kostFilter ? { kostId: kostFilter } : {};
    const alertWhere = kostFilter ? { kostId: kostFilter } : {};

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. KPI: Total Rooms
    const totalRooms = await prisma.room.count({ where: roomWhere });

    // 2. KPI: Occupancy
    const occupiedRooms = await prisma.room.count({
      where: {
        ...roomWhere,
        status: 'OCCUPIED'
      },
    });
    const availableRooms = Math.max(0, totalRooms - occupiedRooms);
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // 3. KPI: Monthly Revenue (Paid Rent in Current Month)
    const revenueSum = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        ...paymentWhereBase,
        type: 'RENT',
        status: 'PAID',
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    // KPI: Monthly Revenue Outstanding (Pending Payments in Current Month)
    const outstandingSum = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        ...paymentWhereBase,
        status: 'PENDING',
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    const monthlyRevenue = revenueSum._sum.amount || 0;
    const outstandingRevenue = outstandingSum._sum.amount || 0;

    // 4. KPI: System Activity
    const uniqueRfidDevices = await prisma.rfidLog.findMany({
      where: rfidWhere,
      distinct: ['deviceName'],
      select: { deviceName: true },
    });
    const rfidDoorsCount = uniqueRfidDevices.length;
    const laundryCount = 0;

    // 5. Chart: Monthly Revenue Growth (Last 6 Months)
    const months = [];
    const revenueData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const sMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const eMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const sum = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          ...paymentWhereBase,
          status: 'PAID',
          createdAt: { gte: sMonth, lte: eMonth },
        },
      });

      months.push(monthNames[d.getMonth()]);
      revenueData.push(sum._sum.amount || 0);
    }

    // 6. Recent RFID Access Logs
    const recentRfidLogsRaw = await prisma.rfidLog.findMany({
      where: rfidWhere,
      take: 5,
      orderBy: { timestamp: 'desc' },
      include: {
        resident: {
          include: {
            room: true,
          },
        },
      },
    });

    const recentRfidLogs = recentRfidLogsRaw.map(log => ({
      id: log.id,
      residentName: log.resident?.name || 'Unknown User',
      avatarUrl: log.resident?.avatarUrl || null,
      roomNumber: log.resident?.room?.number || 'N/A',
      deviceName: log.deviceName,
      status: log.status,
      timestamp: log.timestamp.toISOString(),
    }));

    // 7. Recent Payments
    const recentPaymentsRaw = await prisma.payment.findMany({
      where: paymentWhereBase,
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        resident: true,
        room: true,
      },
    });

    const recentPayments = recentPaymentsRaw.map(payment => ({
      id: payment.id,
      title: payment.type === 'RENT' ? `Rent Payment - Room ${payment.room?.number || 'N/A'}` :
             payment.type === 'LAUNDRY' ? 'Laundry Credit Top-up' :
             payment.type === 'ELECTRICITY' ? 'Electricity Surcharge' : 'Other Payment',
      residentName: payment.resident?.name || 'Unknown User',
      amount: payment.amount,
      status: payment.status,
      paymentMethod: payment.paymentMethod || 'PENDING',
      createdAt: payment.createdAt.toISOString(),
    }));

    // 8. System Alerts
    const systemAlerts = await prisma.systemAlert.findMany({
      where: alertWhere,
      take: 5,
      orderBy: { timestamp: 'desc' },
    });

    // Send formatted dashboard response
    return reply.send({
      success: true,
      data: {
        kpis: {
          totalRooms,
          occupiedRooms,
          availableRooms,
          occupancyRate,
          monthlyRevenue,
          outstandingRevenue,
          rfidDoorsCount,
          laundryCount,
        },
        charts: {
          revenueGrowth: {
            labels: months,
            data: revenueData,
          },
          occupancyDistribution: {
            labels: ['Occupied', 'Available'],
            data: [occupiedRooms, availableRooms],
          },
        },
        recentRfidLogs,
        recentPayments,
        systemAlerts: systemAlerts.map(alert => ({
          id: alert.id,
          type: alert.type,
          message: alert.message,
          timestamp: alert.timestamp.toISOString(),
        })),
      }
    });
  } catch (error) {
    this.log.error(error as Error, 'Failed to fetch dashboard data');
    throw error;
  }
}

