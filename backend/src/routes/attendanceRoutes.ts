import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';

const router = Router();

// Helper to get start and end of day in UTC / local
const getDayBounds = (date: Date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// GET /api/attendance/today - Current day status for logged-in user
router.get('/today', authenticate, async (req: AuthRequest, res: Response) => {
  const employeeId = req.user!.employeeId;
  if (!employeeId) {
    return res.json({ success: true, data: null });
  }

  const { start, end } = getDayBounds();

  const record = await prisma.attendanceRecord.findFirst({
    where: {
      employeeId,
      date: { gte: start, lte: end },
    },
  });

  res.json({
    success: true,
    data: record,
    serverTime: new Date().toISOString(),
    config: {
      workStart: config.company.workStartTime,
      workEnd: config.company.workEndTime,
      gracePeriodMinutes: config.company.gracePeriodMinutes,
    },
  });
});

// POST /api/attendance/check-in - Employee Web Punch In
router.post('/check-in', authenticate, async (req: AuthRequest, res: Response) => {
  if (req.user?.role === 'SUPER_ADMIN') {
    throw new AppError('Super Administrators have enterprise system oversight and are exempt from mandatory attendance punches.', 400);
  }

  const employeeId = req.user!.employeeId;
  if (!employeeId) {
    throw new AppError('Employee profile required to check in', 400);
  }

  const now = new Date();
  const { start, end } = getDayBounds(now);

  const existing = await prisma.attendanceRecord.findFirst({
    where: {
      employeeId,
      date: { gte: start, lte: end },
    },
  });

  if (existing && existing.checkInTime) {
    throw new AppError('You have already checked in today at ' + existing.checkInTime.toLocaleTimeString(), 400);
  }

  // Calculate late arrival
  const [startH, startM] = config.company.workStartTime.split(':').map(Number);
  const thresholdMinutes = startH * 60 + startM + config.company.gracePeriodMinutes;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const lateMinutes = Math.max(0, currentMinutes - thresholdMinutes);
  const status = lateMinutes > 0 ? 'LATE' : 'PRESENT';

  // Extract clean client IP (prioritizing live client-provided public IP if sent)
  const forwarded = req.headers['x-forwarded-for'];
  let detectedIp = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : req.ip || req.socket.remoteAddress || '127.0.0.1';
  if (detectedIp === '::1' || detectedIp === '::ffff:127.0.0.1') {
    detectedIp = '127.0.0.1 (Localhost)';
  }

  const clientIp = req.body.ip || detectedIp;
  const clientLocation = req.body.location || 'Home / Office Web Portal';

  const record = existing
    ? await prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: {
          checkInTime: now,
          status,
          lateMinutes,
          checkInMethod: req.body.method || 'WEB',
          checkInIp: clientIp,
          checkInLocation: clientLocation,
        },
      })
    : await prisma.attendanceRecord.create({
        data: {
          employeeId,
          date: start,
          checkInTime: now,
          status,
          lateMinutes,
          checkInMethod: req.body.method || 'WEB',
          checkInIp: clientIp,
          checkInLocation: clientLocation,
        },
      });

  await logAudit({
    userId: req.user!.id,
    action: 'CHECK_IN',
    entity: 'AttendanceRecord',
    entityId: record.id,
    details: { time: now, status, lateMinutes },
    ipAddress: req.ip,
  });

  res.json({
    success: true,
    message: status === 'LATE'
      ? `Checked in successfully (Late by ${lateMinutes} minutes)`
      : 'Checked in on time. Have a productive day!',
    data: record,
  });
});

// POST /api/attendance/check-out - Employee Web Punch Out
router.post('/check-out', authenticate, async (req: AuthRequest, res: Response) => {
  if (req.user?.role === 'SUPER_ADMIN') {
    throw new AppError('Super Administrators have enterprise system oversight and are exempt from mandatory attendance punches.', 400);
  }

  const employeeId = req.user!.employeeId;
  if (!employeeId) {
    throw new AppError('Employee profile required to check out', 400);
  }

  const now = new Date();
  const { start, end } = getDayBounds(now);

  const existing = await prisma.attendanceRecord.findFirst({
    where: {
      employeeId,
      date: { gte: start, lte: end },
    },
  });

  if (!existing || !existing.checkInTime) {
    throw new AppError('No check-in record found for today. Please check in first.', 400);
  }

  if (existing.checkOutTime) {
    throw new AppError('You have already checked out today at ' + existing.checkOutTime.toLocaleTimeString(), 400);
  }

  // Calculate hours worked
  const diffMs = now.getTime() - new Date(existing.checkInTime).getTime();
  const totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  const breakHours = totalHours >= 5 ? 0.75 : 0; // Standard 45-min lunch deduction if shift > 5 hrs
  const effectiveHours = Math.max(0, Math.round((totalHours - breakHours) * 100) / 100);

  // Calculate early exit if leaving before official end time
  const [endH, endM] = config.company.workEndTime.split(':').map(Number);
  const shiftEndMinutes = endH * 60 + endM;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const earlyExitMinutes = Math.max(0, shiftEndMinutes - currentMinutes);

  let finalStatus = existing.status;
  if (effectiveHours < config.company.halfDayHours) {
    finalStatus = 'HALF_DAY';
  }

  // Extract clean client IP
  const forwardedOut = req.headers['x-forwarded-for'];
  let detectedIpOut = typeof forwardedOut === 'string'
    ? forwardedOut.split(',')[0].trim()
    : req.ip || req.socket.remoteAddress || '127.0.0.1';
  if (detectedIpOut === '::1' || detectedIpOut === '::ffff:127.0.0.1') {
    detectedIpOut = '127.0.0.1 (Localhost)';
  }

  const clientIpOut = req.body.ip || detectedIpOut;
  const clientLocationOut = req.body.location || 'Home / Office Web Portal';

  const record = await prisma.attendanceRecord.update({
    where: { id: existing.id },
    data: {
      checkOutTime: now,
      totalHours,
      breakHours,
      effectiveHours,
      earlyExitMinutes,
      status: finalStatus,
      checkOutMethod: req.body.method || 'WEB',
      checkOutIp: clientIpOut,
      checkOutLocation: clientLocationOut,
    },
  });

  await logAudit({
    userId: req.user!.id,
    action: 'CHECK_OUT',
    entity: 'AttendanceRecord',
    entityId: record.id,
    details: { time: now, totalHours, effectiveHours },
    ipAddress: clientIpOut,
  });

  res.json({
    success: true,
    message: `Checked out successfully. Total hours: ${totalHours} hrs`,
    data: record,
  });
});

// GET /api/attendance/my-history - Employee's own attendance history
router.get('/my-history', authenticate, async (req: AuthRequest, res: Response) => {
  const employeeId = req.user!.employeeId;
  if (!employeeId) return res.json({ success: true, data: [] });

  const { startDate, endDate } = req.query as Record<string, string>;

  const where: any = { employeeId };

  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  const records = await prisma.attendanceRecord.findMany({
    where,
    orderBy: { date: 'desc' },
    take: 60,
  });

  res.json({ success: true, data: records });
});

// GET /api/attendance/admin/daily - All employees attendance for a specific date
router.get('/admin/daily', authenticate, authorize('SUPER_ADMIN', 'HR_ADMIN', 'PROJECT_MANAGER'), async (req: AuthRequest, res: Response) => {
  const { date = new Date().toISOString() } = req.query as Record<string, string>;
  const { start, end } = getDayBounds(new Date(date));

  const [employees, records] = await Promise.all([
    prisma.employee.findMany({
      where: {
        employmentStatus: 'ACTIVE',
        user: { role: { not: 'SUPER_ADMIN' } },
      },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        department: { select: { name: true } },
        designation: { select: { name: true } },
      },
      orderBy: { employeeId: 'asc' },
    }),
    prisma.attendanceRecord.findMany({
      where: { date: { gte: start, lte: end } },
    }),
  ]);

  const recordMap = new Map(records.map((r) => [r.employeeId, r]));

  const summary = {
    present: 0,
    late: 0,
    absent: 0,
    halfDay: 0,
    checkedInNow: 0,
  };

  const results = employees.map((emp) => {
    const record = recordMap.get(emp.id);
    if (!record || !record.checkInTime) {
      summary.absent++;
      return {
        ...emp,
        attendance: null,
        status: 'ABSENT',
      };
    }

    if (record.status === 'LATE') summary.late++;
    else if (record.status === 'HALF_DAY') summary.halfDay++;
    else summary.present++;

    if (record.checkInTime && !record.checkOutTime) {
      summary.checkedInNow++;
    }

    return {
      ...emp,
      attendance: record,
      status: record.status,
    };
  });

  res.json({
    success: true,
    data: results,
    summary,
    totalEmployees: employees.length,
  });
});

// POST /api/attendance/corrections - Submit correction request
const correctionSchema = z.object({
  attendanceRecordId: z.string().optional(),
  date: z.string(),
  requestedCheckIn: z.string(),
  requestedCheckOut: z.string(),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

router.post('/corrections', authenticate, async (req: AuthRequest, res: Response) => {
  const employeeId = req.user!.employeeId;
  if (!employeeId) throw new AppError('Employee profile required', 400);

  const body = correctionSchema.parse(req.body);

  const request = await prisma.attendanceCorrectionRequest.create({
    data: {
      employeeId,
      attendanceRecordId: body.attendanceRecordId || null,
      date: new Date(body.date),
      requestedCheckIn: new Date(body.requestedCheckIn),
      requestedCheckOut: new Date(body.requestedCheckOut),
      reason: body.reason,
      status: 'PENDING',
    },
  });

  // Notify HR and Super Admin
  const hrUsers = await prisma.user.findMany({
    where: { role: { in: ['SUPER_ADMIN', 'HR_ADMIN'] }, isActive: true },
  });

  for (const hr of hrUsers) {
    await prisma.notification.create({
      data: {
        userId: hr.id,
        title: 'New Attendance Regularization',
        message: `${req.user!.firstName} ${req.user!.lastName} requested attendance correction for ${new Date(body.date).toLocaleDateString()}.`,
        type: 'WARNING',
        linkUrl: '/attendance',
      },
    });
  }

  await logAudit({
    userId: req.user!.id,
    action: 'REQUEST_ATTENDANCE_CORRECTION',
    entity: 'AttendanceCorrectionRequest',
    entityId: request.id,
    details: body,
  });

  res.status(201).json({
    success: true,
    message: 'Attendance correction request submitted for approval.',
    data: request,
  });
});

// GET /api/attendance/corrections - List correction requests
router.get('/corrections', authenticate, async (req: AuthRequest, res: Response) => {
  const isPrivileged = ['SUPER_ADMIN', 'HR_ADMIN', 'PROJECT_MANAGER'].includes(req.user!.role);
  const where: any = {};

  if (!isPrivileged) {
    where.employeeId = req.user!.employeeId;
  }

  const requests = await prisma.attendanceCorrectionRequest.findMany({
    where,
    include: {
      employee: {
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          department: { select: { name: true } },
        },
      },
      reviewedBy: { select: { email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: requests });
});

// PUT /api/attendance/corrections/:id/status - Approve or reject correction
router.put('/corrections/:id/status', authenticate, authorize('SUPER_ADMIN', 'HR_ADMIN', 'PROJECT_MANAGER'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { status, reviewNotes } = req.body;

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    throw new AppError('Invalid status. Must be APPROVED or REJECTED', 400);
  }

  const request = await prisma.attendanceCorrectionRequest.findUnique({
    where: { id },
    include: { employee: true },
  });

  if (!request) throw new AppError('Correction request not found', 404);
  if (request.status !== 'PENDING') throw new AppError('Request is already ' + request.status, 400);

  const updated = await prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.attendanceCorrectionRequest.update({
      where: { id },
      data: {
        status,
        reviewedById: req.user!.id,
        reviewNotes: reviewNotes || null,
        reviewedAt: new Date(),
      },
    });

    // If approved, update or create the attendance record
    if (status === 'APPROVED') {
      const { start, end } = getDayBounds(request.date);
      const diffMs = request.requestedCheckOut.getTime() - request.requestedCheckIn.getTime();
      const totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
      const effectiveHours = Math.max(0, totalHours - 0.75);

      const existingRecord = await tx.attendanceRecord.findFirst({
        where: {
          employeeId: request.employeeId,
          date: { gte: start, lte: end },
        },
      });

      if (existingRecord) {
        await tx.attendanceRecord.update({
          where: { id: existingRecord.id },
          data: {
            checkInTime: request.requestedCheckIn,
            checkOutTime: request.requestedCheckOut,
            totalHours,
            effectiveHours,
            status: 'PRESENT',
            isRegularized: true,
            notes: `Regularized by ${req.user!.email}: ${reviewNotes || 'Approved'}`,
          },
        });
      } else {
        await tx.attendanceRecord.create({
          data: {
            employeeId: request.employeeId,
            date: start,
            checkInTime: request.requestedCheckIn,
            checkOutTime: request.requestedCheckOut,
            totalHours,
            effectiveHours,
            status: 'PRESENT',
            isRegularized: true,
            notes: `Regularized by ${req.user!.email}: ${reviewNotes || 'Approved'}`,
          },
        });
      }
    }

    return updatedRequest;
  });

  // Notify the employee
  await prisma.notification.create({
    data: {
      userId: request.employee.userId,
      title: `Attendance Correction ${status}`,
      message: `Your correction request for ${request.date.toLocaleDateString()} was ${status.toLowerCase()}${reviewNotes ? ': ' + reviewNotes : '.'}`,
      type: status === 'APPROVED' ? 'SUCCESS' : 'DANGER',
      linkUrl: '/attendance',
    },
  });

  await logAudit({
    userId: req.user!.id,
    action: `ATTENDANCE_CORRECTION_${status}`,
    entity: 'AttendanceCorrectionRequest',
    entityId: id,
    details: { status, reviewNotes },
  });

  res.json({
    success: true,
    message: `Correction request has been ${status.toLowerCase()}`,
    data: updated,
  });
});

export default router;
