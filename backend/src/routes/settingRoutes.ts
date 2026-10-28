import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';

const router = Router();

// GET /api/settings - Get public/general company settings
router.get('/', async (req, res: Response) => {
  const settings = await prisma.companySetting.findMany();
  const settingsMap: Record<string, string> = {};
  settings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  res.json({
    success: true,
    data: {
      companyName: settingsMap['COMPANY_NAME'] || config.company.name,
      companyLogo: settingsMap['COMPANY_LOGO'] || null,
      workStartTime: settingsMap['WORK_START_TIME'] || config.company.workStartTime,
      workEndTime: settingsMap['WORK_END_TIME'] || config.company.workEndTime,
      gracePeriodMinutes: parseInt(settingsMap['GRACE_PERIOD_MINUTES'] || String(config.company.gracePeriodMinutes), 10),
      raw: settings,
    },
  });
});

// PUT /api/settings - Update company settings (Super Admin only)
const updateSettingsSchema = z.object({
  companyName: z.string().min(1).optional(),
  companyLogo: z.string().optional().nullable(), // base64 data URL or null to remove
  workStartTime: z.string().optional(),
  workEndTime: z.string().optional(),
  gracePeriodMinutes: z.number().int().min(0).optional(),
});

router.put('/', authenticate, authorize('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  const body = updateSettingsSchema.parse(req.body);

  const updates: Array<{ key: string; value: string; category: string; description?: string }> = [];

  if (body.companyName) {
    updates.push({
      key: 'COMPANY_NAME',
      value: body.companyName,
      category: 'GENERAL',
      description: 'Official organization entity name',
    });
  }
  if (body.companyLogo !== undefined) {
    if (body.companyLogo === null || body.companyLogo === '') {
      // Remove logo
      await prisma.companySetting.deleteMany({ where: { key: 'COMPANY_LOGO' } });
    } else {
      updates.push({
        key: 'COMPANY_LOGO',
        value: body.companyLogo,
        category: 'GENERAL',
        description: 'Company logo as base64 data URL',
      });
    }
  }
  if (body.workStartTime) {
    updates.push({
      key: 'WORK_START_TIME',
      value: body.workStartTime,
      category: 'ATTENDANCE',
      description: 'Official shift start time',
    });
  }
  if (body.workEndTime) {
    updates.push({
      key: 'WORK_END_TIME',
      value: body.workEndTime,
      category: 'ATTENDANCE',
      description: 'Official shift end time',
    });
  }
  if (body.gracePeriodMinutes !== undefined) {
    updates.push({
      key: 'GRACE_PERIOD_MINUTES',
      value: String(body.gracePeriodMinutes),
      category: 'ATTENDANCE',
      description: 'Allowed arrival grace period in minutes',
    });
  }

  for (const item of updates) {
    await prisma.companySetting.upsert({
      where: { key: item.key },
      update: { value: item.value },
      create: item,
    });
  }

  await logAudit({
    userId: req.user!.id,
    action: 'UPDATE_COMPANY_SETTINGS',
    entity: 'CompanySetting',
    details: { ...body, companyLogo: body.companyLogo ? '[BASE64_IMAGE]' : body.companyLogo },
  });

  res.json({
    success: true,
    message: 'Company settings updated successfully',
    data: body,
  });
});

export default router;
