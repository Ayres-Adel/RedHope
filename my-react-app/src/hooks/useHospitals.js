import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export const useHospitals = () => {
  const [hospitals, setHospitals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/map/hospitals`);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch hospitals');
        }
        
        const hospitalsData = data.data?.locations || [];
        
        if (hospitalsData.length === 0) {
          console.warn('No hospitals found in the data');
        }
        
        setHospitals(hospitalsData);
      } catch (err) {
        console.error("Error fetching hospitals:", err);
        setError(`Failed to load hospitals: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHospitals();
  }, []);

  const fetchAllHospitals = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/map/hospitals`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch all hospitals');
      }
      
      return data.data?.locations || [];
    } catch (err) {
      console.error("Error fetching all hospitals:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { hospitals, isLoading, error, fetchAllHospitals };
};
