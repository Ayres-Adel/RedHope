import { useState, useCallback } from 'react';
import { saveCoordinates } from '../utils/LocationService';

export const useLocation = () => {
  const [locationStatus, setLocationStatus] = useState('idle');
  const [locationError, setLocationError] = useState(null);

  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      setLocationStatus('loading');
      setLocationError(null);
      
      if (!navigator.geolocation) {
        const error = 'Geolocation is not supported by your browser';
        setLocationError(error);
        setLocationStatus('error');
        reject(new Error(error));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          
          // Save coordinates using the LocationService
          saveCoordinates(location);
          
          setLocationStatus('success');
          resolve(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError(error.message);
          setLocationStatus('error');
          
          // Default to a fallback location (e.g., center of Algiers)
          const fallbackLocation = { latitude: 36.7538, longitude: 3.0588 };
          resolve(fallbackLocation);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }, []);
  
  return {
    getCurrentLocation,
    locationStatus,
    locationError
  };
};
