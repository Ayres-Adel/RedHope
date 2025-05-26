import { useEffect } from 'react';

const ScrollTracker = ({ onSectionChange, isHomePage }) => {
  useEffect(() => {
    if (!isHomePage) return;
    
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPosition = window.scrollY;
          const viewportHeight = window.innerHeight;
          
          const homeSection = document.getElementById('home');
          const servicesSection = document.getElementById('services');
          const aboutSection = document.getElementById('about');
          
          const homeThreshold = 100;
          const servicesThreshold = viewportHeight * 0.5;
          const aboutThreshold = viewportHeight * 1.5;
          
          const homeSectionTop = homeSection ? homeSection.offsetTop : 0;
          const servicesSectionTop = servicesSection ? servicesSection.offsetTop - 100 : servicesThreshold;
          const aboutSectionTop = aboutSection ? aboutSection.offsetTop - 100 : aboutThreshold;
          
          let currentSection;
          if (scrollPosition < servicesSectionTop) {
            currentSection = 'home';
          } else if (scrollPosition < aboutSectionTop) {
            currentSection = 'services';
          } else {
            currentSection = 'about';
          }
          
          onSectionChange(currentSection);
          ticking = false;
        });
        
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isHomePage, onSectionChange]);
  
  return null;
};

export default ScrollTracker;
