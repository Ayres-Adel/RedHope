import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import '../styles/CitySelect.css';
import { API_BASE_URL } from '../config';

const CitySelector = memo(({ onLocationChange, isDarkMode, includeAllCities = false }) => {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const initialSelectionMade = useRef(false);

  // Fetch cities data
  useEffect(() => {
    let isMounted = true;
    
    const fetchCities = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/wilaya/all`);
        
        // Handle 404 error specifically (try to seed data)
        if (!response.ok) {
          if (response.status === 404 && isMounted) {
            console.log("Cities endpoint not found, trying to seed data...");
            
            const seedResponse = await fetch(`${API_BASE_URL}/api/wilaya/seed`, {
              method: 'POST'
            });
            
            if (seedResponse.ok && isMounted) {
              console.log("Successfully seeded cities data");
              const retryResponse = await fetch(`${API_BASE_URL}/api/wilaya/all`);
              
              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                if (!isMounted) return;
                
                console.log('Cities loaded after seeding:', retryData.data?.length || 0);
                handleCitiesData(retryData);
                return;
              }
            }
          }
          throw new Error(`Failed to load cities: ${response.status}`);
        }
        
        // Process successful response
        const data = await response.json();
        if (!isMounted) return;
        
        handleCitiesData(data);
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching cities:', error);
          setError(error.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchCities();
    
    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    };
  }, []);
  
  // Process cities data from API response
  const handleCitiesData = (data) => {
    let citiesData = [];
    
    if (!data.data && data.success && Array.isArray(data)) {
      citiesData = data;
    } else if (data.data && Array.isArray(data.data)) {
      citiesData = data.data;
    } else {
      console.warn('Unexpected API response format:', data);
      setError('Unexpected API response format');
      return;
    }
    
    // Sort cities by their numeric code
    const sortedCities = citiesData.sort((a, b) => {
      const codeA = parseInt(a.code || a.wilayaCode || 0);
      const codeB = parseInt(b.code || b.wilayaCode || 0);
      return codeA - codeB;
    });
    
    console.log('Cities sorted by code, count:', sortedCities.length);
    setCities(sortedCities);
  };
  
  // Make initial selection when cities are loaded
  useEffect(() => {
    if (!isLoading && cities.length > 0 && !initialSelectionMade.current) {
      initialSelectionMade.current = true;
      
      // Only trigger for "All Cities" selection
      if (selectedCity === 'all') {
        // Delay to avoid race conditions
        const timer = setTimeout(() => {
          console.log('Initial selection: All Cities');
          onLocationChange(
            {
              lat: 36.16215909617758,
              lng: 1.330560770492638
            }, 
            "All Cities", 
            null
          );
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, cities, selectedCity, onLocationChange]);
  
  // Handle city selection change
  const handleCityChange = useCallback((e) => {
    const cityId = e.target.value;
    setSelectedCity(cityId);
    
    if (cityId === "all") {
      console.log('Selected: All Cities - keeping current map view');
      onLocationChange(null, "All Cities", null);
      return;
    }
    
    if (!cityId) return; // Handle empty selection
    
    // Find the selected city data
    const city = cities.find(c => c._id === cityId || c.id === cityId);
    if (!city) {
      console.warn('Could not find city data for ID:', cityId);
      return;
    }
    
    // Get the city code
    const cityCode = city.code || city.wilayaCode;
    console.log(`Selected city: ${city.name}, code: ${cityCode}, id: ${cityId}`);
    
    // Handle location coordinates based on data format
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
    } else {
      console.warn('Selected city has no valid coordinates:', city);
    }
  }, [cities, onLocationChange]);
  
  if (error) {
    return (
      <div className="city-selector-error" role="alert">
        Failed to load cities: {error}
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
        aria-label="Select a city"
      >
        <option value="all">All Cities</option>
        
        {cities.map(city => (
          <option key={city._id || city.id} value={city._id || city.id}>
            {city.code ? `${city.code} - ${city.name}` : city.name}
          </option>
        ))}
      </select>
      
      {isLoading && (
        <div className={`loading-indicator ${isDarkMode ? 'dark-mode' : ''}`} aria-live="polite">
          Loading cities...
        </div>
      )}
    </div>
  );
});

CitySelector.propTypes = {
  onLocationChange: PropTypes.func.isRequired,
  isDarkMode: PropTypes.bool,
  includeAllCities: PropTypes.bool
};

CitySelector.displayName = 'CitySelector';

export default CitySelector;
