import { useState, useEffect } from 'react';

/**
 * Hook pour détecter la taille d'écran et le type d'appareil
 * Optimisé pour mobile et tablette
 */
const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowSize.width < 768; // < md
  const isTablet = windowSize.width >= 768 && windowSize.width < 1024; // md to lg
  const isDesktop = windowSize.width >= 1024; // >= lg
  const isSmallMobile = windowSize.width < 640; // < sm
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return {
    width: windowSize.width,
    height: windowSize.height,
    isMobile,
    isTablet,
    isDesktop,
    isSmallMobile,
    isTouchDevice,
    breakpoint: isSmallMobile ? 'xs' : isMobile ? 'sm' : isTablet ? 'md' : 'lg'
  };
};

export default useResponsive;

