import api from './axios'

export interface CreateLeaveRequestData {
  startDateTime: string
  endDateTime: string
  reason: string
}

export const leaveRequestsApi = {
  getAll: async (status?: string) => {
    const response = await api.get('/leave-requests', { params: { status } })
    return response.data
  },
  
  create: async (data: CreateLeaveRequestData) => {
    const response = await api.post('/leave-requests', data)
    return response.data
  },
  
  approve: async (id: string) => {
    const response = await api.patch(`/leave-requests/${id}/approve`)
    return response.data
  },
  
  reject: async (id: string, rejectionReason?: string) => {
    const response = await api.patch(`/leave-requests/${id}/reject`, { rejectionReason })
    return response.data
  },
  
  cancel: async (id: string) => {
    const response = await api.delete(`/leave-requests/${id}`)
    return response.data
  },
}

