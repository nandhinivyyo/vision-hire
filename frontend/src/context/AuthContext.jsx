import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('visionhire_token');
    if (token) {
      api.get('/api/auth/me')
        .then(res => setUser(res.data))
        .catch(() => { 
          localStorage.removeItem('visionhire_token'); 
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('visionhire_token', res.data.token);
    setUser(res.data);
    return res.data;
  };

  const register = async (data) => {
    const res = await api.post('/api/auth/register', data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('visionhire_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
