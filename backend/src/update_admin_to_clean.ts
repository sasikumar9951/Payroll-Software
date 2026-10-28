import prisma from './config/prisma';

async function updateAdmin() {
  console.log('--- Updating Admin profile in DB ---');

  // 1. Update Designation
  const ceoDesig = await prisma.designation.findFirst({
    where: {
      name: { in: ['Founder & CEO', 'Founder & Chief Executive Officer'] },
    },
  });

  let adminDesigId = ceoDesig?.id;
  if (ceoDesig) {
    const updatedDesig = await prisma.designation.update({
      where: { id: ceoDesig.id },
      data: {
        name: 'System Administrator',
        code: 'ADMIN',
      },
    });
    console.log('✓ Renamed designation to:', updatedDesig.name);
    adminDesigId = updatedDesig.id;
  }

  // 2. Update Admin user's employee profile
  const adminUser = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
    include: { employee: true },
  });

  if (adminUser && adminUser.employee) {
    const updatedEmp = await prisma.employee.update({
      where: { id: adminUser.employee.id },
      data: {
        firstName: 'System',
        lastName: 'Admin',
        displayName: 'Admin',
        designationId: adminDesigId || adminUser.employee.designationId,
      },
    });
    console.log('✓ Updated Admin Employee name to:', updatedEmp.firstName, updatedEmp.lastName);
  }

  console.log('--- Finished updating Admin profile ---');
}

updateAdmin()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
