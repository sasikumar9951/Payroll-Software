import { Router, Response } from 'express';
import prisma from '../config/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/notifications
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: req.user!.id, isRead: false },
  });

  res.json({ success: true, data: notifications, unreadCount });
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;

  await prisma.notification.updateMany({
    where: { id, userId: req.user!.id },
    data: { isRead: true },
  });

  res.json({ success: true, message: 'Notification marked as read' });
});

// PUT /api/notifications/read-all
router.put('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, isRead: false },
    data: { isRead: true },
  });

  res.json({ success: true, message: 'All notifications marked as read' });
});

export default router;
