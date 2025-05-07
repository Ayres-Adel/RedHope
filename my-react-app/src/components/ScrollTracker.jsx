import { useEffect } from 'react';

/*
 * This component tracks scroll position and updates the active section.
 * It doesn't render anything but updates the activeSection in its parent component.
 */
const ScrollTracker = ({ onSectionChange, isHomePage }) => {
  useEffect(() => {
    if (!isHomePage) return;
    
    // Use throttling to avoid excessive recalculation
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPosition = window.scrollY;
          const viewportHeight = window.innerHeight;
          
          // Get section positions
          const homeSection = document.getElementById('home');
          const servicesSection = document.getElementById('services');
          const aboutSection = document.getElementById('about');
          
          // Default section thresholds if elements aren't found
          const homeThreshold = 100;
          const servicesThreshold = viewportHeight * 0.5; // Dynamic calculation based on viewport
          const aboutThreshold = viewportHeight * 1.5;
          
          // Calculate actual thresholds if elements exist
          const homeSectionTop = homeSection ? homeSection.offsetTop : 0;
          const servicesSectionTop = servicesSection ? servicesSection.offsetTop - 100 : servicesThreshold;
          const aboutSectionTop = aboutSection ? aboutSection.offsetTop - 100 : aboutThreshold;
          
          // Determine active section based on scroll position
          let currentSection;
          if (scrollPosition < servicesSectionTop) {
            currentSection = 'home';
          } else if (scrollPosition < aboutSectionTop) {
            currentSection = 'services';
          } else {
            currentSection = 'about';
          }
          
          // Notify parent component about section change
          onSectionChange(currentSection);
          ticking = false;
        });
        
        ticking = true;
      }
    };
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Initial check on mount
    handleScroll();
    
    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isHomePage, onSectionChange]);
  
  return null; // This component doesn't render anything
};

export default ScrollTracker;
