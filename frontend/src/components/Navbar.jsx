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
    <nav style={{ background: 'rgba(15,15,19,0.9)', borderBottom: '1px solid var(--card-border)', backdropFilter: 'blur(12px)' }}
      className="sticky top-0 z-40 px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/courses" className="flex items-center gap-2">
          <img 
            src="https://k12.seatifyai.com/wp-content/uploads/2025/04/Logo-Seatifyai-1.webp" 
            alt="Seatifyai" 
            style={{ height: '68px', width: 'auto' }}
          />
        </Link>

        {/* Desktop nav */}
        {user && (
          <div className="hidden md:flex items-center gap-6">
            <Link to="/courses" className={`text-sm font-medium transition-colors ${location.pathname === '/courses' ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}>
              Courses
            </Link>
            <Link to="/profile" className={`text-sm font-medium transition-colors ${location.pathname === '/profile' ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}>
              Profile
            </Link>
            <div className="flex items-center gap-3 pl-4" style={{ borderLeft: '1px solid var(--card-border)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'var(--primary)' }}>
                {user.name ? user.name[0].toUpperCase() : 'S'}
              </div>
              <span className="text-sm text-gray-300">{user.name || user.email}</span>
              <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition-colors ml-1">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Mobile hamburger */}
        {user && (
          <button className="md:hidden text-gray-400" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        )}
      </div>

      {/* Mobile menu */}
      {menuOpen && user && (
        <div className="md:hidden py-4 border-t" style={{ borderColor: 'var(--card-border)' }}>
          <div className="flex flex-col gap-4 px-2">
            <Link to="/courses" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white py-2">Courses</Link>
            <Link to="/profile" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white py-2">Profile</Link>
            <button onClick={handleLogout} className="text-left text-red-400 hover:text-red-300 py-2 flex items-center gap-2">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      )}
      {/* Mobile Bottom Nav */}
      {user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-4">
          <div className="mx-auto max-w-sm rounded-2xl p-1 flex items-center justify-around shadow-2xl"
            style={{ 
              background: 'rgba(23,23,28,0.85)', 
              border: '1px solid rgba(255,255,255,0.08)', 
              backdropFilter: 'blur(20px)' 
            }}>
            <Link to="/courses" className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${location.pathname === '/courses' ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-400 hover:text-gray-200'}`}>
              <BookOpen size={20} />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Courses</span>
            </Link>
            
            <Link to="/profile" className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${location.pathname === '/profile' ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-400 hover:text-gray-200'}`}>
              <User size={20} />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Profile</span>
            </Link>

            <button onClick={handleLogout} className="flex flex-col items-center gap-1 p-2 rounded-xl text-gray-500 hover:text-red-400 transition-all">
              <LogOut size={20} />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
