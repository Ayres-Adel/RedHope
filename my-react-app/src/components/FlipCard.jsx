import React, { useEffect, useState } from 'react';
import '../styles/FlipCard.css';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaEnvelope, FaGlobe } from 'react-icons/fa'; // React Icons
import Search from './Search';

const FlipCard = () => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleLearnMoreClick = () => {
    setIsFlipped(true);
  };

  const handleDonateNowClick = () => {
    setIsFlipped(false);
  };

  // Language state: reads from localStorage
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
  useEffect(() => {
    const interval = setInterval(() => {
      const currentLang = localStorage.getItem('language') || 'en';
      if (currentLang !== language) {
        setLanguage(currentLang);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [language]);

  useEffect(() => {
    const toggle = document.getElementById('toggle');
    toggle.addEventListener('change', () => {
      document.body.classList.toggle('dark-theme', toggle.checked);
    });

    // Cleanup event listener
    return () => {
      toggle.removeEventListener('change', () => {
        document.body.classList.toggle('dark-theme', toggle.checked);
      });
    };
  }, []);
  
  return (
    <div className="flip-card">
      <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`}>
        <div className="flip-card-front">
          <h2>RedHope</h2>
          <h3>{language === 'fr' ? 'Chaque don peut sauver jusqu\'à 3 vies.' : 'Every donation can save up to 3 lives.'}</h3>
          <img src="./src/assets/images/RedHope_Logo.png" alt="Blood Donation" className="card-image" />
          <button className="learn-more-btn" onClick={handleLearnMoreClick}>{language === 'fr' ? 'En savoir plus' : 'Learn More'}</button>
        </div>
        <div className="flip-card-back">
          <div className="flip-card-front">
           <span> <h2>{language === 'fr' ? 'À propos de nous' : 'About Us'}</h2></span>
            <div className="social-media-links">
              <a href="https://facebook.com/redhope" target="_blank" rel="noopener noreferrer">
                <FaFacebook className="social-icon" />
                <span>Facebook</span>
              </a>
              <a href="https://twitter.com/redhope" target="_blank" rel="noopener noreferrer">
                <FaTwitter className="social-icon" />
                <span>Twitter</span>
              </a>
              <a href="https://instagram.com/redhope" target="_blank" rel="noopener noreferrer">
                <FaInstagram className="social-icon" />
                <span>Instagram</span>
              </a>
              <a href="https://linkedin.com/company/redhope" target="_blank" rel="noopener noreferrer">
                <FaLinkedin className="social-icon" />
                <span>LinkedIn</span>
              </a>
            </div>
            <button className="donate-now-btn" onClick={handleDonateNowClick}>{language === 'fr' ? 'Faire un don' : 'Donate Now'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlipCard;