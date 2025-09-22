import { useLocation } from 'react-router-dom';
import Navigation from './Navigation';
import DeviceOrientation from './DeviceOrientation';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  // Game screen should be immersive (no navigation)
  const isGameScreen = location.pathname.startsWith('/game');

  return (
    <DeviceOrientation>
      <div className="min-h-screen bg-cyber-black relative overflow-hidden">
        {/* Cyberpunk animated background */}
        <div className="cyber-bg-pattern" />

        {/* Matrix-style data rain for non-game screens */}
        {!isGameScreen && <div className="data-rain" />}

        {/* Navigation - hidden on game screen */}
        {!isGameScreen && <Navigation />}

        {/* Main content */}
        <main className={isGameScreen ? 'h-screen relative z-10' : 'flex-1 relative z-10'}>
          {children}
        </main>
      </div>
    </DeviceOrientation>
  );
};

export default Layout;