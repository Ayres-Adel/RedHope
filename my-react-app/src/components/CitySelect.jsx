import React, { useState, useEffect } from 'react';
import '../styles/CitySelect.css';

const CitySelector = ({ onLocationChange, isDarkMode }) => {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:3000/api/wilaya/all');
        
        if (!response.ok) {
          if (response.status === 404) {
            console.log("Cities endpoint not found, trying to seed data...");
            // Try to seed the database if no cities exist
            const seedResponse = await fetch('http://localhost:3000/api/wilaya/seed', {
              method: 'POST'
            });
            
            if (seedResponse.ok) {
              console.log("Successfully seeded cities data");
              // Retry fetching cities after seeding
              const retryResponse = await fetch('http://localhost:3000/api/wilaya/all');
              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                console.log('Cities loaded after seeding:', retryData.data?.length || 0);
                setCities(retryData.data || []);
                setIsLoading(false);
                return;
              }
            }
          }
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Get cities data and sort them by code
        let citiesData = [];
        
        if (!data.data && data.success && Array.isArray(data)) {
          citiesData = data;
        } else if (data.data && Array.isArray(data.data)) {
          citiesData = data.data;
        } else {
          console.warn('Unexpected API response format:', data);
          throw new Error('Unexpected API response format');
        }
        
        // Sort cities by their code
        const sortedCities = citiesData.sort((a, b) => {
          const codeA = a.code || a.wilayaCode || 0;
          const codeB = b.code || b.wilayaCode || 0;
          return codeA - codeB;
        });
        
        console.log('Cities sorted by code, count:', sortedCities.length);
        setCities(sortedCities);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching cities:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };
    
    fetchCities();
  }, []);
  
  const handleCityChange = (e) => {
    const cityId = e.target.value;
    setSelectedCity(cityId);
    
    if (!cityId) return; // Handle empty selection
    
    // Find the selected city data
    const city = cities.find(c => c._id === cityId || c.id === cityId);
    if (city && city.location && city.location.coordinates) {
      console.log('Selected city:', city.name, city.location.coordinates);
      onLocationChange({
        lat: city.location.coordinates[1], // Latitude is second in GeoJSON
        lng: city.location.coordinates[0]  // Longitude is first in GeoJSON
      });
    } else if (city && city.latitude && city.longitude) {
      // Alternative data format
      console.log('Selected city (alt format):', city.name, city.latitude, city.longitude);
      onLocationChange({
        lat: parseFloat(city.latitude),
        lng: parseFloat(city.longitude)
      });
    } else {
      console.warn('Selected city has no valid coordinates:', city);
    }
  };
  
  if (error) {
    return (
      <div className="city-selector-error">
        Failed to load cities: {error}
      </div>
    );
  }
  
  return (
    <div className={`city-selector ${isDarkMode ? 'dark-theme' : ''}`}>
      <select 
        value={selectedCity} 
        onChange={handleCityChange} 
        disabled={isLoading}
        className={isDarkMode ? 'dark-mode' : 'light-mode'}
      >
        <option value="" disabled>-- Select a City --</option>
        {cities.map(city => (
          <option 
            key={city._id || city.id} 
            value={city._id || city.id}
            className={isDarkMode ? 'dark-mode-option' : ''}
          >
            {city.code ? `${city.code} - ${city.name}` : city.name}
          </option>
        ))}
      </select>
      
      {isLoading && (
        <div className={`loading-indicator ${isDarkMode ? 'dark-mode' : ''}`}>
          Loading cities...
        </div>
      )}
    </div>
  );
};

export default CitySelector;
