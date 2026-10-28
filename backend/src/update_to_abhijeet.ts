import prisma from './config/prisma';
import bcrypt from 'bcryptjs';

async function updateToAbhijeet() {
  console.log('Updating Employee to Abhijeet kumar S (DCT-26-004)...');

  // 1. Get Engineering or IT department
  let dept = await prisma.department.findFirst({
    where: { code: 'ENG' },
  });
  if (!dept) {
    dept = await prisma.department.findFirst();
  }
  if (!dept) {
    dept = await prisma.department.create({
      data: {
        name: 'Information Technology & Engineering',
        code: 'ENG',
        description: 'IT infrastructure, systems support and software development',
      },
    });
  }

  // 2. Find or create designation "IT & Project support"
  let desig = await prisma.designation.findFirst({
    where: {
      name: 'IT & Project support',
      departmentId: dept.id,
    },
  });

  if (!desig) {
    desig = await prisma.designation.create({
      data: {
        name: 'IT & Project support',
        code: 'IT-PS',
        level: 2,
        departmentId: dept.id,
      },
    });
  }

  // 3. Find the user (either by employee@company.com or rahul's account or create)
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'employee@company.com' },
        { email: 'abhijeet.s@divinecoretech.com' },
      ],
    },
  });

  const passwordHash = await bcrypt.hash('Employee@123', 10);

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: 'abhijeet.s@divinecoretech.com',
        role: 'EMPLOYEE',
      },
    });
    console.log(`Updated User email to: abhijeet.s@divinecoretech.com`);
  } else {
    user = await prisma.user.create({
      data: {
        email: 'abhijeet.s@divinecoretech.com',
        passwordHash,
        role: 'EMPLOYEE',
      },
    });
    console.log(`Created User: abhijeet.s@divinecoretech.com`);
  }

  // 4. Update or create Employee profile
  let employee = await prisma.employee.findFirst({
    where: {
      OR: [
        { userId: user.id },
        { employeeId: 'DCT-26-004' },
        { employeeId: 'EMP-002' },
      ],
    },
  });

  const joiningDate = new Date('2026-09-07');

  if (employee) {
    employee = await prisma.employee.update({
      where: { id: employee.id },
      data: {
        userId: user.id,
        employeeId: 'DCT-26-004',
        firstName: 'Abhijeet kumar',
        lastName: 'S',
        displayName: 'Abhijeet kumar S',
        personalEmail: 'abhijeet.s@divinecoretech.com',
        departmentId: dept.id,
        designationId: desig.id,
        joiningDate: joiningDate,
        employmentStatus: 'ACTIVE',
        employmentType: 'FULL_TIME',
        workLocation: 'OFFICE',
      },
    });
    console.log(`Updated Employee profile to: ${employee.firstName} ${employee.lastName} (${employee.employeeId})`);
  } else {
    employee = await prisma.employee.create({
      data: {
        userId: user.id,
        employeeId: 'DCT-26-004',
        firstName: 'Abhijeet kumar',
        lastName: 'S',
        displayName: 'Abhijeet kumar S',
        phone: '+91 98765 43210',
        personalEmail: 'abhijeet.s@divinecoretech.com',
        departmentId: dept.id,
        designationId: desig.id,
        joiningDate: joiningDate,
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
  }

  console.log('✅ Employee successfully updated to Abhijeet kumar S!');
  console.log('----------------------------------------------------');
  console.log('Name:            Abhijeet kumar S');
  console.log('Employee ID:     DCT-26-004');
  console.log('Role/Designation: IT & Project support');
  console.log('Email:           abhijeet.s@divinecoretech.com');
  console.log('Joining Date:    07-09-2026');
  console.log('----------------------------------------------------');
}

updateToAbhijeet()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
