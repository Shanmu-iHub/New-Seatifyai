import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('seatify_token');
    const userData = localStorage.getItem('seatify_user');
    if (token && userData) {
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

  const login = (userData, token) => {
    localStorage.setItem('seatify_token', token);
    localStorage.setItem('seatify_user', JSON.stringify(userData));
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

  const logout = () => {
    localStorage.removeItem('seatify_token');
    localStorage.removeItem('seatify_user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateUser = (newUserData) => {
    const updated = { ...user, ...newUserData };
    localStorage.setItem('seatify_user', JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
