import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppErrorBoundary, GameErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Collection from './pages/Collection';
import DeckBuilder from './pages/DeckBuilder';
import Profile from './pages/Profile';
import Help from './pages/Help';

function App() {
  return (
    <AppErrorBoundary>
      <Router>
        <AuthProvider>
          <Layout>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/help" element={<Help />} />

              {/* Protected routes - require authentication */}
              <Route
                path="/lobby"
                element={
                  <ProtectedRoute>
                    <Lobby />
                  </ProtectedRoute>
                }
              />

              {/* Game routes - protected and wrapped with GameErrorBoundary */}
              <Route
                path="/game/:gameId"
                element={
                  <ProtectedRoute>
                    <GameErrorBoundary>
                      <Game />
                    </GameErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/game"
                element={
                  <ProtectedRoute>
                    <GameErrorBoundary>
                      <Game />
                    </GameErrorBoundary>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/test/drag-drop"
                element={
                  <ProtectedRoute>
                    <GameErrorBoundary>
                      <Game />
                    </GameErrorBoundary>
                  </ProtectedRoute>
                }
              />

              {/* Collection, deck builder, profile - protected */}
              <Route
                path="/collection"
                element={
                  <ProtectedRoute>
                    <Collection />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/deck-builder"
                element={
                  <ProtectedRoute>
                    <DeckBuilder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Catch all route - redirect to home */}
              <Route path="*" element={<Home />} />
            </Routes>
          </Layout>

          {/* Toast notifications - Gothic style */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1a1a1a',
                color: '#fcedd5',
                border: '2px solid #7c4f0d',
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: '500',
                borderRadius: '0',
                boxShadow: '0 0 10px rgba(185, 134, 11, 0.3)',
              },
              success: {
                style: {
                  background: '#0a0a0a',
                  border: '2px solid #b8860b',
                  color: '#f7d0a4',
                  boxShadow: '0 0 15px rgba(185, 134, 11, 0.5)',
                },
              },
              error: {
                style: {
                  background: '#0a0a0a',
                  border: '2px solid #b91c1c',
                  color: '#fecaca',
                  boxShadow: '0 0 15px rgba(185, 28, 28, 0.5)',
                },
              },
            }}
          />
        </AuthProvider>
      </Router>
    </AppErrorBoundary>
  );
}

export default App;
