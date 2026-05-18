import api from './axios'

export const authApi = {
  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data)
    return response.data
  },
  googleAuth: async (data: { credential: string }) => {
    const response = await api.post('/auth/google', data)
    return response.data
  },
  updateProfile: async (data: any) => {
    const response = await api.patch('/profile', data)
    return response.data
  }
}
