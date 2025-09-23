import { useState, useEffect } from 'react';
import { DevicePhoneMobileIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface DeviceOrientationProps {
  children: React.ReactNode;
}

const DeviceOrientation: React.FC<DeviceOrientationProps> = ({ children }) => {
  const [orientation, setOrientation] = useState({
    isLandscape: window.innerWidth > window.innerHeight,
    isMobile: window.innerWidth < 768,
  });

  useEffect(() => {
    const handleResize = () => {
      setOrientation({
        isLandscape: window.innerWidth > window.innerHeight,
        isMobile: window.innerWidth < 768,
      });
    };

    const handleOrientationChange = () => {
      // Small delay to ensure dimensions are updated
      setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Show rotation prompt for mobile devices in portrait mode
  if (orientation.isMobile && !orientation.isLandscape) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="text-center text-white p-8 max-w-sm mx-auto">
          <div className="mb-8 relative">
            <DevicePhoneMobileIcon className="w-24 h-24 mx-auto text-blue-400 mb-4" />
            <ArrowPathIcon className="w-8 h-8 absolute top-8 -right-2 text-yellow-400 animate-spin" />
          </div>

          <h2 className="text-2xl font-bold mb-4 text-blue-400">
            Rotation Required
          </h2>

          <p className="text-gray-300 mb-6 leading-relaxed">
            Echoes Of War is designed for landscape orientation.
            Please rotate your device to continue the war.
          </p>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400">
              💡 For the best gaming experience, play in landscape mode
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default DeviceOrientation;