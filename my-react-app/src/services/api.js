import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

export const userService = {
  getProfile: async () => {
    const response = await api.get('/api/user/profile');
    return response;
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

export const donationRequestService = {
  createDonationRequest: async (requestData) => {
    try {
      const response = await api.post('/api/donation-request', requestData);
      return response;
    } catch (error) {
      console.error('Error creating donation request:', error);
      throw error;
    }
  },
  
  createGuestDonationRequest: async (guestRequestData) => {
    try {
      const response = await api.post('/api/donation-request/guest', guestRequestData);
      return response;
    } catch (error) {
      console.error('Error creating guest donation request:', error);
      throw error;
    }
  },
  
  getDonationRequests: async (filters) => {
    try {
      const response = await api.get('/api/donation-request', { params: filters });
      return response;
    } catch (error) {
      console.error('Error fetching donation requests:', error);
      throw error;
    }
  },
  
  getUserDonationRequests: async (filters = {}) => {
    try {
      const response = await api.get('/api/donation-request/user', { params: filters });
      return response;
    } catch (error) {
      console.error('Error fetching user donation requests:', error);
      throw error;
    }
  },

  getUserDonorRequests: async (filters = {}) => {
    try {
      const response = await api.get('/api/donation-request/donor', { params: filters });
      return response;
    } catch (error) {
      console.error('Error fetching user donor requests:', error);
      throw error;
    }
  },

  getAllUserRequests: async (filters = {}) => {
    try {
      const response = await api.get('/api/donation-request/all-user', { params: filters });
      return response;
    } catch (error) {
      console.error('Error fetching all user requests:', error);
      throw error;
    }
  },
  
  getDonationRequestById: async (requestId) => {
    try {
      const response = await api.get(`/api/donation-request/${requestId}`);
      return response;
    } catch (error) {
      console.error(`Error fetching donation request ${requestId}:`, error);
      throw error;
    }
  },
  
  cancelDonationRequest: async (requestId) => {
    return api.put(`/api/donation-request/${requestId}/cancel`);
  },
  
  completeDonationRequest: async (requestId) => {
    return api.put(`/api/donation-request/${requestId}/complete`);
  },
  
  fulfillDonationRequest: async (requestId) => {
    return api.put(`/api/donation-request/${requestId}/fulfill`);
  },
  
  updateDonationRequest: async (requestId, updateData) => {
    return api.put(`/api/donation-request/update/${requestId}`, updateData);
  },
  
  deleteDonationRequest: async (requestId) => {
    return api.delete(`/api/donation-request/${requestId}`);
  },
  
  updateDonationRequestStatus: async (requestId, newStatus) => {
    if (newStatus === 'Fulfilled') {
      return donationRequestService.fulfillDonationRequest(requestId);
    } else if (newStatus === 'Completed') {
      return donationRequestService.completeDonationRequest(requestId); 
    } else if (newStatus === 'Cancelled') {
      return donationRequestService.cancelDonationRequest(requestId);
    } else {
      throw new Error(`Unsupported status change: ${newStatus}`);
    }
  }
};

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

export const wilayaService = {
  getAllWilayas: async () => {
    return api.get('/api/wilaya/all');
  },
  
  getWilayaByCode: async (code) => {
    return api.get(`/api/wilaya/code/${code}`);
  },
  
  getWilayaById: async (id) => {
    return api.get(`/api/wilaya/${id}`);
  },
  
  getBloodCenters: async () => {
    return api.get('/api/wilaya/blood-centers/all');
  },
  
  getBloodCentersByWilaya: async (code) => {
    return api.get(`/api/wilaya/${code}/blood-centers`);
  }
};

export default api;
