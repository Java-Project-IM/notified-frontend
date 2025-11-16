import apiClient from './api'
import { Student, StudentFormData } from '@/types'
import { fetchWithRetry, logError, withTimeout } from '@/utils/errorHandling'
import {
  validateEmail,
  validateName,
  validateStudentNumber,
  validateSection,
  sanitizeString,
  sanitizeEmail,
} from '@/utils/validation'

/**
 * Student service for managing student data
 */
export const studentService = {
  /**
   * Get all students
   * @returns Array of all students
   * @throws {Error} When API request fails
   */
  async getAll(): Promise<Student[]> {
    try {
      const response = await withTimeout(
        fetchWithRetry(() => apiClient.get<Student[]>('/students')),
        15000,
        'Failed to load students - Request timeout'
      )
      return response.data
    } catch (error) {
      logError('StudentService', 'getAll', error)
      throw error
    }
  },

  /**
   * Get student by ID
   * @param id - Student ID
   * @returns Student data
   * @throws {Error} When API request fails
   */
  async getById(id: number): Promise<Student> {
    try {
      const response = await withTimeout(
        fetchWithRetry(() => apiClient.get<Student>(`/students/${id}`)),
        10000,
        'Failed to load student - Request timeout'
      )
      return response.data
    } catch (error) {
      logError('StudentService', 'getById', error)
      throw error
    }
  },

  /**
   * Get student by student number
   * @param studentNumber - Student number (format: YY-NNNN)
   * @returns Student data
   * @throws {Error} When API request fails
   */
  async getByStudentNumber(studentNumber: string): Promise<Student> {
    // fetching student by student number

    // Validate student number format
    const validation = validateStudentNumber(studentNumber)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    try {
      const response = await withTimeout(
        fetchWithRetry(() => apiClient.get<Student>(`/students/number/${studentNumber}`)),
        10000,
        'Failed to load student - Request timeout'
      )
      return response.data
    } catch (error) {
      logError('StudentService', 'getByStudentNumber', error)
      throw error
    }
  },

  /**
   * Generate a new unique student number
   * @returns Generated student number
   * @throws {Error} When API request fails
   */
  async generateStudentNumber(): Promise<{ studentNumber: string }> {
    // generating student number
    try {
      const response = await withTimeout(
        fetchWithRetry(() =>
          apiClient.get<{ studentNumber: string }>('/students/generate/student-number')
        ),
        10000,
        'Failed to generate student number - Request timeout'
      )
      return response.data
    } catch (error) {
      logError('StudentService', 'generateStudentNumber', error)
      throw error
    }
  },

  /**
   * Create a new student
   * @param data - Student form data
   * @returns Created student data
   * @throws {Error} When validation fails or API request fails
   */
  async create(data: StudentFormData): Promise<Student> {
    // creating student

    // Validate required fields
    const studentNumberValidation = validateStudentNumber(data.studentNumber)
    if (!studentNumberValidation.isValid) {
      throw new Error(studentNumberValidation.error)
    }

    const firstNameValidation = validateName(data.firstName, 'First name')
    if (!firstNameValidation.isValid) {
      throw new Error(firstNameValidation.error)
    }

    const lastNameValidation = validateName(data.lastName, 'Last name')
    if (!lastNameValidation.isValid) {
      throw new Error(lastNameValidation.error)
    }

    const emailValidation = validateEmail(data.email)
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.error)
    }

    // Validate optional fields
    if (data.section) {
      const sectionValidation = validateSection(data.section)
      if (!sectionValidation.isValid) {
        throw new Error(sectionValidation.error)
      }
    }

    if (data.guardianName) {
      const guardianNameValidation = validateName(data.guardianName, 'Guardian name')
      if (!guardianNameValidation.isValid) {
        throw new Error(guardianNameValidation.error)
      }
    }

    if (data.guardianEmail) {
      const guardianEmailValidation = validateEmail(data.guardianEmail)
      if (!guardianEmailValidation.isValid) {
        throw new Error('Guardian ' + guardianEmailValidation.error)
      }
    }

    // Sanitize data
    const sanitizedData: StudentFormData = {
      studentNumber: data.studentNumber.trim(),
      firstName: sanitizeString(data.firstName),
      lastName: sanitizeString(data.lastName),
      email: sanitizeEmail(data.email),
      section: data.section ? sanitizeString(data.section) : undefined,
      guardianName: data.guardianName ? sanitizeString(data.guardianName) : undefined,
      guardianEmail: data.guardianEmail ? sanitizeEmail(data.guardianEmail) : undefined,
    }

    try {
      const response = await withTimeout(
        apiClient.post<Student>('/students', sanitizedData),
        15000,
        'Failed to create student - Request timeout'
      )
      return response.data
    } catch (error) {
      logError('StudentService', 'create', error)
      throw error
    }
  },

  /**
   * Update an existing student
   * @param id - Student ID
   * @param data - Partial student data to update
   * @returns Updated student data
   * @throws {Error} When validation fails or API request fails
   */
  async update(id: number, data: Partial<StudentFormData>): Promise<Student> {
    // updating student

    // Validate provided fields
    if (data.studentNumber) {
      const validation = validateStudentNumber(data.studentNumber)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }
    }

    if (data.firstName) {
      const validation = validateName(data.firstName, 'First name')
      if (!validation.isValid) {
        throw new Error(validation.error)
      }
    }

    if (data.lastName) {
      const validation = validateName(data.lastName, 'Last name')
      if (!validation.isValid) {
        throw new Error(validation.error)
      }
    }

    if (data.email) {
      const validation = validateEmail(data.email)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }
    }

    if (data.section) {
      const validation = validateSection(data.section)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }
    }

    if (data.guardianName) {
      const validation = validateName(data.guardianName, 'Guardian name')
      if (!validation.isValid) {
        throw new Error(validation.error)
      }
    }

    if (data.guardianEmail) {
      const validation = validateEmail(data.guardianEmail)
      if (!validation.isValid) {
        throw new Error('Guardian ' + validation.error)
      }
    }

    // Sanitize data
    const sanitizedData: Partial<StudentFormData> = {}
    if (data.studentNumber) sanitizedData.studentNumber = data.studentNumber.trim()
    if (data.firstName) sanitizedData.firstName = sanitizeString(data.firstName)
    if (data.lastName) sanitizedData.lastName = sanitizeString(data.lastName)
    if (data.email) sanitizedData.email = sanitizeEmail(data.email)
    if (data.section) sanitizedData.section = sanitizeString(data.section)
    if (data.guardianName) sanitizedData.guardianName = sanitizeString(data.guardianName)
    if (data.guardianEmail) sanitizedData.guardianEmail = sanitizeEmail(data.guardianEmail)

    try {
      const response = await withTimeout(
        apiClient.put<Student>(`/students/${id}`, sanitizedData),
        15000,
        'Failed to update student - Request timeout'
      )
      // Student updated: response.data.studentNumber
      return response.data
    } catch (error) {
      logError('StudentService', 'update', error)
      throw error
    }
  },

  /**
   * Delete a student
   * @param id - Student ID
   * @throws {Error} When API request fails
   */
  async delete(id: number): Promise<void> {
    // deleting student id
    try {
      const response = await withTimeout(
        apiClient.delete(`/students/${id}`),
        10000,
        'Failed to delete student - Request timeout'
      )
      // student deleted successfully
      return response.data
    } catch (error) {
      logError('StudentService', 'delete', error)
      throw error
    }
  },

  /**
   * Search students by query
   * @param query - Search query string
   * @returns Array of matching students
   * @throws {Error} When API request fails
   */
  async search(query: string): Promise<Student[]> {
    // searching students

    // Sanitize search query
    const sanitizedQuery = sanitizeString(query)

    if (sanitizedQuery.length === 0) {
      return []
    }

    try {
      const response = await withTimeout(
        fetchWithRetry(() =>
          apiClient.get<Student[]>('/students/search', {
            params: { q: sanitizedQuery },
          })
        ),
        10000,
        'Search request timeout'
      )
      // found students: response.data.length
      return response.data
    } catch (error) {
      logError('StudentService', 'search', error)
      throw error
    }
  },
}
