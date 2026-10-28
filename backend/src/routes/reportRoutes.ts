import { Router, Response } from 'express';
import * as XLSX from 'xlsx';
import prisma from '../config/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/reports/attendance/excel - Export attendance records as Excel (.xlsx)
router.get('/attendance/excel', authenticate, authorize('SUPER_ADMIN', 'HR_ADMIN', 'ACCOUNTS_ADMIN'), async (req: AuthRequest, res: Response) => {
  const records = await prisma.attendanceRecord.findMany({
    include: {
      employee: {
        include: {
          department: true,
          designation: true,
        },
      },
    },
    orderBy: { date: 'desc' },
    take: 1000,
  });

  const rows = records.map((r) => ({
    'Employee ID': r.employee.employeeId,
    'Employee Name': `${r.employee.firstName} ${r.employee.lastName}`,
    'Department': r.employee.department?.name || 'N/A',
    'Designation': r.employee.designation?.name || 'N/A',
    'Date': new Date(r.date).toLocaleDateString('en-GB'),
    'Check In': r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString('en-US') : 'N/A',
    'Check Out': r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString('en-US') : 'N/A',
    'Status': r.status,
    'Total Hours': r.totalHours || 0,
    'Effective Hours': r.effectiveHours || 0,
    'Late Minutes': r.lateMinutes || 0,
    'Punch Method': r.checkInMethod,
    'Regularized': r.isRegularized ? 'Yes' : 'No',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', 'attachment; filename="DivineCore_Attendance_Report.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

// GET /api/reports/employees/excel - Export employee list as Excel (.xlsx)
router.get('/employees/excel', authenticate, authorize('SUPER_ADMIN', 'HR_ADMIN', 'ACCOUNTS_ADMIN'), async (req: AuthRequest, res: Response) => {
  const employees = await prisma.employee.findMany({
    include: {
      user: true,
      department: true,
      designation: true,
    },
    orderBy: { employeeId: 'asc' },
  });

  const rows = employees.map((e) => ({
    'Employee ID': e.employeeId,
    'Name': `${e.firstName} ${e.lastName}`,
    'Official Email': e.user.email,
    'Phone': e.phone || 'N/A',
    'Department': e.department?.name || 'N/A',
    'Designation': e.designation?.name || 'N/A',
    'Employment Status': e.employmentStatus,
    'Work Location': e.workLocation,
    'Joining Date': new Date(e.joiningDate).toLocaleDateString('en-GB'),
    'Gross Monthly Salary (INR)': e.grossSalary || 0,
    'Annual CTC (INR)': e.ctc || 0,
    'Bank': e.bankName || 'N/A',
    'Account No': e.accountNumber || 'N/A',
    'PAN No': e.panNumber || 'N/A',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', 'attachment; filename="DivineCore_Employees_Report.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

export default router;
