import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'divinecore_hrms_super_secure_jwt_secret_key_2026_production_ready',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'divinecore_hrms_refresh_token_secret_2026',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  company: {
    name: process.env.COMPANY_NAME || 'DivineCore Technologies Pvt. Ltd.',
    timezone: process.env.COMPANY_TIMEZONE || 'Asia/Kolkata',
    workStartTime: process.env.WORK_START_TIME || '09:00',
    workEndTime: process.env.WORK_END_TIME || '18:00',
    gracePeriodMinutes: parseInt(process.env.GRACE_PERIOD_MINUTES || '15', 10),
    halfDayHours: 4.5,
    fullDayHours: 9.0,
  },
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
};
