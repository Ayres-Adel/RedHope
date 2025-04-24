import api from './api';

export const adminService = {
  // Dashboard
  getDashboardStats: async () => {
    return api.get('/api/admin/dashboard');
  },
  
  // User management
  getAllUsers: async (page = 1, limit = 20, search = '', sort = 'createdAt', order = 'desc') => {
    return api.get('/api/admin/users', {
      params: { page, limit, search, sort, order }
    });
  },
  
  updateUser: async (userId, userData) => {
    return api.put(`/api/admin/users/${userId}`, userData);
  },
  
  exportUserData: async (format = 'csv') => {
    return api.get('/api/admin/export/users', {
      params: { format },
      responseType: 'blob' // Important for file downloads
    });
  },
  
  // Admin management
  createAdmin: async (adminData) => {
    return api.post('/api/admin/admins', adminData);
  },
  
  // Additional admin services can be added here
};

export default adminService;
