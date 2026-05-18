import api from './axios'

export interface CreateComplaintData {
  customerName: string
  phone: string
  address: string
  block: string
  vcRId?: string
  complaintType: string
  description: string
  paymentStatus?: string
  callReceivedBy?: string
}

export interface UpdateComplaintData {
  technicianFeedback?: string
  callCenterFeedback?: string
  supervisorFeedback?: string
  usedMaterial?: string
  remarks?: string
}

export const complaintsApi = {
  getAll: async (filters?: Record<string, any>) => {
    const response = await api.get('/complaints', { params: filters })
    return response.data
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/complaints/${id}`)
    return response.data
  },
  
  create: async (data: CreateComplaintData) => {
    const response = await api.post('/complaints', data)
    return response.data
  },
  
  uploadVoiceRecording: async (complaintId: string, audioBlob: Blob, duration: number) => {
    const formData = new FormData()
    // Ensure the file has proper .webm extension and correct MIME type
    const file = new File([audioBlob], `recording-${Date.now()}.webm`, {
      type: 'audio/webm'
    })
    formData.append('voiceRecording', file)
    formData.append('duration', duration.toString())

    const response = await api.post(`/complaints/${complaintId}/upload-voice`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },
  
  acknowledge: async (id: string) => {
    const response = await api.patch(`/complaints/${id}/acknowledge`)
    return response.data
  },
  
  close: async (id: string, data: UpdateComplaintData) => {
    const response = await api.patch(`/complaints/${id}/close`, data)
    return response.data
  },
  
  reassign: async (id: string, technicianId: string) => {
    const response = await api.patch(`/complaints/${id}/reassign`, { technicianId })
    return response.data
  },
}

