import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// Departments
export const DEPARTMENTS = {
  ADMIN: 'admin',
  FINANCE: 'finance',
  CUSTOMER_SERVICE: 'customer_service',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [failedAttempts, setFailedAttempts] = useState(() => {
    try { return parseInt(localStorage.getItem('admin_failed_attempts') || '0'); } catch { return 0; }
  });
  const [lockoutUntil, setLockoutUntil] = useState(() => {
    try {
      const stored = localStorage.getItem('admin_lockout_until');
      return stored ? parseInt(stored) : null;
    } catch { return null; }
  });
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Helper to update attempts
  const updateFailedAttempts = (attempts) => {
    setFailedAttempts(attempts);
    localStorage.setItem('admin_failed_attempts', attempts.toString());
  };

  // Helper to update lockout
  const updateLockoutUntil = (timeMs) => {
    setLockoutUntil(timeMs);
    if (timeMs) {
      localStorage.setItem('admin_lockout_until', timeMs.toString());
    } else {
      localStorage.removeItem('admin_lockout_until');
    }
  };

  const login = useCallback(async (email, password, department) => {
    // Check lockout
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      return { success: false, error: `Account locked. Try again in ${remaining}s.` };
    }

    // Clear expired lockout
    if (lockoutUntil && Date.now() >= lockoutUntil) {
      updateLockoutUntil(null);
      updateFailedAttempts(0);
    }

    try {
      // Call real backend API
      const res = await fetch(`${API_BASE}/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const newAttempts = failedAttempts + 1;
        updateFailedAttempts(newAttempts);
        if (newAttempts >= LOCKOUT_THRESHOLD) {
          updateLockoutUntil(Date.now() + LOCKOUT_DURATION_MS);
          return { success: false, error: 'Too many failed attempts. Account locked for 5 minutes.' };
        }
        return { success: false, error: data.error || `Invalid credentials. ${LOCKOUT_THRESHOLD - newAttempts} attempts remaining.` };
      }

      // Map department — admin can access all, others check role
      const adminDept = data.user.department;
      if (department && department !== adminDept && data.user.role !== 'super_admin') {
        return { success: false, error: `You do not have access to the ${department.replace('_', ' ')} department.` };
      }

      const userData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role === 'super_admin' ? 'Super Admin' : data.user.role,
        avatar: data.user.avatar || data.user.name.charAt(0),
        department: department || adminDept,
        loginTime: new Date().toISOString(),
        token: data.token,
      };

      // Persist
      localStorage.setItem('admin_user', JSON.stringify(userData));
      localStorage.setItem('admin_token', data.token);

      setUser(userData);
      updateFailedAttempts(0);
      updateLockoutUntil(null);
      setLastActivity(Date.now());
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error. Is the backend running?' };
    }
  }, [failedAttempts, lockoutUntil]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_token');
  }, []);

  const refreshActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  const isSessionExpired = useCallback(() => {
    return user && (Date.now() - lastActivity > SESSION_TIMEOUT_MS);
  }, [user, lastActivity]);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      failedAttempts,
      lockoutUntil,
      lastActivity,
      refreshActivity,
      isSessionExpired,
      SESSION_TIMEOUT_MS,
      DEPARTMENTS,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
