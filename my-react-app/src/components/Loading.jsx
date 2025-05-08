// src/components/Loading.jsx
import React, { useEffect } from 'react';
import '../styles/loading.css';
import RedHopeLogo from '../assets/images/RedHope_Logo.png';

const Loading = () => {
  // Apply dark theme from localStorage on component mount
  useEffect(() => {
    const isDarkMode = localStorage.getItem("darkMode") === "true";
    if (isDarkMode) {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
  }, []);

  return (
    <div className="loading">
      <div className="logo_loading">
        <img src={RedHopeLogo} alt="RedHope Logo" />
        <a href="/"><h1><span>Red</span>Hope</h1></a>
        <div className="loading-spinner"></div>
      </div>
    </div>
  );
};

export default Loading;
