import type { User, TokenResponse, Session } from '../types/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const authService = {
  /**
   * Verify JWT token and get user info
   */
  async verifyToken(accessToken: string): Promise<User> {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Token verification failed');
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    return {
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken,
      expiresIn: data.data.expiresIn,
    };
  },

  /**
   * Logout and revoke refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },

  /**
   * Get all active sessions for authenticated user
   */
  async getSessions(accessToken: string): Promise<Session[]> {
    const response = await fetch(`${API_URL}/api/auth/sessions`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sessions');
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Revoke a specific session
   */
  async revokeSession(accessToken: string, sessionId: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/auth/sessions/${sessionId}/revoke`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to revoke session');
    }
  },
};
