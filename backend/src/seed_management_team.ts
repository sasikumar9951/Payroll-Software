import bcrypt from 'bcryptjs';
import prisma from './config/prisma';

async function setupManagementTeam() {
  console.log('🚀 Setting up company executive & management team...');

  // 1. Departments setup
  const hrDept = await prisma.department.upsert({
    where: { code: 'HRD' },
    update: { name: 'Human Resources & Talent' },
    create: {
      name: 'Human Resources & Talent',
      code: 'HRD',
      description: 'Talent acquisition, employee lifecycle, workplace policies and HR administration',
    },
  });

  const engDept = await prisma.department.upsert({
    where: { code: 'ENG' },
    update: { name: 'Engineering & Technology' },
    create: {
      name: 'Engineering & Technology',
      code: 'ENG',
      description: 'Software architecture, IT infrastructure and systems engineering',
    },
  });

  // 2. Designations setup
  const ceoDesig = await prisma.designation.upsert({
    where: {
      name_departmentId: {
        name: 'System Administrator',
        departmentId: engDept.id,
      },
    },
    update: { level: 10 },
    create: {
      name: 'System Administrator',
      code: 'ADMIN',
      level: 10,
      departmentId: engDept.id,
    },
  });

  const hrManagerDesig = await prisma.designation.upsert({
    where: {
      name_departmentId: {
        name: 'HR Manager',
        departmentId: hrDept.id,
      },
    },
    update: { level: 8 },
    create: {
      name: 'HR Manager',
      code: 'HRM',
      level: 8,
      departmentId: hrDept.id,
    },
  });

  const itManagerDesig = await prisma.designation.upsert({
    where: {
      name_departmentId: {
        name: 'IT Manager',
        departmentId: engDept.id,
      },
    },
    update: { level: 8 },
    create: {
      name: 'IT Manager',
      code: 'ITM',
      level: 8,
      departmentId: engDept.id,
    },
  });

  const leaveTypes = await prisma.leaveType.findMany();
  const currentYear = new Date().getFullYear();

  // Helper for leave allocation
  const allocateLeaves = async (empId: string) => {
    for (const lt of leaveTypes) {
      const existing = await prisma.leaveBalance.findFirst({
        where: {
          employeeId: empId,
          leaveTypeId: lt.id,
          year: currentYear,
        },
      });
      if (!existing) {
        await prisma.leaveBalance.create({
          data: {
            employeeId: empId,
            leaveTypeId: lt.id,
            year: currentYear,
            allocatedDays: lt.daysAllowedPerYear,
            usedDays: 0,
            pendingDays: 0,
            remainingDays: lt.daysAllowedPerYear,
          },
        });
      }
    }
  };

  // 3. Admin Account Setup
  const adminUser = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
  });

  let ceoEmployee = null;
  if (adminUser) {
    ceoEmployee = await prisma.employee.findUnique({
      where: { userId: adminUser.id },
    });

    if (ceoEmployee) {
      ceoEmployee = await prisma.employee.update({
        where: { id: ceoEmployee.id },
        data: {
          firstName: 'System',
          lastName: 'Admin',
          displayName: 'Admin',
          designationId: ceoDesig.id,
          departmentId: engDept.id,
        },
      });
      console.log('✓ Updated Admin profile: System Admin');
    }
  }

  // 4. HR Manager : Namitha M
  // joining date: 20.07.2026, emp id: DCT-26-001, lpa: 3, mail id: namitha.m@divinecoretech.com, dob: 20.06.2005, blood gp: a1+
  const hrEmail = 'namitha.m@divinecoretech.com';
  const hrPasswordHash = await bcrypt.hash('Namitha@123', 10);

  const hrUser = await prisma.user.upsert({
    where: { email: hrEmail },
    update: {
      role: 'HR_ADMIN',
      isActive: true,
    },
    create: {
      email: hrEmail,
      passwordHash: hrPasswordHash,
      role: 'HR_ADMIN',
      isActive: true,
    },
  });

  const hrJoining = new Date('2026-07-20T00:00:00Z');
  const hrDob = new Date('2005-06-20T00:00:00Z');

  const hrEmployee = await prisma.employee.upsert({
    where: { employeeId: 'DCT-26-001' },
    update: {
      userId: hrUser.id,
      firstName: 'Namitha',
      lastName: 'M',
      displayName: 'Namitha M',
      personalEmail: hrEmail,
      dob: hrDob,
      gender: 'Female',
      joiningDate: hrJoining,
      departmentId: hrDept.id,
      designationId: hrManagerDesig.id,
      reportingManagerId: ceoEmployee?.id || null,
      employmentStatus: 'ACTIVE',
      employmentType: 'FULL_TIME',
      workLocation: 'OFFICE',
      basicSalary: 15000,
      hra: 6000,
      specialAllowance: 4000,
      grossSalary: 25000,
      ctc: 300000, // 3 LPA
    },
    create: {
      employeeId: 'DCT-26-001',
      userId: hrUser.id,
      firstName: 'Namitha',
      lastName: 'M',
      displayName: 'Namitha M',
      personalEmail: hrEmail,
      dob: hrDob,
      gender: 'Female',
      joiningDate: hrJoining,
      departmentId: hrDept.id,
      designationId: hrManagerDesig.id,
      reportingManagerId: ceoEmployee?.id || null,
      employmentStatus: 'ACTIVE',
      employmentType: 'FULL_TIME',
      workLocation: 'OFFICE',
      basicSalary: 15000,
      hra: 6000,
      specialAllowance: 4000,
      grossSalary: 25000,
      ctc: 300000, // 3 LPA
    },
  });
  await allocateLeaves(hrEmployee.id);
  console.log('✓ Upserted HR Manager: Namitha M (DCT-26-001)');

  // 5. IT Manager : Saranya M
  // joining date: 1.09.2026, emp id: DCT-26-006, lpa: 3, mail id: saranya.m@divinecoretech.com, dob: 16.09.2006, blood group: o+
  const itEmail = 'saranya.m@divinecoretech.com';
  const itPasswordHash = await bcrypt.hash('Saranya@123', 10);

  const itUser = await prisma.user.upsert({
    where: { email: itEmail },
    update: {
      role: 'PROJECT_MANAGER',
      isActive: true,
    },
    create: {
      email: itEmail,
      passwordHash: itPasswordHash,
      role: 'PROJECT_MANAGER',
      isActive: true,
    },
  });

  const itJoining = new Date('2026-09-01T00:00:00Z');
  const itDob = new Date('2006-09-16T00:00:00Z');

  const itEmployee = await prisma.employee.upsert({
    where: { employeeId: 'DCT-26-006' },
    update: {
      userId: itUser.id,
      firstName: 'Saranya',
      lastName: 'M',
      displayName: 'Saranya M',
      personalEmail: itEmail,
      dob: itDob,
      gender: 'Female',
      joiningDate: itJoining,
      departmentId: engDept.id,
      designationId: itManagerDesig.id,
      reportingManagerId: ceoEmployee?.id || null,
      employmentStatus: 'ACTIVE',
      employmentType: 'FULL_TIME',
      workLocation: 'OFFICE',
      basicSalary: 15000,
      hra: 6000,
      specialAllowance: 4000,
      grossSalary: 25000,
      ctc: 300000, // 3 LPA
    },
    create: {
      employeeId: 'DCT-26-006',
      userId: itUser.id,
      firstName: 'Saranya',
      lastName: 'M',
      displayName: 'Saranya M',
      personalEmail: itEmail,
      dob: itDob,
      gender: 'Female',
      joiningDate: itJoining,
      departmentId: engDept.id,
      designationId: itManagerDesig.id,
      reportingManagerId: ceoEmployee?.id || null,
      employmentStatus: 'ACTIVE',
      employmentType: 'FULL_TIME',
      workLocation: 'OFFICE',
      basicSalary: 15000,
      hra: 6000,
      specialAllowance: 4000,
      grossSalary: 25000,
      ctc: 300000, // 3 LPA
    },
  });
  await allocateLeaves(itEmployee.id);
  console.log('✓ Upserted IT Manager: Saranya M (DCT-26-006)');

  // 6. Update blood groups directly in DB
  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "employees" SET "bloodGroup" = 'A1+' WHERE "employeeId" = 'DCT-26-001'`
    );
    await prisma.$executeRawUnsafe(
      `UPDATE "employees" SET "bloodGroup" = 'O+' WHERE "employeeId" = 'DCT-26-006'`
    );
    console.log('✓ Updated blood groups: Namitha M (A1+), Saranya M (O+)');
  } catch (err: any) {
    console.log('Note on bloodGroup update:', err.message);
  }

  console.log('\n======================================================');
  console.log('🏢 Management Team Configuration Summary:');
  console.log('------------------------------------------------------');
  console.log('1. Admin: System Admin');
  console.log('   Email: admin@divinecore.in | Password: Admin@123 | Role: SUPER_ADMIN');
  console.log('');
  console.log('2. HR Manager: Namitha M');
  console.log('   Emp ID: DCT-26-001 | Email: namitha.m@divinecoretech.com');
  console.log('   Password: Namitha@123 | Role: HR_ADMIN | LPA: 3 LPA');
  console.log('   Joining Date: 20-07-2026 | DOB: 20-06-2005 | Blood: A1+');
  console.log('');
  console.log('3. IT Manager: Saranya M');
  console.log('   Emp ID: DCT-26-006 | Email: saranya.m@divinecoretech.com');
  console.log('   Password: Saranya@123 | Role: PROJECT_MANAGER | LPA: 3 LPA');
  console.log('   Joining Date: 01-09-2026 | DOB: 16-09-2006 | Blood: O+');
  console.log('======================================================');
}

setupManagementTeam()
  .catch((e) => {
    console.error('Error during management team setup:', e);
  })
  .finally(() => prisma.$disconnect());
