export type Role = 'SUPER_ADMIN' | 'HR_ADMIN' | 'PROJECT_MANAGER' | 'ACCOUNTS_ADMIN' | 'EMPLOYEE';

export interface User {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLoginAt?: string;
  employee?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string | null;
    department?: string | null;
    designation?: string | null;
  } | null;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  designations?: Designation[];
  _count?: { employees: number };
}

export interface Designation {
  id: string;
  name: string;
  code: string;
  level: number;
  departmentId: string;
  department?: { name: string; code: string };
}

export interface Employee {
  id: string;
  employeeId: string;
  userId: string;
  user: { email: string; role: Role; isActive: boolean; lastLoginAt?: string };
  firstName: string;
  lastName: string;
  displayName?: string;
  dob?: string;
  bloodGroup?: string;
  phone?: string;
  departmentId?: string;
  department?: { id: string; name: string; code: string };
  designationId?: string;
  designation?: { id: string; name: string; level: number };
  reportingManagerId?: string;
  reportingManager?: { id: string; firstName: string; lastName: string; employeeId: string };
  subordinates?: Array<{ id: string; firstName: string; lastName: string; employeeId: string }>;
  joiningDate: string;
  confirmationDate?: string;
  probationStatus: string;
  employmentStatus: 'ACTIVE' | 'PROBATION' | 'NOTICE_PERIOD' | 'RESIGNED' | 'TERMINATED';
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  workLocation: 'OFFICE' | 'REMOTE' | 'HYBRID';
  currentAddress?: string;
  permanentAddress?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  basicSalary?: number;
  hra?: number;
  specialAllowance?: number;
  otherAllowances?: number;
  grossSalary?: number;
  ctc?: number;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  panNumber?: string;
  uanNumber?: string;
  pfNumber?: string;
  esiNumber?: string;
  leaveBalances?: LeaveBalance[];
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    department?: { name: string };
  };
  date: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LATE' | 'ON_LEAVE' | 'HOLIDAY' | 'WEEKEND';
  totalHours?: number;
  effectiveHours?: number;
  breakHours?: number;
  lateMinutes?: number;
  earlyExitMinutes?: number;
  checkInMethod: string;
  checkInIp?: string;
  checkInLocation?: string;
  checkOutMethod?: string;
  checkOutIp?: string;
  checkOutLocation?: string;
  isRegularized?: boolean;
  notes?: string;
}

export interface AttendanceCorrection {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    department?: { name: string };
  };
  date: string;
  requestedCheckIn: string;
  requestedCheckOut: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: { email: string };
  reviewNotes?: string;
  createdAt: string;
}

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  description?: string;
  daysAllowedPerYear: number;
  isPaid: boolean;
  requiresProof: boolean;
  colorCode: string;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  leaveType: LeaveType;
  year: number;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    department?: { name: string };
    designation?: { name: string };
  };
  leaveTypeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
  halfDayType?: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewedBy?: { email: string };
  rejectionReason?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface DashboardSummary {
  stats: {
    totalEmployees: number;
    activeEmployees: number;
    presentCount: number;
    lateCount: number;
    halfDayCount: number;
    onLeaveCount: number;
    absentCount: number;
    currentlyCheckedIn: number;
    attendanceRate: number;
    pendingLeaves: number;
    pendingCorrections: number;
  };
  departmentStats: Array<{
    id: string;
    name: string;
    code: string;
    employeeCount: number;
  }>;
  trendData: Array<{
    date: string;
    present: number;
    late: number;
    absent: number;
  }>;
  notifications: NotificationItem[];
  activePunches: Array<{
    id: string;
    employeeId: string;
    name: string;
    department: string;
    checkInTime: string;
    status: string;
    isCheckedOut: boolean;
  }>;
  serverTime: string;
}
