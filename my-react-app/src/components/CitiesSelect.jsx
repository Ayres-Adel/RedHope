import React, { useState, useEffect } from 'react';
import { wilayaService } from '../services/api';
import '../styles/CitySelector.css';

const CitySelector = ({ onLocationChange }) => {
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
  const [wilayas, setWilayas] = useState([]);
  const [selectedWilaya, setSelectedWilaya] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWilayas = async () => {
      try {
        setLoading(true);
        const response = await wilayaService.getAllWilayas();
        setWilayas(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setError(language === 'en' ? 'Failed to load wilayas' : 'Échec du chargement des wilayas');
        setLoading(false);
      }
    };

    fetchWilayas();

    // Check for language updates
    const interval = setInterval(() => {
      const currentLang = localStorage.getItem('language') || 'en';
      if (currentLang !== language) {
        setLanguage(currentLang);
      }
    }, 1000);

    return () => clearInterval(interval);
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

  // Improved loading and error states with better styling
  if (loading) {
    return (
      <div className="city-selector loading">
        <div className="selector-placeholder">
          <div className="loading-spinner"></div>
          <span>{language === 'en' ? 'Loading wilayas...' : 'Chargement des wilayas...'}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="city-selector error">
        <div className="selector-placeholder error-message">
          <span>{error}</span>
          <button onClick={() => window.location.reload()}>
            {language === 'en' ? 'Try Again' : 'Réessayer'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="city-selector">
      <label htmlFor="wilaya-select" className="selector-label">
        {language === 'en' ? 'Choose a Wilaya:' : 'Choisissez une Wilaya:'}
      </label>
      <select
        id="wilaya-select"
        value={selectedWilaya}
        onChange={handleWilayaChange}
        className="wilaya-select"
      >
        <option value="">
          {language === 'en' ? '-- Select a wilaya --' : '-- Sélectionner une wilaya --'}
        </option>
        {wilayas.map((wilaya) => (
          <option key={wilaya.code} value={wilaya.code}>
            {wilaya.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CitySelector;
