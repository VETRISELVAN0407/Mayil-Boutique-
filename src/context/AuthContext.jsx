import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as authService from '../services/authService';
import {
  decodeToken,
  setAccessToken as persistAccessToken,
  setRefreshToken as persistRefreshToken,
} from '../services/apiClient';

const AuthContext = createContext(null);

function customerFromToken(token) {
  const claims = token ? decodeToken(token) : null;
  return claims?.role === 'CUSTOMER' ? { mobile: claims.sub, role: 'CUSTOMER' } : null;
}

function isAdminToken(token) {
  return (token ? decodeToken(token) : null)?.role === 'ADMIN';
}

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [customer, setCustomer] = useState(() => customerFromToken(localStorage.getItem('mayil_access_token')));
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('mayil_access_token'));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('mayil_refresh_token'));

  // The admin shell only treats an admin token as an authenticated session.
  const status = isAdminToken(accessToken) ? 'authenticated' : 'guest';

  const clearSession = useCallback(() => {
    persistAccessToken(null);
    persistRefreshToken(null);
    setAccessToken(null);
    setRefreshToken(null);
    setAdmin(null);
    setCustomer(null);
  }, []);

  // The tokens live in localStorage, shared by every tab of this browser. When another tab signs in or out (for
  // example the owner opens the admin), follow it; otherwise this tab keeps showing a customer while its requests
  // already carry the other session's token (customer-only calls then fail with 403).
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== null && e.key !== 'mayil_access_token' && e.key !== 'mayil_refresh_token') return;
      const token = localStorage.getItem('mayil_access_token');
      setAccessToken(token);
      setRefreshToken(localStorage.getItem('mayil_refresh_token'));
      setCustomer(customerFromToken(token));
      if (!isAdminToken(token)) setAdmin(null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // apiClient fires this when a token refresh fails.
  useEffect(() => {
    window.addEventListener('mayil:session-expired', clearSession);
    return () => window.removeEventListener('mayil:session-expired', clearSession);
  }, [clearSession]);

  const storeTokens = (data) => {
    persistAccessToken(data.accessToken);
    persistRefreshToken(data.refreshToken);
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
  };

  const login = async (mobile, password) => {
    const data = await authService.loginAdmin(mobile, password);
    storeTokens(data);
    setCustomer(null);
    setAdmin({ adminId: data.adminId, mobile: data.mobile, role: data.role });
    return data;
  };

  // After a password change the server revokes the old refresh token and issues a new pair.
  const changeAdminPassword = async (currentPassword, newPassword) => {
    const data = await authService.changeAdminPassword(currentPassword, newPassword);
    storeTokens(data);
    return data;
  };

  const loginCustomer = async (mobile, code) => {
    const data = await authService.verifyCustomerOtp(mobile, code);
    storeTokens(data);
    setAdmin(null);
    setCustomer({ mobile, role: 'CUSTOMER' });
    return data;
  };

  const logout = async () => {
    try {
      if (refreshToken) {
        if (customer) {
          await authService.logoutCustomer(refreshToken);
        } else {
          await authService.logoutAdmin(refreshToken);
        }
      }
    } catch (error) {
      // Ignore logout API failures; clear local state regardless.
    } finally {
      clearSession();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        customer,
        isLoggedIn: !!customer,
        accessToken,
        refreshToken,
        status,
        login,
        changeAdminPassword,
        loginCustomer,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
