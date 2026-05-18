import api from './axios'

export interface ChatMessage {
  _id: string
  complaintId: string
  senderId: string
  senderName: string
  senderRole: 'customer' | 'technician' | 'staff' | 'manager'
  content: string
  messageType: 'text' | 'voice'
  voiceUrl?: string
  voiceDuration?: number
  readBy: string[]
  createdAt: string
}

export interface Conversation {
  complaintId: string
  customerName: string
  technicianName: string
  complaintType: string
  status: string
  block: string
  unreadCount: number
  lastMessage?: { content: string; messageType: string; senderName: string; createdAt: string }
}

export const chatApi = {
  getConversations: async () => {
    const response = await api.get('/chat/conversations')
    return response.data
  },
  getMessages: async (complaintId: string) => {
    const response = await api.get(`/chat/${complaintId}/messages`)
    return response.data
  },
  sendMessage: async (complaintId: string, content: string) => {
    const response = await api.post(`/chat/${complaintId}/messages`, { content })
    return response.data
  },
  sendVoiceMessage: async (complaintId: string, audioBlob: Blob, duration: number) => {
    const formData = new FormData()
    const file = new File([audioBlob], `voice-msg-${Date.now()}.webm`, { type: 'audio/webm' })
    formData.append('voiceRecording', file)
    formData.append('duration', duration.toString())
    const response = await api.post(`/chat/${complaintId}/voice-message`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }
}
