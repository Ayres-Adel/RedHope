import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faGlobe } from '@fortawesome/free-solid-svg-icons';
import '../styles/NavBarStyle.css';
import '../components/Map.jsx';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMapPage = location.pathname === '/map';
  const isSignPage = location.pathname === '/sign';
  const isLoginPage = location.pathname === '/login';

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
  const [activeSection, setActiveSection] = useState(isMapPage ? 'map' : 'home'); // Set initial active section
  const [lineStyle, setLineStyle] = useState({ width: 0, left: 0 }); // State to control the line's position and width

  // Refs for navigation links
  const homeRef = useRef(null);
  const servicesRef = useRef(null);
  const aboutRef = useRef(null);
  const mapRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const changeLanguage = () => {
    const newLanguage = language === 'en' ? 'fr' : 'en';
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  // Function to handle smooth scrolling and update the active section
  const handleScroll = (id) => {
    if (isMapPage || isSignPage || isLoginPage) {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setActiveSection(id); // Update the active section
  };

  // Update the line position and width based on the active section
  useEffect(() => {
    const updateLinePosition = () => {
      let ref;
      switch (activeSection) {
        case 'home':
          ref = homeRef;
          break;
        case 'services':
          ref = servicesRef;
          break;
        case 'about':
          ref = aboutRef;
          break;
        case 'map':
          ref = mapRef;
          break;
        default:
          ref = null;
      }

      if (ref && ref.current) {
        const { offsetWidth, offsetLeft } = ref.current;
        setLineStyle({ width: offsetWidth, left: offsetLeft });
      }
    };

    updateLinePosition();
    window.addEventListener('resize', updateLinePosition); // Update on window resize
    return () => window.removeEventListener('resize', updateLinePosition);
  }, [activeSection]);

  // Set active section to 'map' when on the map page
  useEffect(() => {
    if (isMapPage) {
      setActiveSection('map');
    }
  }, [isMapPage]);

  // Use IntersectionObserver to detect the active section (for home, services, about)
  useEffect(() => {
    const sections = ['home', 'services', 'about'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.5 } // Adjust the threshold as needed
    );

    sections.forEach((sectionId) => {
      const section = document.getElementById(sectionId);
      if (section) {
        observer.observe(section);
      }
    });

    // Cleanup observer
    return () => observer.disconnect();
  }, []);

  // Dark mode toggle logic (unchanged)
  useEffect(() => {
    const toggle = document.getElementById('toggle');
    const savedMode = localStorage.getItem('darkMode');

    if (savedMode === 'true') {
      document.body.classList.add('dark-theme');
      toggle.checked = true;
    } else {
      document.body.classList.remove('dark-theme');
      toggle.checked = false;
    }

    toggle.addEventListener('change', () => {
      document.body.classList.toggle('dark-theme', toggle.checked);
      localStorage.setItem('darkMode', toggle.checked);
    });

    return () => {
      toggle.removeEventListener('change', () => {
        document.body.classList.toggle('dark-theme', toggle.checked);
        localStorage.setItem('darkMode', toggle.checked);
      });
    };
  }, []);

  return (
    <header>
      <nav>
        <div className="RedHope">
          <img src="./src/assets/images/RedHope_Logo.png" alt="RedHope Logo" />
          <a href="/"><h1><span>Red</span>Hope</h1></a>
        </div>

        {/* Hamburger Menu */}
        <div className="hamburger" onClick={toggleMenu}>
          <div></div>
          <div></div>
          <div></div>
        </div>

        {/* Navigation Links */}
        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <div
            ref={homeRef}
            className="HSA"
            onClick={() => handleScroll('home')}
          >
            {language === 'en' ? 'Home' : 'Accueil'}
          </div>
          <div
            ref={servicesRef}
            className="HSA"
            onClick={() => handleScroll('services')}
          >
            {language === 'en' ? 'Services' : 'Services'}
          </div>
          <div
            ref={aboutRef}
            className="HSA"
            onClick={() => handleScroll('about')}
          >
            {language === 'en' ? 'About Us' : 'À Propos'}
          </div>
          <div
            ref={mapRef}
            className="HSA"
          >
            <Link to="/map">{language === 'en' ? 'Map' : 'Carte'}</Link>
          </div>

          {/* Dynamic Line */}
          <div
            className="active-line"
            style={{
              width: `${lineStyle.width}px`,
              left: `${lineStyle.left}px`,
            }}
          />
        </div>

        {/* Login Icon */}
        <div className={`auth ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/login">
            <FontAwesomeIcon icon={faUser} className="login-icon" />
          </Link>
        </div>

        {/* Language Switcher Icon */}
        <div className={`language-switcher ${isMenuOpen ? 'active' : ''}`}>
          <FontAwesomeIcon
            icon={faGlobe}
            className="language-icon"
            onClick={changeLanguage}
            title={language === 'en' ? 'Switch to French' : 'Switch to English'}
          />
        </div>

        {/* Dark Mode Toggle */}
        <div className={`toggle-container ${isMenuOpen ? 'active' : ''}`}>
          <input type="checkbox" id="toggle" />
          <label htmlFor="toggle" className="display">
            <div className="circle">
              <svg className="sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z" />
              </svg>
              <svg className="moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z" clipRule="evenodd" />
              </svg>
            </div>
          </label>
        </div>
      </nav>
      <hr />
    </header>
  );
}