import React, { useState, useEffect, useRef } from 'react';
import '../styles/CitySelect.css';

const CitySelector = ({ onLocationChange, isDarkMode, includeAllCities = false }) => {
  // Set the default value to 'all' instead of an empty string
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modified useEffect to prevent auto-triggering API calls when not needed
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
        
        // Sort cities by their code after fetching
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
  
  // Remove the effect that previously triggered the All Cities selection automatically
  // Instead, we'll manually trigger it only once on first render
  const initialSelectionMade = useRef(false);
  useEffect(() => {
    // Only trigger once when component mounts and cities are loaded
    if (!isLoading && cities.length > 0 && !initialSelectionMade.current) {
      initialSelectionMade.current = true;
      
      // Only if this is the first time and All Cities is selected
      if (selectedCity === 'all') {
        // Delayed execution to prevent race conditions with parent components
        setTimeout(() => {
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
      }
    }
  }, [isLoading, cities, selectedCity, onLocationChange]);
  
  const handleCityChange = (e) => {
    const cityId = e.target.value;
    setSelectedCity(cityId);
    
    if (cityId === "all") {
      // Handle "All Cities" option without changing coordinates
      console.log('Selected: All Cities - keeping current map view');
      onLocationChange(null, "All Cities", null);
      return;
    }
    
    if (!cityId) return; // Handle empty selection
    
    // Find the selected city data
    const city = cities.find(c => c._id === cityId || c.id === cityId);
    if (city && city.location && city.location.coordinates) {
      console.log('Selected city:', city.name, city.location.coordinates);
      onLocationChange({
        lat: city.location.coordinates[1], // Latitude is second in GeoJSON
        lng: city.location.coordinates[0]  // Longitude is first in GeoJSON
      }, city.name, cityId);
    } else if (city && city.latitude && city.longitude) {
      // Alternative data format
      console.log('Selected city (alt format):', city.name, city.latitude, city.longitude);
      onLocationChange({
        lat: parseFloat(city.latitude),
        lng: parseFloat(city.longitude)
      }, city.name, cityId);
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
    <div className="city-selector">
      <select 
        value={selectedCity} 
        onChange={handleCityChange} 
        disabled={isLoading}
        className={isDarkMode ? 'dark-mode' : 'light-mode'}
        aria-label="Select a city"
      >
        {/* Always include All Cities and make it the first option */}
        <option value="all">All Cities</option>
        
        {cities.map(city => (
          <option key={city._id || city.id} value={city._id || city.id}>
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
