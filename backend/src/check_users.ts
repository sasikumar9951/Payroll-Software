import prisma from './config/prisma';

async function listUsers() {
  const users = await prisma.user.findMany({
    include: {
      employee: {
        include: {
          department: true,
          designation: true,
        },
      },
    },
  });

  console.log('--- USERS IN DATABASE ---');
  users.forEach((u: any) => {
    console.log(`Email: ${u.email} | Role: ${u.role} | Employee: ${u.employee ? `${u.employee.firstName} ${u.employee.lastName} (${u.employee.employeeId})` : 'None'}`);
  });
  console.log('-------------------------');
}

listUsers().finally(() => prisma.$disconnect());
