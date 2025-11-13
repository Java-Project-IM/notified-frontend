import apiClient from './api'
import { Student, StudentFormData } from '@/types'

export const studentService = {
  async getAll(): Promise<Student[]> {
    const response = await apiClient.get<Student[]>('/students')
    return response.data
  },

  async getById(id: number): Promise<Student> {
    const response = await apiClient.get<Student>(`/students/${id}`)
    return response.data
  },

  async getByStudentNumber(studentNumber: string): Promise<Student> {
    const response = await apiClient.get<Student>(`/students/number/${studentNumber}`)
    return response.data
  },

  async generateStudentNumber(): Promise<{ studentNumber: string }> {
    const response = await apiClient.get<{ studentNumber: string }>(
      '/students/generate/student-number'
    )
    return response.data
  },

  async create(data: StudentFormData): Promise<Student> {
    const response = await apiClient.post<Student>('/students', data)
    return response.data
  },

  async update(id: number, data: Partial<StudentFormData>): Promise<Student> {
    const response = await apiClient.put<Student>(`/students/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/students/${id}`)
  },

  async search(query: string): Promise<Student[]> {
    const response = await apiClient.get<Student[]>('/students/search', {
      params: { q: query },
    })
    return response.data
  },
}
