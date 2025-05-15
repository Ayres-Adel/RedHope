import axios from 'axios';
import { API_BASE_URL } from '../config';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication service
export const authService = {
  login: async (email, password) => {
    const response = await api.post('/login', { email, password });
    localStorage.setItem('token', response.data.token);
    return response.data;
  },
  
  signup: async (userData) => {
    const response = await api.post('/signup', userData);
    localStorage.setItem('token', response.data.token);
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

// User service
export const userService = {
  getProfile: async () => {
    return api.get('/api/user/profile');
  },
  
  changePassword: async (currentPassword, newPassword, confirmNewPassword) => {
    return api.put('/api/user/change-password', {
      currentPassword,
      newPassword,
      confirmNewPassword
    });
  },
  
  deleteAccount: async () => {
    return api.delete('/api/user/delete-account');
  }
};

// Hospital service
export const hospitalService = {
  getAllHospitals: async () => {
    return api.get('/api/hospitals');
  },
  
  getHospitalsByWilaya: async (wilaya) => {
    return api.get(`/api/hospitals/wilaya/${wilaya}`);
  },
  
  getNearbyHospitals: async (latitude, longitude, maxDistance) => {
    return api.get(`/api/hospitals/nearby`, {
      params: { latitude, longitude, maxDistance }
    });
  }
};

// Donation service
export const donationService = {
  createDonation: async (donationData) => {
    return api.post('/api/donations', donationData);
  },
  
  getUserDonations: async () => {
    return api.get('/api/donations/user');
  },
  
  getDonationById: async (donationId) => {
    return api.get(`/api/donations/${donationId}`);
  },
  
  updateDonationStatus: async (donationId, status) => {
    return api.patch(`/api/donations/${donationId}/status`, { status });
  }
};

// Donation Request service
export const donationRequestService = {
  createDonationRequest: async (requestData) => {
    // requestData should contain: bloodType, hospitalId (optional), expiryDate, donorId (optional)
    return api.post('/api/donation-request', requestData);
  },
  
  createGuestDonationRequest: async (guestRequestData) => {
    // guestRequestData should contain: phoneNumber OR guestId, bloodType, 
    // hospitalId (optional), expiryDate
    return api.post('/api/donation-request/guest', guestRequestData);
  },
  
  getDonationRequests: async (filters) => {
    return api.get('/api/donation-request', { params: filters });
  },
  
  getUserDonationRequests: async () => {
    return api.get('/api/donation-request/user');
  },
  
  getDonationRequestById: async (requestId) => {
    return api.get(`/api/donation-request/${requestId}`);
  },
  
  respondToDonationRequest: async (requestId, status) => {
    return api.post(`/api/donation-request/${requestId}/respond`, { status });
  },
  
  updateDonationRequestStatus: async (requestId, status) => {
    return api.patch(`/api/donation-request/${requestId}/status`, { status });
  }
};

// Notification service
export const notificationService = {
  getUserNotifications: async () => {
    return api.get('/api/notifications');
  },
  
  markAsRead: async (notificationIds) => {
    return api.post('/api/notifications/read', { notificationIds });
  },
  
  archiveNotifications: async (notificationIds) => {
    return api.post('/api/notifications/archive', { notificationIds });
  },
  
  getUnreadCount: async () => {
    return api.get('/api/notifications/unread-count');
  }
};

// Wilaya service
export const wilayaService = {
  getAllWilayas: async () => {
    return api.get('/api/wilayas');
  },
  
  getWilayaByCode: async (code) => {
    return api.get(`/api/wilayas/${code}`);
  },
  
  getBloodCenters: async () => {
    return api.get('/api/wilayas/blood-centers/all');
  },
  
  getBloodCentersByWilaya: async (code) => {
    return api.get(`/api/wilayas/${code}/blood-centers`);
  }
};

export default api;
