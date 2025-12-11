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

// Local type definition to handle both basic subject fields and schedule fields
type SubjectInput = Partial<Subject> & {
  schedule?: SubjectSchedule
  schedules?: SubjectScheduleSlot[]
}

function sanitizeSubjectFormData(data: SubjectInput): SubjectInput {
  const sanitized: SubjectInput = {}

  if (data.subjectName !== undefined) {
    sanitized.subjectName = sanitizers.name(data.subjectName)
  }
  if (data.subjectCode !== undefined) {
    sanitized.subjectCode = sanitizers.subjectCode(data.subjectCode)
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
  if (data.yearLevel !== undefined) {
    sanitized.yearLevel = data.yearLevel
  }
  if (data.section !== undefined) {
    sanitized.section = sanitizers.text(data.section)
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
  async create(data: SubjectInput): Promise<Subject> {
    // Validate required fields
    if (!data.subjectName || !data.subjectCode) {
      throw new Error('Subject name and code are required')
    }

    // Validate subject name
    const nameValidation = validators.subjectName(data.subjectName)
    if (!nameValidation.isValid) {
      throw new Error(nameValidation.error)
    }

    // Validate subject code
    const codeValidation = validators.subjectCode(data.subjectCode)
    if (!codeValidation.isValid) {
      throw new Error(codeValidation.error)
    }

    if (data.section !== undefined) {
      const sectionValidation = validators.section(data.section)
      if (!sectionValidation.isValid) {
        throw new Error(sectionValidation.error)
      }
    }

    if (data.yearLevel !== undefined) {
      const yearLevelValidation = validators.yearLevel(data.yearLevel)
      if (!yearLevelValidation.isValid) {
        throw new Error(yearLevelValidation.error)
      }
    }

    if (data.section !== undefined) {
      const sectionValidation = validators.section(data.section)
      if (!sectionValidation.isValid) {
        throw new Error(sectionValidation.error)
      }
    } else {
      throw new Error('Section is required')
    }

    // Validate year level
    if (data.yearLevel) {
      const yearLevelValidation = validators.yearLevel(data.yearLevel)
      if (!yearLevelValidation.isValid) {
        throw new Error(yearLevelValidation.error)
      }
    } else {
      throw new Error('Year level is required')
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
  async update(id: string | number, data: SubjectInput): Promise<Subject> {
    // Validate ID
    const idStr = String(id)
    if (!idStr || idStr.trim().length === 0) {
      throw new Error('Subject ID is required')
    }

    // Validate fields if provided
    if (data.subjectName !== undefined) {
      const nameValidation = validators.subjectName(data.subjectName)
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.error)
      }
    }

    if (data.subjectCode !== undefined) {
      const codeValidation = validators.subjectCode(data.subjectCode)
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
