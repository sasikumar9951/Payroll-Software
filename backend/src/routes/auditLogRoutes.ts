import { Router, Response } from 'express';
import prisma from '../config/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/audit-logs - Super Admin / HR audit trail
router.get('/', authenticate, authorize('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  const { limit = '50', page = '1' } = req.query as Record<string, string>;
  const take = Math.min(100, parseInt(limit, 10));
  const skip = (Math.max(1, parseInt(page, 10)) - 1) * take;

  const [total, logs] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, role: true } },
      },
    }),
  ]);

  res.json({
    success: true,
    data: logs,
    meta: {
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / take),
    },
  });
});

export default router;
