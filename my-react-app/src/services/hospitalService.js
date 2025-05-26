import axios from 'axios';
import { API_BASE_URL } from '../config';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

const hospitalService = {
  getAllHospitals: async (page = 1, limit = 10, searchQuery = '', sort = 'name', order = 'asc') => {
    try {
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
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/hospital?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  getHospitalById: async (hospitalId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/hospital/${hospitalId}`,
        getAuthHeaders()
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  createHospital: async (hospitalData) => {
    try {
      const formattedData = formatHospitalData(hospitalData);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/hospital`, 
        formattedData,
        getAuthHeaders()
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  updateHospital: async (hospitalId, hospitalData) => {
    try {
      const formattedData = formatHospitalData(hospitalData);
      
      const response = await axios.put(
        `${API_BASE_URL}/api/hospital/${hospitalId}`,
        formattedData,
        getAuthHeaders()
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  deleteHospital: async (hospitalId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/hospital/${hospitalId}`,
        getAuthHeaders()
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

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
      throw error;
    }
  }
};

function formatHospitalData(hospitalData) {
  const formattedData = { ...hospitalData };
  
  if (hospitalData.latitude !== undefined && hospitalData.longitude !== undefined) {
    const lat = parseFloat(hospitalData.latitude);
    const lng = parseFloat(hospitalData.longitude);
    
    if (!isNaN(lat) && !isNaN(lng)) {
      formattedData.location = {
        type: 'Point',
        coordinates: [lng, lat]
      };
    }
    
    delete formattedData.latitude;
    delete formattedData.longitude;
  } 
  else if (hospitalData.location && hospitalData.location.coordinates) {
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
