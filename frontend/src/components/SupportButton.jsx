import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LifeBuoy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SupportButton() {
  const { user } = useAuth();
  const location = useLocation();

  // Only render if user is authenticated and has a complete profile, and not on /support, /admin or /login pages
  const hasIncompleteProfile = user && (!user.name || !user.email || !user.mobile || !user.dob);
  if (!user || hasIncompleteProfile || location.pathname === '/support' || location.pathname === '/admin' || location.pathname === '/login') return null;

  const targetRoute = user.role === 'admin' ? '/admin/support' : '/support';

  return (
    <Link
      to={targetRoute}
      className="fixed bottom-44 md:bottom-24 right-6 z-50 group flex items-center gap-3 cursor-pointer"
      aria-label="Help Desk Support"
    >
      <style>{`
        @keyframes custom-support-pulse {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .support-pulse {
          animation: custom-support-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>

      {/* Tooltip */}
      <span className="hidden md:block bg-white text-gray-800 text-xs font-bold px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 pointer-events-none"
        style={{ border: '1px solid var(--card-border)' }}>
        Help & Support
      </span>
      
      {/* Support Icon */}
      <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-all active:scale-95"
        style={{ 
          background: 'var(--primary)',
          boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)'
        }}>
        <LifeBuoy size={26} color="white" className="animate-spin-slow z-10" />
        
        {/* Pulse Effect */}
        <div className="absolute inset-0 rounded-2xl support-pulse" style={{ background: 'var(--primary)' }} />
      </div>
    </Link>
  );
}
