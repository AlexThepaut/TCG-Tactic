import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
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
    <ErrorBoundary>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/game" element={<Game />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/deck-builder" element={<DeckBuilder />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/help" element={<Help />} />
            {/* Catch all route - redirect to home */}
            <Route path="*" element={<Home />} />
          </Routes>
        </Layout>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#f3f4f6',
              border: '1px solid #374151',
            },
            success: {
              style: {
                background: '#065f46',
                border: '1px solid #10b981',
              },
            },
            error: {
              style: {
                background: '#7f1d1d',
                border: '1px solid #ef4444',
              },
            },
          }}
        />
      </Router>
    </ErrorBoundary>
  );
}

export default App;