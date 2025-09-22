import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppErrorBoundary, GameErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';

// Pages
import Home from './pages/Home';
import Game from './pages/Game';
import Collection from './pages/Collection';
import DeckBuilder from './pages/DeckBuilder';
import Profile from './pages/Profile';
import Help from './pages/Help';

function App() {
  return (
    <AppErrorBoundary>
      <div className="relative min-h-screen bg-cyber-black overflow-hidden">
        {/* Cyberpunk animated background */}
        <div className="cyber-bg-pattern" />

        <Router>
          <Layout>
            <Routes>
            <Route path="/" element={<Home />} />
            {/* Game routes wrapped with GameErrorBoundary for enhanced error handling */}
            <Route
              path="/game/:gameId"
              element={
                <GameErrorBoundary>
                  <Game />
                </GameErrorBoundary>
              }
            />
            <Route
              path="/game"
              element={
                <GameErrorBoundary>
                  <Game />
                </GameErrorBoundary>
              }
            />
            <Route
              path="/test/drag-drop"
              element={
                <GameErrorBoundary>
                  <Game />
                </GameErrorBoundary>
              }
            />
            <Route path="/collection" element={<Collection />} />
            <Route path="/deck-builder" element={<DeckBuilder />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/help" element={<Help />} />
            {/* Catch all route - redirect to home */}
            <Route path="*" element={<Home />} />
          </Routes>
        </Layout>

        {/* Toast notifications - Cyberpunk styled */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(10, 10, 10, 0.9)',
              color: '#00ffff',
              border: '1px solid rgba(0, 255, 255, 0.3)',
              borderRadius: '8px',
              fontFamily: 'Orbitron, monospace',
              fontWeight: 'bold',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 0 20px rgba(0, 255, 255, 0.2)',
            },
            success: {
              style: {
                background: 'rgba(0, 255, 102, 0.1)',
                border: '1px solid #00ff66',
                color: '#00ff66',
                boxShadow: '0 0 20px rgba(0, 255, 102, 0.3)',
              },
            },
            error: {
              style: {
                background: 'rgba(255, 68, 68, 0.1)',
                border: '1px solid #ff4444',
                color: '#ff4444',
                boxShadow: '0 0 20px rgba(255, 68, 68, 0.3)',
              },
            },
          }}
        />
          </Layout>
        </Router>
      </div>
    </AppErrorBoundary>
  );
}

export default App;
