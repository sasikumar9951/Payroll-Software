# DivineCore Technologies Pvt. Ltd. — Enterprise HRMS & Company Management System

[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-emerald.svg)]()
[![Stack](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%20%2B%20TypeScript-blue.svg)]()
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express%20%2B%20TypeScript-indigo.svg)]()
[![ORM](https://img.shields.io/badge/ORM-Prisma-purple.svg)]()
[![Design](https://img.shields.io/badge/Theme-Navy%20Blue%20Enterprise-navy.svg)]()

A complete, production-grade **Company Management System (HRMS + Attendance + Leave Management + Workforce Analytics)** custom-crafted for **DivineCore Technologies Pvt. Ltd.**

---

## 🚀 Live Application URLs

- **Frontend Portal**: [http://localhost:5173](http://localhost:5173)
- **Backend API Server**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Pre-Configured Demo Accounts (1-Click Login Enabled)

On the login page, you can either enter credentials manually or click the **1-Click Quick Demo Selector** buttons:

| Role | Name | Official Email | Default Password | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin / Founder & CEO** | Dr. Aarav Sharma | `admin@divinecore.in` | `Admin@123` | Complete system access, audit trail, employee management, approvals, settings |
| **HR Admin** | Meera Nair | `hr@divinecore.in` | `Hr@123` | Employee directory, leave approvals, attendance regularizations, department setup |
| **Team Lead / PM** | Rohan Deshmukh | `pm@divinecore.in` | `Pm@123` | Subordinate approvals, team attendance, project oversight |
| **Accounts / Payroll Admin** | Kavita Iyer | `accounts@divinecore.in` | `Accounts@123` | Confidential salary structures, statutory details (PAN/Bank), payroll exports |
| **Employee (Senior Dev)** | John Doe | `john@divinecore.in` | `User@123` | Personal profile, web punch in/out, leave applications, personal balances |

---

## 🌟 Key Functional Modules (Phase 1 Delivered)

### 1. Executive Real-Time Dashboard
- Live employee metrics calculated directly from database records (Total Workforce, Present Today, Late Arrivals, On Leave, Absent, Attendance %).
- **Interactive Web Punch Widget**: Live clock in / check out with server-time verification.
- **Visual Analytics with Recharts**:
  - 7-Day Attendance Trend area chart (present on time vs late arrivals).
  - Department Headcount distribution bar chart.
- Real-time **Live Floor Attendance** table tracking recent punches, IP addresses, and locations.
- Pending Administrative Actions notification banner for managers.

### 2. Employee Management & Directory
- Comprehensive employee directory with search, department filtering, and status filtering (`ACTIVE`, `PROBATION`, `NOTICE_PERIOD`, `TERMINATED`).
- Detailed Employee Profile cards (`/employees/:id`):
  - Job details, hierarchy level, and reporting manager relationship.
  - Emergency contact details and residential address.
  - **Confidential Salary & Statutory Compensation**: Monthly basic, HRA, special allowances, annual CTC, Bank account, IFSC, and PAN (strictly role-guarded).
  - Annual leave balances overview.
- **Onboard New Employee Modal**: Real-time form with user account creation, initial 2026 leave balances allocation, and validation.

### 3. Attendance & Regularization Hub
- Server timestamp recording with office working hours (**09:00 AM – 06:00 PM IST**).
- Automatic grace period calculation (15-minute grace; punches after 09:15 AM marked `LATE`).
- Calculation of effective hours, break deductions, and early departures.
- **Attendance Regularization Workflow**:
  - Employees can submit missed punch correction requests with time justification.
  - Reviewers can Approve/Reject requests. Approving automatically updates the official attendance record.
- **Company Daily Attendance Register**: Live view for administrators showing all staff punches, IPs, and locations.

### 4. Leave Management & Approvals Portal
- Pre-configured company leave categories:
  - **Casual Leave (CL)**: 12 days/year
  - **Sick Leave (SL)**: 10 days/year
  - **Earned / Privilege Leave (EL)**: 15 days/year
  - **Compensatory Off (CO)**: 5 days/year
- Multi-day and half-day (1st half / 2nd half) application support.
- Overlapping date prevention and balance verification.
- Dedicated **Approvals & Reviews** dashboard for HR and Team Leads:
  - Approve / Reject leave requests with justification notes.
  - Approving automatically deducts days from the employee's remaining balance.

### 5. Departments & Designations Manager
- Company division management (Engineering, Product & UI/UX, Human Resources, Finance & Accounts, QA & SecOps).
- Hierarchy levels (Levels 1 to 10) and designation titles.

### 6. Reports & Export Engine
- **One-click Excel (.xlsx) Downloads**:
  - `DivineCore_Attendance_Report.xlsx`: Comprehensive daily punch log with total hours, late minutes, and punch methods.
  - `DivineCore_Employees_Report.xlsx`: Full workforce roster with statutory details, CTC, and contact information.

### 7. Enterprise Security & Audit Trail
- Password hashing with Bcrypt (salt rounds: 10).
- HTTP-Only secure cookies and JWT bearer token support.
- Role-Based Access Control (RBAC) middleware.
- Centralized audit logging tracking user logins, employee creations, attendance punches, and authorization decisions.
- Rate limiting on authentication routes to mitigate brute force attacks.
- Helmet security headers and CORS configuration.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts, React Hot Toast, Date-Fns, Axios |
| **Backend** | Node.js, Express.js, TypeScript, Prisma ORM, Bcrypt.js, JsonWebToken, Zod, Cookie-Parser, Helmet, Express-Rate-Limit, Morgan, XLSX |
| **Database** | SQLite for instant local zero-config testing + Ready-to-deploy MySQL schema (`prisma/schema.mysql.prisma`) |
| **Aesthetics** | Enterprise Navy Blue (`#0B192C`, `#1E3E62`, `#0284C7`), Glassmorphism, Dark/Light Themes, Micro-animations |

---

## 📦 How to Run Locally

### 1. Backend Server
```bash
cd backend
# Database is already initialized and seeded with 8 employees!
# To start the server:
npx ts-node src/server.ts
```
The server will start at `http://localhost:5000`.

### 2. Frontend Application
```bash
cd frontend
npm run dev
```
The frontend will start at `http://localhost:5173`.

### 3. Switching to MySQL (When Ready)
1. Open `backend/.env`.
2. Update the `DATABASE_URL` with your MySQL root password:
   ```env
   DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/divinecore_hrms"
   ```
3. Copy the MySQL schema:
   ```bash
   cp backend/prisma/schema.mysql.prisma backend/prisma/schema.prisma
   ```
4. Push and seed MySQL:
   ```bash
   cd backend
   npx prisma db push
   npx ts-node prisma/seed.ts
   ```

---

## 🏛️ Project Structure

```
D:\company software\
├── backend\
│   ├── prisma\
│   │   ├── dev.db                      # Active SQLite database (auto-seeded)
│   │   ├── schema.prisma               # Universal Prisma schema
│   │   ├── schema.mysql.prisma         # Dedicated MySQL production schema
│   │   └── seed.ts                     # Database seeder with realistic test data
│   ├── src\
│   │   ├── config\                     # App & Prisma configs
│   │   ├── middleware\                 # Auth, RBAC & Error handling
│   │   ├── routes\                     # REST API endpoints:
│   │   │   ├── authRoutes.ts
│   │   │   ├── employeeRoutes.ts
│   │   │   ├── attendanceRoutes.ts
│   │   │   ├── leaveRoutes.ts
│   │   │   ├── dashboardRoutes.ts
│   │   │   ├── departmentRoutes.ts
│   │   │   ├── reportRoutes.ts
│   │   │   ├── notificationRoutes.ts
│   │   │   └── auditLogRoutes.ts
│   │   ├── utils\                      # Audit logging utilities
│   │   └── server.ts                   # Express server entry point
│   ├── .env                            # Environment variables
│   ├── .env.example                    # Env example template
│   └── package.json
└── frontend\
    ├── src\
    │   ├── components\
    │   │   ├── layout\                 # Sidebar, Header, NotificationDrawer, Layout
    │   │   └── ui\                     # Badge, StatCard, Modal
    │   ├── context\                    # AuthContext, ThemeContext
    │   ├── pages\                      # All core HRMS pages:
    │   │   ├── LoginPage.tsx
    │   │   ├── DashboardPage.tsx
    │   │   ├── EmployeesPage.tsx
    │   │   ├── EmployeeDetailPage.tsx
    │   │   ├── AttendancePage.tsx
    │   │   ├── LeavesPage.tsx
    │   │   ├── LeaveApprovalsPage.tsx
    │   │   ├── DepartmentsPage.tsx
    │   │   ├── ReportsPage.tsx
    │   │   └── AuditLogsPage.tsx
    │   ├── services\                   # Axios API service
    │   ├── types\                      # TypeScript interfaces
    │   ├── App.tsx                     # React Router & Providers
    │   ├── index.css                   # Navy Blue design system & tokens
    │   └── main.tsx
    ├── vite.config.ts
    └── package.json
```

---

Developed for **DivineCore Technologies Pvt. Ltd.**
