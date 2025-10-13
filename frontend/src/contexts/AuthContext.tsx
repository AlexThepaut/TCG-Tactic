import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthState, AuthContextValue } from '../types/auth';
import { authService } from '../services/authService';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    sessions: [],
  });

  const navigate = useNavigate();

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        console.log('[AuthContext] Starting session restoration...');
        const accessToken = localStorage.getItem('tcg_access_token');

        if (!accessToken) {
          console.log('[AuthContext] No access token found');
          setAuthState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        console.log('[AuthContext] Access token found, verifying with backend...');
        // Verify token with backend
        const user = await authService.verifyToken(accessToken);

        console.log('[AuthContext] Token verified successfully:', user.username);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          sessions: [],
        });
      } catch (error) {
        // Token invalid or expired
        console.error('[AuthContext] Token verification failed:', error);
        localStorage.removeItem('tcg_access_token');
        localStorage.removeItem('tcg_refresh_token');
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          sessions: [],
        });
      }
    };

    restoreSession();
  }, []);

  const loginWithGoogle = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = 'http://localhost:5001/api/auth/google';
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('tcg_refresh_token');
      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      // Clear local storage
      localStorage.removeItem('tcg_access_token');
      localStorage.removeItem('tcg_refresh_token');

      // Clear auth state
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        sessions: [],
      });

      // Navigate to home
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  const fetchSessions = async () => {
    try {
      const accessToken = localStorage.getItem('tcg_access_token');
      if (!accessToken) {
        return;
      }

      const sessions = await authService.getSessions(accessToken);
      setAuthState(prev => ({ ...prev, sessions }));
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setAuthState(prev => ({
        ...prev,
        error: 'Failed to load sessions'
      }));
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      const accessToken = localStorage.getItem('tcg_access_token');
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      await authService.revokeSession(accessToken, sessionId);

      // Refresh sessions list
      await fetchSessions();
    } catch (error) {
      console.error('Failed to revoke session:', error);
      setAuthState(prev => ({
        ...prev,
        error: 'Failed to revoke session'
      }));
      throw error;
    }
  };

  const handleOAuthCallback = async (accessToken: string, refreshToken: string) => {
    try {
      console.log('[AuthContext] handleOAuthCallback - storing tokens...');
      // Store tokens
      localStorage.setItem('tcg_access_token', accessToken);
      localStorage.setItem('tcg_refresh_token', refreshToken);

      console.log('[AuthContext] handleOAuthCallback - verifying token...');
      // Verify token and get user info
      const user = await authService.verifyToken(accessToken);

      console.log('[AuthContext] handleOAuthCallback - updating auth state for user:', user.username);
      // Update auth state
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        sessions: [],
      });

      console.log('[AuthContext] handleOAuthCallback - auth state updated, isAuthenticated should be true');

      // Fetch sessions in background
      fetchSessions().catch(err => console.error('Failed to fetch sessions:', err));
    } catch (error) {
      console.error('[AuthContext] OAuth callback failed:', error);
      localStorage.removeItem('tcg_access_token');
      localStorage.removeItem('tcg_refresh_token');
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        loginWithGoogle,
        logout,
        clearError,
        fetchSessions,
        revokeSession,
        handleOAuthCallback,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
