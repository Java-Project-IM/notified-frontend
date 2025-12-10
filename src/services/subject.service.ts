/**
 * Subject Service
 *
 * Handles subject-related API calls with comprehensive validation
 */

import apiClient from './api'
import { Subject, ApiResponse } from '@/types'
import { SubjectEnhanced, SubjectScheduleSlot, SubjectSchedule } from '@/types/subject.types'
import { sanitizeString } from '@/utils/validation'
import {
  validators,
  sanitizers,
  VALIDATION_RULES,
  validateSubjectForm,
} from '@/utils/validation-rules'

/**
 * Sanitize subject form data for API submission
 */
function sanitizeSubjectFormData(data: Partial<Subject>): Partial<Subject> {
  const sanitized: Partial<Subject> = {}

  if (data.name !== undefined) {
    sanitized.name = sanitizers.name(data.name)
  }
  if (data.code !== undefined) {
    sanitized.code = sanitizers.subjectCode(data.code)
  }
  if (data.description !== undefined) {
    sanitized.description = sanitizers.text(data.description || '')
  }
  if (data.instructor !== undefined) {
    sanitized.instructor = sanitizers.name(data.instructor || '')
  }
  if (data.room !== undefined) {
    sanitized.room = sanitizeString(data.room || '')
  }
  if (data.capacity !== undefined) {
    sanitized.capacity = data.capacity
  }
  if (data.schedule !== undefined) {
    sanitized.schedule = data.schedule
  }

  return sanitized
}

export const subjectService = {
  /**
   * Get all subjects
   */
  async getAll(): Promise<Subject[]> {
    const response = await apiClient.get<ApiResponse<Subject[]>>('/subjects')
    return response.data.data || response.data
  },

  /**
   * Get subject by ID
   */
  async getById(id: string | number): Promise<SubjectEnhanced> {
    // Validate ID
    const idStr = String(id)
    if (!idStr || idStr.trim().length === 0) {
      throw new Error('Subject ID is required')
    }

    const response = await apiClient.get<ApiResponse<SubjectEnhanced>>(`/subjects/${id}`)
    return response.data.data || response.data
  },

  /**
   * Create new subject with comprehensive validation
   */
  async create(data: Partial<Subject>): Promise<Subject> {
    // Validate required fields
    if (!data.name || !data.code) {
      throw new Error('Subject name and code are required')
    }

    // Validate subject name
    const nameValidation = validators.subjectName(data.name)
    if (!nameValidation.isValid) {
      throw new Error(nameValidation.error)
    }

    // Validate subject code
    const codeValidation = validators.subjectCode(data.code)
    if (!codeValidation.isValid) {
      throw new Error(codeValidation.error)
    }

    // Validate optional fields
    if (data.capacity !== undefined) {
      const capacityValidation = validators.capacity(data.capacity)
      if (!capacityValidation.isValid) {
        throw new Error(capacityValidation.error)
      }
    }

    if (data.description) {
      const descValidation = validators.description(data.description)
      if (!descValidation.isValid) {
        throw new Error(descValidation.error)
      }
    }

    if (data.instructor) {
      const instructorValidation = validators.instructorName(data.instructor)
      if (!instructorValidation.isValid) {
        throw new Error(instructorValidation.error)
      }
    }

    if (data.room) {
      const roomValidation = validators.roomNumber(data.room)
      if (!roomValidation.isValid) {
        throw new Error(roomValidation.error)
      }
    }

    // Sanitize data before submission
    const sanitizedData = sanitizeSubjectFormData(data)

    const response = await apiClient.post<ApiResponse<Subject>>('/subjects', sanitizedData)
    return response.data.data || response.data
  },

  /**
   * Update subject with comprehensive validation
   */
  async update(id: string | number, data: Partial<Subject>): Promise<Subject> {
    // Validate ID
    const idStr = String(id)
    if (!idStr || idStr.trim().length === 0) {
      throw new Error('Subject ID is required')
    }

    // Validate fields if provided
    if (data.name !== undefined) {
      const nameValidation = validators.subjectName(data.name)
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.error)
      }
    }

    if (data.code !== undefined) {
      const codeValidation = validators.subjectCode(data.code)
      if (!codeValidation.isValid) {
        throw new Error(codeValidation.error)
      }
    }

    if (data.capacity !== undefined) {
      const capacityValidation = validators.capacity(data.capacity)
      if (!capacityValidation.isValid) {
        throw new Error(capacityValidation.error)
      }
    }

    if (data.description !== undefined && data.description) {
      const descValidation = validators.description(data.description)
      if (!descValidation.isValid) {
        throw new Error(descValidation.error)
      }
    }

    if (data.instructor !== undefined && data.instructor) {
      const instructorValidation = validators.instructorName(data.instructor)
      if (!instructorValidation.isValid) {
        throw new Error(instructorValidation.error)
      }
    }

    if (data.room !== undefined && data.room) {
      const roomValidation = validators.roomNumber(data.room)
      if (!roomValidation.isValid) {
        throw new Error(roomValidation.error)
      }
    }

    // Sanitize data before submission
    const sanitizedData = sanitizeSubjectFormData(data)

    const response = await apiClient.put<ApiResponse<Subject>>(`/subjects/${id}`, sanitizedData)
    return response.data.data || response.data
  },

  /**
   * Update subject schedule (legacy single schedule)
   */
  async updateSchedule(id: string | number, schedule: SubjectSchedule | null): Promise<Subject> {
    const response = await apiClient.put<ApiResponse<Subject>>(`/subjects/${id}`, { schedule })
    return response.data.data || response.data
  },

  /**
   * Update subject schedules (multiple schedules support)
   */
  async updateSchedules(
    id: string | number,
    schedules: SubjectScheduleSlot[]
  ): Promise<SubjectEnhanced> {
    const response = await apiClient.put<ApiResponse<SubjectEnhanced>>(
      `/subjects/${id}/schedules`,
      {
        schedules,
      }
    )
    return response.data.data || response.data
  },

  /**
   * Delete subject
   */
  async delete(id: string | number): Promise<void> {
    // Validate ID
    const idStr = String(id)
    if (!idStr || idStr.trim().length === 0) {
      throw new Error('Subject ID is required')
    }

    await apiClient.delete(`/subjects/${id}`)
  },

  /**
   * Search subjects with validation
   */
  async search(query: string): Promise<Subject[]> {
    // Validate and sanitize search query
    const searchValidation = validators.searchTerm(query)
    if (!searchValidation.isValid && query.trim().length > 0) {
      throw new Error(searchValidation.error)
    }

    const sanitizedQuery = sanitizers.search(query)

    if (sanitizedQuery.length === 0) {
      return []
    }

    const response = await apiClient.get<ApiResponse<Subject[]>>('/subjects/search', {
      params: { q: sanitizedQuery },
    })
    return response.data.data || response.data
  },
}
