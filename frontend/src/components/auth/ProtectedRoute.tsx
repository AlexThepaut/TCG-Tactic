import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  console.log('[ProtectedRoute] Checking auth:', {
    path: location.pathname,
    isLoading,
    isAuthenticated,
    hasUser: !!user,
    username: user?.username
  });

  if (isLoading) {
    console.log('[ProtectedRoute] Still loading, showing spinner...');
    return (
      <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-amber-400 text-4xl mb-4 animate-pulse">⚔</div>
          <div className="text-2xl font-bold text-amber-400 animate-pulse">
            VERIFYING CREDENTIALS...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to login...');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('[ProtectedRoute] Authenticated, rendering protected content');
  return <>{children}</>;
};
