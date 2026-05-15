import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import CoursesPage from './pages/CoursesPage';
import ApplicationForm from './pages/ApplicationForm';
import PaymentPage from './pages/PaymentPage';
import ConfirmationPage from './pages/ConfirmationPage';
import ProfilePage from './pages/ProfilePage';
import WhatsAppButton from './components/WhatsAppButton';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'var(--bg)'}}>
      <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"/>
    </div>
  );
  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/courses" /> : children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <div className={user ? "pb-24 md:pb-0" : ""}>
      <Navbar />
      <Routes>
        <Route path="/" element={<CoursesPage />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/apply/:courseId" element={<ProtectedRoute><ApplicationForm /></ProtectedRoute>} />
        <Route path="/payment/:applicationId" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
        <Route path="/confirmation/:applicationId" element={<ProtectedRoute><ConfirmationPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      </Routes>
      <WhatsAppButton />
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
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
