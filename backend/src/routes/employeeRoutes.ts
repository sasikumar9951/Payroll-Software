import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';

const router = Router();

// Validation schema for creating an employee
const createEmployeeSchema = z.object({
  employeeId: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional().default('DivineCore@123'),
  role: z.enum(['SUPER_ADMIN', 'HR_ADMIN', 'PROJECT_MANAGER', 'ACCOUNTS_ADMIN', 'EMPLOYEE']).default('EMPLOYEE'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  designationTitle: z.string().optional(),
  reportingManagerId: z.string().optional(),
  joiningDate: z.string().min(1),
  employmentStatus: z.string().default('ACTIVE'),
  employmentType: z.string().default('FULL_TIME'),
  workLocation: z.string().default('OFFICE'),
  basicSalary: z.number().optional(),
  hra: z.number().optional(),
  specialAllowance: z.number().optional(),
  ctc: z.number().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  panNumber: z.string().optional(),
  currentAddress: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

// GET /api/employees - List and filter employees
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const {
    search,
    departmentId,
    employmentStatus,
    workLocation,
    page = '1',
    limit = '10',
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};

  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { employeeId: { contains: search } },
      { user: { email: { contains: search } } },
    ];
  }

  if (departmentId) where.departmentId = departmentId;
  if (employmentStatus) where.employmentStatus = employmentStatus;
  if (workLocation) where.workLocation = workLocation;

  const isPrivileged = ['SUPER_ADMIN', 'HR_ADMIN', 'ACCOUNTS_ADMIN'].includes(req.user!.role);

  const [total, employees] = await Promise.all([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { employeeId: 'asc' },
      include: {
        user: { select: { email: true, role: true, isActive: true, lastLoginAt: true } },
        department: { select: { id: true, name: true, code: true } },
        designation: { select: { id: true, name: true, level: true } },
        reportingManager: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      },
    }),
  ]);

  // Strip sensitive salary info if not privileged
  const sanitized = employees.map((emp) => {
    if (!isPrivileged) {
      const { basicSalary, hra, specialAllowance, otherAllowances, grossSalary, ctc, bankName, accountNumber, ifscCode, panNumber, ...safeEmp } = emp;
      return safeEmp;
    }
    return emp;
  });

  res.json({
    success: true,
    data: sanitized,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

// GET /api/employees/:id - Single employee profile
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const isSelf = req.user!.employeeId === id;
  const isPrivileged = ['SUPER_ADMIN', 'HR_ADMIN', 'ACCOUNTS_ADMIN'].includes(req.user!.role);

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, role: true, isActive: true, lastLoginAt: true } },
      department: true,
      designation: true,
      reportingManager: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      subordinates: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      leaveBalances: { include: { leaveType: true }, where: { year: 2026 } },
      documents: true,
    },
  });

  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  // Hide salary if neither self nor privileged
  if (!isSelf && !isPrivileged) {
    const { basicSalary, hra, specialAllowance, otherAllowances, grossSalary, ctc, bankName, accountNumber, ifscCode, panNumber, uanNumber, pfNumber, esiNumber, ...safeEmp } = employee;
    return res.json({ success: true, data: safeEmp });
  }

  res.json({ success: true, data: employee });
});

// POST /api/employees - Add new employee (HR / Super Admin)
router.post('/', authenticate, authorize('SUPER_ADMIN', 'HR_ADMIN'), async (req: AuthRequest, res: Response) => {
  const body = createEmployeeSchema.parse(req.body);

  // Check unique email and employeeId
  const existingUser = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
  if (existingUser) throw new AppError('User with this email already exists', 400);

  const existingEmp = await prisma.employee.findUnique({ where: { employeeId: body.employeeId } });
  if (existingEmp) throw new AppError('Employee ID already in use', 400);

  const passwordHash = await bcrypt.hash(body.password, 10);

  // If a free-text designationTitle was provided, find or create the Designation record
  let finalDesignationId = body.designationId || null;
  if (body.designationTitle && body.designationTitle.trim()) {
    const title = body.designationTitle.trim();
    const existingDesig = await prisma.designation.findFirst({
      where: { name: { equals: title, mode: 'insensitive' } },
    });
    if (existingDesig) {
      finalDesignationId = existingDesig.id;
    } else {
      const code = title
        .split(' ')
        .map((w: string) => w[0]?.toUpperCase() || '')
        .join('')
        .slice(0, 8) + '-' + Math.floor(100 + Math.random() * 900);

      // Link to department if provided or first available
      let deptId = body.departmentId;
      if (!deptId) {
        const firstDept = await prisma.department.findFirst();
        deptId = firstDept?.id;
      }

      if (deptId) {
        const createdDesig = await prisma.designation.create({
          data: {
            name: title,
            code,
            level: 1,
            departmentId: deptId,
          },
        });
        finalDesignationId = createdDesig.id;
      }
    }
  }

  const grossSalary = (body.basicSalary || 0) + (body.hra || 0) + (body.specialAllowance || 0);

  const newEmployee = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: body.email.toLowerCase(),
        passwordHash,
        role: body.role,
      },
    });

    const emp = await tx.employee.create({
      data: {
        employeeId: body.employeeId,
        userId: user.id,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        departmentId: body.departmentId || null,
        designationId: finalDesignationId,
        reportingManagerId: body.reportingManagerId || null,
        joiningDate: new Date(body.joiningDate),
        employmentStatus: body.employmentStatus,
        employmentType: body.employmentType,
        workLocation: body.workLocation,
        basicSalary: body.basicSalary || null,
        hra: body.hra || null,
        specialAllowance: body.specialAllowance || null,
        grossSalary: grossSalary > 0 ? grossSalary : null,
        ctc: body.ctc || null,
        bankName: body.bankName,
        accountNumber: body.accountNumber,
        ifscCode: body.ifscCode,
        panNumber: body.panNumber,
        currentAddress: body.currentAddress,
        emergencyContactName: body.emergencyContactName,
        emergencyContactPhone: body.emergencyContactPhone,
      },
      include: {
        user: { select: { email: true, role: true } },
        department: true,
        designation: true,
      },
    });

    // Allocate initial leave balances
    const leaveTypes = await tx.leaveType.findMany();
    for (const lt of leaveTypes) {
      await tx.leaveBalance.create({
        data: {
          employeeId: emp.id,
          leaveTypeId: lt.id,
          year: new Date().getFullYear(),
          allocatedDays: lt.daysAllowedPerYear,
          usedDays: 0,
          pendingDays: 0,
          remainingDays: lt.daysAllowedPerYear,
        },
      });
    }

    return emp;
  });

  await logAudit({
    userId: req.user!.id,
    action: 'CREATE_EMPLOYEE',
    entity: 'Employee',
    entityId: newEmployee.id,
    details: { employeeId: newEmployee.employeeId, email: body.email },
  });

  res.status(201).json({
    success: true,
    message: 'Employee created successfully',
    data: newEmployee,
  });
});

// PUT /api/employees/:id - Update employee
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'HR_ADMIN'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const data = req.body;

  const emp = await prisma.employee.findUnique({ where: { id }, include: { user: true } });
  if (!emp) throw new AppError('Employee not found', 404);

  // Resolve free-text designationTitle → designationId
  let finalDesignationId = data.designationId || emp.designationId;
  if (data.designationTitle && data.designationTitle.trim()) {
    const title = data.designationTitle.trim();
    const existingDesig = await prisma.designation.findFirst({
      where: { name: { equals: title, mode: 'insensitive' } },
    });
    if (existingDesig) {
      finalDesignationId = existingDesig.id;
    } else {
      const code = title
        .split(' ')
        .map((w: string) => w[0]?.toUpperCase() || '')
        .join('')
        .slice(0, 8) + '-' + Math.floor(100 + Math.random() * 900);
      const deptId = data.departmentId || emp.departmentId;
      if (deptId) {
        const createdDesig = await prisma.designation.create({
          data: { name: title, code, level: 1, departmentId: deptId },
        });
        finalDesignationId = createdDesig.id;
      } else {
        const firstDept = await prisma.department.findFirst();
        if (firstDept) {
          const createdDesig = await prisma.designation.create({
            data: { name: title, code, level: 1, departmentId: firstDept.id },
          });
          finalDesignationId = createdDesig.id;
        }
      }
    }
  }

  // Update role on user record if provided
  if (data.role && data.role !== emp.user.role) {
    await prisma.user.update({ where: { id: emp.userId }, data: { role: data.role } });
  }

  const grossSalary =
    (data.basicSalary ?? emp.basicSalary ?? 0) +
    (data.hra ?? emp.hra ?? 0) +
    (data.specialAllowance ?? emp.specialAllowance ?? 0);

  const updated = await prisma.employee.update({
    where: { id },
    data: {
      firstName: data.firstName ?? emp.firstName,
      lastName: data.lastName ?? emp.lastName,
      phone: data.phone ?? emp.phone,
      departmentId: data.departmentId || emp.departmentId,
      designationId: finalDesignationId,
      reportingManagerId: data.reportingManagerId || emp.reportingManagerId,
      employmentStatus: data.employmentStatus ?? emp.employmentStatus,
      employmentType: data.employmentType ?? emp.employmentType,
      workLocation: data.workLocation ?? emp.workLocation,
      basicSalary: data.basicSalary !== undefined ? data.basicSalary : emp.basicSalary,
      hra: data.hra !== undefined ? data.hra : emp.hra,
      specialAllowance: data.specialAllowance !== undefined ? data.specialAllowance : emp.specialAllowance,
      grossSalary: grossSalary > 0 ? grossSalary : emp.grossSalary,
      ctc: data.ctc !== undefined ? data.ctc : emp.ctc,
      bankName: data.bankName ?? emp.bankName,
      accountNumber: data.accountNumber ?? emp.accountNumber,
      ifscCode: data.ifscCode ?? emp.ifscCode,
      panNumber: data.panNumber ?? emp.panNumber,
      currentAddress: data.currentAddress ?? emp.currentAddress,
      emergencyContactName: data.emergencyContactName ?? emp.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone ?? emp.emergencyContactPhone,
    },
    include: {
      department: true,
      designation: true,
      user: { select: { email: true, role: true } },
    },
  });

  await logAudit({
    userId: req.user!.id,
    action: 'UPDATE_EMPLOYEE',
    entity: 'Employee',
    entityId: id,
    details: { ...data, resolvedDesignationId: finalDesignationId },
  });

  res.json({ success: true, message: 'Employee updated successfully', data: updated });
});

// DELETE /api/employees/:id - Deactivate employee
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'HR_ADMIN'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;

  const emp = await prisma.employee.findUnique({ where: { id }, include: { user: true } });
  if (!emp) throw new AppError('Employee not found', 404);

  // Soft deactivate
  await prisma.$transaction([
    prisma.employee.update({
      where: { id },
      data: { employmentStatus: 'TERMINATED', exitDate: new Date() },
    }),
    prisma.user.update({
      where: { id: emp.userId },
      data: { isActive: false },
    }),
  ]);

  await logAudit({
    userId: req.user!.id,
    action: 'DEACTIVATE_EMPLOYEE',
    entity: 'Employee',
    entityId: id,
  });

  res.json({ success: true, message: 'Employee deactivated successfully' });
});

export default router;
