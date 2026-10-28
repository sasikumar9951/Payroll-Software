import { Router, Response } from 'express';
import prisma from '../config/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/dashboard/summary - Real-time HRMS executive dashboard metrics
router.get('/summary', authenticate, async (req: AuthRequest, res: Response) => {
  const today = new Date();
  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  // 1. Employees counts (Regular employees tracked for attendance, excluding system Super Admin)
  const [totalEmployees, activeEmployees] = await Promise.all([
    prisma.employee.count({
      where: { user: { role: { not: 'SUPER_ADMIN' } } },
    }),
    prisma.employee.count({
      where: {
        employmentStatus: 'ACTIVE',
        user: { role: { not: 'SUPER_ADMIN' } },
      },
    }),
  ]);

  // 2. Today's attendance records
  const todayRecords = await prisma.attendanceRecord.findMany({
    where: { date: { gte: startOfToday, lte: endOfToday } },
    include: {
      employee: {
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          profilePhoto: true,
          department: { select: { name: true } },
        },
      },
    },
  });

  const presentCount = todayRecords.filter((r) => r.status === 'PRESENT').length;
  const lateCount = todayRecords.filter((r) => r.status === 'LATE').length;
  const halfDayCount = todayRecords.filter((r) => r.status === 'HALF_DAY').length;
  const onLeaveCount = todayRecords.filter((r) => r.status === 'ON_LEAVE').length;
  const currentlyCheckedIn = todayRecords.filter((r) => r.checkInTime && !r.checkOutTime).length;

  const totalAttended = presentCount + lateCount + halfDayCount;
  const absentCount = Math.max(0, activeEmployees - totalAttended - onLeaveCount);
  const attendanceRate = activeEmployees > 0 ? Math.round((totalAttended / activeEmployees) * 100) : 0;

  // 3. Pending requests
  const [pendingLeaves, pendingCorrections] = await Promise.all([
    prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
    prisma.attendanceCorrectionRequest.count({ where: { status: 'PENDING' } }),
  ]);

  // 4. Department breakdown
  const departments = await prisma.department.findMany({
    include: {
      _count: {
        select: { employees: true },
      },
    },
  });

  const departmentStats = departments.map((d) => ({
    id: d.id,
    name: d.name,
    code: d.code,
    employeeCount: d._count.employees,
  }));

  // 5. 7-Day Attendance Trend for Charts
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const pastWeekRecords = await prisma.attendanceRecord.findMany({
    where: { date: { gte: sevenDaysAgo, lte: endOfToday } },
  });

  const trendMap = new Map<string, { date: string; present: number; late: number; absent: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    trendMap.set(dateStr, { date: dateStr, present: 0, late: 0, absent: 0 });
  }

  for (const r of pastWeekRecords) {
    const dateStr = new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (trendMap.has(dateStr)) {
      const item = trendMap.get(dateStr)!;
      if (r.status === 'LATE') item.late++;
      else if (r.status === 'PRESENT' || r.status === 'HALF_DAY') item.present++;
    }
  }

  // Estimate absent for days
  const trendData = Array.from(trendMap.values()).map((t) => ({
    ...t,
    absent: Math.max(0, activeEmployees - (t.present + t.late)),
  }));

  // 6. Recent Notifications for Current User
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // 7. Recent Checked In Employees (Active Live list)
  const activePunches = todayRecords
    .filter((r) => r.checkInTime)
    .sort((a, b) => new Date(b.checkInTime!).getTime() - new Date(a.checkInTime!).getTime())
    .slice(0, 6)
    .map((r) => ({
      id: r.id,
      employeeId: r.employee.employeeId,
      name: `${r.employee.firstName} ${r.employee.lastName}`,
      department: r.employee.department?.name || 'General',
      checkInTime: r.checkInTime,
      status: r.status,
      isCheckedOut: !!r.checkOutTime,
    }));

  res.json({
    success: true,
    data: {
      stats: {
        totalEmployees,
        activeEmployees,
        presentCount,
        lateCount,
        halfDayCount,
        onLeaveCount,
        absentCount,
        currentlyCheckedIn,
        attendanceRate,
        pendingLeaves,
        pendingCorrections,
      },
      departmentStats,
      trendData,
      notifications,
      activePunches,
      serverTime: new Date().toISOString(),
    },
  });
});

export default router;
