import prisma from '../config/prisma';

export const logAudit = async ({
  userId,
  action,
  entity,
  entityId,
  details,
  ipAddress,
}: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entity,
        entityId: entityId || null,
        details: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    console.error('Audit log failed:', error);
  }
};
