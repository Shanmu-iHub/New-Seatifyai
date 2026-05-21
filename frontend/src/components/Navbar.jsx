import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, User, LogOut, Menu, X, BookOpen } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (location.pathname === '/login') return null;

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/login');
  };

  const hasIncompleteProfile = user && (!user.name || !user.email || !user.mobile || !user.dob);

  return (
    <>
      <nav style={{ background: 'rgba(255,255,255,0.85)', borderBottom: '1px solid var(--card-border)', backdropFilter: 'blur(16px)' }}
        className="sticky top-0 z-[60] px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={hasIncompleteProfile ? "/profile-setup" : "/courses"} className="flex items-center gap-2">
            <img 
              src="/logo.webp" 
              alt="Seatifyai" 
              style={{ height: '68px', width: 'auto' }}
            />
          </Link>

          {/* Desktop nav */}
          {user ? (
            <div className="hidden md:flex items-center gap-6">
              {!hasIncompleteProfile && (
                <>
                  <Link to="/courses" className={`text-sm font-medium transition-colors ${location.pathname === '/courses' || location.pathname === '/' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}>
                    Courses
                  </Link>
                  <Link to="/admissions" className={`text-sm font-medium transition-colors ${location.pathname === '/admissions' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}>
                    Admissions
                  </Link>
                  <Link to="/profile" className={`text-sm font-medium transition-colors ${location.pathname === '/profile' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}>
                    Profile
                  </Link>
                </>
              )}
              <a href="tel:+919600940618" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                Help: +91 96009 40618
              </a>
              <div className="flex items-center gap-3 pl-4" style={{ borderLeft: '1px solid var(--card-border)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: 'var(--primary)' }}>
                  {user.name ? user.name[0].toUpperCase() : 'S'}
                </div>
                <span className="text-sm text-gray-700 font-medium">{user.name || user.email || user.mobile}</span>
                <button onClick={() => setShowLogoutConfirm(true)} className="text-gray-400 hover:text-red-500 transition-colors ml-1 cursor-pointer">
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-6">
              <a href="tel:+919600940618" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                Help: +91 96009 40618
              </a>
              <Link to="/login" className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-200"
                style={{ background: 'var(--primary)' }}>
                Sign In
              </Link>
            </div>
          )}

          {/* Mobile toggle */}
          <button className="md:hidden text-gray-500" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t animate-fade-up bg-white/95 backdrop-blur-xl" style={{ borderColor: 'var(--card-border)' }}>
            <div className="flex flex-col gap-4 px-2">
              {!hasIncompleteProfile && (
                <>
                  <Link to="/courses" onClick={() => setMenuOpen(false)} className="text-gray-600 font-medium py-2">Courses</Link>
                  <Link to="/admissions" onClick={() => setMenuOpen(false)} className="text-gray-600 font-medium py-2">Admissions</Link>
                </>
              )}
              {user ? (
                <>
                  {!hasIncompleteProfile && (
                    <Link to="/profile" onClick={() => setMenuOpen(false)} className="text-gray-600 font-medium py-2">Profile</Link>
                  )}
                  <button onClick={() => { setMenuOpen(false); setShowLogoutConfirm(true); }} className="text-left text-red-500 font-medium py-2 flex items-center gap-2 cursor-pointer">
                    <LogOut size={16} /> Logout
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMenuOpen(false)} className="inline-block px-5 py-3 rounded-xl text-center font-bold text-white"
                  style={{ background: 'var(--primary)' }}>
                  Sign In
                </Link>
              )}
              <a href="tel:+919600940618" onClick={() => setMenuOpen(false)} className="text-gray-600 font-medium py-2 border-t mt-2" style={{ borderColor: 'var(--card-border)' }}>
                Help: +91 96009 40618
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Bottom Nav */}
      {hasIncompleteProfile ? (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none">
          <div className="mx-auto max-w-sm rounded-2xl p-2 flex items-center justify-between shadow-xl pointer-events-auto"
            style={{ 
              background: 'rgba(255,255,255,0.95)', 
              border: '1px solid rgba(0,0,0,0.05)', 
              backdropFilter: 'blur(20px)' 
            }}>
            <span className="text-xs text-gray-500 font-semibold pl-2">Complete Profile to Continue</span>
            <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-red-500 hover:bg-red-50 transition-all font-bold text-xs cursor-pointer">
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none">
          <div className="mx-auto max-w-sm rounded-2xl p-1 flex items-center justify-around shadow-xl pointer-events-auto"
            style={{ 
              background: 'rgba(255,255,255,0.9)', 
              border: '1px solid rgba(0,0,0,0.05)', 
              backdropFilter: 'blur(20px)' 
            }}>
            <Link to="/courses" className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${location.pathname === '/courses' || location.pathname === '/' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-900'}`}>
              <BookOpen size={20} />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Courses</span>
            </Link>
            
            <Link to="/admissions" className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${location.pathname === '/admissions' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-900'}`}>
              <BookOpen size={20} />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Admit</span>
            </Link>

            {user ? (
              <>
                <Link to="/profile" className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${location.pathname === '/profile' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-900'}`}>
                  <User size={20} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Profile</span>
                </Link>

                <button onClick={() => setShowLogoutConfirm(true)} className="flex flex-col items-center gap-1 p-2 rounded-xl text-gray-400 hover:text-red-500 transition-all cursor-pointer">
                  <LogOut size={20} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Logout</span>
                </button>
              </>
            ) : (
              <Link to="/login" className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${location.pathname === '/login' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-900'}`}>
                <User size={20} />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Sign In</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Premium Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop blur */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowLogoutConfirm(false)}
          />
          
          {/* Modal Container */}
          <div 
            className="relative bg-white/95 rounded-3xl p-6 md:p-8 max-w-sm w-full border border-slate-200/80 shadow-2xl backdrop-blur-md transform scale-100 transition-all duration-300 animate-fade-up"
            style={{ 
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
              fontFamily: 'Outfit, sans-serif'
            }}
          >
            {/* Header / Icon */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-4 border border-rose-100">
                <LogOut size={22} className="ml-0.5" />
              </div>
              
              <h3 className="text-lg font-extrabold text-slate-950 mb-2" style={{ fontFamily: 'Clash Display, sans-serif' }}>
                Confirm Logout
              </h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Are you sure you want to log out of your Seatify account? Your current session will be ended.
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full sm:order-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-extrabold hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
              >
                No, Keep Session
              </button>
              <button
                onClick={confirmLogout}
                className="w-full sm:order-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-extrabold hover:bg-red-700 hover:shadow-lg hover:shadow-red-200 active:scale-95 transition-all cursor-pointer"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
