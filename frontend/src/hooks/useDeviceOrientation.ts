import { useState, useEffect } from 'react';
import type { DeviceOrientation } from '@/types';

function useDeviceOrientation(): DeviceOrientation {
  const [orientation, setOrientation] = useState<DeviceOrientation>(() => ({
    isLandscape: window.innerWidth > window.innerHeight,
    isMobile: window.innerWidth < 768,
    shouldShowRotationPrompt: false,
  }));

  useEffect(() => {
    const updateOrientation = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      const isMobile = window.innerWidth < 768;
      const shouldShowRotationPrompt = isMobile && !isLandscape;

      setOrientation({
        isLandscape,
        isMobile,
        shouldShowRotationPrompt,
      });
    };

    const handleResize = () => {
      updateOrientation();
    };

    const handleOrientationChange = () => {
      // Small delay to ensure dimensions are updated after orientation change
      setTimeout(updateOrientation, 100);
    };

    // Set initial orientation
    updateOrientation();

    // Listen for changes
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
}

export default useDeviceOrientation;