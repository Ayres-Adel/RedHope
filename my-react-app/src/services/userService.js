import api from './api';

const userService = {
  getAllUsers: async (page = 1, limit = 10, search = '', sort = 'createdAt', order = 'desc') => {
    return api.get('/api/user/paginated', {
      params: {
        page, 
        limit,
        search,
        sortBy: sort,
        sortOrder: order === 'desc' ? -1 : 1
      }
    });
  },

  getUserById: async (userId) => {
    return api.get(`/api/user/${userId}`);
  },

  createUser: async (userData) => {
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
