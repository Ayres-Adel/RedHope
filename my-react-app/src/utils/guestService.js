import axios from 'axios';
import { API_BASE_URL } from '../config.js';

const guestService = {
  registerGuest: async (phoneNumber, location, cityId = null) => {
    try {
      if (!phoneNumber) {
        throw new Error('Phone number is required');
      }
      
      if (!location || !location.coordinates) {
        location = {
          type: 'Point',
          coordinates: [0, 0]
        };
      }
      
      const response = await axios.post(`${API_BASE_URL}/api/guest/register`, {
        phoneNumber,
        location,
        cityId,
        timestamp: new Date().toISOString()
      });
      
      try {
        localStorage.setItem('guestRegistrationTime', response.data.createdAt || new Date().toISOString());
        localStorage.setItem('guestPhoneNumber', phoneNumber);
      } catch (err) {
        console.warn('Could not store guest registration time locally', err);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error registering guest:', error);
      if (error.response && error.response.status === 409) {
        return {
          success: true,
          message: 'Guest already registered',
          createdAt: localStorage.getItem('guestRegistrationTime') || new Date().toISOString()
        };
      }
      throw error;
    }
  },

  getGuestByPhone: async (phoneNumber) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/guest/phone/${phoneNumber}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching guest:', error);
      throw error;
    }
  },
  
  getLastRegistrationTime: () => {
    try {
      return localStorage.getItem('guestRegistrationTime');
    } catch (err) {
      return null;
    }
  },
  
  isGuestRegistered: () => {
    return !!localStorage.getItem('guestRegistrationTime') && 
           !!localStorage.getItem('guestPhoneNumber');
  }
};

export default guestService;
