import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

// Original jumpToSection function for backward compatibility
export default function jumpToSection(sectionId, navigate, location, setActiveSection) {
  if (location.pathname === "/") {
    // If already on homepage, just scroll to the section
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveSection && setActiveSection(sectionId);
    }
  } else {
    // If not on homepage, navigate to homepage with section hash
    navigate(`/#${sectionId}`);
  }
}

// Enhanced hook with internal active section management
export const useJumpToSection = () => {
  const [activeSection, setActiveSection] = useState('home'); // Default to home

  // Improved jump function with better scrolling behavior
  const jump = (section) => {
    const element = document.getElementById(section);
    
    if (element) {
      // Calculate position with offset for navbar
      const navbarHeight = 80; // Approximate navbar height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
      
      // Use scrollTo for more precise control
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Set active section immediately
      setActiveSection(section);
    }
  };

  // Use Intersection Observer to detect which section is currently visible
  useEffect(() => {
    const sections = ['home', 'services', 'about'];
    
    // Create observer with adjusted options for better section detection
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most visible section (with highest intersection ratio)
        const visibleSections = entries.filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          
        if (visibleSections.length > 0) {
          setActiveSection(visibleSections[0].target.id);
        }
      },
      { 
        rootMargin: '-100px 0px -40% 0px', // Give more importance to the top part of the viewport
        threshold: [0.1, 0.2, 0.3, 0.4, 0.5] // Multiple thresholds for better accuracy
      }
    );

    // Observe all sections
    sections.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      sections.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, []);

  return { jump, activeSection };
};