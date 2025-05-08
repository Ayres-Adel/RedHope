/**
 * Viewport Detection Utility
 * Detects actual mobile devices and sets appropriate HTML class
 */

export const detectMobileDevice = () => {
  // Check if the device is actually mobile
  const isMobileDevice = () => {
    return (
      typeof window.orientation !== 'undefined' ||
      navigator.userAgent.indexOf('IEMobile') !== -1 ||
      window.innerWidth <= 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    );
  };

  // Apply mobile class to HTML element for CSS targeting
  if (isMobileDevice()) {
    document.documentElement.classList.add('mobile-device');
  } else {
    document.documentElement.classList.remove('mobile-device');
  }
  
  // Update on resize
  window.addEventListener('resize', () => {
    if (isMobileDevice()) {
      document.documentElement.classList.add('mobile-device');
    } else {
      document.documentElement.classList.remove('mobile-device');
    }
  });
};
