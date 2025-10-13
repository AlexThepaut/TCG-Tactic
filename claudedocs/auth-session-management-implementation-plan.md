# 🎯 Authentication & Session Management - Complete Implementation Plan

## 📊 Current State Analysis

### ✅ Already Implemented
- **OAuth Integration**: Google OAuth flow with backend at `/api/auth/google`
- **AuthContext**: React Context with session restoration on mount
- **Token Storage**: JWT access/refresh tokens in localStorage
- **Protected Routes**: `ProtectedRoute` component redirecting unauthenticated users
- **Basic UI Components**:
  - `UserMenu` dropdown with profile/logout
  - `Login` page with Google sign-in
  - Navigation integration showing auth state
- **Auth Service**: API calls for verify, refresh, logout

### ❌ Gaps Identified

1. **User Feedback**: No clear visual indicator after successful login
2. **Token Management**: No automatic token refresh before expiry
3. **Error Handling**: No graceful handling of expired sessions
4. **Profile Page**: Skeleton exists but needs full implementation
5. **Session Management**: Can't view/revoke active sessions
6. **API Integration**: No centralized API client with auth headers
7. **Guest Mode**: No support for temporary/guest users
8. **Loading States**: Auth verification shows blank screen briefly

---

## 🎯 Implementation Roadmap

### **Phase 1: Core User Experience (Immediate - 2-3 hours)**

#### 1.1 Enhanced Login Success Feedback
**Problem**: Users don't know if login succeeded until page loads
**Solution**: Toast notification + user badge animation

**Implementation:**
```tsx
// In AuthContext.tsx after successful token verification
useEffect(() => {
  const restoreSession = async () => {
    // ... existing code ...
    if (user) {
      toast.success(`Welcome back, ${user.username}!`, {
        icon: '⚔️',
        duration: 3000,
      });
    }
  };
}, []);
```

**Files to modify:**
- `frontend/src/contexts/AuthContext.tsx` - Add success toast
- `frontend/src/pages/Login.tsx` - Show login processing state

#### 1.2 User Avatar Component
**Problem**: User avatar implementation is duplicated in Navigation/UserMenu
**Solution**: Reusable avatar component with fallback

**Create:** `frontend/src/components/auth/UserAvatar.tsx`
```tsx
interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  showOnlineIndicator?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  showOnlineIndicator = false
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className="relative">
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-amber-600 to-amber-800 border border-amber-500/50 flex items-center justify-center overflow-hidden`}>
        {user.profilePicture ? (
          <img
            src={user.profilePicture}
            alt={user.username}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="font-bold text-amber-200">
            {user.username.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      {showOnlineIndicator && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full animate-pulse" />
      )}
    </div>
  );
};
```

**Benefits:**
- Consistent avatar display across app
- Lazy loading for performance
- Fallback to initials if no image
- Optional online indicator

#### 1.3 Auth Loading Skeleton
**Problem**: Brief blank screen during auth verification
**Solution**: Loading skeleton component

**Create:** `frontend/src/components/auth/AuthLoadingSkeleton.tsx`
```tsx
export const AuthLoadingSkeleton: React.FC = () => {
  return (
    <div className="h-16 flex items-center justify-end space-x-4 px-4">
      {/* Desktop skeleton */}
      <div className="hidden md:flex items-center space-x-2 animate-pulse">
        <div className="h-4 w-24 bg-gray-700 rounded" />
        <div className="w-10 h-10 bg-gray-700 rounded-full" />
      </div>

      {/* Mobile skeleton */}
      <div className="md:hidden w-10 h-10 bg-gray-700 rounded animate-pulse" />
    </div>
  );
};
```

**Integration:**
```tsx
// In Navigation.tsx
{authState.isLoading ? (
  <AuthLoadingSkeleton />
) : isAuthenticated ? (
  <UserMenu />
) : (
  <Link to="/login">AUTHENTICATE</Link>
)}
```

#### 1.4 Enhanced Navigation Display
**Problem**: User info not prominent enough
**Solution**: Show username badge + avatar in main nav

**Modify:** `frontend/src/components/Navigation.tsx`
```tsx
// Desktop auth section (lines 178-190)
<div className="ml-4 pl-4 border-l border-imperial-700/40">
  {isAuthenticated && user ? (
    <div className="flex items-center space-x-3">
      {/* Logged in badge */}
      <div className="hidden lg:flex items-center px-3 py-1 bg-green-900/30 border border-green-600/50 rounded">
        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
        <span className="text-xs font-tech text-green-400">ACTIVE</span>
      </div>

      <UserMenu />
    </div>
  ) : (
    <Link to="/login" className="...">
      AUTHENTICATE
    </Link>
  )}
</div>
```

**Visual improvements:**
- Green "ACTIVE" badge showing logged-in state
- Animated pulse indicator
- Username visible on larger screens
- Smooth transitions between states

---

### **Phase 2: Token & Session Management (Next - 3-4 hours)**

#### 2.1 Automatic Token Refresh Hook
**Problem**: Tokens expire causing silent auth failures
**Solution**: Auto-refresh 5 minutes before expiry

**Create:** `frontend/src/hooks/useTokenRefresh.ts`
```tsx
export const useTokenRefresh = () => {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) return;

    const accessToken = localStorage.getItem('tcg_access_token');
    if (!accessToken) return;

    // Decode JWT to get expiry
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const expiryTime = payload.exp * 1000;
    const now = Date.now();
    const timeUntilExpiry = expiryTime - now;

    // Refresh 5 minutes before expiry
    const refreshTime = Math.max(0, timeUntilExpiry - 5 * 60 * 1000);

    const timer = setTimeout(async () => {
      try {
        const refreshToken = localStorage.getItem('tcg_refresh_token');
        if (!refreshToken) {
          await logout();
          return;
        }

        const tokens = await authService.refreshToken(refreshToken);
        localStorage.setItem('tcg_access_token', tokens.accessToken);
        localStorage.setItem('tcg_refresh_token', tokens.refreshToken);

        toast.success('Session renewed', { icon: '🔄', duration: 2000 });
      } catch (error) {
        toast.error('Session expired. Please login again.');
        await logout();
      }
    }, refreshTime);

    return () => clearTimeout(timer);
  }, [user, logout]);
};
```

**Integration:**
```tsx
// In AuthContext.tsx
export const AuthProvider: React.FC<{ children }> = ({ children }) => {
  // ... existing state ...

  // Add token refresh hook
  useTokenRefresh();

  return (
    <AuthContext.Provider value={...}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### 2.2 Axios API Client with Interceptors
**Problem**: Manual token addition to every API call
**Solution**: Centralized API client with auth interceptors

**Create:** `frontend/src/services/apiClient.ts`
```tsx
import axios from 'axios';
import { authService } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tcg_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token expiry
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('tcg_refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Attempt token refresh
        const tokens = await authService.refreshToken(refreshToken);
        localStorage.setItem('tcg_access_token', tokens.accessToken);
        localStorage.setItem('tcg_refresh_token', tokens.refreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout
        localStorage.removeItem('tcg_access_token');
        localStorage.removeItem('tcg_refresh_token');
        window.location.href = '/login?expired=true';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

**Usage:**
```tsx
// Replace all fetch() calls with apiClient
// Old:
const response = await fetch(`${API_URL}/api/auth/me`, {
  headers: { 'Authorization': `Bearer ${accessToken}` },
});

// New:
const response = await apiClient.get('/api/auth/me');
```

#### 2.3 Session Management UI
**Problem**: Users can't see/revoke active sessions
**Solution**: Session management panel in profile

**Create:** `frontend/src/components/auth/SessionManager.tsx`
```tsx
interface Session {
  id: string;
  provider: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastUsedAt: string;
}

export const SessionManager: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const response = await apiClient.get('/api/auth/sessions');
        setSessions(response.data.data);
      } catch (error) {
        toast.error('Failed to load sessions');
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  const revokeSession = async (sessionId: string) => {
    try {
      await apiClient.post(`/api/auth/sessions/${sessionId}/revoke`);
      setSessions(sessions.filter(s => s.id !== sessionId));
      toast.success('Session revoked');
    } catch (error) {
      toast.error('Failed to revoke session');
    }
  };

  const revokeAllSessions = async () => {
    if (!confirm('This will log you out everywhere. Continue?')) return;

    try {
      await apiClient.post('/api/auth/sessions/revoke-all');
      toast.success('All sessions revoked. Redirecting...');
      setTimeout(() => window.location.href = '/login', 2000);
    } catch (error) {
      toast.error('Failed to revoke sessions');
    }
  };

  return (
    <div className="bg-gray-800/95 border-2 border-amber-600/50 p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-amber-400">Active Sessions</h2>
        <button
          onClick={revokeAllSessions}
          className="px-4 py-2 border border-red-600/50 text-red-400 hover:bg-red-800/30 text-sm font-medium transition-all"
        >
          REVOKE ALL
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No active sessions</div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-4 bg-gray-900/50 border border-gray-700 rounded"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-amber-400 font-medium">
                    {session.provider === 'google' ? '🔗 Google' : '🔐 Local'}
                  </span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-400">{session.ipAddress}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {getBrowserInfo(session.userAgent)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Last used: {formatRelativeTime(session.lastUsedAt)}
                </div>
              </div>

              <button
                onClick={() => revokeSession(session.id)}
                className="ml-4 px-3 py-1 border border-red-600/50 text-red-400 hover:bg-red-800/30 text-xs font-medium transition-all rounded"
              >
                REVOKE
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

**Backend endpoint needed:**
```typescript
// backend/src/routes/auth.ts
router.get('/sessions', authMiddleware, async (req, res) => {
  const sessions = await OAuthService.getUserActiveSessions(req.user.id);
  res.json({ success: true, data: sessions });
});

router.post('/sessions/:id/revoke', authMiddleware, async (req, res) => {
  await OAuthService.revokeSession(req.params.id);
  res.json({ success: true });
});

router.post('/sessions/revoke-all', authMiddleware, async (req, res) => {
  await OAuthService.revokeAllUserSessions(req.user.id);
  res.json({ success: true });
});
```

---

### **Phase 3: Complete Profile Page (3-4 hours)**

#### 3.1 Profile Page Structure
**Problem**: Profile page is empty skeleton
**Solution**: Full profile with stats, sessions, settings

**Modify:** `frontend/src/pages/Profile.tsx`
```tsx
export default function Profile() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserStats = async () => {
      try {
        const response = await apiClient.get('/api/users/stats');
        setStats(response.data.data);
      } catch (error) {
        toast.error('Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    loadUserStats();
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Profile Header */}
        <ProfileHeader user={user} />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Games"
            value={stats?.totalGames || 0}
            icon="⚔️"
            color="imperial"
          />
          <StatCard
            title="Victories"
            value={stats?.totalWins || 0}
            icon="🏆"
            color="humans"
          />
          <StatCard
            title="Win Rate"
            value={`${stats?.winRate || 0}%`}
            icon="📈"
            color="aliens"
          />
          <StatCard
            title="Favorite Faction"
            value={stats?.favoriteFaction || 'None'}
            icon="🎖️"
            color="robots"
          />
        </div>

        {/* Faction Stats */}
        <FactionStats stats={stats} />

        {/* Session Management */}
        <SessionManager />

        {/* Account Settings */}
        <AccountSettings user={user} />
      </div>
    </div>
  );
}
```

#### 3.2 Profile Components
**Create:** `frontend/src/components/profile/ProfileHeader.tsx`
```tsx
export const ProfileHeader: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="bg-gray-800/95 border-2 border-amber-600/50 p-8 rounded-lg">
      <div className="flex items-center space-x-6">
        <UserAvatar user={user} size="lg" showOnlineIndicator />

        <div className="flex-1">
          <h1 className="text-3xl font-bold text-amber-400 mb-2">
            {user.username}
          </h1>
          <p className="text-gray-300 mb-3">{user.email}</p>

          <div className="flex items-center space-x-4">
            <div className="flex items-center px-3 py-1 bg-amber-900/30 border border-amber-600/50 rounded">
              <span className="text-xs font-tech text-amber-300">
                {user.authProvider === 'google' ? '🔗 GOOGLE ACCOUNT' : '🔐 LOCAL ACCOUNT'}
              </span>
            </div>

            {user.emailVerified && (
              <div className="flex items-center px-3 py-1 bg-green-900/30 border border-green-600/50 rounded">
                <span className="text-xs font-tech text-green-400">
                  ✓ VERIFIED
                </span>
              </div>
            )}
          </div>
        </div>

        <button className="px-4 py-2 border border-amber-600/50 text-amber-300 hover:bg-amber-800/30 transition-all">
          EDIT PROFILE
        </button>
      </div>
    </div>
  );
};
```

**Create:** `frontend/src/components/profile/FactionStats.tsx`
```tsx
export const FactionStats: React.FC<{ stats: any }> = ({ stats }) => {
  const factions = ['humans', 'aliens', 'robots'];

  return (
    <div className="bg-gray-800/95 border-2 border-amber-600/50 p-6 rounded-lg">
      <h2 className="text-xl font-bold text-amber-400 mb-4">Faction Performance</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {factions.map((faction) => {
          const games = stats?.[`${faction}Games`] || 0;
          const wins = stats?.[`${faction}Wins`] || 0;
          const winRate = games > 0 ? Math.round((wins / games) * 100) : 0;

          return (
            <div
              key={faction}
              className="p-4 bg-gray-900/50 border border-gray-700 rounded"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white capitalize">
                  {faction}
                </h3>
                <span className="text-2xl">
                  {faction === 'humans' && '🛡️'}
                  {faction === 'aliens' && '👾'}
                  {faction === 'robots' && '🤖'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Games:</span>
                  <span className="text-white font-medium">{games}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Wins:</span>
                  <span className="text-green-400 font-medium">{wins}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Win Rate:</span>
                  <span className="text-amber-400 font-medium">{winRate}%</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-2 bg-gray-700 rounded overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400"
                  style={{ width: `${winRate}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

---

### **Phase 4: Guest Mode & Advanced Features (Future - 4-5 hours)**

#### 4.1 Guest Mode Support
**Problem**: Users forced to login before exploring
**Solution**: Temporary guest accounts with upgrade prompts

**Modify:** `frontend/src/contexts/AuthContext.tsx`
```tsx
const continueAsGuest = () => {
  const guestUser: User = {
    id: 0,
    username: `Guest_${Math.random().toString(36).substr(2, 6)}`,
    email: 'guest@temporary.local',
    profilePicture: undefined,
    authProvider: 'local',
    emailVerified: false,
  };

  setAuthState({
    user: guestUser,
    isAuthenticated: false, // Important: not truly authenticated
    isLoading: false,
    error: null,
  });

  sessionStorage.setItem('guest_mode', 'true');
};
```

**Create:** `frontend/src/components/auth/GuestModeBanner.tsx`
```tsx
export const GuestModeBanner: React.FC = () => {
  const isGuest = sessionStorage.getItem('guest_mode') === 'true';
  const navigate = useNavigate();

  if (!isGuest) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-amber-900 to-amber-800 border-t-2 border-amber-600 p-4 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-2xl">⚠️</div>
          <div>
            <p className="text-amber-100 font-bold">Guest Mode Active</p>
            <p className="text-amber-200 text-sm">
              Your progress won't be saved. Create an account to preserve victories.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all"
        >
          CREATE ACCOUNT
        </button>
      </div>
    </div>
  );
};
```

#### 4.2 Session Timeout Warning
**Problem**: Silent session expiry confuses users
**Solution**: Warning modal 2 minutes before expiry

**Create:** `frontend/src/components/auth/SessionTimeoutWarning.tsx`
```tsx
export const SessionTimeoutWarning: React.FC = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(120);
  const { logout } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('tcg_access_token');
    if (!token) return;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000;
    const warningTime = expiryTime - 2 * 60 * 1000; // 2 min before

    const warningTimer = setTimeout(() => {
      setShowWarning(true);

      // Countdown timer
      const countdownInterval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            logout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }, warningTime - Date.now());

    return () => clearTimeout(warningTimer);
  }, [logout]);

  const extendSession = async () => {
    try {
      const refreshToken = localStorage.getItem('tcg_refresh_token');
      const tokens = await authService.refreshToken(refreshToken!);
      localStorage.setItem('tcg_access_token', tokens.accessToken);
      localStorage.setItem('tcg_refresh_token', tokens.refreshToken);
      setShowWarning(false);
      toast.success('Session extended');
    } catch (error) {
      toast.error('Failed to extend session');
    }
  };

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 border-2 border-amber-600 p-8 rounded-lg max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4 animate-pulse">⏰</div>
          <h2 className="text-2xl font-bold text-amber-400 mb-2">
            SESSION EXPIRING SOON
          </h2>
          <p className="text-gray-300">
            Your session will expire in{' '}
            <span className="text-amber-400 font-bold">{timeRemaining}</span> seconds
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={extendSession}
            className="w-full px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all"
          >
            EXTEND SESSION
          </button>

          <button
            onClick={logout}
            className="w-full px-6 py-3 border border-gray-600 text-gray-300 hover:bg-gray-700 transition-all"
          >
            LOGOUT NOW
          </button>
        </div>
      </div>
    </div>
  );
};
```

#### 4.3 Offline State Handling
**Problem**: App breaks when backend unavailable
**Solution**: Graceful offline mode

**Create:** `frontend/src/hooks/useOnlineStatus.ts`
```tsx
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isBackendOnline, setIsBackendOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check backend health every 30s
    const healthCheck = setInterval(async () => {
      try {
        await apiClient.get('/health');
        setIsBackendOnline(true);
      } catch {
        setIsBackendOnline(false);
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(healthCheck);
    };
  }, []);

  return { isOnline, isBackendOnline };
};
```

**Create:** `frontend/src/components/OfflineBanner.tsx`
```tsx
export const OfflineBanner: React.FC = () => {
  const { isOnline, isBackendOnline } = useOnlineStatus();

  if (isOnline && isBackendOnline) return null;

  return (
    <div className="fixed top-16 left-0 right-0 bg-red-900 border-b-2 border-red-600 p-3 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-center space-x-3">
        <div className="text-xl">📡</div>
        <p className="text-red-100 font-medium">
          {!isOnline
            ? 'No internet connection. Some features may be unavailable.'
            : 'Backend server unreachable. Please try again later.'}
        </p>
      </div>
    </div>
  );
};
```

---

## 📋 Complete File Checklist

### **New Files to Create (13 total)**

1. ✨ `frontend/src/components/auth/UserAvatar.tsx` - Reusable avatar component
2. ✨ `frontend/src/components/auth/AuthLoadingSkeleton.tsx` - Loading placeholder
3. ✨ `frontend/src/components/auth/SessionManager.tsx` - Session list/revoke UI
4. ✨ `frontend/src/components/auth/GuestModeBanner.tsx` - Guest mode warning
5. ✨ `frontend/src/components/auth/SessionTimeoutWarning.tsx` - Expiry modal
6. ✨ `frontend/src/components/profile/ProfileHeader.tsx` - Profile top section
7. ✨ `frontend/src/components/profile/FactionStats.tsx` - Faction performance grid
8. ✨ `frontend/src/components/profile/AccountSettings.tsx` - Settings panel
9. ✨ `frontend/src/components/OfflineBanner.tsx` - Offline indicator
10. ✨ `frontend/src/hooks/useTokenRefresh.ts` - Auto-refresh hook
11. ✨ `frontend/src/hooks/useOnlineStatus.ts` - Network status hook
12. ✨ `frontend/src/services/apiClient.ts` - Axios instance with interceptors
13. ✨ `frontend/src/utils/formatters.ts` - Date/time formatting utilities

### **Files to Modify (6 total)**

1. 📝 `frontend/src/contexts/AuthContext.tsx` - Add token refresh, guest mode
2. 📝 `frontend/src/components/Navigation.tsx` - Enhanced user display
3. 📝 `frontend/src/components/auth/UserMenu.tsx` - Add session count
4. 📝 `frontend/src/components/auth/ProtectedRoute.tsx` - Guest mode support
5. 📝 `frontend/src/services/authService.ts` - Replace fetch with apiClient
6. 📝 `frontend/src/pages/Profile.tsx` - Complete implementation

### **Backend Endpoints Needed (4 total)**

1. 🔌 `GET /api/users/stats` - User statistics
2. 🔌 `GET /api/auth/sessions` - List active sessions
3. 🔌 `POST /api/auth/sessions/:id/revoke` - Revoke single session
4. 🔌 `POST /api/auth/sessions/revoke-all` - Revoke all sessions

---

## 🎨 UI/UX Design Principles

### Visual Consistency
- **Color Scheme**: Gothic theme with amber (#F59E0B) accents
- **Typography**:
  - Display: `font-display` (headers)
  - Tech: `font-tech` (UI elements)
  - Body: `font-sans` (content)
- **Borders**: 2px solid with glow effects
- **Spacing**: 4px grid system (p-2, p-4, p-6, p-8)
- **Shadows**: Colored glows matching faction themes

### Responsive Design
- **Breakpoints**:
  - Mobile: < 768px (touch-optimized, 44px targets)
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
- **Mobile-First**: Design for small screens, enhance for large
- **Touch Targets**: Minimum 44x44px for mobile buttons
- **Font Scaling**: Base 16px, scale up for desktop

### Animation Guidelines
- **Transitions**: 300ms ease for state changes
- **Hover Effects**: Glow, border color, slight scale
- **Loading States**: Pulse animation for skeletons
- **Page Transitions**: Fade in/out (200ms)
- **Toast Notifications**: Slide in from right

### Accessibility
- **ARIA Labels**: All interactive elements
- **Keyboard Navigation**: Tab order, focus indicators
- **Screen Readers**: Semantic HTML, alt text
- **Color Contrast**: WCAG AA minimum (4.5:1)
- **Focus States**: Visible outline on all focusable elements

---

## 🔧 Technical Implementation Details

### State Management Strategy
```tsx
// Global state (AuthContext)
- user: User | null
- isAuthenticated: boolean
- isLoading: boolean
- error: string | null

// Local state (components)
- UI-specific state (modals, dropdowns)
- Form state (controlled inputs)
- Loading states (async operations)

// Session storage
- guest_mode: boolean (temporary guest flag)

// Local storage
- tcg_access_token: JWT access token
- tcg_refresh_token: JWT refresh token
```

### Token Lifecycle
```
1. Login → Receive tokens → Store in localStorage
2. Every request → Add Bearer token via interceptor
3. Token near expiry (5min) → Auto-refresh in background
4. Token expired (401) → Attempt refresh → Retry request
5. Refresh failed → Clear tokens → Redirect to login
6. Logout → Revoke backend → Clear storage → Redirect
```

### Error Handling Strategy
```tsx
// API Errors
- 401 Unauthorized → Attempt refresh, then logout
- 403 Forbidden → Show permission error
- 429 Rate Limited → Show friendly "slow down" message
- 500+ Server Error → Show "server issue, try later"
- Network Error → Show offline banner

// Auth Errors
- Token decode failure → Clear tokens, force login
- Refresh token expired → Logout with message
- Invalid credentials → Show error on login page
- Session revoked → Immediate logout with notification
```

### Performance Optimizations
```tsx
// Image Loading
- Lazy load profile pictures
- Use placeholder while loading
- Cache images in browser
- Serve optimized sizes from backend

// Re-render Prevention
- React.memo for pure components
- useCallback for event handlers
- useMemo for expensive computations
- Debounce search/filter inputs

// Code Splitting
- Lazy load Profile page
- Lazy load SessionManager
- Lazy load heavy dependencies (charts, etc.)

// API Optimization
- Cache user stats (5min stale-while-revalidate)
- Batch session requests
- Debounce auto-save operations
```

---

## 🧪 Testing Strategy

### Unit Tests
```tsx
// AuthContext
- ✓ Restores session from localStorage
- ✓ Handles token verification failure
- ✓ Clears tokens on logout
- ✓ Triggers refresh before expiry

// useTokenRefresh hook
- ✓ Calculates correct refresh time
- ✓ Refreshes token successfully
- ✓ Handles refresh failure (logout)
- ✓ Cleans up timer on unmount

// apiClient interceptors
- ✓ Adds Authorization header
- ✓ Retries 401 with refresh
- ✓ Redirects on refresh failure
- ✓ Preserves original request config
```

### Integration Tests
```tsx
// Auth Flow
- ✓ User logs in with Google
- ✓ Tokens stored in localStorage
- ✓ User info displayed in nav
- ✓ Protected routes accessible
- ✓ Logout clears state

// Token Refresh Flow
- ✓ Token refreshes before expiry
- ✓ Expired token triggers refresh
- ✓ Failed refresh logs out user
- ✓ Refreshed token used in retry

// Guest Mode Flow
- ✓ Guest can access lobby
- ✓ Guest sees upgrade banner
- ✓ Guest progress not saved
- ✓ Guest can upgrade to account
```

### E2E Tests (Playwright)
```tsx
// Happy Path
- ✓ Complete login flow end-to-end
- ✓ Navigate all protected pages
- ✓ View and update profile
- ✓ Logout successfully

// Error Scenarios
- ✓ Handle expired session gracefully
- ✓ Show offline banner when backend down
- ✓ Recover from token refresh failure
- ✓ Session timeout warning works

// Mobile Scenarios
- ✓ Mobile navigation works
- ✓ Touch targets are 44px minimum
- ✓ User menu accessible on mobile
- ✓ Forms usable on small screens
```

---

## 📅 Implementation Timeline

### Week 1: Core Experience
- **Day 1-2**: Phase 1 (User feedback, avatar, loading states)
- **Day 3-4**: Phase 2 (Token refresh, API client, session management)
- **Day 5**: Testing and bug fixes

### Week 2: Profile & Advanced Features
- **Day 1-2**: Phase 3 (Complete profile page with stats)
- **Day 3-4**: Phase 4 (Guest mode, timeout warnings)
- **Day 5**: Polish, testing, documentation

### Estimated Total: **40-50 hours** (1-2 weeks full-time)

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All unit tests passing
- [ ] E2E tests passing
- [ ] No console errors in production build
- [ ] Environment variables configured
- [ ] API endpoints tested with production backend
- [ ] Token expiry times verified
- [ ] Session management tested with multiple devices

### Security Checks
- [ ] JWT secrets rotated
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] CSRF tokens validated

### Performance Checks
- [ ] Lighthouse score > 90
- [ ] Images optimized
- [ ] Bundle size acceptable (< 500KB gzipped)
- [ ] API response times < 500ms
- [ ] Token refresh doesn't block UI

### Monitoring Setup
- [ ] Error tracking (Sentry/similar)
- [ ] Analytics (user flows, auth events)
- [ ] Performance monitoring (Core Web Vitals)
- [ ] API error rates tracked
- [ ] Failed login attempts logged

---

## 📚 Additional Resources

### Documentation to Create
1. **User Guide**: How to login, manage sessions, view profile
2. **Developer Docs**: Auth flow diagrams, API endpoints, state management
3. **Troubleshooting**: Common auth issues and solutions
4. **Security Policy**: Password requirements, session policies

### Future Enhancements
- **Two-Factor Authentication (2FA)**: TOTP/SMS verification
- **Social Logins**: GitHub, Discord, Twitter
- **Password Reset Flow**: Email verification with secure tokens
- **Account Linking**: Merge local + OAuth accounts
- **Remember Me**: Extended session duration option
- **Login History**: View past login attempts with location
- **Security Notifications**: Email alerts for suspicious activity
- **Multi-Language Support**: i18n for auth flows

---

## 🎯 Success Metrics

### User Experience
- **Login Success Rate**: > 95%
- **Session Drop Rate**: < 2%
- **Time to Login**: < 5 seconds
- **User Satisfaction**: > 4.5/5 stars

### Technical Metrics
- **Token Refresh Success**: > 99%
- **API Uptime**: > 99.9%
- **Auth Error Rate**: < 0.5%
- **Page Load Time**: < 2 seconds

### Business Metrics
- **Guest → Account Conversion**: > 30%
- **Session Duration**: > 20 minutes average
- **Return User Rate**: > 60% weekly
- **Active Sessions per User**: 1-2 devices

---

This comprehensive plan covers everything needed for a production-ready authentication and session management system. Implement phases incrementally, test thoroughly, and iterate based on user feedback. Each phase is self-contained and can be deployed independently.
