import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../config/prisma';
import { AppError } from './errorHandler';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Authentication required. Please log in.', 401);
    }

    const decoded = jwt.verify(token, config.jwtSecret) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            departmentId: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or account is deactivated.', 401);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employee?.id,
      firstName: user.employee?.firstName,
      lastName: user.employee?.lastName,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Session expired. Please log in again.', 401));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid authentication token.', 401));
    }
    next(error);
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Requires one of: [${allowedRoles.join(', ')}]`,
          403
        )
      );
    }

    next();
  };
};
