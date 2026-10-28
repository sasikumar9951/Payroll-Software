import prisma from './config/prisma';

async function clearPunches() {
  console.log('Clearing previous punches for employee...');

  const employee = await prisma.employee.findFirst({
    where: { employeeId: 'EMP-002' },
  });

  if (!employee) {
    console.log('Employee EMP-002 not found.');
    return;
  }

  const deleted = await prisma.attendanceRecord.deleteMany({
    where: {
      employeeId: employee.id,
    },
  });

  console.log(`✅ Successfully deleted ${deleted.count} attendance punch record(s) for ${employee.firstName} ${employee.lastName} (${employee.employeeId})!`);
}

clearPunches()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
