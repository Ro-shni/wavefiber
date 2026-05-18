import api from './axios'

export const settingsApi = {
  get: async () => {
    const response = await api.get('/settings')
    return response.data
  },
  
  toggleAutoAssign: async (enabled: boolean) => {
    const response = await api.patch('/settings/autoassign', { enabled })
    return response.data
  },
}

