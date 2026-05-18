import api from './axios'

export const dashboardApi = {
  getTechnicianStats: async (technicianId: string) => {
    const response = await api.get(`/dashboard/technician/${technicianId}`)
    return response.data
  }
}
