import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [tenant, setTenant] = useState(() => JSON.parse(localStorage.getItem('tenant') || 'null'));
  const [loading, setLoading] = useState(true);

  // Apply tenant branding to CSS variables
  const applyBranding = useCallback((t) => {
    if (t?.branding) {
      document.documentElement.style.setProperty('--color-primary', t.branding.primaryColor || '#4F46E5');
      document.documentElement.style.setProperty('--color-secondary', t.branding.secondaryColor || '#7C3AED');
      if (t.branding.companyName) {
        document.title = `${t.branding.companyName} - Dashboard`;
      }
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.getMe()
        .then(({ data }) => {
          setUser(data.user);
          setTenant(data.tenant);
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('tenant', JSON.stringify(data.tenant));
          applyBranding(data.tenant);
        })
        .catch(() => {
          localStorage.clear();
          setUser(null);
          setTenant(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [applyBranding]);

  const login = async (email, password, subdomain) => {
    const { data } = await authAPI.login({ email, password, subdomain });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('tenant', JSON.stringify(data.tenant));
    setUser(data.user);
    setTenant(data.tenant);
    applyBranding(data.tenant);
    return data;
  };

  const register = async (formData) => {
    const { data } = await authAPI.register(formData);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('tenant', JSON.stringify(data.tenant));
    setUser(data.user);
    setTenant(data.tenant);
    applyBranding(data.tenant);
    return data;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setTenant(null);
    document.documentElement.style.removeProperty('--color-primary');
    document.documentElement.style.removeProperty('--color-secondary');
    window.location.href = '/login';
  };

  const updateTenant = (updatedTenant) => {
    setTenant(updatedTenant);
    localStorage.setItem('tenant', JSON.stringify(updatedTenant));
    applyBranding(updatedTenant);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, tenant, loading, login, register, logout, updateTenant, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
