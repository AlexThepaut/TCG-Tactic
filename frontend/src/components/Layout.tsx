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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        {/* Navigation - hidden on game screen */}
        {!isGameScreen && <Navigation />}

        {/* Main content */}
        <main className={isGameScreen ? 'h-screen' : 'flex-1'}>
          {children}
        </main>
      </div>
    </DeviceOrientation>
  );
};

export default Layout;