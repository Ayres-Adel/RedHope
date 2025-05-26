import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faGlobe,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/NavBarStyle.css";
import { useJumpToSection } from "./JumpPages.jsx";
import ScrollTracker from './ScrollTracker';
import RedHopeLogo from "../assets/images/RedHope_Logo.png";

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

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isHomePage = location.pathname === "/";
  const isMapPage = location.pathname === "/map";
  const isSearchPage = location.pathname === "/search";
  const isSignPage = location.pathname === "/sign";
  const isLoginPage = location.pathname === "/login";
  const isUserPage = location.pathname === "/user";
  const isAdminPage = location.pathname === "/admin";
  const isUnrelatedPage = !isHomePage && !isMapPage && !isAdminPage && !isSearchPage;

  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [isAdmin, setIsAdmin] = useState(false);

  const { jump, activeSection: hookActiveSection } = useJumpToSection();
  const [currentSection, setCurrentSection] = useState('home');
  const activeSection = isHomePage ? currentSection : hookActiveSection;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "en"
  );
  const [lineStyle, setLineStyle] = useState({ width: 0, left: 0 });

  const navLinksRef = useRef(null);
  const hamburgerRef = useRef(null);
  const homeRef = useRef(null);
  const servicesRef = useRef(null);
  const aboutRef = useRef(null);
  const mapRef = useRef(null);
  const adminRef = useRef(null);

  const handleSectionChange = useCallback((section) => {
    setCurrentSection(section);
  }, []);

  const handleToggleChange = useCallback((event) => {
    const isChecked = event.target.checked;
    document.body.classList.toggle("dark-theme", isChecked);
    localStorage.setItem("darkMode", isChecked);
    
    const allToggles = [
      document.getElementById("toggle"), 
      document.getElementById("mobile-toggle")
    ];
    
    allToggles.forEach(toggle => {
      if (toggle && toggle !== event.target) {
        toggle.checked = isChecked;
      }
    });
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
    if (hamburgerRef.current) {
      hamburgerRef.current.classList.remove('active');
    }
  }, []);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prevState => {
      const newState = !prevState;
      if (hamburgerRef.current) {
        hamburgerRef.current.classList.toggle('active', newState);
      }
      return newState;
    });
  }, []);

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

  const handleMapNavigation = useCallback(() => {
    navigate("/map");
    closeMenu();
  }, [navigate, closeMenu]);

  const handleAdminNavigation = useCallback(() => {
    navigate("/admin");
    closeMenu();
  }, [navigate, closeMenu]);

  const handleSearchNavigation = useCallback(() => {
    navigate("/search");
    closeMenu();
  }, [navigate, closeMenu]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/login");
  }, [navigate]);

  const checkAdminStatus = useCallback(() => {
    const userRole = localStorage.getItem("userRole");
    return userRole === "admin" || localStorage.getItem("isAdmin") === "true";
  }, []);

  const changeLanguage = useCallback(() => {
    const newLanguage = language === "en" ? "fr" : "en";
    setLanguage(newLanguage);
    localStorage.setItem("language", newLanguage);
    
    document.dispatchEvent(
      new CustomEvent('languageChanged', { 
        detail: { language: newLanguage } 
      })
    );
  }, [language]);

  useEffect(() => {
    const hasToken = !!localStorage.getItem("token");
    setIsLoggedIn(hasToken);
    
    if (hasToken) {
      setIsAdmin(checkAdminStatus());
    } else {
      setIsAdmin(false);
    }
    
    if (isHomePage && location.state?.scrollTo) {
      jump(location.state.scrollTo);
      navigate("/", { replace: true, state: {} });
    }
    
    const setupThemeToggle = () => {
      const toggle = document.getElementById("toggle");
      const mobileToggle = document.getElementById("mobile-toggle");
      
      if (!toggle || !mobileToggle) return;
      
      const isDarkMode = localStorage.getItem("darkMode") === "true";
      document.body.classList.toggle("dark-theme", isDarkMode);
      toggle.checked = isDarkMode;
      mobileToggle.checked = isDarkMode;
    };
    
    setupThemeToggle();
    
    const handleClickOutside = (event) => {
      if (isMenuOpen && 
          navLinksRef.current && 
          !navLinksRef.current.contains(event.target) &&
          (!hamburgerRef.current || !hamburgerRef.current.contains(event.target))) {
        closeMenu();
      }
    };
    
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [location.pathname, checkAdminStatus, isHomePage, location.state, jump, navigate, isMenuOpen, closeMenu]);

  const t = useCallback((en, fr) => language === "en" ? en : fr, [language]);

  return (
    <header>
      <ScrollTracker 
        onSectionChange={handleSectionChange}
        isHomePage={isHomePage} 
      />
      
      <nav className={isMenuOpen ? 'expanded' : ''}>
        <div className="nav-logo">
          <a href="/">
            <img src= {RedHopeLogo} alt="RedHope Logo" />
            <h1><span>Red</span>Hope</h1>
          </a>
        </div>

        <div
          ref={hamburgerRef}
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

        <div 
          ref={navLinksRef}
          className={`nav-links ${isMenuOpen ? "active" : ""}`}
        >
          <NavLink 
            reference={homeRef}
            isActive={!isUnrelatedPage && !(isMapPage || isAdminPage || isSearchPage) && 
                     (activeSection === "home" || (!activeSection && isHomePage))}
            onClick={() => handleNavigation("home")}
          >
            {t("Home", "Accueil")}
          </NavLink>
          
          <NavLink 
            isActive={!isUnrelatedPage && isSearchPage}
            onClick={handleSearchNavigation}
          >
            {t("Search", "Recherche")}
          </NavLink>
          
          <NavLink 
            reference={mapRef}
            isActive={!isUnrelatedPage && isMapPage}
            onClick={handleMapNavigation}
          >
            {t("Map", "Carte")}
          </NavLink>
          
          <NavLink 
            reference={servicesRef}
            isActive={!isUnrelatedPage && activeSection === "services"}
            onClick={() => handleNavigation("services")}
          >
            {t("Services", "Services")}
          </NavLink>
          
          <NavLink 
            reference={aboutRef}
            isActive={!isUnrelatedPage && activeSection === "about"}
            onClick={() => handleNavigation("about")}
          >
            {t("About Us", "À Propos")}
          </NavLink>

          {isAdmin && (
            <NavLink 
              reference={adminRef}
              isActive={!isUnrelatedPage && isAdminPage}
              onClick={handleAdminNavigation}
            >
              {t("Admin Panel", "Panneau d'Admin")}
            </NavLink>
          )}
          
          <div className="active-line" style={lineStyle} />
          
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

        <div className={`nav-icons ${isMenuOpen ? "active" : ""}`}>
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
              <Link className="notLoggedIn-icon"
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

          <div className="toggle-container">
            <input 
              type="checkbox" 
              id="toggle" 
              onChange={handleToggleChange}
              aria-label={t("Toggle dark theme", "Basculer le thème sombre")}
            />
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
        </div>
      </nav>
    </header>
  );
}
