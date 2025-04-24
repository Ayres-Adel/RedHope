import React, { useState, useEffect, useRef, useCallback } from "react";
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

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";
  const isMapPage = location.pathname === "/map";
  const isSignPage = location.pathname === "/sign";
  const isLoginPage = location.pathname === "/login";
  const isUserPage = location.pathname === "/user";
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  const { jump, activeSection } = useJumpToSection(); // Use enhanced hook

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "en"
  );
  const [lineStyle, setLineStyle] = useState({ width: 0, left: 0 });

  // Optimized event handler with useCallback to prevent re-creation on renders
  const handleToggleChange = useCallback(() => {
    const toggle = document.getElementById("toggle");
    if (toggle) {
      document.body.classList.toggle("dark-theme", toggle.checked);
      localStorage.setItem("darkMode", toggle.checked);

      // Update all icons to match theme
      document.querySelectorAll('.login-icon, .language-icon').forEach(icon => {
        icon.classList.toggle('dark-themed-icon', !document.body.classList.contains('dark-theme'));
      });
    }
  }, []);

  // Improved navigation function with useCallback
  const handleNavigation = useCallback(
    (section) => {
      if (isHomePage) {
        // If already on home page, just jump to section
        jump(section);
      } else {
        // Navigate to home page with section parameter
        navigate("/", { state: { scrollTo: section } });
      }
      setIsMenuOpen(false);
    },
    [isHomePage, jump, navigate]
  );

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/login");
  };

  // Update login state when token changes
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, [location.pathname]);

  // Handle navigation when returning to home page with a section to scroll to
  useEffect(() => {
    if (isHomePage && location.state?.scrollTo) {
      jump(location.state.scrollTo);
      // Clean up state after handling
      navigate("/", { replace: true, state: {} });
    }
  }, [isHomePage, location.state, jump, navigate]);

  // Refs for navigation links
  const homeRef = useRef(null);
  const servicesRef = useRef(null);
  const aboutRef = useRef(null);
  const mapRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    // Toggle active class on hamburger for animation
    const hamburgerElement = document.querySelector('.hamburger');
    if (hamburgerElement) {
      hamburgerElement.classList.toggle('active', !isMenuOpen);
    }
  };

  // Update language change function to broadcast the change to all components
  const changeLanguage = () => {
    const newLanguage = language === "en" ? "fr" : "en";
    setLanguage(newLanguage);
    localStorage.setItem("language", newLanguage);
    
    // Dispatch custom event for components that might miss the localStorage change
    document.dispatchEvent(
      new CustomEvent('languageChanged', { 
        detail: { language: newLanguage } 
      })
    );
  };

  // Replace interval with a more efficient language detection approach
  useEffect(() => {
    // Create a storage event listener instead of interval polling
    const handleStorageChange = (e) => {
      if (e.key === "language" && e.newValue !== language) {
        setLanguage(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [language]);

  // Optimized dark mode toggle with proper event cleanup
  useEffect(() => {
    const toggle = document.getElementById("toggle");
    if (!toggle) return;

    // Make sure toggle checkbox is visible and functional
    toggle.style.display = "block";
    
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode === "true") {
      document.body.classList.add("dark-theme");
      toggle.checked = true;
    } else {
      document.body.classList.remove("dark-theme");
      toggle.checked = false;
    }

    toggle.addEventListener("change", handleToggleChange);
    return () => toggle.removeEventListener("change", handleToggleChange);
  }, [handleToggleChange]);

  // Update the line position and width based on the active section
  useEffect(() => {
    const updateLinePosition = () => {
      let ref;
      switch (activeSection) {
        case "home":
          ref = homeRef;
          break;
        case "services":
          ref = servicesRef;
          break;
        case "about":
          ref = aboutRef;
          break;
        case "map":
          ref = mapRef;
          break;
        default:
          // Set default to home if on home page with no active section
          ref = isHomePage ? homeRef : null;
      }

      if (ref && ref.current) {
        const { offsetWidth, offsetLeft } = ref.current;
        // Add transition styling for smoother movement
        setLineStyle({
          width: offsetWidth,
          left: offsetLeft,
          transition: "all 0.3s ease",
          opacity: 1
        });
      } else {
        // Hide line if no active section
        setLineStyle({ opacity: 0 });
      }
    };

    updateLinePosition();

    // Debounce resize handler for better performance
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateLinePosition, 100);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, [activeSection, isHomePage]);

  // Check if we're on the admin page to remove the duplicate navigation
  const isAdminPage = window.location.pathname.includes("/admin");

  return (
    <header>
      <nav className={isMenuOpen ? 'expanded' : ''}>
        <div className="RedHope">
          <img src="./src/assets/images/RedHope_Logo.png" alt="RedHope Logo" />
          <a href="/">
            <h1>
              <span>Red</span>Hope
            </h1>
          </a>
        </div>

        {/* Hamburger Menu - now with animation */}
        <div
          className="hamburger"
          onClick={toggleMenu}
          role="button"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          tabIndex="0"
          onKeyDown={(e) => {
            if (e.key === "Enter") toggleMenu();
          }}
        >
          <div></div>
          <div></div>
          <div></div>
        </div>

        {/* Navigation Links */}
        <div className={`nav-links ${isMenuOpen ? "active" : ""}`}>
          <div
            ref={homeRef}
            className={`HSA ${activeSection === "home" || (!activeSection && isHomePage) ? "active" : ""}`}
            onClick={() => handleNavigation("home")}
          >
            {language === "en" ? "Home" : "Accueil"}
          </div>
          <div
            ref={servicesRef}
            className={`HSA ${activeSection === "services" ? "active" : ""}`}
            onClick={() => handleNavigation("services")}
          >
            {language === "en" ? "Services" : "Services"}
          </div>
          <div
            ref={aboutRef}
            className={`HSA ${activeSection === "about" ? "active" : ""}`}
            onClick={() => handleNavigation("about")}
          >
            {language === "en" ? "About Us" : "À Propos"}
          </div>
          <div
            ref={mapRef}
            className={`HSA ${isMapPage ? "active" : ""}`}
            onClick={() => {
              navigate("/map");
              setIsMenuOpen(false);
            }}
          >
            {language === "en" ? "Map" : "Carte"}
          </div>

          {/* Only show admin navigation in the main navbar if not on the admin page */}
          {isLoggedIn && !isAdminPage && (
            <div
              className={`HSA ${activeSection === "admin" ? "active" : ""}`}
              onClick={() => {
                navigate("/admin");
                setIsMenuOpen(false);
              }}
            >
              {language === "en" ? "Admin Panel" : "Panneau d'Admin"}
            </div>
          )}

          {/* Active line with smoother transitions */}
          <div
            className="active-line"
            style={lineStyle}
          />
        </div>

        <div className={`nav-icons ${isMenuOpen ? "active" : ""}`}>
          {/* Login/User Icon */}
          <div className="auth">
            {isLoggedIn || isUserPage ? (
              <>
                <FontAwesomeIcon
                  icon={faUser}
                  className="login-icon"
                  onClick={() => navigate("/user")}
                  title="User Profile"
                />
                <FontAwesomeIcon
                  icon={faSignOutAlt}
                  className="login-icon"
                  onClick={handleLogout}
                  title="Logout"
                />
              </>
            ) : (
              <Link to="/login">
                <FontAwesomeIcon 
                  icon={faUser} 
                  className="login-icon" 
                  title={language === "en" ? "Login" : "Connexion"}
                />
              </Link>
            )}
          </div>

          {/* Language Switcher Icon */}
          <div className="language-switcher">
            <FontAwesomeIcon
              icon={faGlobe}
              className="language-icon"
              onClick={changeLanguage}
              title={
                language === "en" ? "Switch to French" : "Switch to English"
              }
            />
          </div>

          {/* Dark Mode Toggle with theme-aware styling */}
          <div className="toggle-container">
            <input 
              type="checkbox" 
              id="toggle" 
              onChange={() => {
                // Update all icons to match theme
                document.querySelectorAll('.login-icon, .language-icon').forEach(icon => {
                  icon.classList.toggle('dark-themed-icon', !document.body.classList.contains('dark-theme'));
                });
              }}
            />
            <label htmlFor="toggle" className="display">
              <div className="circle">
                <svg
                  className="sun"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z" />
                </svg>
                <svg
                  className="moon"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
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
