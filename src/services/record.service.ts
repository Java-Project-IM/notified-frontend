import apiClient from './api'
import { Record, DashboardStats } from '@/types'

export const recordService = {
  async getAll(): Promise<Record[]> {
    const response = await apiClient.get<Record[]>('/records')
    return response.data
  },

  async getToday(): Promise<Record[]> {
    const response = await apiClient.get<Record[]>('/records/today')
    return response.data
  },

  async getStats(): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>('/records/stats')
    return response.data
  },

  async getById(id: number): Promise<Record> {
    const response = await apiClient.get<Record>(`/records/${id}`)
    return response.data
  },

  async getByStudent(studentId: number): Promise<Record[]> {
    const response = await apiClient.get<Record[]>(`/records/student/${studentId}`)
    return response.data
  },

  async getBySubject(subjectId: number): Promise<Record[]> {
    const response = await apiClient.get<Record[]>(`/records/subject/${subjectId}`)
    return response.data
  },

  async getByType(type: string): Promise<Record[]> {
    const response = await apiClient.get<Record[]>(`/records/type/${type}`)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/records/${id}`)
  },
}
