import api from './axios'

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  phone?: string
  role?: 'customer' | 'technician' | 'manager' | 'staff'
  address?: string
  block?: string
  vcRId?: string
}

export interface GoogleAuthData {
  credential: string
}

export interface UpdateProfileData {
  name?: string
  phone?: string
  address?: string
  block?: string
  vcRId?: string
}

export const authApi = {
  login: async (data: LoginData) => {
    const response = await api.post('/auth/login', data)
    return response.data
  },
  
  googleAuth: async (data: GoogleAuthData) => {
    const response = await api.post('/auth/google', data)
    return response.data
  },
  
  register: async (data: RegisterData) => {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  updateProfile: async (data: UpdateProfileData) => {
    const response = await api.patch('/profile', data)
    return response.data
  },

  getProfile: async () => {
    const response = await api.get('/profile')
    return response.data
  }
}

