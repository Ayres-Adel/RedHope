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
  getAllAdmins: async (page = 1, limit = 10, search = '', sort = 'createdAt', order = 'desc') => {
    return api.get('/api/admin/accounts', {
      params: { 
        page, 
        limit, 
        search, 
        sortBy: sort, // Use sortBy
        sortOrder: order === 'desc' ? -1 : 1 // Use sortOrder with -1 or 1
      }
    });
  },

  getAdminById: async (adminId) => {
    return api.get(`/api/admin/accounts/${adminId}`);
  },

  createAdmin: async (adminData) => {
    console.log('adminService createAdmin called with:', adminData);
    // Make sure we're using the correct endpoint
    return api.post('/api/admin/accounts', adminData);
  },
  
  updateAdmin: async (adminId, adminData) => {
    return api.put(`/api/admin/accounts/${adminId}`, adminData);
  },

  deleteAdmin: async (adminId) => {
    return api.delete(`/api/admin/accounts/${adminId}`);
  },

  updateAdminPermissions: async (adminId, permissions) => {
    return api.patch(`/api/admin/accounts/${adminId}/permissions`, { permissions });
  }
  
  // Additional admin services can be added here
};

export default adminService;
