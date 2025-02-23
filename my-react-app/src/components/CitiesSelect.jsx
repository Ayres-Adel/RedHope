import React, { useState, useEffect } from 'react';
import "../styles/CitySelector.css";

const CitySelector = ({ onLocationChange }) => {
  // Language state: reads from localStorage
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');

  // Poll localStorage for language changes
  useEffect(() => {
    const interval = setInterval(() => {
      const currentLang = localStorage.getItem('language') || 'en';
      if (currentLang !== language) {
        setLanguage(currentLang);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [language]);

  // Dark theme toggle effect
  useEffect(() => {
    const toggle = document.getElementById('toggle');
    if (toggle) {
      const toggleDarkMode = () => {
        document.body.classList.toggle('dark-theme', toggle.checked);
      };

      toggle.addEventListener('change', toggleDarkMode);

      return () => {
        toggle.removeEventListener('change', toggleDarkMode);
      };
    }
  }, []);

  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [wilayas, setWilayas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/src/assets/wilayas_algerie.json')
      .then(response => response.json())
      .then(data => {
        setWilayas(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setError(language === 'en' ? 'Failed to load wilayas' : 'Échec du chargement des wilayas');
        setLoading(false);
      });
  }, [language]);

  const handleWilayaChange = (e) => {
    const code = e.target.value;
    setSelectedWilaya(code);

    const selectedWilayaData = wilayas.find((w) => w.code === code);
    if (selectedWilayaData?.latitude && selectedWilayaData?.longitude) {
      console.log('CitySelector - Selected coordinates:', {
        lat: parseFloat(selectedWilayaData.latitude),
        lng: parseFloat(selectedWilayaData.longitude),
      });
      onLocationChange({
        lat: parseFloat(selectedWilayaData.latitude),
        lng: parseFloat(selectedWilayaData.longitude),
      });
    }
  };

  if (loading) return <div className="loading">{language === 'en' ? 'Loading...' : 'Chargement...'}</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="wilaya-selector">
      <label htmlFor="wilaya-select">
        {language === 'en' ? 'Select Wilaya:' : 'Sélectionnez une Wilaya:'}
      </label>
      <select 
        id="wilaya-select" 
        value={selectedWilaya} 
        onChange={handleWilayaChange}
        className="wilaya-select"
      >
        <option value="">{language === 'en' ? 'Select a Wilaya' : 'Sélectionnez une Wilaya'}</option>
        {wilayas.map((wilaya) => (
          <option key={wilaya.code} value={wilaya.code}>
            {wilaya.code} - {wilaya.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CitySelector;
