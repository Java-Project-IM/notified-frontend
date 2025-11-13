import apiClient from './api'
import { Subject, SubjectFormData } from '@/types'

export const subjectService = {
  async getAll(): Promise<Subject[]> {
    const response = await apiClient.get<Subject[]>('/subjects')
    return response.data
  },

  async getById(id: number): Promise<Subject> {
    const response = await apiClient.get<Subject>(`/subjects/${id}`)
    return response.data
  },

  async getByCode(code: string): Promise<Subject> {
    const response = await apiClient.get<Subject>(`/subjects/code/${code}`)
    return response.data
  },

  async getByYear(year: number): Promise<Subject[]> {
    const response = await apiClient.get<Subject[]>(`/subjects/year/${year}`)
    return response.data
  },

  async getEnrollments(id: number): Promise<unknown[]> {
    const response = await apiClient.get<unknown[]>(`/subjects/${id}/enrollments`)
    return response.data
  },

  async create(data: SubjectFormData): Promise<Subject> {
    const response = await apiClient.post<Subject>('/subjects', data)
    return response.data
  },

  async update(id: number, data: Partial<SubjectFormData>): Promise<Subject> {
    const response = await apiClient.put<Subject>(`/subjects/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/subjects/${id}`)
  },

  async search(query: string): Promise<Subject[]> {
    const response = await apiClient.get<Subject[]>('/subjects/search', {
      params: { q: query },
    })
    return response.data
  },
}
