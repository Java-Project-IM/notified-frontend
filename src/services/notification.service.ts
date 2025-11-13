import apiClient from './api'

interface Notification {
  id: number
  userId: number
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  read: boolean
  createdAt: string
  updatedAt: string
}

interface NotificationFormData {
  userId?: number
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
}

interface NotificationStats {
  total: number
  unread: number
  read: number
  byType: {
    info: number
    warning: number
    success: number
    error: number
  }
}

export const notificationService = {
  async getAll(): Promise<Notification[]> {
    const response = await apiClient.get<Notification[]>('/notifications')
    return response.data
  },

  async getUnreadCount(): Promise<{ count: number }> {
    const response = await apiClient.get<{ count: number }>('/notifications/unread')
    return response.data
  },

  async getStats(): Promise<NotificationStats> {
    const response = await apiClient.get<NotificationStats>('/notifications/stats')
    return response.data
  },

  async getById(id: number): Promise<Notification> {
    const response = await apiClient.get<Notification>(`/notifications/${id}`)
    return response.data
  },

  async create(data: NotificationFormData): Promise<Notification> {
    const response = await apiClient.post<Notification>('/notifications', data)
    return response.data
  },

  async markAsRead(id: number): Promise<void> {
    await apiClient.put(`/notifications/${id}/read`)
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.put('/notifications/read-all')
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/notifications/${id}`)
  },

  async deleteAllRead(): Promise<void> {
    await apiClient.delete('/notifications/read')
  },
}
