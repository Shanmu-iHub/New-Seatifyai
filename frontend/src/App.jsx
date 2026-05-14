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

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'var(--bg)'}}>
      <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"/>
    </div>
  );
  return user ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <div className={user ? "pb-24 md:pb-0" : ""}>
      <Navbar />
      <Routes>
        <Route path="/" element={<CoursesPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/apply/:courseId" element={<ProtectedRoute><ApplicationForm /></ProtectedRoute>} />
        <Route path="/payment/:applicationId" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
        <Route path="/confirmation/:applicationId" element={<ProtectedRoute><ConfirmationPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      </Routes>
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
            style: { background: '#1A1A24', color: '#F9FAFB', border: '1px solid #2A2A3A' },
            success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
