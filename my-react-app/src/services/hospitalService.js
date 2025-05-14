import axios from 'axios';
import { API_BASE_URL } from '../config';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

// Hospital service with all necessary endpoints
const hospitalService = {
  // Get all hospitals with pagination and search
  getAllHospitals: async (page = 1, limit = 10, searchQuery = '', sort = 'name', order = 'asc') => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (sort) {
        params.append('sort', sort);
      }
      
      if (order) {
        params.append('order', order);
      }
      
      // Use the correct API endpoint for hospitals
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/hospital?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      return response;
    } catch (error) {
      console.error('Error in getAllHospitals service:', error);
      throw error;
    }
  },

  // Get hospital by ID
  getHospitalById: async (hospitalId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/hospital/${hospitalId}`,
        getAuthHeaders()
      );
      return response;
    } catch (error) {
      console.error(`Error fetching hospital ${hospitalId}:`, error);
      throw error;
    }
  },

  // Create a new hospital
  createHospital: async (hospitalData) => {
    try {
      // Ensure the location data is properly formatted
      const formattedData = formatHospitalData(hospitalData);
      
      // Log what's being sent to API for debugging
      console.log('Creating hospital with data:', formattedData);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/hospital`, 
        formattedData,
        getAuthHeaders()
      );
      return response;
    } catch (error) {
      console.error('Error creating hospital:', error);
      throw error;
    }
  },

  // Update hospital
  updateHospital: async (hospitalId, hospitalData) => {
    try {
      // Ensure the location data is properly formatted
      const formattedData = formatHospitalData(hospitalData);
      
      // Log what's being sent to API for debugging
      console.log('Updating hospital with data:', formattedData);
      
      const response = await axios.put(
        `${API_BASE_URL}/api/hospital/${hospitalId}`,
        formattedData,
        getAuthHeaders()
      );
      return response;
    } catch (error) {
      console.error(`Error updating hospital ${hospitalId}:`, error);
      throw error;
    }
  },

  // Delete hospital
  deleteHospital: async (hospitalId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/hospital/${hospitalId}`,
        getAuthHeaders()
      );
      return response;
    } catch (error) {
      console.error(`Error deleting hospital ${hospitalId}:`, error);
      throw error;
    }
  },

  // Export hospital data
  exportHospitalData: async (format = 'csv') => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/hospital/export?format=${format}`,
        {
          ...getAuthHeaders(),
          responseType: 'blob'
        }
      );
      return response;
    } catch (error) {
      console.error('Error exporting hospital data:', error);
      throw error;
    }
  }
};

// Helper function to properly format hospital data for API requests
function formatHospitalData(hospitalData) {
  const formattedData = { ...hospitalData };
  
  // Handle latitude and longitude if they exist as separate fields
  if (hospitalData.latitude !== undefined && hospitalData.longitude !== undefined) {
    // Ensure they are numeric values
    const lat = parseFloat(hospitalData.latitude);
    const lng = parseFloat(hospitalData.longitude);
    
    // Only set the location if we have valid numbers
    if (!isNaN(lat) && !isNaN(lng)) {
      formattedData.location = {
        type: 'Point',
        coordinates: [lng, lat] // API expects [longitude, latitude] format (GeoJSON)
      };
    }
    
    // Remove the individual lat/lng fields
    delete formattedData.latitude;
    delete formattedData.longitude;
  } 
  // Already has GeoJSON format but coordinates might be strings
  else if (hospitalData.location && hospitalData.location.coordinates) {
    // Ensure coordinates are numbers, not strings
    if (Array.isArray(hospitalData.location.coordinates)) {
      formattedData.location = {
        type: 'Point',
        coordinates: hospitalData.location.coordinates.map(coord => 
          typeof coord === 'string' ? parseFloat(coord) : coord
        )
      };
    }
  }
  
  return formattedData;
}

export default hospitalService;
