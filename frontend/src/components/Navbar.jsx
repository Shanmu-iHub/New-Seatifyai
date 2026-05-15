import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, User, LogOut, Menu, X, BookOpen } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  if (location.pathname === '/login') return null;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
    <nav style={{ background: 'rgba(255,255,255,0.85)', borderBottom: '1px solid var(--card-border)', backdropFilter: 'blur(16px)' }}
      className="sticky top-0 z-40 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/courses" className="flex items-center gap-2">
            <img 
              src="/logo.webp" 
              alt="Seatifyai" 
              style={{ height: '68px', width: 'auto' }}
            />
          </Link>

          {/* Desktop nav */}
          {user ? (
            <div className="hidden md:flex items-center gap-6">
              <Link to="/courses" className={`text-sm font-medium transition-colors ${location.pathname === '/courses' || location.pathname === '/' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}>
                Courses
              </Link>
              <Link to="/profile" className={`text-sm font-medium transition-colors ${location.pathname === '/profile' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'}`}>
                Profile
              </Link>
              <a href="tel:+919600940618" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                Help: +91 96009 40618
              </a>
              <div className="flex items-center gap-3 pl-4" style={{ borderLeft: '1px solid var(--card-border)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: 'var(--primary)' }}>
                  {user.name ? user.name[0].toUpperCase() : 'S'}
                </div>
                <span className="text-sm text-gray-700 font-medium">{user.name || user.email}</span>
                <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors ml-1">
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
          <div className="md:hidden py-4 border-t animate-fade-up" style={{ borderColor: 'var(--card-border)' }}>
            <div className="flex flex-col gap-4 px-2">
              <Link to="/courses" onClick={() => setMenuOpen(false)} className="text-gray-600 font-medium py-2">Courses</Link>
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="text-gray-600 font-medium py-2">Profile</Link>
                  <button onClick={handleLogout} className="text-left text-red-500 font-medium py-2 flex items-center gap-2">
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
          
          {user ? (
            <>
              <Link to="/profile" className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${location.pathname === '/profile' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-900'}`}>
                <User size={20} />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Profile</span>
              </Link>

              <button onClick={handleLogout} className="flex flex-col items-center gap-1 p-2 rounded-xl text-gray-400 hover:text-red-500 transition-all">
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
    </>
  );
}
