import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './routes/authRoutes';
import employeeRoutes from './routes/employeeRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import leaveRoutes from './routes/leaveRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import departmentRoutes from './routes/departmentRoutes';
import reportRoutes from './routes/reportRoutes';
import notificationRoutes from './routes/notificationRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import settingRoutes from './routes/settingRoutes';
import assessmentRoutes from './routes/assessmentRoutes';

const app = express();

// Security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// CORS
app.use(cors({
  origin: [config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logger
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiter for authentication endpoints to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditLogRoutes);
import path from 'path';
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/settings', settingRoutes);
app.use('/api/assessments', assessmentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    company: config.company.name,
    timestamp: new Date().toISOString(),
    version: '1.0.0 (Phase 1)',
  });
});

// Centralized error handler
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`🚀 DivineCore Technologies HRMS Backend Server running`);
  console.log(`📡 URL: http://localhost:${config.port}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🏢 Organization: ${config.company.name}`);
  console.log(`====================================================`);
});

export default app;
