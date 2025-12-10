import api from './api'
import type { EmailData } from '@/components/modals/EmailModal'
import { logError } from '@/utils/errorHandling'

/**
 * Email Service
 *
 * Handles email sending operations through the backend API.
 * Supports single and multiple recipients, attachments, and HTML formatting.
 *
 * @enterprise-grade Error handling with proper logging and user feedback
 */

export interface EmailResponse {
  success: boolean
  message: string
  emailsSent?: number
}

export interface EmailHistoryRecord {
  _id: string
  recordType: string
  recordData: string
  performedBy: {
    _id: string
    name: string
    email: string
  }
  student?: {
    _id: string
    studentNumber: string
    firstName: string
    lastName: string
  }
  metadata?: {
    recipient?: string
    recipients?: string[]
    subject?: string
    messageId?: string
    totalRecipients?: number
    sentCount?: number
    failedCount?: number
  }
  createdAt: string
  updatedAt: string
}

export interface EmailHistoryResponse {
  emails: EmailHistoryRecord[]
  total: number
  page: number
  limit: number
}

/**
 * Send email to one or more recipients
 * @param emailData - Email data including recipients, subject, message, and optional attachments
 * @returns Promise<boolean> - True if email sent successfully
 */
export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    // sending email (metadata omitted from console for production)

    // For multiple recipients, split and send individually
    const recipients = emailData.to.split(',').map((e) => e.trim())

    if (recipients.length === 1) {
      // Single recipient - direct send
      const response = await api.post<EmailResponse>('/emails/send', {
        to: recipients[0],
        subject: emailData.subject,
        message: emailData.message,
        attachments: emailData.attachments,
      })
      // email sent successfully
      return response.data.success
    } else {
      // Multiple recipients - batch send
      const response = await api.post<EmailResponse>('/emails/send-bulk', {
        recipients,
        subject: emailData.subject,
        message: emailData.message,
        attachments: emailData.attachments,
      })
      // bulk email sent successfully
      return response.data.success
    }
  } catch (error: any) {
    logError('EmailService', 'sendEmail', error)

    // Provide helpful error messages synced with backend
    if (error.response?.status === 404) {
      throw new Error(
        'Email service not configured on backend. Please contact your administrator to set up email endpoints.'
      )
    } else if (error.response?.status === 401) {
      throw new Error('Unauthorized - Please login again')
    } else if (error.response?.status === 403) {
      // Permission error - bulk email requires superadmin/admin/staff role
      throw new Error(
        error.response.data?.message ||
          'You do not have permission to perform this action. Bulk email requires superadmin, admin, or staff role.'
      )
    } else if (error.response?.status === 429) {
      // Rate limit exceeded
      throw new Error(
        error.response.data?.message ||
          'Rate limit exceeded. Please wait 45 seconds before sending more emails.'
      )
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data?.message || 'Invalid email data')
    } else if (error.response?.status === 500) {
      throw new Error('Email server error - Please contact support')
    } else if (error.message === 'Network Error') {
      throw new Error('Network error - Please check your connection')
    }

    throw new Error('Failed to send email')
  }
}

/**
 * Send email to guardian (student notification)
 * @param studentId - Student ID
 * @param guardianEmail - Guardian email address
 * @param subject - Email subject
 * @param message - Email message
 * @returns Promise<boolean> - True if email sent successfully
 */
export async function sendGuardianEmail(
  studentId: string,
  guardianEmail: string,
  subject: string,
  message: string
): Promise<boolean> {
  try {
    // sending guardian email
    const response = await api.post<EmailResponse>('/emails/send-guardian', {
      studentId,
      guardianEmail,
      subject,
      message,
    })

    return response.data.success
  } catch (error: any) {
    logError('EmailService', 'sendGuardianEmail', error)

    if (error.response?.status === 404) {
      throw new Error('Email service not available - Backend endpoints not configured')
    } else if (error.response?.status === 403) {
      throw new Error(error.response.data?.message || 'Permission denied')
    } else if (error.response?.status === 429) {
      throw new Error(
        error.response.data?.message ||
          'Rate limit exceeded. Please wait before sending more emails.'
      )
    }

    throw new Error(error.response?.data?.message || 'Failed to send guardian email')
  }
}

/**
 * Get email configuration status
 * @returns Promise with email server configuration status
 */
export async function getEmailConfig(): Promise<{
  configured: boolean
  provider?: string
}> {
  try {
    const response = await api.get<{ configured: boolean; provider?: string }>('/emails/config')
    return response.data
  } catch (error) {
    logError('EmailService', 'getEmailConfig', error)
    return { configured: false }
  }
}

/**
 * Test email configuration
 * @param testEmail - Email address to send test email to
 * @returns Promise<boolean> - True if test email sent successfully
 */
export async function testEmailConfig(testEmail: string): Promise<boolean> {
  try {
    const response = await api.post<EmailResponse>('/emails/test', { email: testEmail })
    return response.data.success
  } catch (error) {
    logError('EmailService', 'testEmailConfig', error)
    return false
  }
}

/**
 * Get email history with pagination
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 20)
 * @param startDate - Optional start date filter
 * @param endDate - Optional end date filter
 * @returns Promise<EmailHistoryResponse> - Paginated email history
 */
export async function getEmailHistory(
  page: number = 1,
  limit: number = 20,
  startDate?: string,
  endDate?: string
): Promise<EmailHistoryResponse> {
  try {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('limit', limit.toString())
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)

    const response = await api.get<any>(`/emails/history?${params.toString()}`)

    // Handle different response formats
    if (response.data.data) {
      return {
        emails: response.data.data.emails || response.data.data,
        total: response.data.data.total || 0,
        page: response.data.data.page || page,
        limit: response.data.data.limit || limit,
      }
    }

    return {
      emails: response.data.emails || response.data,
      total: response.data.total || 0,
      page: response.data.page || page,
      limit: response.data.limit || limit,
    }
  } catch (error) {
    logError('EmailService', 'getEmailHistory', error)
    throw new Error('Failed to fetch email history')
  }
}

export default {
  sendEmail,
  sendGuardianEmail,
  getEmailConfig,
  testEmailConfig,
  getEmailHistory,
}
