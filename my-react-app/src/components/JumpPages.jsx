import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

export default function jumpToSection(sectionId, navigate, location, setActiveSection) {
  if (location.pathname === "/") {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveSection && setActiveSection(sectionId);
    }
  } else {
    navigate(`/#${sectionId}`);
  }
}

export const useJumpToSection = () => {
  const [activeSection, setActiveSection] = useState('home');

  const jump = (section) => {
    const element = document.getElementById(section);
    
    if (element) {
      const navbarHeight = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      setActiveSection(section);
    }
  };

  useEffect(() => {
    const sections = ['home', 'services', 'about'];
    
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries.filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          
        if (visibleSections.length > 0) {
          setActiveSection(visibleSections[0].target.id);
        }
      },
      { 
        rootMargin: '-100px 0px -40% 0px',
        threshold: [0.1, 0.2, 0.3, 0.4, 0.5]
      }
    );

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