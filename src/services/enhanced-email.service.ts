import apiClient from './api'
import { logError } from '@/utils/errorHandling'
import {
  emailTemplates,
  EmailBranding,
  EmailTemplateData,
  AbsenceAlertData,
  LowAttendanceData,
  DEFAULT_BRANDING,
} from '@/utils/emailTemplates'

/**
 * Enhanced Email Service
 *
 * Advanced email functionality including:
 * - Rich HTML templates with branding
 * - Scheduled email delivery
 * - Email bounce handling
 * - Unsubscribe management
 * - Attachment support
 *
 * @enterprise-grade Full-featured email management
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ScheduledEmail {
  id: string
  to: string | string[]
  subject: string
  htmlContent: string
  textContent?: string
  scheduledAt: string
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
  createdAt: string
  sentAt?: string
  error?: string
}

export interface EmailBounce {
  id: string
  email: string
  type: 'hard' | 'soft'
  reason: string
  timestamp: string
  originalEmailId?: string
}

export interface UnsubscribeRecord {
  id: string
  email: string
  reason?: string
  unsubscribedAt: string
  resubscribedAt?: string
  status: 'unsubscribed' | 'resubscribed'
}

export interface EmailAttachment {
  filename: string
  content: string // Base64 encoded string for binary content
  contentType: string
  encoding?: 'base64' | 'utf-8'
}

export interface EnhancedEmailPayload {
  to: string | string[]
  subject: string
  htmlContent?: string
  textContent?: string
  templateType?: 'attendance' | 'consecutiveAbsence' | 'lowAttendance' | 'weeklyReport'
  templateData?: EmailTemplateData | AbsenceAlertData | LowAttendanceData
  branding?: Partial<EmailBranding>
  attachments?: EmailAttachment[]
  scheduledAt?: string
  tags?: string[]
}

export interface EmailDeliveryStatus {
  emailId: string
  status: 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed'
  recipientEmail: string
  sentAt?: string
  deliveredAt?: string
  bouncedAt?: string
  bounceType?: 'hard' | 'soft'
  bounceReason?: string
  opens?: number
  clicks?: number
}

export interface EmailStats {
  totalSent: number
  delivered: number
  bounced: number
  pending: number
  opens: number
  clicks: number
  bounceRate: number
  deliveryRate: number
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export const enhancedEmailService = {
  /**
   * Send email with HTML template
   */
  async sendTemplatedEmail(
    payload: EnhancedEmailPayload
  ): Promise<{ success: boolean; emailId?: string }> {
    try {
      let htmlContent = payload.htmlContent

      // Generate HTML from template if specified
      if (payload.templateType && payload.templateData) {
        const branding: EmailBranding = {
          ...DEFAULT_BRANDING,
          ...payload.branding,
        }

        switch (payload.templateType) {
          case 'attendance':
            htmlContent = emailTemplates.attendance(
              payload.templateData as EmailTemplateData,
              branding
            )
            break
          case 'consecutiveAbsence':
            htmlContent = emailTemplates.consecutiveAbsence(
              payload.templateData as AbsenceAlertData,
              branding
            )
            break
          case 'lowAttendance':
            htmlContent = emailTemplates.lowAttendance(
              payload.templateData as LowAttendanceData,
              branding
            )
            break
          case 'weeklyReport':
            htmlContent = emailTemplates.weeklyReport(payload.templateData as any, branding)
            break
        }
      }

      const response = await apiClient.post<{ success: boolean; data: { emailId: string } }>(
        '/emails/send-html',
        {
          to: payload.to,
          subject: payload.subject,
          html: htmlContent,
          text: payload.textContent,
          attachments: payload.attachments,
          tags: payload.tags,
        }
      )

      return {
        success: response.data.success,
        emailId: response.data.data?.emailId,
      }
    } catch (error) {
      logError('EnhancedEmailService', 'sendTemplatedEmail', error)

      // Fallback to basic email endpoint
      try {
        const response = await apiClient.post('/emails/send', {
          to: Array.isArray(payload.to) ? payload.to[0] : payload.to,
          subject: payload.subject,
          message: payload.textContent || 'Please view this email in an HTML-capable email client.',
        })
        return { success: response.data.success }
      } catch (fallbackError) {
        throw new Error('Failed to send email')
      }
    }
  },

  /**
   * Schedule an email for future delivery
   */
  async scheduleEmail(payload: EnhancedEmailPayload): Promise<ScheduledEmail> {
    try {
      if (!payload.scheduledAt) {
        throw new Error('scheduledAt is required for scheduled emails')
      }

      let htmlContent = payload.htmlContent

      // Generate HTML from template if specified
      if (payload.templateType && payload.templateData) {
        const branding: EmailBranding = {
          ...DEFAULT_BRANDING,
          ...payload.branding,
        }

        switch (payload.templateType) {
          case 'attendance':
            htmlContent = emailTemplates.attendance(
              payload.templateData as EmailTemplateData,
              branding
            )
            break
          case 'consecutiveAbsence':
            htmlContent = emailTemplates.consecutiveAbsence(
              payload.templateData as AbsenceAlertData,
              branding
            )
            break
          case 'lowAttendance':
            htmlContent = emailTemplates.lowAttendance(
              payload.templateData as LowAttendanceData,
              branding
            )
            break
        }
      }

      const response = await apiClient.post<{ data: ScheduledEmail }>('/emails/schedule', {
        to: payload.to,
        subject: payload.subject,
        html: htmlContent,
        text: payload.textContent,
        scheduledAt: payload.scheduledAt,
        attachments: payload.attachments,
      })

      return response.data.data
    } catch (error) {
      logError('EnhancedEmailService', 'scheduleEmail', error)
      throw new Error('Failed to schedule email')
    }
  },

  /**
   * Get all scheduled emails
   */
  async getScheduledEmails(
    status?: 'pending' | 'sent' | 'failed' | 'cancelled'
  ): Promise<ScheduledEmail[]> {
    try {
      const params = status ? `?status=${status}` : ''
      const response = await apiClient.get<{ data: ScheduledEmail[] }>(`/emails/scheduled${params}`)
      return response.data.data || []
    } catch (error) {
      logError('EnhancedEmailService', 'getScheduledEmails', error)
      return []
    }
  },

  /**
   * Cancel a scheduled email
   */
  async cancelScheduledEmail(emailId: string): Promise<void> {
    try {
      await apiClient.delete(`/emails/scheduled/${emailId}`)
    } catch (error) {
      logError('EnhancedEmailService', 'cancelScheduledEmail', error)
      throw new Error('Failed to cancel scheduled email')
    }
  },

  /**
   * Reschedule an email
   */
  async rescheduleEmail(emailId: string, newScheduledAt: string): Promise<ScheduledEmail> {
    try {
      const response = await apiClient.put<{ data: ScheduledEmail }>(
        `/emails/scheduled/${emailId}`,
        {
          scheduledAt: newScheduledAt,
        }
      )
      return response.data.data
    } catch (error) {
      logError('EnhancedEmailService', 'rescheduleEmail', error)
      throw new Error('Failed to reschedule email')
    }
  },

  // ============================================================================
  // BOUNCE HANDLING
  // ============================================================================

  /**
   * Get email bounces
   */
  async getBounces(filters?: {
    type?: 'hard' | 'soft'
    startDate?: string
    endDate?: string
  }): Promise<EmailBounce[]> {
    try {
      const params = new URLSearchParams()
      if (filters?.type) params.append('type', filters.type)
      if (filters?.startDate) params.append('startDate', filters.startDate)
      if (filters?.endDate) params.append('endDate', filters.endDate)

      const response = await apiClient.get<{ data: EmailBounce[] }>(
        `/emails/bounces?${params.toString()}`
      )
      return response.data.data || []
    } catch (error) {
      logError('EnhancedEmailService', 'getBounces', error)
      return []
    }
  },

  /**
   * Check if an email address is bounced
   */
  async isEmailBounced(email: string): Promise<{ bounced: boolean; type?: 'hard' | 'soft' }> {
    try {
      const response = await apiClient.get<{ data: { bounced: boolean; type?: 'hard' | 'soft' } }>(
        `/emails/bounces/check/${encodeURIComponent(email)}`
      )
      return response.data.data
    } catch (error) {
      logError('EnhancedEmailService', 'isEmailBounced', error)
      return { bounced: false }
    }
  },

  /**
   * Remove email from bounce list (for soft bounces that have been resolved)
   */
  async removeBounce(email: string): Promise<void> {
    try {
      await apiClient.delete(`/emails/bounces/${encodeURIComponent(email)}`)
    } catch (error) {
      logError('EnhancedEmailService', 'removeBounce', error)
      throw new Error('Failed to remove email from bounce list')
    }
  },

  // ============================================================================
  // UNSUBSCRIBE MANAGEMENT
  // ============================================================================

  /**
   * Get unsubscribed emails
   */
  async getUnsubscribes(): Promise<UnsubscribeRecord[]> {
    try {
      const response = await apiClient.get<{ data: UnsubscribeRecord[] }>('/emails/unsubscribes')
      return response.data.data || []
    } catch (error) {
      logError('EnhancedEmailService', 'getUnsubscribes', error)
      return []
    }
  },

  /**
   * Check if email is unsubscribed
   */
  async isUnsubscribed(email: string): Promise<boolean> {
    try {
      const response = await apiClient.get<{ data: { unsubscribed: boolean } }>(
        `/emails/unsubscribes/check/${encodeURIComponent(email)}`
      )
      return response.data.data.unsubscribed
    } catch (error) {
      logError('EnhancedEmailService', 'isUnsubscribed', error)
      return false
    }
  },

  /**
   * Unsubscribe an email address
   */
  async unsubscribe(email: string, reason?: string): Promise<void> {
    try {
      await apiClient.post('/emails/unsubscribes', { email, reason })
    } catch (error) {
      logError('EnhancedEmailService', 'unsubscribe', error)
      throw new Error('Failed to unsubscribe email')
    }
  },

  /**
   * Resubscribe an email address
   */
  async resubscribe(email: string): Promise<void> {
    try {
      await apiClient.delete(`/emails/unsubscribes/${encodeURIComponent(email)}`)
    } catch (error) {
      logError('EnhancedEmailService', 'resubscribe', error)
      throw new Error('Failed to resubscribe email')
    }
  },

  /**
   * Generate unsubscribe URL for an email
   */
  generateUnsubscribeUrl(email: string, token?: string): string {
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin
    const encodedEmail = encodeURIComponent(email)
    return token
      ? `${baseUrl}/unsubscribe?email=${encodedEmail}&token=${token}`
      : `${baseUrl}/unsubscribe?email=${encodedEmail}`
  },

  // ============================================================================
  // EMAIL DELIVERY STATUS
  // ============================================================================

  /**
   * Get delivery status of an email
   */
  async getDeliveryStatus(emailId: string): Promise<EmailDeliveryStatus | null> {
    try {
      const response = await apiClient.get<{ data: EmailDeliveryStatus }>(
        `/emails/status/${emailId}`
      )
      return response.data.data
    } catch (error) {
      logError('EnhancedEmailService', 'getDeliveryStatus', error)
      return null
    }
  },

  /**
   * Get email statistics
   */
  async getEmailStats(period?: 'day' | 'week' | 'month'): Promise<EmailStats> {
    try {
      const params = period ? `?period=${period}` : ''
      const response = await apiClient.get<{ data: EmailStats }>(`/emails/stats${params}`)
      return response.data.data
    } catch (error) {
      logError('EnhancedEmailService', 'getEmailStats', error)
      return {
        totalSent: 0,
        delivered: 0,
        bounced: 0,
        pending: 0,
        opens: 0,
        clicks: 0,
        bounceRate: 0,
        deliveryRate: 0,
      }
    }
  },

  // ============================================================================
  // ATTACHMENT HELPERS
  // ============================================================================

  /**
   * Convert file to attachment format
   */
  async fileToAttachment(file: File): Promise<EmailAttachment> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve({
          filename: file.name,
          content: base64,
          contentType: file.type,
          encoding: 'base64',
        })
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  },

  /**
   * Validate attachment size (max 10MB per attachment, 25MB total)
   */
  validateAttachments(attachments: EmailAttachment[]): { valid: boolean; error?: string } {
    const maxSingleSize = 10 * 1024 * 1024 // 10MB
    const maxTotalSize = 25 * 1024 * 1024 // 25MB

    let totalSize = 0

    for (const attachment of attachments) {
      // Calculate size: for base64, actual size is ~75% of string length
      // For UTF-8, use TextEncoder for accurate byte count
      let size: number
      if (attachment.encoding === 'base64') {
        // Base64 strings are ~33% larger than the actual data
        size = Math.ceil(attachment.content.length * 0.75)
      } else {
        // Use TextEncoder for UTF-8 byte length calculation (browser-compatible)
        size = new TextEncoder().encode(attachment.content).length
      }

      if (size > maxSingleSize) {
        return {
          valid: false,
          error: `Attachment "${attachment.filename}" exceeds 10MB limit`,
        }
      }

      totalSize += size
    }

    if (totalSize > maxTotalSize) {
      return {
        valid: false,
        error: 'Total attachment size exceeds 25MB limit',
      }
    }

    return { valid: true }
  },

  // ============================================================================
  // ALERT EMAIL SHORTCUTS
  // ============================================================================

  /**
   * Send consecutive absence alert email
   */
  async sendConsecutiveAbsenceAlert(
    guardianEmail: string,
    data: AbsenceAlertData,
    branding?: Partial<EmailBranding>
  ): Promise<{ success: boolean }> {
    return this.sendTemplatedEmail({
      to: guardianEmail,
      subject: `⚠️ Absence Alert: ${data.studentName} - ${data.consecutiveDays} Consecutive Days`,
      templateType: 'consecutiveAbsence',
      templateData: {
        ...data,
        unsubscribeUrl: this.generateUnsubscribeUrl(guardianEmail),
      },
      branding,
      tags: ['alert', 'consecutive-absence'],
    })
  },

  /**
   * Send low attendance warning email
   */
  async sendLowAttendanceAlert(
    guardianEmail: string,
    data: LowAttendanceData,
    branding?: Partial<EmailBranding>
  ): Promise<{ success: boolean }> {
    return this.sendTemplatedEmail({
      to: guardianEmail,
      subject: `⚠️ Attendance Warning: ${data.studentName} - ${data.attendanceRate}% Attendance Rate`,
      templateType: 'lowAttendance',
      templateData: {
        ...data,
        unsubscribeUrl: this.generateUnsubscribeUrl(guardianEmail),
      },
      branding,
      tags: ['alert', 'low-attendance'],
    })
  },

  /**
   * Send weekly report email
   */
  async sendWeeklyReport(
    guardianEmail: string,
    data: Parameters<typeof emailTemplates.weeklyReport>[0],
    branding?: Partial<EmailBranding>
  ): Promise<{ success: boolean }> {
    return this.sendTemplatedEmail({
      to: guardianEmail,
      subject: `📊 Weekly Attendance Report: ${data.studentName}`,
      templateType: 'weeklyReport',
      templateData: {
        ...data,
        unsubscribeUrl: this.generateUnsubscribeUrl(guardianEmail),
      } as any,
      branding,
      tags: ['report', 'weekly'],
    })
  },
}

export default enhancedEmailService
