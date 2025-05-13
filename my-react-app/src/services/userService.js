import api from './api';

const userService = {
  getAllUsers: async (page = 1, limit = 10, search = '', sort = 'createdAt', order = 'desc') => {
    console.log('Requesting users with params:', { page, limit, search, sort, order });
    
    // Remove any isDonor filtering to show all users
    return api.get('/api/user/paginated', {
      params: {
        page, 
        limit,
        search,
        sortBy: sort,
        sortOrder: order === 'desc' ? -1 : 1
      }
    }).catch(error => {
      console.error('Error fetching users:', error);
      
      // Fall back to all users endpoint if paginated fails
      if (error.response?.status === 404 || error.response?.status === 500) {
        console.log('Falling back to /api/user/all endpoint');
        return api.get('/api/user/all');
      }
      
      throw error;
    });
  },

  getUserById: async (userId) => {
    return api.get(`/api/user/${userId}`);
  },

  createUser: async (userData) => {
    console.log('userService createUser called with:', userData);
    // Make sure we're using the correct endpoint
    return api.post('/api/user/create', userData);
  },

  updateUser: async (userId, userData) => {
    return api.put(`/api/user/${userId}`, userData);
  },

  deleteUser: async (userId) => {
    return api.delete(`/api/user/${userId}`);
  },

  exportUserData: async (format = 'csv') => {
    return api.get('/api/user/export', {
      params: { format },
      responseType: 'blob'
    });
  }
};

export default userService;
