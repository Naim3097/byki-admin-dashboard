import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { AdminLayout } from './components/Layout/AdminLayout';
import { LoginPage } from './pages/Login/LoginPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { OrdersListPage } from './pages/Orders/OrdersListPage';
import { OrderDetailPage } from './pages/Orders/OrderDetailPage';
import { BookingsListPage } from './pages/Bookings/BookingsListPage';
import { EmergencyMonitorPage } from './pages/Emergency/EmergencyMonitorPage';
import { TicketsListPage } from './pages/Support/TicketsListPage';
import { UsersListPage } from './pages/Users/UsersListPage';
import { UserDetailPage } from './pages/Users/UserDetailPage';
import { ProductsListPage } from './pages/Catalog/ProductsListPage';
import { WorkshopsPage } from './pages/Catalog/WorkshopsPage';
import { VouchersPage } from './pages/Catalog/VouchersPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { LoadingSpinner } from './components/Common/LoadingSpinner';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuthStore();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, [initializeAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="emergency" element={<EmergencyMonitorPage />} />
          <Route path="orders" element={<OrdersListPage />} />
          <Route path="orders/:orderId" element={<OrderDetailPage />} />
          <Route path="bookings" element={<BookingsListPage />} />
          <Route path="support" element={<TicketsListPage />} />
          <Route path="users" element={<UsersListPage />} />
          <Route path="users/:userId" element={<UserDetailPage />} />
          <Route path="catalog/products" element={<ProductsListPage />} />
          <Route path="catalog/workshops" element={<WorkshopsPage />} />
          <Route path="catalog/vouchers" element={<VouchersPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
