// src/hooks/useScreenSize.js
import { useState, useEffect } from 'react';

const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Call handler immediately to get initial size
    handleResize();

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Define minimum requirements for floorplan editor
  const MINIMUM_WIDTH = 1024;
  const MINIMUM_HEIGHT = 768;

  const isSuitableForEditor = screenSize.width >= MINIMUM_WIDTH && screenSize.height >= MINIMUM_HEIGHT;

  return {
    width: screenSize.width,
    height: screenSize.height,
    isSuitableForEditor,
    minimumWidth: MINIMUM_WIDTH,
    minimumHeight: MINIMUM_HEIGHT,
  };
};

export default useScreenSize;

// Also provide a named export so modules can import with `import { useScreenSize } from '@/hooks/useScreenSize'`
export { useScreenSize };