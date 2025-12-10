import apiClient from './api'
import { Student, StudentFormData } from '@/types'
import { fetchWithRetry, logError, withTimeout } from '@/utils/errorHandling'
import { validators, sanitizers, VALIDATION_CONSTANTS } from '@/utils/validation-rules'
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
      // Request with a high limit to avoid server-side default pagination
      const response = await withTimeout(
        fetchWithRetry(() => apiClient.get<Student[]>('/students', { params: { limit: 1000 } })),
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

    // Validate required fields using comprehensive validators
    const studentNumberValidation = validators.studentNumber(data.studentNumber)
    if (!studentNumberValidation.isValid) {
      throw new Error(studentNumberValidation.error)
    }

    const firstNameValidation = validators.personName(data.firstName, 'First name')
    if (!firstNameValidation.isValid) {
      throw new Error(firstNameValidation.error)
    }

    const lastNameValidation = validators.personName(data.lastName, 'Last name')
    if (!lastNameValidation.isValid) {
      throw new Error(lastNameValidation.error)
    }

    const emailValidation = validators.email(data.email)
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.error)
    }

    // Validate optional fields
    if (data.section) {
      const sectionValidation = validators.section(data.section)
      if (!sectionValidation.isValid) {
        throw new Error(sectionValidation.error)
      }
    }

    if (data.birthdate) {
      const birthdateValidation = validators.birthdate(data.birthdate)
      if (!birthdateValidation.isValid) {
        throw new Error(birthdateValidation.error)
      }
    }

    if (data.contact) {
      const contactValidation = validators.contact(data.contact)
      if (!contactValidation.isValid) {
        throw new Error(contactValidation.error)
      }
    }

    if (data.guardianName) {
      const guardianNameValidation = validators.personName(data.guardianName, 'Guardian name')
      if (!guardianNameValidation.isValid) {
        throw new Error(guardianNameValidation.error)
      }
    }

    if (data.guardianEmail) {
      const guardianEmailValidation = validators.email(data.guardianEmail)
      if (!guardianEmailValidation.isValid) {
        throw new Error('Guardian ' + guardianEmailValidation.error)
      }
    }

    if (data.guardianContact) {
      const guardianContactValidation = validators.contact(data.guardianContact)
      if (!guardianContactValidation.isValid) {
        throw new Error('Guardian ' + guardianContactValidation.error)
      }
    }

    if (data.nfcId) {
      const nfcValidation = validators.nfcId(data.nfcId)
      if (!nfcValidation.isValid) {
        throw new Error(nfcValidation.error)
      }
    }

    // Sanitize data
    const sanitizedData: StudentFormData = {
      studentNumber: sanitizers.trim(data.studentNumber),
      firstName: sanitizers.input(data.firstName),
      lastName: sanitizers.input(data.lastName),
      email: sanitizers.email(data.email),
      birthdate: data.birthdate ? sanitizers.trim(data.birthdate) : undefined,
      contact: data.contact ? sanitizers.phone(data.contact) : undefined,
      status: data.status || 'active',
      section: data.section ? sanitizers.input(data.section) : undefined,
      guardianName: data.guardianName ? sanitizers.input(data.guardianName) : undefined,
      guardianEmail: data.guardianEmail ? sanitizers.email(data.guardianEmail) : undefined,
      guardianContact: data.guardianContact ? sanitizers.phone(data.guardianContact) : undefined,
      nfcId: data.nfcId ? sanitizers.trim(data.nfcId).toUpperCase() : undefined,
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

    // Validate provided fields using comprehensive validators
    if (data.studentNumber) {
      const validation = validators.studentNumber(data.studentNumber)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }
    }

    if (data.firstName) {
      const validation = validators.personName(data.firstName, 'First name')
      if (!validation.isValid) {
        throw new Error(validation.error)
      }
    }

    if (data.lastName) {
      const validation = validators.personName(data.lastName, 'Last name')
      if (!validation.isValid) {
        throw new Error(validation.error)
      }
    }

    if (data.email) {
      const validation = validators.email(data.email)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }
    }

    if (data.section) {
      const validation = validators.section(data.section)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }
    }

    if (data.birthdate) {
      const validation = validators.birthdate(data.birthdate)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }
    }

    if (data.contact) {
      const validation = validators.contact(data.contact)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }
    }

    if (data.guardianName) {
      const validation = validators.personName(data.guardianName, 'Guardian name')
      if (!validation.isValid) {
        throw new Error(validation.error)
      }
    }

    if (data.guardianEmail) {
      const validation = validators.email(data.guardianEmail)
      if (!validation.isValid) {
        throw new Error('Guardian ' + validation.error)
      }
    }

    if (data.guardianContact) {
      const validation = validators.contact(data.guardianContact)
      if (!validation.isValid) {
        throw new Error('Guardian ' + validation.error)
      }
    }

    if (data.nfcId) {
      const validation = validators.nfcId(data.nfcId)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }
    }

    // Sanitize data
    const sanitizedData: Partial<StudentFormData> = {}
    if (data.studentNumber) sanitizedData.studentNumber = sanitizers.trim(data.studentNumber)
    if (data.firstName) sanitizedData.firstName = sanitizers.input(data.firstName)
    if (data.lastName) sanitizedData.lastName = sanitizers.input(data.lastName)
    if (data.email) sanitizedData.email = sanitizers.email(data.email)
    if (data.birthdate) sanitizedData.birthdate = sanitizers.trim(data.birthdate)
    if (data.contact) sanitizedData.contact = sanitizers.phone(data.contact)
    if (data.status) sanitizedData.status = data.status
    if (data.section) sanitizedData.section = sanitizers.input(data.section)
    if (data.guardianName) sanitizedData.guardianName = sanitizers.input(data.guardianName)
    if (data.guardianEmail) sanitizedData.guardianEmail = sanitizers.email(data.guardianEmail)
    if (data.guardianContact) sanitizedData.guardianContact = sanitizers.phone(data.guardianContact)
    if (data.nfcId) sanitizedData.nfcId = sanitizers.trim(data.nfcId).toUpperCase()

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

    // Validate and sanitize search query using comprehensive validators
    const searchValidation = validators.searchTerm(query)
    if (!searchValidation.isValid && query.trim().length > 0) {
      throw new Error(searchValidation.error)
    }

    const sanitizedQuery = sanitizers.search(query)

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

  /**
   * Get student's enrollments
   * @param studentId - Student ID
   * @returns Array of enrollments with subject details
   */
  async getEnrollments(studentId: number): Promise<
    {
      id: string
      subjectId: string
      enrolledAt: string
      subject?: {
        id: string
        subjectCode: string
        subjectName: string
        section: string
      }
    }[]
  > {
    try {
      const response = await withTimeout(
        fetchWithRetry(() => apiClient.get(`/students/${studentId}/enrollments`)),
        10000,
        'Failed to load enrollments'
      )
      return response.data
    } catch (error) {
      logError('StudentService', 'getEnrollments', error)
      throw error
    }
  },

  /**
   * Get student's attendance summary
   * @param studentId - Student ID
   * @returns Attendance summary with overall stats and per-subject breakdown
   */
  async getAttendanceSummary(studentId: number): Promise<{
    totalDays: number
    present: number
    absent: number
    late: number
    excused: number
    attendanceRate: number
    bySubject: Array<{
      subjectId: string
      subjectCode: string
      subjectName: string
      present: number
      absent: number
      late?: number
      excused?: number
      attendanceRate: number
    }>
  }> {
    try {
      const response = await withTimeout(
        fetchWithRetry(() => apiClient.get(`/students/${studentId}/attendance/summary`)),
        10000,
        'Failed to load attendance summary'
      )
      return response.data
    } catch (error) {
      logError('StudentService', 'getAttendanceSummary', error)
      throw error
    }
  },
}
