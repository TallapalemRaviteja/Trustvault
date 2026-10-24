import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { OwnerDashboard } from './pages/OwnerDashboard';
import { ViewerDashboard } from './pages/ViewerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { DocumentLibraryPage } from './pages/DocumentLibraryPage';
import { DocumentDetailPage } from './pages/DocumentDetailPage';
import { PermissionManagementPage } from './pages/PermissionManagementPage';
import { UploadDocumentPage } from './pages/UploadDocumentPage';
import { AuditExplorerPage } from './pages/AuditExplorerPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B1020] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-3 border-[#4F8CFF] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const defaultPath = user.role === 'admin' ? '/admin' : user.role === 'owner' ? '/dashboard' : '/viewer';
    return <Navigate to={defaultPath} replace />;
  }

  return <>{children}</>;
};

// Main Enterprise App Layout with Collapsible & Mobile Sidebar
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B1020] light:bg-[#F8FAFC] text-[#F4F7FC] light:text-[#0F172A] flex flex-col font-sans transition-colors duration-200">
      <Navbar
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isSidebarOpen={isMobileSidebarOpen}
      />
      <div className="flex-1 flex w-full">
        <Sidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

// Root Redirect Component
const RoleHomeRedirect: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'owner') return <Navigate to="/dashboard" replace />;
  return <Navigate to="/viewer" replace />;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <RoleHomeRedirect />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin']}>
                    <AppLayout>
                      <OwnerDashboard />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/viewer"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ViewerDashboard />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout>
                      <AdminDashboard />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/documents"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <DocumentLibraryPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/documents/:id"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <DocumentDetailPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/permissions"
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin']}>
                    <AppLayout>
                      <PermissionManagementPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/upload"
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin']}>
                    <AppLayout>
                      <UploadDocumentPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/audit"
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin']}>
                    <AppLayout>
                      <AuditExplorerPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <SettingsPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="*"
                element={
                  <AppLayout>
                    <NotFoundPage />
                  </AppLayout>
                }
              />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
