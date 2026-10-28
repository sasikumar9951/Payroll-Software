import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CompanySettingsProvider } from './context/CompanySettingsContext';
import { Layout } from './components/layout/Layout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { EmployeeDetailPage } from './pages/EmployeeDetailPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { AttendancePage } from './pages/AttendancePage';
import { LeavesPage } from './pages/LeavesPage';
import { LeaveApprovalsPage } from './pages/LeaveApprovalsPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <ThemeProvider>
      <CompanySettingsProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#1E293B',
                color: '#fff',
                fontSize: '13px',
                borderRadius: '12px',
                padding: '12px 16px',
              },
            }}
          />
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/employees/:id/assessment" element={<AssessmentPage />} />

            <Route element={<Layout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/assessment" element={<AssessmentPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/employees/:id" element={<EmployeeDetailPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/leaves" element={<LeavesPage />} />
              <Route path="/leave-approvals" element={<LeaveApprovalsPage />} />
              <Route path="/departments" element={<DepartmentsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/audit-logs" element={<AuditLogsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </CompanySettingsProvider>
    </ThemeProvider>
  );
}

export default App;
