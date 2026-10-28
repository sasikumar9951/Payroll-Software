import bcrypt from 'bcryptjs';
import prisma from './config/prisma';

async function seedEmployee() {
  console.log('Seeding standard Employee account in Supabase...');

  // 1. Get or find Engineering department and Software Engineer designation
  let dept = await prisma.department.findFirst({
    where: { code: 'ENG' },
  });
  if (!dept) {
    dept = await prisma.department.findFirst();
  }
  if (!dept) {
    throw new Error('No department found');
  }

  let desig = await prisma.designation.findFirst({
    where: { name: 'Senior Full Stack Engineer' },
  });
  if (!desig) {
    desig = await prisma.designation.findFirst() || await prisma.designation.create({
      data: {
        name: 'Senior Full Stack Engineer',
        code: 'SWE-SR',
        level: 3,
        departmentId: dept.id,
      },
    });
  }

  // 2. Create standard Employee user account
  const employeeEmail = 'abhijeet.s@divinecoretech.com';
  const defaultPassword = 'Employee@123';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: employeeEmail },
        { email: 'employee@company.com' },
      ],
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: employeeEmail,
        passwordHash,
        role: 'EMPLOYEE',
      },
    });
    console.log(`Created User: ${employeeEmail}`);
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: employeeEmail,
        passwordHash,
        role: 'EMPLOYEE',
      },
    });
    console.log(`Updated User: ${employeeEmail}`);
  }

  // 3. Create or link Employee profile
  let employee = await prisma.employee.findFirst({
    where: {
      OR: [
        { userId: user.id },
        { employeeId: 'DCT-26-004' },
      ],
    },
  });

  if (!employee) {
    employee = await prisma.employee.create({
      data: {
        employeeId: 'DCT-26-004',
        userId: user.id,
        firstName: 'Abhijeet kumar',
        lastName: 'S',
        displayName: 'Abhijeet kumar S',
        phone: '+91 98765 43210',
        personalEmail: 'abhijeet.s@divinecoretech.com',
        departmentId: dept.id,
        designationId: desig.id,
        joiningDate: new Date('2026-09-07'),
        probationStatus: 'PROBATION',
        employmentStatus: 'ACTIVE',
        employmentType: 'FULL_TIME',
        workLocation: 'OFFICE',
        basicSalary: 45000,
        hra: 18000,
        specialAllowance: 12000,
        grossSalary: 75000,
        ctc: 950000,
      },
    });
    console.log(`Created Employee profile: ${employee.firstName} ${employee.lastName} (${employee.employeeId})`);
  } else {
    employee = await prisma.employee.update({
      where: { id: employee.id },
      data: {
        employeeId: 'DCT-26-004',
        firstName: 'Abhijeet kumar',
        lastName: 'S',
        displayName: 'Abhijeet kumar S',
        personalEmail: 'abhijeet.s@divinecoretech.com',
        joiningDate: new Date('2026-09-07'),
      },
    });
    console.log(`Updated Employee profile: ${employee.firstName} ${employee.lastName} (${employee.employeeId})`);
  }

  // 4. Allocate leave balances if not present
  const leaveTypes = await prisma.leaveType.findMany();
  const currentYear = new Date().getFullYear();

  for (const lt of leaveTypes) {
    const existing = await prisma.leaveBalance.findFirst({
      where: {
        employeeId: employee.id,
        leaveTypeId: lt.id,
        year: currentYear,
      },
    });

    if (!existing) {
      await prisma.leaveBalance.create({
        data: {
          employeeId: employee.id,
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

  console.log('✅ Standard Employee account ready in Supabase database!');
  console.log('----------------------------------------------------');
  console.log(`Email:    ${employeeEmail}`);
  console.log(`Password: ${defaultPassword}`);
  console.log('Role:     EMPLOYEE');
  console.log('Name:     Rahul Verma (EMP-002)');
  console.log('----------------------------------------------------');
}

seedEmployee()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
