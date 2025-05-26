import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config';

export const useBloodStatistics = () => {
  const defaultBloodTypeStats = {
    "A+": { count: 0, color: "#ff4747" },
    "A-": { count: 0, color: "#ff6b6b" },
    "B+": { count: 0, color: "#2ecc71" },
    "B-": { count: 0, color: "#3dd685" },
    "AB+": { count: 0, color: "#3498db" },
    "AB-": { count: 0, color: "#4aa3df" },
    "O+": { count: 0, color: "#f39c12" },
    "O-": { count: 0, color: "#f5b041" },
  };
  
  const [bloodTypeStats, setBloodTypeStats] = useState(defaultBloodTypeStats);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [totalDonors, setTotalDonors] = useState(0);

  const fetchBloodTypeStats = useCallback(async (cityId = null) => {
    setLoadingStats(true);
    setStatsError(null);
    
    try {
      const endpoint = cityId 
        ? `${API_BASE_URL}/api/stats/blood-types?cityId=${cityId}` 
        : `${API_BASE_URL}/api/stats/blood-types`;
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch blood type statistics');
      }

      const newStats = { ...defaultBloodTypeStats };
      let donorCount = 0;
      
      const statsData = data.data || data;
      
      if (statsData.bloodTypes) {
        Object.entries(statsData.bloodTypes).forEach(([type, count]) => {
          if (newStats[type]) {
            newStats[type] = { ...newStats[type], count: count };
            donorCount += count;
          }
        });
      } else {
        Object.entries(statsData).forEach(([type, count]) => {
          const normalizedType = type.replace('_PLUS', '+').replace('_MINUS', '-');
          if (newStats[normalizedType]) {
            newStats[normalizedType] = { 
              ...newStats[normalizedType], 
              count: typeof count === 'number' ? count : parseInt(count, 10) || 0 
            };
            donorCount += newStats[normalizedType].count;
          }
        });
      }
      
      setBloodTypeStats(newStats);
      setTotalDonors(donorCount);
      
    } catch (error) {
      console.error("Error fetching blood type statistics:", error);
      setStatsError(error.message);
      setBloodTypeStats(defaultBloodTypeStats);
      setTotalDonors(0);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchBloodTypeStats();
  }, [fetchBloodTypeStats]);

  return { bloodTypeStats, totalDonors, loadingStats, statsError, fetchBloodTypeStats };
};
