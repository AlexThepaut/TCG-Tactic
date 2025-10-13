export interface User {
  id: number;
  username: string;
  email: string;
  profilePicture?: string;
  authProvider: 'local' | 'google';
  emailVerified: boolean;
}

export interface Session {
  id: string;
  provider: 'google' | 'local';
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  lastUsedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessions: Session[];
}

export interface AuthContextValue extends AuthState {
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  clearError: () => void;
  fetchSessions: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
  handleOAuthCallback: (accessToken: string, refreshToken: string) => Promise<void>;
}

export interface TokenPayload {
  userId: number;
  username: string;
  sessionId: string;
  iat: number;
  exp: number;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
