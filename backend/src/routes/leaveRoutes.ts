import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';
import { sendAdminNotification } from '../utils/mailer';

const router = Router();

// GET /api/leaves/types - Available leave types
router.get('/types', authenticate, async (req: AuthRequest, res: Response) => {
  const types = await prisma.leaveType.findMany({
    orderBy: { name: 'asc' },
  });
  res.json({ success: true, data: types });
});

// GET /api/leaves/my-balances - Logged in employee's leave balance
router.get('/my-balances', authenticate, async (req: AuthRequest, res: Response) => {
  const employeeId = req.user!.employeeId;
  if (!employeeId) return res.json({ success: true, data: [] });

  const currentYear = new Date().getFullYear();

  const balances = await prisma.leaveBalance.findMany({
    where: { employeeId, year: currentYear },
    include: { leaveType: true },
  });

  res.json({ success: true, data: balances });
});

// GET /api/leaves/my-requests - Employee's own submitted leave requests
router.get('/my-requests', authenticate, async (req: AuthRequest, res: Response) => {
  const employeeId = req.user!.employeeId;
  if (!employeeId) return res.json({ success: true, data: [] });

  const requests = await prisma.leaveRequest.findMany({
    where: { employeeId },
    include: {
      leaveType: true,
      reviewedBy: { select: { email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: requests });
});

// POST /api/leaves/apply - Apply for leave
const applyLeaveSchema = z.object({
  leaveTypeId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  isHalfDay: z.boolean().default(false),
  halfDayType: z.enum(['FIRST_HALF', 'SECOND_HALF']).optional(),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

router.post('/apply', authenticate, async (req: AuthRequest, res: Response) => {
  const employeeId = req.user!.employeeId;
  if (!employeeId) throw new AppError('Employee profile required to apply for leave', 400);

  const body = applyLeaveSchema.parse(req.body);

  const start = new Date(body.startDate);
  const end = new Date(body.endDate);

  if (start > end) {
    throw new AppError('Start date cannot be after end date', 400);
  }

  // Calculate total days
  let totalDays = 0;
  if (body.isHalfDay) {
    totalDays = 0.5;
  } else {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  // Check overlapping leave requests
  const overlapping = await prisma.leaveRequest.findFirst({
    where: {
      employeeId,
      status: { in: ['PENDING', 'APPROVED'] },
      OR: [
        { startDate: { lte: end }, endDate: { gte: start } },
      ],
    },
  });

  if (overlapping) {
    throw new AppError('You already have a pending or approved leave request overlapping this period.', 400);
  }

  // Check balance
  const currentYear = start.getFullYear();
  const balance = await prisma.leaveBalance.findUnique({
    where: {
      employeeId_leaveTypeId_year: {
        employeeId,
        leaveTypeId: body.leaveTypeId,
        year: currentYear,
      },
    },
  });

  if (balance && balance.remainingDays < totalDays) {
    throw new AppError(`Insufficient leave balance. You have ${balance.remainingDays} days remaining, but requested ${totalDays} days.`, 400);
  }

  const newRequest = await prisma.$transaction(async (tx) => {
    const reqRecord = await tx.leaveRequest.create({
      data: {
        employeeId,
        leaveTypeId: body.leaveTypeId,
        startDate: start,
        endDate: end,
        totalDays,
        isHalfDay: body.isHalfDay,
        halfDayType: body.halfDayType || null,
        reason: body.reason,
        status: 'PENDING',
      },
      include: { leaveType: true },
    });

    // Update pending days in balance
    if (balance) {
      await tx.leaveBalance.update({
        where: { id: balance.id },
        data: {
          pendingDays: balance.pendingDays + totalDays,
        },
      });
    }

    return reqRecord;
  });

  // Notify HR (in-app)
  const hrUsers = await prisma.user.findMany({
    where: { role: { in: ['SUPER_ADMIN', 'HR_ADMIN'] }, isActive: true },
  });

  for (const hr of hrUsers) {
    await prisma.notification.create({
      data: {
        userId: hr.id,
        title: 'New Leave Application',
        message: `${req.user!.firstName} ${req.user!.lastName} applied for ${totalDays} day(s) ${newRequest.leaveType.name}.`,
        type: 'INFO',
        linkUrl: '/leaves',
      },
    });
  }

  // Notify Admin via Email
  const empName = `${req.user!.firstName} ${req.user!.lastName}`;
  const empId   = req.user!.employeeId || 'N/A';
  await sendAdminNotification({
    subject: `Leave Application — ${empName}`,
    employeeName: empName,
    employeeId: String(empId),
    eventType: 'Leave Application',
    details: {
      'Leave Type'  : newRequest.leaveType.name,
      'From'        : start.toDateString(),
      'To'          : end.toDateString(),
      'Total Days'  : totalDays,
      'Reason'      : body.reason,
      'Status'      : 'PENDING — Awaiting Review',
    },
    actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/leaves`,
  });

  await logAudit({
    userId: req.user!.id,
    action: 'APPLY_LEAVE',
    entity: 'LeaveRequest',
    entityId: newRequest.id,
    details: { totalDays, startDate: start, endDate: end, leaveTypeId: body.leaveTypeId },
  });

  res.status(201).json({
    success: true,
    message: 'Leave application submitted successfully for review.',
    data: newRequest,
  });
});

// GET /api/leaves/admin/all - View all leave requests with filters
router.get('/admin/all', authenticate, authorize('SUPER_ADMIN', 'HR_ADMIN', 'PROJECT_MANAGER'), async (req: AuthRequest, res: Response) => {
  const { status, departmentId } = req.query as Record<string, string>;

  const where: any = {};
  if (status) where.status = status;
  if (departmentId) where.employee = { departmentId };

  const requests = await prisma.leaveRequest.findMany({
    where,
    include: {
      employee: {
        include: {
          department: true,
          designation: true,
        },
      },
      leaveType: true,
      reviewedBy: { select: { email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: requests });
});

// PUT /api/leaves/admin/:id/action - Approve or Reject Leave Request
router.put('/admin/:id/action', authenticate, authorize('SUPER_ADMIN', 'HR_ADMIN', 'PROJECT_MANAGER'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { action, rejectionReason } = req.body;

  if (!['APPROVE', 'REJECT'].includes(action)) {
    throw new AppError('Action must be APPROVE or REJECT', 400);
  }

  const leave = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { employee: true, leaveType: true },
  });

  if (!leave) throw new AppError('Leave request not found', 404);
  if (leave.status !== 'PENDING') throw new AppError('Request is already ' + leave.status, 400);

  const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

  const updated = await prisma.$transaction(async (tx) => {
    const updatedLeave = await tx.leaveRequest.update({
      where: { id },
      data: {
        status,
        reviewedById: req.user!.id,
        rejectionReason: action === 'REJECT' ? rejectionReason : null,
        reviewedAt: new Date(),
      },
    });

    const currentYear = leave.startDate.getFullYear();
    const balance = await tx.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: leave.employeeId,
          leaveTypeId: leave.leaveTypeId,
          year: currentYear,
        },
      },
    });

    if (balance) {
      if (status === 'APPROVED') {
        // Deduct from remaining and remove from pending
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: {
            usedDays: balance.usedDays + leave.totalDays,
            pendingDays: Math.max(0, balance.pendingDays - leave.totalDays),
            remainingDays: Math.max(0, balance.remainingDays - leave.totalDays),
          },
        });
      } else {
        // Just remove from pending
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: {
            pendingDays: Math.max(0, balance.pendingDays - leave.totalDays),
          },
        });
      }
    }

    return updatedLeave;
  });

  // Notify the employee
  await prisma.notification.create({
    data: {
      userId: leave.employee.userId,
      title: `Leave Request ${status}`,
      message: `Your ${leave.leaveType.name} application for ${leave.totalDays} day(s) was ${status.toLowerCase()}${rejectionReason ? ': ' + rejectionReason : '.'}`,
      type: status === 'APPROVED' ? 'SUCCESS' : 'DANGER',
      linkUrl: '/leaves',
    },
  });

  await logAudit({
    userId: req.user!.id,
    action: `LEAVE_${status}`,
    entity: 'LeaveRequest',
    entityId: id,
    details: { status, rejectionReason },
  });

  res.json({
    success: true,
    message: `Leave request ${status.toLowerCase()} successfully`,
    data: updated,
  });
});

export default router;
