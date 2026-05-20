import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Session timeout: 30 minutes of inactivity
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);

  const logout = useCallback(() => {
    localStorage.removeItem('seatify_token');
    localStorage.removeItem('seatify_user');
    localStorage.removeItem('seatify_last_activity');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setShowTimeoutModal(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
  }, []);

  // Reset inactivity timer on user activity
  const resetTimer = useCallback(() => {
    if (!user) return;
    localStorage.setItem('seatify_last_activity', Date.now().toString());

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    // Show warning 2 minutes before timeout
    warningRef.current = setTimeout(() => {
      setShowTimeoutModal(true);
    }, SESSION_TIMEOUT_MS - 2 * 60 * 1000);

    // Auto-logout on timeout
    timeoutRef.current = setTimeout(() => {
      setShowTimeoutModal(false);
      logout();
      window.location.href = '/login';
    }, SESSION_TIMEOUT_MS);
  }, [user, logout]);

  // Check if session expired on page load (e.g. after tab was closed)
  const checkSessionExpiry = useCallback(() => {
    const lastActivity = localStorage.getItem('seatify_last_activity');
    if (lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity, 10);
      if (elapsed > SESSION_TIMEOUT_MS) {
        logout();
        return true; // expired
      }
    }
    return false;
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem('seatify_token');
    const userData = localStorage.getItem('seatify_user');

    if (token && userData) {
      // Check if session timed out while tab was away
      if (checkSessionExpiry()) {
        setLoading(false);
        return;
      }

      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Dynamic Background Sync: Load latest database profile to sync complete fields (name, email, mobile, dob)
      axios.get('/api/students/profile')
        .then(res => {
          if (res.data?.profile) {
            const p = res.data.profile;
            const updated = {
              ...parsedUser,
              name: p.fullName || parsedUser.name,
              email: p.email || parsedUser.email,
              mobile: p.mobile || parsedUser.mobile,
              dob: p.dob || parsedUser.dob,
              // ALWAYS preserve role — never overwrite with undefined
              role: parsedUser.role || 'student',
            };
            if (JSON.stringify(parsedUser) !== JSON.stringify(updated)) {
              localStorage.setItem('seatify_user', JSON.stringify(updated));
              setUser(updated);
            }
          }
        })
        .catch(err => console.log('⚠️ Background profile sync failed:', err.message));
    }
    
    // Handle 401 globally
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    setLoading(false);
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  // Activity listeners for session timeout
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    const handler = () => resetTimer();

    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    resetTimer(); // Start the timer

    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [user, resetTimer]);

  const login = (userData, token) => {
    localStorage.setItem('seatify_token', token);
    localStorage.setItem('seatify_user', JSON.stringify(userData));
    localStorage.setItem('seatify_last_activity', Date.now().toString());
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);

    // Sync immediately upon login to load any profile/application details already in the DB
    axios.get('/api/students/profile')
      .then(res => {
        if (res.data?.profile) {
          const p = res.data.profile;
          const updated = {
            ...userData,
            name: p.fullName || userData.name,
            email: p.email || userData.email,
            mobile: p.mobile || userData.mobile,
            dob: p.dob || userData.dob,
            // ALWAYS preserve role from the original login response
            role: userData.role || 'student',
          };
          localStorage.setItem('seatify_user', JSON.stringify(updated));
          setUser(updated);
        }
      })
      .catch(err => console.log('⚠️ Login profile sync failed:', err.message));
  };

  const updateUser = (newUserData) => {
    const updated = { ...user, ...newUserData };
    localStorage.setItem('seatify_user', JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}

      {/* Session Timeout Warning Modal */}
      {showTimeoutModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ animation: 'fadeIn 0.2s ease' }}>
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center" style={{ animation: 'slideUp 0.3s ease' }}>
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⏰</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Session Expiring</h3>
            <p className="text-sm text-gray-500 mb-6">
              Your session will expire in <span className="font-bold text-red-500">2 minutes</span> due to inactivity. Click below to stay logged in.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { logout(); window.location.href = '/login'; }}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              >
                Logout
              </button>
              <button
                onClick={() => { setShowTimeoutModal(false); resetTimer(); }}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all shadow-lg"
                style={{ background: 'var(--primary, #4F46E5)' }}
              >
                Stay Logged In
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
