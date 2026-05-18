import api from './axios'

export const complaintsApi = {
  getAll: async (filters?: Record<string, any>) => {
    const response = await api.get('/complaints', { params: filters })
    return response.data
  },
  getById: async (id: string) => {
    const response = await api.get(`/complaints/${id}`)
    return response.data
  },
  create: async (data: any) => {
    const response = await api.post('/complaints', data)
    return response.data
  },
  uploadVoiceRecording: async (complaintId: string, audioBlob: Blob, duration: number) => {
    const formData = new FormData()
    const file = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' })
    formData.append('voiceRecording', file)
    formData.append('duration', duration.toString())
    const response = await api.post(`/complaints/${complaintId}/upload-voice`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },
  acknowledge: async (id: string) => {
    const response = await api.patch(`/complaints/${id}/acknowledge`)
    return response.data
  },
  close: async (id: string, data: any) => {
    const response = await api.patch(`/complaints/${id}/close`, data)
    return response.data
  },
  verify: async (id: string, data: any) => {
    const response = await api.patch(`/complaints/${id}/verify`, data)
    return response.data
  }
}
