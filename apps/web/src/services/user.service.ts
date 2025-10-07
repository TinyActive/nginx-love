import api from './api';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  role: 'admin' | 'moderator' | 'viewer';
  status: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  phone?: string;
  timezone?: string;
  language?: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role?: 'admin' | 'moderator' | 'viewer';
  status?: 'active' | 'inactive';
  phone?: string;
  timezone?: string;
  language?: string;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  fullName?: string;
  role?: 'admin' | 'moderator' | 'viewer';
  status?: 'active' | 'inactive' | 'suspended';
  phone?: string;
  timezone?: string;
  language?: string;
  avatar?: string;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  byRole: {
    admin: number;
    moderator: number;
    viewer: number;
  };
  recentLogins: number;
}

const userService = {
  // Get all users
  async getAll(params?: { role?: string; status?: string; search?: string }): Promise<{ success: boolean; data: User[] }> {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Get single user
  async getById(id: string): Promise<{ success: boolean; data: User }> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Create new user
  async create(data: CreateUserData): Promise<{ success: boolean; data: User; message: string }> {
    const response = await api.post('/users', data);
    return response.data;
  },

  // Update user
  async update(id: string, data: UpdateUserData): Promise<{ success: boolean; data: User; message: string }> {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  // Delete user
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Toggle user status
  async updateStatus(id: string, status: 'active' | 'inactive' | 'suspended'): Promise<{ success: boolean; data: User; message: string }> {
    const response = await api.patch(`/users/${id}/status`, { status });
    return response.data;
  },

  // Reset user password
  async resetPassword(id: string): Promise<{ success: boolean; message: string; data?: any }> {
    const response = await api.post(`/users/${id}/reset-password`, {});
    return response.data;
  },

  // Get user statistics
  async getStats(): Promise<{ success: boolean; data: UserStats }> {
    const response = await api.get('/users/stats');
    return response.data;
  }
};

export default userService;
