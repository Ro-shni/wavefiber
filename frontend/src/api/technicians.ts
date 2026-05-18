import api from './axios'

export const techniciansApi = {
  getAll: async (filters?: Record<string, any>) => {
    const response = await api.get('/technicians', { params: filters })
    return response.data
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/technicians/${id}`)
    return response.data
  },
  
  updateLeave: async (id: string, data: { onLeave: boolean; leaveStartDate?: string; leaveEndDate?: string }) => {
    const response = await api.patch(`/technicians/${id}/leave`, data)
    return response.data
  },
  
  updateAvailability: async (id: string, isAvailable: boolean) => {
    const response = await api.patch(`/technicians/${id}/availability`, { isAvailable })
    return response.data
  },
}

