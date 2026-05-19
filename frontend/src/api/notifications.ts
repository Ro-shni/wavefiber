import api from './axios';

export interface Notification {
  _id: string;
  recipient: string;
  title: string;
  message: string;
  type: 'COMPLAINT_UPDATE' | 'NEW_MESSAGE' | 'LEAVE_REQUEST' | 'SYSTEM';
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationApi = {
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  }
};
