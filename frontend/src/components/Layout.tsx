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
      <div className="min-h-screen bg-gradient-to-br from-gothic-black via-void-900 to-gothic-darkest relative overflow-hidden">
        {/* Atmospheric background effects */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-imperial-600 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-robots-600 to-transparent"></div>
          <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-aliens-600 to-transparent"></div>
          <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-imperial-600 to-transparent"></div>
        </div>

        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${
            'theme("colors.imperial.400")'
          } 1px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>

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