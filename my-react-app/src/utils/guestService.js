import axios from 'axios';
import { API_BASE_URL } from '../config.js';

const guestService = {
  // Register a guest with phone number and location
  registerGuest: async (phoneNumber, location, cityId = null) => {
    try {
      // Validate inputs
      if (!phoneNumber) {
        throw new Error('Phone number is required');
      }
      
      if (!location || !location.coordinates) {
        // Create a default location if none provided
        location = {
          type: 'Point',
          coordinates: [0, 0]
        };
      }
      
      const response = await axios.post(`${API_BASE_URL}/api/guest/register`, {
        phoneNumber,
        location,
        cityId, // Include cityId if available
        timestamp: new Date().toISOString() // Include client timestamp
      });
      
      // Store timestamp locally
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
        // 409 Conflict - Phone number already exists, treat as success
        return {
          success: true,
          message: 'Guest already registered',
          createdAt: localStorage.getItem('guestRegistrationTime') || new Date().toISOString()
        };
      }
      throw error;
    }
  },

  // Get guest by phone number
  getGuestByPhone: async (phoneNumber) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/guest/phone/${phoneNumber}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching guest:', error);
      throw error;
    }
  },
  
  // Get guest registration time from local storage
  getLastRegistrationTime: () => {
    try {
      return localStorage.getItem('guestRegistrationTime');
    } catch (err) {
      return null;
    }
  },
  
  // Check if a guest is already registered
  isGuestRegistered: () => {
    return !!localStorage.getItem('guestRegistrationTime') && 
           !!localStorage.getItem('guestPhoneNumber');
  }
};

export default guestService;
