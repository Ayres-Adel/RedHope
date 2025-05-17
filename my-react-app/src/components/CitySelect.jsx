import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import '../styles/CitySelect.css';
import { API_BASE_URL } from '../config';

const CitySelector = memo(({ onLocationChange, isDarkMode, includeAllCities = false, language = 'en' }) => {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const initialSelectionMade = useRef(false);
  
  const translations = useMemo(() => ({
    en: {
      allCities: "All Cities",
      loadingCities: "Loading cities...",
      selectCity: "Select a city",
      failedToLoadCities: "Failed to load cities:"
    },
    fr: {
      allCities: "Toutes les Villes",
      loadingCities: "Chargement des villes...",
      selectCity: "Sélectionner une ville",
      failedToLoadCities: "Échec du chargement des villes:"
    }
  }), []);

  const t = translations[language] || translations.en;

  useEffect(() => {
    let isMounted = true;
    
    const fetchCities = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/wilaya/all`);
        
        if (!response.ok) {
          if (response.status === 404 && isMounted) {
            const seedResponse = await fetch(`${API_BASE_URL}/api/wilaya/seed`, {
              method: 'POST'
            });
            
            if (seedResponse.ok && isMounted) {
              const retryResponse = await fetch(`${API_BASE_URL}/api/wilaya/all`);
              
              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                if (!isMounted) return;
                
                handleCitiesData(retryData);
                return;
              }
            }
          }
          throw new Error(`Failed to load cities: ${response.status}`);
        }
        
        const data = await response.json();
        if (!isMounted) return;
        
        handleCitiesData(data);
      } catch (error) {
        if (isMounted) {
          setError(error.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchCities();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  const formatCityCode = (code) => {
    if (!code) return '';
    // Ensure code is a string and pad with leading zero if needed
    return String(code).padStart(2, '0');
  };
  
  const handleCitiesData = (data) => {
    let citiesData = [];
    
    if (Array.isArray(data)) {
      citiesData = data;
    } else if (data.data && Array.isArray(data.data)) {
      citiesData = data.data;
    } else if (data.success && Array.isArray(data.cities)) {
      citiesData = data.cities;
    } else if (data.wilayas && Array.isArray(data.wilayas)) {
      citiesData = data.wilayas;
    } else if (data.success && data.data && Array.isArray(data.data.wilayas)) {
      citiesData = data.data.wilayas;
    } else {
      const arrayProps = Object.keys(data).filter(key => Array.isArray(data[key]));
      if (arrayProps.length > 0) {
        citiesData = data[arrayProps[0]];
      } else {
        setError('Unexpected API response format');
        return;
      }
    }
    
    if (citiesData.length > 0) {
      const firstCity = citiesData[0];
      if (!firstCity.name || (!firstCity.code && !firstCity.wilayaCode)) {
        setError('Invalid city data format');
        return;
      }
    }
    
    const sortedCities = citiesData.sort((a, b) => {
      const codeA = parseInt(a.code || a.wilayaCode || 0);
      const codeB = parseInt(b.code || b.wilayaCode || 0);
      return codeA - codeB;
    });
    
    setCities(sortedCities);
  };
  
  useEffect(() => {
    if (!isLoading && cities.length > 0 && !initialSelectionMade.current) {
      initialSelectionMade.current = true;
      
      if (selectedCity === 'all') {
        const timer = setTimeout(() => {
          onLocationChange(
            {
              lat: 36.16215909617758,
              lng: 1.330560770492638
            }, 
            t.allCities, 
            null
          );
        }, 300);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, cities, selectedCity, onLocationChange, t]);
  
  const handleCityChange = useCallback((e) => {
    const cityId = e.target.value;
    setSelectedCity(cityId);
    
    if (cityId === "all") {
      onLocationChange(null, t.allCities, null);
      return;
    }
    
    if (!cityId) return;
    
    const city = cities.find(c => c._id === cityId || c.id === cityId);
    if (!city) {
      return;
    }
    
    // Get the city code and ensure it's properly formatted
    const cityCode = formatCityCode(city.code || city.wilayaCode);
    
    if (city.location && city.location.coordinates) {
      onLocationChange({
        lat: city.location.coordinates[1],
        lng: city.location.coordinates[0]
      }, city.name, cityCode);
    } else if (city.latitude && city.longitude) {
      onLocationChange({
        lat: parseFloat(city.latitude),
        lng: parseFloat(city.longitude)
      }, city.name, cityCode);
    }
  }, [cities, onLocationChange, t]);
  
  if (error) {
    return (
      <div className="city-selector-error" role="alert">
        {t.failedToLoadCities} {error}
      </div>
    );
  }
  
  return (
    <div className="city-selector">
      <select 
        value={selectedCity} 
        onChange={handleCityChange} 
        disabled={isLoading}
        className={isDarkMode ? 'dark-mode' : 'light-mode'}
        aria-label={t.selectCity}
      >
        <option value="all">{t.allCities}</option>
        
        {cities.map(city => (
          <option key={city._id || city.id} value={city._id || city.id}>
            {city.code ? `${formatCityCode(city.code)} - ${city.name}` : city.name}
          </option>
        ))}
      </select>
      
      {isLoading && (
        <div className={`loading-indicator ${isDarkMode ? 'dark-mode' : ''}`} aria-live="polite">
          {t.loadingCities}
        </div>
      )}
    </div>
  );
});

CitySelector.propTypes = {
  onLocationChange: PropTypes.func.isRequired,
  isDarkMode: PropTypes.bool,
  includeAllCities: PropTypes.bool,
  language: PropTypes.string
};

CitySelector.displayName = 'CitySelector';

export default CitySelector;
