import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../plugins/database';

export async function getDashboardData(
  this: import('fastify').FastifyInstance,
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. KPI: Total Rooms
    const totalRooms = await prisma.room.count();

    // 2. KPI: Occupancy
    const occupiedRooms = await prisma.room.count({
      where: { status: 'OCCUPIED' },
    });
    const availableRooms = totalRooms - occupiedRooms;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // 3. KPI: Monthly Revenue (Paid Rent in Current Month)
    const revenueSum = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        type: 'RENT',
        status: 'PAID',
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    // KPI: Monthly Revenue Outstanding (Pending Payments in Current Month)
    const outstandingSum = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'PENDING',
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    const monthlyRevenue = revenueSum._sum.amount || 0;
    const outstandingRevenue = outstandingSum._sum.amount || 0;

    // 4. KPI: System Activity
    const uniqueRfidDevices = await prisma.rfidLog.findMany({
      distinct: ['deviceName'],
      select: { deviceName: true },
    });
    const rfidDoorsCount = uniqueRfidDevices.length > 0 ? uniqueRfidDevices.length : 85;
    const laundryCount = 12; // Static or dynamic based on requirement

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
          status: 'PAID',
          createdAt: { gte: sMonth, lte: eMonth },
        },
      });

      months.push(monthNames[d.getMonth()]);
      revenueData.push(sum._sum.amount || 0);
    }

    // 6. Recent RFID Access Logs
    const recentRfidLogsRaw = await prisma.rfidLog.findMany({
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
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        resident: true,
        room: true,
      },
    });

    const recentPayments = recentPaymentsRaw.map(payment => ({
      id: payment.id,
      title: payment.type === 'RENT' ? `Rent Payment - Room ${payment.room?.number}` :
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
      take: 5,
      orderBy: { timestamp: 'desc' },
    });

    // Send formatted dashboard response
    return reply.send({
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
    });
  } catch (error) {
    this.log.error(error as Error, 'Failed to fetch dashboard data');
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Failed to retrieve dashboard overview data.',
    });
  }
}
