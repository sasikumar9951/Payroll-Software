import { Router, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import prisma from '../config/prisma';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { logAudit } from '../utils/audit';

const router = Router();

// Ensure upload directory exists for assessment screen recordings
const uploadDir = path.join(__dirname, '../../uploads/assessments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `screen-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 300 * 1024 * 1024 }, // 300MB video recording limit
});

// POST /api/assessments/upload-recording - Upload recorded screen video
router.post('/upload-recording', authenticate, upload.single('recording'), async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No screen recording file provided' });
  }

  const recordingUrl = `/uploads/assessments/${req.file.filename}`;
  return res.json({
    success: true,
    recordingUrl,
    filename: req.file.filename,
    size: req.file.size,
    message: 'Screen recording uploaded successfully',
  });
});

// POST /api/assessments/submit - Submit an assessment result
router.post('/submit', authenticate, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const {
    candidateName,
    candidateEmail,
    candidateEmpId,
    designation,
    score,
    totalQuestions,
    correctAnswers,
    pointsEarned,
    violations,
    passed,
    status,
    answersJson,
    recordingUrl,
  } = req.body;

  const employee = await prisma.employee.findFirst({
    where: {
      OR: [
        { userId: user.id },
        { employeeId: candidateEmpId || '' },
      ],
    },
  });

  const submission = await prisma.assessmentSubmission.create({
    data: {
      employeeId: employee?.id || null,
      candidateName: candidateName || `${employee?.firstName || ''} ${employee?.lastName || ''}`.trim() || user.email,
      candidateEmail: candidateEmail || user.email,
      candidateEmpId: candidateEmpId || employee?.employeeId || 'N/A',
      designation: designation || employee?.designationId || 'IT & Project support',
      score: Number(score) || 0,
      totalQuestions: Number(totalQuestions) || 25,
      correctAnswers: Number(correctAnswers) || 0,
      pointsEarned: Number(pointsEarned) || 0,
      violations: Number(violations) || 0,
      passed: Boolean(passed),
      status: status || 'COMPLETED',
      answersJson: typeof answersJson === 'string' ? answersJson : JSON.stringify(answersJson || []),
      recordingUrl: recordingUrl || null,
    },
  });

  // Notify admins
  const adminUsers = await prisma.user.findMany({
    where: { role: { in: ['SUPER_ADMIN', 'HR_ADMIN'] } },
  });

  for (const admin of adminUsers) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: 'New Assessment Submission',
        message: `${submission.candidateName} (${submission.candidateEmpId}) completed the assessment with score ${submission.score}% (${submission.passed ? 'PASSED' : 'FAILED'}). Violations: ${submission.violations}.`,
        type: submission.passed ? 'SUCCESS' : 'WARNING',
        linkUrl: `/assessment`,
      },
    }).catch(() => {});
  }

  // Audit log
  await logAudit({
    userId: user.id,
    action: 'SUBMIT_ASSESSMENT',
    entity: 'AssessmentSubmission',
    entityId: submission.id,
    details: `Assessment submitted by ${submission.candidateName}: Score ${submission.score}%, Violations: ${submission.violations}`,
    ipAddress: req.ip,
  });

  return res.json({
    success: true,
    message: 'Assessment submitted successfully and recorded for administrator review',
    data: submission,
  });
});

// GET /api/assessments - Get all assessment submissions (for Admin/HR) or employee's own
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const isAdmin = ['SUPER_ADMIN', 'HR_ADMIN', 'PROJECT_MANAGER'].includes(user.role);

  let whereClause = {};
  if (!isAdmin) {
    // Regular employee only sees their own
    const employee = await prisma.employee.findFirst({
      where: { userId: user.id },
    });
    whereClause = {
      OR: [
        { employeeId: employee?.id || 'none' },
        { candidateEmail: user.email },
      ],
    };
  }

  const submissions = await prisma.assessmentSubmission.findMany({
    where: whereClause,
    include: {
      employee: {
        include: {
          department: true,
          designation: true,
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
  });

  return res.json({
    success: true,
    data: submissions,
  });
});

// GET /api/assessments/:id - Get single assessment submission details
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const user = req.user!;
  const isAdmin = ['SUPER_ADMIN', 'HR_ADMIN', 'PROJECT_MANAGER'].includes(user.role);

  const submission = await prisma.assessmentSubmission.findUnique({
    where: { id },
    include: {
      employee: {
        include: {
          department: true,
          designation: true,
        },
      },
    },
  });

  if (!submission) {
    return res.status(404).json({ success: false, message: 'Assessment submission not found' });
  }

  // If not admin and not their submission, deny
  if (!isAdmin && submission.candidateEmail !== user.email) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  return res.json({
    success: true,
    data: submission,
  });
});

// DELETE /api/assessments - Clear all assessment history (SUPER_ADMIN or HR_ADMIN only)
router.delete('/', authenticate, authorize('SUPER_ADMIN', 'HR_ADMIN'), async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await prisma.assessmentSubmission.deleteMany({});

  await logAudit({
    userId: user.id,
    action: 'CLEAR_ALL_ASSESSMENTS',
    entity: 'AssessmentSubmission',
    entityId: 'ALL',
    details: `Cleared ${result.count} assessment records from the system`,
    ipAddress: req.ip,
  });

  return res.json({
    success: true,
    message: `Successfully cleared all ${result.count} assessment records`,
    count: result.count,
  });
});

// DELETE /api/assessments/:id - Delete single assessment record
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'HR_ADMIN'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const user = req.user!;

  await prisma.assessmentSubmission.delete({
    where: { id },
  });

  await logAudit({
    userId: user.id,
    action: 'DELETE_ASSESSMENT',
    entity: 'AssessmentSubmission',
    entityId: id,
    details: `Deleted assessment submission ${id}`,
    ipAddress: req.ip,
  });

  return res.json({
    success: true,
    message: 'Assessment submission deleted successfully',
  });
});

export default router;
