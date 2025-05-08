import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faGlobe,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/NavBarStyle.css";
import "../components/Map.jsx";
import { useJumpToSection } from "./JumpPages.jsx";
import ScrollTracker from './ScrollTracker';

// Memoized navigation link component for better performance
const NavLink = memo(({ 
  reference, 
  isActive, 
  onClick, 
  children 
}) => (
  <div
    ref={reference}
    className={`HSA ${isActive ? "active" : ""}`}
    onClick={onClick}
  >
    {children}
  </div>
));

// Main Navbar component
export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Page detection constants - memoized to prevent recalculation
  const pageDetection = useMemo(() => {
    const isHomePage = location.pathname === "/";
    const isMapPage = location.pathname === "/map";
    const isSignPage = location.pathname === "/sign";
    const isLoginPage = location.pathname === "/login";
    const isUserPage = location.pathname === "/user";
    const isAdminPage = location.pathname === "/admin";
    const isUnrelatedPage = !isHomePage && !isMapPage && !isAdminPage;
    
    return {
      isHomePage,
      isMapPage,
      isSignPage,
      isLoginPage,
      isUserPage,
      isAdminPage,
      isUnrelatedPage
    };
  }, [location.pathname]);
  
  const { isHomePage, isMapPage, isSignPage, isLoginPage, isUserPage, isAdminPage, isUnrelatedPage } = pageDetection;

  // Authentication state - with optimized check
  const [authState, setAuthState] = useState(() => {
    const hasToken = !!localStorage.getItem("token");
    const isAdmin = hasToken && (
      localStorage.getItem("userRole") === "admin" || 
      localStorage.getItem("isAdmin") === "true"
    );
    
    return { isLoggedIn: hasToken, isAdmin };
  });
  
  // Destructure auth state for easier access
  const { isLoggedIn, isAdmin } = authState;

  // Navigation state
  const { jump, activeSection: hookActiveSection } = useJumpToSection();
  const [currentSection, setCurrentSection] = useState('home');
  const activeSection = isHomePage ? currentSection : hookActiveSection;

  // UI state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem("language") || "en");
  const [lineStyle, setLineStyle] = useState({ width: 0, left: 0 });
  const [togglesLoaded, setTogglesLoaded] = useState(false);

  // Element references - consolidated in one object for better organization
  const refs = {
    navLinks: useRef(null),
    hamburger: useRef(null),
    home: useRef(null),
    services: useRef(null),
    about: useRef(null),
    map: useRef(null),
    admin: useRef(null)
  };

  // Handle section changes from ScrollTracker
  const handleSectionChange = useCallback((section) => {
    setCurrentSection(section);
  }, []);

  // Theme toggle handler with useCallback and improved reliability
  const handleToggleChange = useCallback((event) => {
    try {
      const clickedToggle = event.target;
      const isChecked = clickedToggle.checked;
      
      // Apply theme to document
      document.body.classList.toggle("dark-theme", isChecked);
      localStorage.setItem("darkMode", isChecked);
      
      // Sync toggles (safely access DOM elements)
      const desktopToggle = document.getElementById("toggle");
      const mobileToggle = document.getElementById("mobile-toggle");
      
      if (desktopToggle && clickedToggle.id !== "toggle") {
        desktopToggle.checked = isChecked;
      }
      
      if (mobileToggle && clickedToggle.id !== "mobile-toggle") {
        mobileToggle.checked = isChecked;
      }
    } catch (error) {
      console.error("Error handling toggle change:", error);
    }
  }, []);

  // Menu management with improved reliability
  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
    if (refs.hamburger.current) {
      refs.hamburger.current.classList.remove('active');
    }
  }, []);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prevState => {
      const newState = !prevState;
      if (refs.hamburger.current) {
        if (newState) {
          refs.hamburger.current.classList.add('active');
        } else {
          refs.hamburger.current.classList.remove('active');
        }
      }
      return newState;
    });
  }, []);

  // Navigation handler - optimized to reduce complexity
  const handleNavigation = useCallback(
    (section) => {
      if (isHomePage) {
        if (section === "home") {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setCurrentSection('home');
        } else {
          jump(section);
          setCurrentSection(section);
        }
      } else {
        navigate("/", { state: { scrollTo: section } });
      }
      closeMenu();
    },
    [isHomePage, jump, navigate, closeMenu]
  );

  // Specialized navigation handlers
  const handleMapNavigation = useCallback(() => {
    navigate("/map");
    closeMenu();
  }, [navigate, closeMenu]);

  const handleAdminNavigation = useCallback(() => {
    navigate("/admin");
    closeMenu();
  }, [navigate, closeMenu]);

  // Authentication functions
  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    setAuthState(prev => ({ ...prev, isLoggedIn: false }));
    navigate("/login");
  }, [navigate]);

  const checkAdminStatus = useCallback(() => {
    const userRole = localStorage.getItem("userRole");
    return userRole === "admin" || localStorage.getItem("isAdmin") === "true";
  }, []);

  // Language management - optimized with better event handling
  const changeLanguage = useCallback(() => {
    const newLanguage = language === "en" ? "fr" : "en";
    setLanguage(newLanguage);
    localStorage.setItem("language", newLanguage);
    
    // Use custom event for better cross-component communication
    document.dispatchEvent(
      new CustomEvent('languageChanged', { 
        detail: { language: newLanguage } 
      })
    );
  }, [language]);

  // Update login state when token changes - with optimization
  useEffect(() => {
    const hasToken = !!localStorage.getItem("token");
    
    // Only update state when auth status actually changes
    setAuthState(prev => {
      const nextIsAdmin = hasToken && checkAdminStatus();
      if (prev.isLoggedIn !== hasToken || prev.isAdmin !== nextIsAdmin) {
        return { isLoggedIn: hasToken, isAdmin: nextIsAdmin };
      }
      return prev;
    });
  }, [location.pathname, checkAdminStatus]);

  // Handle navigation when returning to home page with section param
  useEffect(() => {
    if (isHomePage && location.state?.scrollTo) {
      jump(location.state.scrollTo);
      // Clear the state to prevent repeated scrolling
      navigate("/", { replace: true, state: {} });
    }
  }, [isHomePage, location.state, jump, navigate]);

  // Language change listener with better cleanup
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "language" && e.newValue !== null && e.newValue !== language) {
        setLanguage(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [language]);

  // Dark mode initialization with improved reliability
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 10;
    
    // Create function for initialization to allow for retry logic
    const initializeThemeToggles = () => {
      const toggle = document.getElementById("toggle");
      const mobileToggle = document.getElementById("mobile-toggle");

      // If elements are not available yet, retry with exponential backoff
      if (!toggle || !mobileToggle) {
        retryCount++;
        if (retryCount < maxRetries) {
          // Increase delay with each retry attempt
          const delay = Math.min(100 * Math.pow(1.5, retryCount), 2000);
          setTimeout(initializeThemeToggles, delay);
        } else {
          console.warn("Failed to initialize toggle elements after multiple attempts");
        }
        return;
      }

      // Make desktop toggle visible
      if (toggle.style) {
        toggle.style.display = "block";
        toggle.classList.add('toggle-visible');
      }

      // Get dark mode preference
      const savedMode = localStorage.getItem("darkMode");
      const isDarkMode = savedMode === "true";
      
      // Apply theme to document
      document.body.classList.toggle("dark-theme", isDarkMode);
      
      // Configure desktop toggle
      if (toggle && !toggle.hasEventListener) {
        toggle.checked = isDarkMode;
        toggle.addEventListener("change", handleToggleChange);
        toggle.hasEventListener = true;
      }
      
      // Configure mobile toggle
      if (mobileToggle && !mobileToggle.hasEventListener) {
        mobileToggle.checked = isDarkMode;
        mobileToggle.addEventListener("change", handleToggleChange);
        mobileToggle.hasEventListener = true;
      }

      // Add a small delay to ensure CSS transitions complete
      setTimeout(() => {
        // Mark toggles as loaded
        setTogglesLoaded(true);
        
        // Add a class to the body to indicate toggles are ready
        document.body.classList.add('toggles-ready');
        
        // Force a repaint to ensure toggles render correctly
        toggle.style.transform = 'translateZ(0)';
        mobileToggle.style.transform = 'translateZ(0)';
      }, 50);
    };

    // Start initialization process
    initializeThemeToggles();

    // Setup mutation observer as backup to detect when toggles are added to DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          const toggle = document.getElementById("toggle");
          const mobileToggle = document.getElementById("mobile-toggle");
          
          if (toggle && mobileToggle && !togglesLoaded) {
            initializeThemeToggles();
            observer.disconnect();
          }
        }
      });
    });

    // Start observing document body for toggle elements
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Cleanup function
    return () => {
      observer.disconnect();
      
      const toggle = document.getElementById("toggle");
      const mobileToggle = document.getElementById("mobile-toggle");
      
      if (toggle && toggle.hasEventListener) {
        toggle.removeEventListener("change", handleToggleChange);
        toggle.hasEventListener = false;
      }
      
      if (mobileToggle && mobileToggle.hasEventListener) {
        mobileToggle.removeEventListener("change", handleToggleChange);
        mobileToggle.hasEventListener = false;
      }
    };
  }, [handleToggleChange, togglesLoaded]);

  // Close menu when clicking outside - optimized with refs
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event) => {
      if (refs.navLinks.current && 
          !refs.navLinks.current.contains(event.target) &&
          (!refs.hamburger.current || !refs.hamburger.current.contains(event.target))) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen, closeMenu]);

  // Translation helper - memoized to prevent unnecessary recalculations
  const t = useCallback((en, fr) => language === "en" ? en : fr, [language]);

  return (
    <header>
      {/* ScrollTracker for section detection */}
      <ScrollTracker 
        onSectionChange={handleSectionChange}
        isHomePage={isHomePage} 
      />
      
      <nav className={`${isMenuOpen ? 'expanded' : ''} ${togglesLoaded ? 'toggles-loaded' : 'toggles-loading'}`}>
        {/* Logo */}
        <div className="nav-logo">
          <a href="/">
            <img src="./src/assets/images/RedHope_Logo.png" alt="RedHope Logo" />
            <h1><span>Red</span>Hope</h1>
          </a>
        </div>

        {/* Hamburger menu button with ref */}
        <div
          ref={refs.hamburger}
          className="hamburger"
          onClick={toggleMenu}
          role="button"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          tabIndex="0"
          onKeyDown={(e) => e.key === "Enter" && toggleMenu()}
        >
          <div></div>
          <div></div>
          <div></div>
        </div>

        {/* Navigation links with optimized rendering */}
        <div 
          ref={refs.navLinks}
          className={`nav-links ${isMenuOpen ? "active" : ""}`}
        >
          <NavLink 
            reference={refs.home}
            isActive={!isUnrelatedPage && !(isMapPage || isAdminPage) && 
                     (activeSection === "home" || (!activeSection && isHomePage))}
            onClick={() => handleNavigation("home")}
          >
            {t("Home", "Accueil")}
          </NavLink>
          
          <NavLink 
            reference={refs.map}
            isActive={!isUnrelatedPage && isMapPage}
            onClick={handleMapNavigation}
          >
            {t("Map", "Carte")}
          </NavLink>
          
          <NavLink 
            reference={refs.services}
            isActive={!isUnrelatedPage && activeSection === "services"}
            onClick={() => handleNavigation("services")}
          >
            {t("Services", "Services")}
          </NavLink>
          
          <NavLink 
            reference={refs.about}
            isActive={!isUnrelatedPage && activeSection === "about"}
            onClick={() => handleNavigation("about")}
          >
            {t("About Us", "À Propos")}
          </NavLink>

          {isAdmin && (
            <NavLink 
              reference={refs.admin}
              isActive={!isUnrelatedPage && isAdminPage}
              onClick={handleAdminNavigation}
            >
              {t("Admin Panel", "Panneau d'Admin")}
            </NavLink>
          )}
          
          {/* Active line indicator */}
          <div className="active-line" style={lineStyle} />
          
          {/* Mobile utility section */}
          <div className="mobile-utility-section">
            <div className="language-switcher">
              <FontAwesomeIcon
                icon={faGlobe}
                className="language-icon"
                onClick={changeLanguage}
                title={t("Switch to French", "Switch to English")}
              />
            </div>

            <div className="toggle-container">
              <input 
                type="checkbox" 
                id="mobile-toggle" 
                onChange={handleToggleChange}
                aria-label={t("Toggle dark theme", "Basculer le thème sombre")}
              />
              <label htmlFor="mobile-toggle" className="display">
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
          </div>
        </div>

        {/* Right-side icons */}
        <div className={`nav-icons ${isMenuOpen ? "active" : ""}`}>
          {/* Auth section */}
          <div className="auth">
            {isLoggedIn || isUserPage ? (
              <>
                <FontAwesomeIcon
                  icon={faUser}
                  className="login-icon"
                  onClick={() => navigate("/user")}
                  title={t("User Profile", "Profil Utilisateur")}
                  aria-label={t("User Profile", "Profil Utilisateur")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && navigate("/user")}
                />
                <FontAwesomeIcon
                  icon={faSignOutAlt}
                  className="login-icon"
                  onClick={handleLogout}
                  title={t("Logout", "Déconnexion")}
                  aria-label={t("Logout", "Déconnexion")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && handleLogout()}
                />
              </>
            ) : (
              <Link 
                to="/login" 
                aria-label={t("Login", "Connexion")}
              >
                <FontAwesomeIcon 
                  icon={faUser} 
                  className="login-icon" 
                  title={t("Login", "Connexion")}
                />
              </Link>
            )}
          </div>

          {/* Language switcher */}
          <div className="language-switcher">
            <FontAwesomeIcon
              icon={faGlobe}
              className="language-icon"
              onClick={changeLanguage}
              title={t("Switch to French", "Switch to English")}
              aria-label={t("Switch language", "Changer de langue")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && changeLanguage()}
            />
          </div>

          {/* Desktop dark mode toggle */}
          <div className={`toggle-container ${togglesLoaded ? 'visible' : 'hidden'}`}>
            <input 
              type="checkbox" 
              id="toggle" 
              onChange={handleToggleChange}
              aria-label={t("Toggle dark theme", "Basculer le thème sombre")}
            />
            <label htmlFor="toggle" className="display">
              <div className="circle">
                <svg
                  className="sun"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z" />
                </svg>
                <svg
                  className="moon"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </label>
          </div>
        </div>
      </nav>
    </header>
  );
}
