import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/prisma';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);

  const normalizedEmail = email.toLowerCase().trim();
  // Support divinecore.in / divinecoretech.in / divinecoretech.com aliases for admin
  const candidateEmails = [normalizedEmail];
  if (normalizedEmail.startsWith('admin@')) {
    candidateEmails.push('admin@divinecore.in', 'admin@divinecoretech.in', 'admin@divinecoretech.com');
  }

  const user = await prisma.user.findFirst({
    where: { email: { in: candidateEmails } },
    include: {
      employee: {
        include: {
          department: true,
          designation: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Contact HR administrator.', 403);
  }

  // Check exact password or first-letter capitalized variant (e.g. admin@123 -> Admin@123)
  let isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch && password.length > 0) {
    const capitalized = password.charAt(0).toUpperCase() + password.slice(1);
    isMatch = await bcrypt.compare(capitalized, user.passwordHash);
  }

  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Generate JWT token
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  // Set HTTP-only cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  await logAudit({
    userId: user.id,
    action: 'USER_LOGIN',
    entity: 'User',
    entityId: user.id,
    ipAddress: req.ip,
  });

  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      employee: user.employee ? {
        id: user.employee.id,
        employeeId: user.employee.employeeId,
        firstName: user.employee.firstName,
        lastName: user.employee.lastName,
        profilePhoto: user.employee.profilePhoto,
        department: user.employee.department?.name,
        designation: user.employee.designation?.name,
      } : null,
    },
  });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      employee: {
        include: {
          department: true,
          designation: true,
          reportingManager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      employee: user.employee,
    },
  });
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  res.clearCookie('token');
  await logAudit({
    userId: req.user?.id,
    action: 'USER_LOGOUT',
    entity: 'User',
    entityId: req.user?.id,
    ipAddress: req.ip,
  });
  res.json({ success: true, message: 'Logged out successfully' });
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 6) {
    throw new AppError('Please provide a valid current password and new password (min 6 chars).', 400);
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw new AppError('User not found', 404);

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) throw new AppError('Incorrect current password', 400);

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  await logAudit({
    userId: user.id,
    action: 'CHANGE_PASSWORD',
    entity: 'User',
    entityId: user.id,
  });

  res.json({ success: true, message: 'Password changed successfully' });
});

export default router;
