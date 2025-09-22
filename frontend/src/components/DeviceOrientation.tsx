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
      <div className="fixed inset-0 bg-cyber-black flex items-center justify-center z-50 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 tech-grid opacity-5 pointer-events-none" />
        <div className="absolute inset-0 data-rain" />

        <div className="cyber-panel rounded-xl p-10 max-w-sm mx-auto text-center relative overflow-hidden neon-glow-cyan">
          {/* Background effects */}
          <div className="absolute inset-0 tech-grid opacity-10 pointer-events-none" />
          <div className="absolute inset-0 holographic opacity-10 pointer-events-none" />

          <div className="relative z-10">
            <div className="mb-10 relative">
              <div className="w-32 h-32 mx-auto mb-6 rounded-xl cyber-panel flex items-center justify-center neon-glow-blue relative">
                <DevicePhoneMobileIcon className="w-20 h-20 neon-text-blue" />
                <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full cyber-panel flex items-center justify-center neon-glow-yellow">
                  <ArrowPathIcon className="w-8 h-8 neon-text-yellow animate-spin" />
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-cyber font-black mb-6 neon-text-cyan tracking-wider uppercase">
              📱 ROTATE DEVICE
            </h2>

            <p className="text-cyber-muted mb-8 leading-relaxed font-sans">
              TCG TACTIQUE tactical systems require landscape orientation for optimal battlefield visualization.
            </p>

            <div className="cyber-card-container rounded-lg p-6 relative overflow-hidden">
              <div className="absolute inset-0 holographic opacity-5" />
              <p className="text-sm text-neon-green-300 font-cyber tracking-wider uppercase relative z-10">
                ⚡ OPTIMAL COMBAT EXPERIENCE REQUIRES LANDSCAPE MODE
              </p>
            </div>
          </div>

          {/* Corner accents */}
          <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-neon-cyan-400 opacity-60" />
          <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-neon-cyan-400 opacity-60" />
          <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-neon-cyan-400 opacity-60" />
          <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-neon-cyan-400 opacity-60" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default DeviceOrientation;