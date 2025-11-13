import apiClient from './api'
import { User } from '@/types'

interface UserStats {
  total: number
  active: number
  inactive: number
  byRole: {
    superadmin: number
    admin: number
    staff: number
  }
}

export const userService = {
  async getAll(): Promise<User[]> {
    const response = await apiClient.get<User[]>('/users')
    return response.data
  },

  async getStats(): Promise<UserStats> {
    const response = await apiClient.get<UserStats>('/users/stats')
    return response.data
  },

  async getById(id: number): Promise<User> {
    const response = await apiClient.get<User>(`/users/${id}`)
    return response.data
  },

  async create(data: {
    name: string
    email: string
    password: string
    role: string
  }): Promise<User> {
    const response = await apiClient.post<User>('/users', data)
    return response.data
  },

  async update(id: number, data: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>(`/users/${id}`, data)
    return response.data
  },

  async toggleActive(id: number): Promise<User> {
    const response = await apiClient.put<User>(`/users/${id}/toggle`)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/users/${id}`)
  },

  async search(query: string): Promise<User[]> {
    const response = await apiClient.get<User[]>('/users/search', {
      params: { q: query },
    })
    return response.data
  },
}
