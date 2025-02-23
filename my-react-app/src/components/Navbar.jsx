import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import '../styles/NavBarStyle.css';
import '../components/Map.jsx';

export default function Navbar() {
  const location = useLocation();
  const isMapPage = location.pathname === '/map';


  useEffect(() => {
    const toggle = document.getElementById('toggle');

    // Check localStorage for saved dark mode preference
    const savedMode = localStorage.getItem('darkMode');

    // Apply the saved mode (if any) when the page is loaded
    if (savedMode === 'true') {
      document.body.classList.add('dark-theme');
      toggle.checked = true;
    } else {
      document.body.classList.remove('dark-theme');
      toggle.checked = false;
    }

    // Add event listener for the toggle button to save mode
    toggle.addEventListener('change', () => {
      // Toggle dark theme on body
      document.body.classList.toggle('dark-theme', toggle.checked);

      // Save the dark mode preference in localStorage
      localStorage.setItem('darkMode', toggle.checked);
    });

    // Cleanup event listener
    return () => {
      toggle.removeEventListener('change', () => {
        document.body.classList.toggle('dark-theme', toggle.checked);
        localStorage.setItem('darkMode', toggle.checked);
      });
    };
  }, []);

  const handleScroll = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <header>
      <nav>
      <Link to="/">
      <a href="#">
          <div className="RedHope">
            <img src="/src/assets/images/RedHope_Logo.png" alt="RedHope Logo" />
            <a href="/"><h1><span>Red</span>Hope</h1></a>
          </div>
        </a>
        </Link>

        <div className='nav-links'>
       
          {!isMapPage && (
            <>
              <div className='HSA' onClick={() => handleScroll('home')}>
                {language === 'en' ? 'Home' : 'Accueil'}
              </div>
              <div className='HSA' onClick={() => handleScroll('services')}>
                {language === 'en' ? 'Services' : 'Services'}
              </div>
              <div className='HSA' onClick={() => handleScroll('about')}>
                {language === 'en' ? 'About Us' : 'À Propos'}
              </div>
              <div className='HSA'>
                <Link to="/map">{language === 'en' ? 'Map' : 'Carte'}</Link>
              </div>
            </>
          )}


        </div>

        <div className='auth'>
          <Link to="/sign">
            <div className='Sign-up'>{language === 'en' ? 'Sign up' : 'S\'inscrire'}</div>
          </Link>
          <Link to="/login">
            <div className='Login'>{language === 'en' ? 'Login' : 'Connexion'}</div>
          </Link>
        </div>

        <div className='language-switcher'>
          <select value={language} onChange={(e) => changeLanguage(e.target.value)}>
            <option value='en'>English</option>
            <option value='fr'>Français</option>
          </select>
        </div>

        {/* Dark Mode Toggle Button */}
        <div className="toggle-container">
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