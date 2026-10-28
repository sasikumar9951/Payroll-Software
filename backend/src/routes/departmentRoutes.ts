import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';

const router = Router();

// GET /api/departments - List all departments with designations and stats
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const departments = await prisma.department.findMany({
    include: {
      designations: true,
      _count: { select: { employees: true } },
    },
    orderBy: { name: 'asc' },
  });

  res.json({ success: true, data: departments });
});

// POST /api/departments - Create department
const deptSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(10).toUpperCase(),
  description: z.string().optional(),
});

router.post('/', authenticate, authorize('SUPER_ADMIN', 'HR_ADMIN'), async (req: AuthRequest, res: Response) => {
  const body = deptSchema.parse(req.body);

  const existing = await prisma.department.findFirst({
    where: { OR: [{ name: body.name }, { code: body.code }] },
  });
  if (existing) throw new AppError('Department name or code already exists', 400);

  const dept = await prisma.department.create({ data: body });

  await logAudit({
    userId: req.user!.id,
    action: 'CREATE_DEPARTMENT',
    entity: 'Department',
    entityId: dept.id,
    details: body,
  });

  res.status(201).json({ success: true, message: 'Department created successfully', data: dept });
});

// GET /api/departments/designations - List all designations
router.get('/designations', authenticate, async (req: AuthRequest, res: Response) => {
  const designations = await prisma.designation.findMany({
    include: { department: { select: { name: true, code: true } } },
    orderBy: [{ level: 'desc' }, { name: 'asc' }],
  });
  res.json({ success: true, data: designations });
});

// POST /api/departments/designations - Create designation
const desigSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).toUpperCase(),
  level: z.number().int().default(1),
  departmentId: z.string().min(1),
});

router.post('/designations', authenticate, authorize('SUPER_ADMIN', 'HR_ADMIN'), async (req: AuthRequest, res: Response) => {
  const body = desigSchema.parse(req.body);

  const desig = await prisma.designation.create({
    data: body,
    include: { department: true },
  });

  await logAudit({
    userId: req.user!.id,
    action: 'CREATE_DESIGNATION',
    entity: 'Designation',
    entityId: desig.id,
    details: body,
  });

  res.status(201).json({ success: true, message: 'Designation created successfully', data: desig });
});

export default router;
