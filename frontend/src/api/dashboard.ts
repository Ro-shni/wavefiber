import api from './axios'

export const dashboardApi = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats')
    return response.data
  },
  
  getTechnicianStats: async (id: string) => {
    const response = await api.get(`/dashboard/technician/${id}`)
    return response.data
  },
}

