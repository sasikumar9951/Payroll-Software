import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Purging all mock data and setting up clean production database...');

  // 1. Purge all records
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.attendanceCorrectionRequest.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.employeeDocument.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.designation.deleteMany();
  await prisma.department.deleteMany();
  await prisma.leaveType.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.companySetting.deleteMany();
  await prisma.user.deleteMany();

  console.log('✓ All mock data, test punches, and dummy records purged.');

  // 2. Official Company Settings
  await prisma.companySetting.createMany({
    data: [
      { key: 'COMPANY_NAME', value: 'DivineCore Technologies Pvt. Ltd.', category: 'GENERAL', description: 'Official registered entity name' },
      { key: 'WORK_START_TIME', value: '09:00', category: 'ATTENDANCE', description: 'Official shift start time (24h format IST)' },
      { key: 'WORK_END_TIME', value: '18:00', category: 'ATTENDANCE', description: 'Official shift end time (24h format IST)' },
      { key: 'GRACE_PERIOD_MINUTES', value: '15', category: 'ATTENDANCE', description: 'Allowed arrival grace period in minutes' },
      { key: 'HALF_DAY_MIN_HOURS', value: '4.5', category: 'ATTENDANCE', description: 'Minimum working hours required for half-day credit' },
      { key: 'FULL_DAY_MIN_HOURS', value: '8.0', category: 'ATTENDANCE', description: 'Minimum working hours required for full-day credit' },
    ],
  });

  // 3. Official Departments
  const engDept = await prisma.department.create({
    data: { name: 'Engineering & Development', code: 'ENG', description: 'Core software engineering and architecture' },
  });
  const prodDept = await prisma.department.create({
    data: { name: 'Product & UI/UX Design', code: 'PRD', description: 'Product strategy, wireframing and design systems' },
  });
  const hrDept = await prisma.department.create({
    data: { name: 'Human Resources & Talent', code: 'HRD', description: 'Talent acquisition, employee lifecycle and culture' },
  });
  const finDept = await prisma.department.create({
    data: { name: 'Finance & Accounts', code: 'FIN', description: 'Payroll administration, statutory compliances and auditing' },
  });
  const qaDept = await prisma.department.create({
    data: { name: 'Quality Assurance & SecOps', code: 'QAS', description: 'Software quality testing and security validation' },
  });

  // 4. Official Core Designations
  const ceoDesig = await prisma.designation.create({
    data: { name: 'Founder & Chief Executive Officer', code: 'CEO', level: 10, departmentId: engDept.id },
  });
  await prisma.designation.createMany({
    data: [
      { name: 'Head of People & Culture', code: 'HPC', level: 8, departmentId: hrDept.id },
      { name: 'Lead Engineering Manager', code: 'LEM', level: 7, departmentId: engDept.id },
      { name: 'Lead Financial Controller', code: 'LFC', level: 7, departmentId: finDept.id },
      { name: 'Senior Full Stack Engineer', code: 'SFE', level: 5, departmentId: engDept.id },
      { name: 'Senior UI/UX Designer', code: 'SUD', level: 5, departmentId: prodDept.id },
      { name: 'Backend Systems Specialist', code: 'BSS', level: 4, departmentId: engDept.id },
      { name: 'QA Automation Engineer', code: 'QAE', level: 4, departmentId: qaDept.id },
    ],
  });

  // 5. Official Leave Types
  const leaveTypes = await Promise.all([
    prisma.leaveType.create({
      data: { name: 'Casual Leave', code: 'CL', description: 'Short planned personal time off', daysAllowedPerYear: 12, isPaid: true, colorCode: '#3B82F6' },
    }),
    prisma.leaveType.create({
      data: { name: 'Sick Leave', code: 'SL', description: 'Medical recovery and health leave', daysAllowedPerYear: 10, isPaid: true, requiresProof: true, colorCode: '#EF4444' },
    }),
    prisma.leaveType.create({
      data: { name: 'Privilege / Earned Leave', code: 'EL', description: 'Annual accrued vacation leave', daysAllowedPerYear: 15, isPaid: true, colorCode: '#10B981' },
    }),
    prisma.leaveType.create({
      data: { name: 'Compensatory Off', code: 'CO', description: 'Credit for weekend / holiday deployment', daysAllowedPerYear: 5, isPaid: true, colorCode: '#F59E0B' },
    }),
  ]);

  // 6. Super Admin Account Setup
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@divinecore.in',
      passwordHash: adminPasswordHash,
      role: 'SUPER_ADMIN',
    },
  });

  const adminEmployee = await prisma.employee.create({
    data: {
      employeeId: 'DCT-001',
      userId: adminUser.id,
      firstName: 'Dr. Aarav',
      lastName: 'Sharma',
      phone: '+91 98765 43210',
      departmentId: engDept.id,
      designationId: ceoDesig.id,
      joiningDate: new Date('2023-01-01'),
      probationStatus: 'CONFIRMED',
      employmentStatus: 'ACTIVE',
      employmentType: 'FULL_TIME',
      workLocation: 'OFFICE',
      currentAddress: 'Suite 402, High Street Towers, Bangalore, Karnataka',
      basicSalary: 250000,
      hra: 100000,
      specialAllowance: 50000,
      grossSalary: 400000,
      ctc: 5000000,
      bankName: 'HDFC Bank',
      accountNumber: '50100456123489',
      ifscCode: 'HDFC0001234',
      panNumber: 'AAACS1234D',
    },
  });

  // Allocate 2026 leave balances for Admin
  const currentYear = new Date().getFullYear();
  for (const lt of leaveTypes) {
    await prisma.leaveBalance.create({
      data: {
        employeeId: adminEmployee.id,
        leaveTypeId: lt.id,
        year: currentYear,
        allocatedDays: lt.daysAllowedPerYear,
        usedDays: 0,
        pendingDays: 0,
        remainingDays: lt.daysAllowedPerYear,
      },
    });
  }

  // Welcome system notification
  await prisma.notification.create({
    data: {
      userId: adminUser.id,
      title: 'DivineCore HRMS Initialized',
      message: 'System master configuration ready. You can now onboard real employees, configure policies, and track real-time attendance.',
      type: 'SUCCESS',
      linkUrl: '/employees',
    },
  });

  console.log('✅ Clean database setup complete!');
  console.log('----------------------------------------------------');
  console.log('Super Admin Credentials:');
  console.log('Email:    admin@divinecore.in');
  console.log('Password: Admin@123');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
