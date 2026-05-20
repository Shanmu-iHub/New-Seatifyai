import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import CoursesPage from './pages/CoursesPage';
import ApplicationForm from './pages/ApplicationForm';
import PaymentPage from './pages/PaymentPage';
import ConfirmationPage from './pages/ConfirmationPage';
import ProfilePage from './pages/ProfilePage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import CancelPage from './pages/CancelPage';
import SupportPage from './pages/SupportPage';
import WhatsAppButton from './components/WhatsAppButton';
import SupportButton from './components/SupportButton';
import AdminLayout from './pages/admin/AdminLayout';
import DashboardOverview from './pages/admin/DashboardOverview';
import AdminAdmissions from './pages/admin/AdminAdmissions';
import AdminColleges from './pages/admin/AdminColleges';
import AdminCollegeDetails from './pages/admin/AdminCollegeDetails';
import AdminStudents from './pages/admin/AdminStudents';
import AdminOrders from './pages/admin/AdminOrders';
import AdminSettings from './pages/admin/AdminSettings';
import AdminSettlements from './pages/admin/AdminSettlements';

const isProfileComplete = (user) => {
  return user && user.name && user.email && user.mobile && user.dob;
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'var(--bg)'}}>
      <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"/>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (!isProfileComplete(user)) return <Navigate to="/profile-setup" />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    return user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/courses" />;
  }
  return children;
};

const ProfileSetupRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (isProfileComplete(user)) {
    return user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/courses" />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== 'admin') return <Navigate to="/login" />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  
  const hasIncompleteProfile = user && (!user.name || !user.email || !user.mobile || !user.dob);

  return (
    <div className={user && !isAdminPath ? "pb-24 md:pb-0" : ""}>
      {!isAdminPath && <Navbar />}
      <Routes>
        <Route path="/" element={hasIncompleteProfile ? <Navigate to="/profile-setup" /> : (user?.role === 'admin' ? <Navigate to="/admin" /> : <CoursesPage />)} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/courses" element={hasIncompleteProfile ? <Navigate to="/profile-setup" /> : (user?.role === 'admin' ? <Navigate to="/admin" /> : <CoursesPage />)} />
        <Route path="/apply/:courseId" element={<ProtectedRoute><ApplicationForm /></ProtectedRoute>} />
        <Route path="/payment/:applicationId" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
        <Route path="/confirmation/:applicationId" element={<ProtectedRoute><ConfirmationPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
        <Route path="/profile-setup" element={<ProfileSetupRoute><ProfileSetupPage /></ProfileSetupRoute>} />
        <Route path="/cancel-booking/:applicationId" element={<ProtectedRoute><CancelPage /></ProtectedRoute>} />
        
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<DashboardOverview />} />
          <Route path="admissions" element={<AdminAdmissions />} />
          <Route path="colleges" element={<AdminColleges />} />
          <Route path="colleges/:collegeName" element={<AdminCollegeDetails />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="settlements" element={<AdminSettlements />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="*" element={<div className="p-8 text-center text-slate-500">Module coming soon...</div>} />
        </Route>
      </Routes>
      {!isAdminPath && <WhatsAppButton />}
      {!isAdminPath && <SupportButton />}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#fff', color: '#1F2937', border: '1px solid var(--card-border)' },
            success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
            duration: 4000
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
