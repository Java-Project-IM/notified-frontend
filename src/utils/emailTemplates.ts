/**
 * HTML Email Templates
 *
 * Professional, branded email templates for the Notified system.
 * All templates are responsive and support dark mode.
 *
 * Features:
 * - School branding support
 * - Responsive design
 * - Accessibility compliant
 * - Unsubscribe links
 * - Professional formatting
 */

// ============================================================================
// TYPES
// ============================================================================

export interface EmailBranding {
  schoolName: string
  schoolLogo?: string
  primaryColor: string
  secondaryColor: string
  footerText?: string
  contactEmail?: string
  contactPhone?: string
  address?: string
  website?: string
}

export interface EmailTemplateData {
  recipientName: string
  studentName: string
  studentNumber: string
  date?: string
  time?: string
  subject?: string
  status?: string
  customMessage?: string
  unsubscribeUrl?: string
}

export interface AbsenceAlertData extends EmailTemplateData {
  consecutiveDays: number
  startDate: string
  endDate: string
  subjects?: string[]
}

export interface LowAttendanceData extends EmailTemplateData {
  attendanceRate: number
  threshold: number
  totalClasses: number
  attendedClasses: number
  missedClasses: number
}

export interface ScheduledEmailData extends EmailTemplateData {
  scheduledDate: string
  scheduledTime: string
}

// ============================================================================
// DEFAULT BRANDING
// ============================================================================

export const DEFAULT_BRANDING: EmailBranding = {
  schoolName: 'Notified',
  primaryColor: '#4F46E5', // Indigo
  secondaryColor: '#7C3AED', // Violet
  footerText: 'This is an automated message from the Notified Attendance System.',
  contactEmail: 'support@notified.edu',
}

// ============================================================================
// BASE TEMPLATE STYLES
// ============================================================================

const baseStyles = `
  <style>
    /* Reset */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
    }
    
    /* Typography */
    .heading {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-weight: 600;
    }
    .body-text {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: #374151;
    }
    
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .email-body {
        background-color: #1f2937 !important;
      }
      .email-container {
        background-color: #111827 !important;
      }
      .body-text {
        color: #e5e7eb !important;
      }
      .heading {
        color: #f9fafb !important;
      }
    }
    
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        padding: 10px !important;
      }
      .mobile-padding {
        padding-left: 20px !important;
        padding-right: 20px !important;
      }
    }
  </style>
`

// ============================================================================
// TEMPLATE BUILDERS
// ============================================================================

/**
 * Build email header with branding
 */
function buildHeader(branding: EmailBranding): string {
  return `
    <tr>
      <td style="padding: 30px 40px; background: linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.secondaryColor} 100%);">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              ${
                branding.schoolLogo
                  ? `<img src="${branding.schoolLogo}" alt="${branding.schoolName}" style="max-height: 50px; margin-bottom: 10px;">`
                  : ''
              }
              <h1 style="margin: 0; font-family: 'Segoe UI', sans-serif; font-size: 24px; font-weight: 700; color: #ffffff;">
                ${branding.schoolName}
              </h1>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `
}

/**
 * Build email footer with unsubscribe link
 */
function buildFooter(branding: EmailBranding, unsubscribeUrl?: string): string {
  return `
    <tr>
      <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-family: 'Segoe UI', sans-serif; font-size: 13px; color: #6b7280; text-align: center;">
              <p style="margin: 0 0 10px 0;">
                ${branding.footerText || 'This is an automated message.'}
              </p>
              ${
                branding.contactEmail
                  ? `<p style="margin: 0 0 10px 0;">
                  Contact us: <a href="mailto:${branding.contactEmail}" style="color: ${branding.primaryColor};">${branding.contactEmail}</a>
                  ${branding.contactPhone ? ` | ${branding.contactPhone}` : ''}
                </p>`
                  : ''
              }
              ${branding.address ? `<p style="margin: 0 0 10px 0;">${branding.address}</p>` : ''}
              ${
                unsubscribeUrl
                  ? `<p style="margin: 15px 0 0 0; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                  <a href="${unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe from these notifications</a>
                </p>`
                  : ''
              }
              <p style="margin: 15px 0 0 0; font-size: 11px; color: #9ca3af;">
                © ${new Date().getFullYear()} ${branding.schoolName}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `
}

/**
 * Status badge generator
 */
function getStatusBadge(status: string): string {
  const colors: Record<string, { bg: string; text: string }> = {
    present: { bg: '#dcfce7', text: '#166534' },
    absent: { bg: '#fee2e2', text: '#991b1b' },
    late: { bg: '#fef3c7', text: '#92400e' },
    excused: { bg: '#dbeafe', text: '#1e40af' },
  }

  const color = colors[status.toLowerCase()] || { bg: '#f3f4f6', text: '#374151' }

  return `
    <span style="
      display: inline-block;
      padding: 4px 12px;
      background-color: ${color.bg};
      color: ${color.text};
      font-size: 14px;
      font-weight: 600;
      border-radius: 9999px;
      text-transform: capitalize;
    ">${status}</span>
  `
}

/**
 * Alert severity badge
 */
function getSeverityBadge(severity: 'warning' | 'critical' | 'info'): string {
  const colors = {
    warning: { bg: '#fef3c7', text: '#92400e', icon: '⚠️' },
    critical: { bg: '#fee2e2', text: '#991b1b', icon: '🚨' },
    info: { bg: '#dbeafe', text: '#1e40af', icon: 'ℹ️' },
  }

  const color = colors[severity]

  return `
    <span style="
      display: inline-block;
      padding: 6px 16px;
      background-color: ${color.bg};
      color: ${color.text};
      font-size: 14px;
      font-weight: 600;
      border-radius: 6px;
    ">${color.icon} ${severity.charAt(0).toUpperCase() + severity.slice(1)}</span>
  `
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

/**
 * Standard attendance notification email
 */
export function generateAttendanceEmail(
  data: EmailTemplateData,
  branding: EmailBranding = DEFAULT_BRANDING
): string {
  const {
    recipientName,
    studentName,
    studentNumber,
    date,
    time,
    status,
    customMessage,
    unsubscribeUrl,
  } = data

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Attendance Notification - ${branding.schoolName}</title>
      ${baseStyles}
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6;" class="email-body">
      <table width="100%" cellpadding="0" cellspacing="0" style="min-width: 100%;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" class="email-container">
              ${buildHeader(branding)}
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 40px;" class="mobile-padding">
                  <h2 class="heading" style="margin: 0 0 20px 0; font-size: 22px; color: #111827;">
                    Attendance Notification
                  </h2>
                  
                  <p class="body-text" style="margin: 0 0 20px 0;">
                    Dear ${recipientName},
                  </p>
                  
                  <p class="body-text" style="margin: 0 0 25px 0;">
                    This is to inform you about the attendance record for:
                  </p>
                  
                  <!-- Student Info Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 25px;">
                    <tr>
                      <td style="padding: 20px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
                              <strong style="color: #374151; font-size: 18px;">${studentName}</strong>
                              <br>
                              <span style="color: #6b7280; font-size: 14px;">Student No: ${studentNumber}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-top: 15px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="width: 50%;">
                                    <span style="color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Date</span>
                                    <br>
                                    <strong style="color: #111827; font-size: 15px;">${date || new Date().toLocaleDateString()}</strong>
                                  </td>
                                  <td style="width: 50%;">
                                    <span style="color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Time</span>
                                    <br>
                                    <strong style="color: #111827; font-size: 15px;">${time || new Date().toLocaleTimeString()}</strong>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          ${
                            status
                              ? `<tr>
                            <td style="padding-top: 15px;">
                              <span style="color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Status</span>
                              <br>
                              <div style="margin-top: 8px;">
                                ${getStatusBadge(status)}
                              </div>
                            </td>
                          </tr>`
                              : ''
                          }
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  ${
                    customMessage
                      ? `<p class="body-text" style="margin: 0 0 25px 0; padding: 15px; background-color: #eff6ff; border-left: 4px solid ${branding.primaryColor}; border-radius: 0 8px 8px 0;">
                      ${customMessage}
                    </p>`
                      : ''
                  }
                  
                  <p class="body-text" style="margin: 25px 0 0 0; color: #6b7280; font-size: 14px;">
                    If you have any questions, please contact the school administration.
                  </p>
                </td>
              </tr>
              
              ${buildFooter(branding, unsubscribeUrl)}
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

/**
 * Consecutive absence alert email
 */
export function generateConsecutiveAbsenceEmail(
  data: AbsenceAlertData,
  branding: EmailBranding = DEFAULT_BRANDING
): string {
  const {
    recipientName,
    studentName,
    studentNumber,
    consecutiveDays,
    startDate,
    endDate,
    subjects,
    unsubscribeUrl,
  } = data

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Absence Alert - ${branding.schoolName}</title>
      ${baseStyles}
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6;" class="email-body">
      <table width="100%" cellpadding="0" cellspacing="0" style="min-width: 100%;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" class="email-container">
              ${buildHeader(branding)}
              
              <!-- Alert Banner -->
              <tr>
                <td style="padding: 20px 40px; background-color: #fef2f2; border-bottom: 2px solid #fecaca;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        ${getSeverityBadge(consecutiveDays >= 5 ? 'critical' : 'warning')}
                        <span style="margin-left: 10px; color: #991b1b; font-weight: 600; font-size: 16px;">
                          Consecutive Absence Alert
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 40px;" class="mobile-padding">
                  <p class="body-text" style="margin: 0 0 20px 0;">
                    Dear ${recipientName},
                  </p>
                  
                  <p class="body-text" style="margin: 0 0 25px 0;">
                    We are writing to inform you that <strong>${studentName}</strong> (${studentNumber}) has been absent for <strong style="color: #dc2626;">${consecutiveDays} consecutive days</strong>.
                  </p>
                  
                  <!-- Absence Details Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border-radius: 8px; margin-bottom: 25px; border: 1px solid #fecaca;">
                    <tr>
                      <td style="padding: 20px;">
                        <h3 style="margin: 0 0 15px 0; color: #991b1b; font-size: 16px;">Absence Details</h3>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 8px 0;">
                              <span style="color: #6b7280;">Consecutive Days:</span>
                              <strong style="color: #dc2626; float: right;">${consecutiveDays}</strong>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; border-top: 1px solid #fecaca;">
                              <span style="color: #6b7280;">From:</span>
                              <strong style="color: #374151; float: right;">${startDate}</strong>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; border-top: 1px solid #fecaca;">
                              <span style="color: #6b7280;">To:</span>
                              <strong style="color: #374151; float: right;">${endDate}</strong>
                            </td>
                          </tr>
                          ${
                            subjects && subjects.length > 0
                              ? `<tr>
                            <td style="padding: 8px 0; border-top: 1px solid #fecaca;">
                              <span style="color: #6b7280;">Affected Subjects:</span>
                              <br>
                              <strong style="color: #374151;">${subjects.join(', ')}</strong>
                            </td>
                          </tr>`
                              : ''
                          }
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <p class="body-text" style="margin: 0 0 20px 0;">
                    Extended absences can significantly impact academic performance. We encourage you to:
                  </p>
                  
                  <ul style="margin: 0 0 25px 0; padding-left: 20px; color: #374151;">
                    <li style="margin-bottom: 8px;">Contact the school if there are any issues we should be aware of</li>
                    <li style="margin-bottom: 8px;">Provide documentation if the absence is due to illness</li>
                    <li style="margin-bottom: 8px;">Arrange for make-up work with teachers</li>
                  </ul>
                  
                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <a href="mailto:${branding.contactEmail}" style="
                          display: inline-block;
                          padding: 14px 32px;
                          background: linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.secondaryColor} 100%);
                          color: #ffffff;
                          text-decoration: none;
                          font-weight: 600;
                          border-radius: 8px;
                          font-size: 15px;
                        ">Contact School</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              ${buildFooter(branding, unsubscribeUrl)}
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

/**
 * Low attendance warning email
 */
export function generateLowAttendanceEmail(
  data: LowAttendanceData,
  branding: EmailBranding = DEFAULT_BRANDING
): string {
  const {
    recipientName,
    studentName,
    studentNumber,
    attendanceRate,
    threshold,
    totalClasses,
    attendedClasses,
    missedClasses,
    unsubscribeUrl,
  } = data

  const severity: 'warning' | 'critical' = attendanceRate < 60 ? 'critical' : 'warning'

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Low Attendance Warning - ${branding.schoolName}</title>
      ${baseStyles}
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6;" class="email-body">
      <table width="100%" cellpadding="0" cellspacing="0" style="min-width: 100%;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" class="email-container">
              ${buildHeader(branding)}
              
              <!-- Alert Banner -->
              <tr>
                <td style="padding: 20px 40px; background-color: ${severity === 'critical' ? '#fef2f2' : '#fffbeb'}; border-bottom: 2px solid ${severity === 'critical' ? '#fecaca' : '#fde68a'};">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        ${getSeverityBadge(severity)}
                        <span style="margin-left: 10px; color: ${severity === 'critical' ? '#991b1b' : '#92400e'}; font-weight: 600; font-size: 16px;">
                          Low Attendance Warning
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 40px;" class="mobile-padding">
                  <p class="body-text" style="margin: 0 0 20px 0;">
                    Dear ${recipientName},
                  </p>
                  
                  <p class="body-text" style="margin: 0 0 25px 0;">
                    We are writing to inform you that <strong>${studentName}</strong>'s attendance rate has fallen below the required threshold.
                  </p>
                  
                  <!-- Attendance Stats Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 25px;">
                    <tr>
                      <td style="padding: 25px; text-align: center;">
                        <!-- Attendance Rate Circle -->
                        <div style="
                          display: inline-block;
                          width: 120px;
                          height: 120px;
                          border-radius: 50%;
                          background: conic-gradient(
                            ${attendanceRate < 60 ? '#dc2626' : '#f59e0b'} ${attendanceRate * 3.6}deg,
                            #e5e7eb ${attendanceRate * 3.6}deg
                          );
                          padding: 10px;
                          box-sizing: border-box;
                        ">
                          <div style="
                            width: 100%;
                            height: 100%;
                            background: white;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                          ">
                            <span style="font-size: 28px; font-weight: 700; color: ${attendanceRate < 60 ? '#dc2626' : '#f59e0b'};">
                              ${attendanceRate}%
                            </span>
                          </div>
                        </div>
                        <p style="margin: 15px 0 5px 0; color: #6b7280; font-size: 13px;">Current Attendance Rate</p>
                        <p style="margin: 0; color: #374151; font-size: 14px;">Required: <strong>${threshold}%</strong></p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Stats Grid -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                    <tr>
                      <td style="width: 33%; padding: 10px; text-align: center; background-color: #f0fdf4; border-radius: 8px 0 0 8px;">
                        <div style="font-size: 24px; font-weight: 700; color: #166534;">${attendedClasses}</div>
                        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Attended</div>
                      </td>
                      <td style="width: 33%; padding: 10px; text-align: center; background-color: #fef2f2;">
                        <div style="font-size: 24px; font-weight: 700; color: #991b1b;">${missedClasses}</div>
                        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Missed</div>
                      </td>
                      <td style="width: 33%; padding: 10px; text-align: center; background-color: #f3f4f6; border-radius: 0 8px 8px 0;">
                        <div style="font-size: 24px; font-weight: 700; color: #374151;">${totalClasses}</div>
                        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Total</div>
                      </td>
                    </tr>
                  </table>
                  
                  <p class="body-text" style="margin: 0 0 20px 0;">
                    Regular attendance is crucial for academic success. Please take immediate action to improve attendance.
                  </p>
                  
                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <a href="mailto:${branding.contactEmail}" style="
                          display: inline-block;
                          padding: 14px 32px;
                          background: linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.secondaryColor} 100%);
                          color: #ffffff;
                          text-decoration: none;
                          font-weight: 600;
                          border-radius: 8px;
                          font-size: 15px;
                        ">Contact School</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              ${buildFooter(branding, unsubscribeUrl)}
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

/**
 * Weekly attendance report email
 */
export function generateWeeklyReportEmail(
  data: {
    recipientName: string
    studentName: string
    studentNumber: string
    weekStart: string
    weekEnd: string
    attendanceRate: number
    presentDays: number
    absentDays: number
    lateDays: number
    excusedDays: number
    unsubscribeUrl?: string
  },
  branding: EmailBranding = DEFAULT_BRANDING
): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Weekly Report - ${branding.schoolName}</title>
      ${baseStyles}
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6;" class="email-body">
      <table width="100%" cellpadding="0" cellspacing="0" style="min-width: 100%;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" class="email-container">
              ${buildHeader(branding)}
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 40px;" class="mobile-padding">
                  <h2 class="heading" style="margin: 0 0 8px 0; font-size: 22px; color: #111827;">
                    Weekly Attendance Report
                  </h2>
                  <p style="margin: 0 0 25px 0; color: #6b7280; font-size: 14px;">
                    ${data.weekStart} - ${data.weekEnd}
                  </p>
                  
                  <p class="body-text" style="margin: 0 0 20px 0;">
                    Dear ${data.recipientName},
                  </p>
                  
                  <p class="body-text" style="margin: 0 0 25px 0;">
                    Here is the weekly attendance summary for <strong>${data.studentName}</strong> (${data.studentNumber}).
                  </p>
                  
                  <!-- Weekly Stats -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                    <tr>
                      <td style="padding: 15px; background-color: #f0fdf4; border-radius: 8px; text-align: center; width: 25%;">
                        <div style="font-size: 28px; font-weight: 700; color: #166534;">${data.presentDays}</div>
                        <div style="font-size: 12px; color: #166534; text-transform: uppercase; margin-top: 4px;">Present</div>
                      </td>
                      <td style="width: 4%;"></td>
                      <td style="padding: 15px; background-color: #fef2f2; border-radius: 8px; text-align: center; width: 22%;">
                        <div style="font-size: 28px; font-weight: 700; color: #991b1b;">${data.absentDays}</div>
                        <div style="font-size: 12px; color: #991b1b; text-transform: uppercase; margin-top: 4px;">Absent</div>
                      </td>
                      <td style="width: 4%;"></td>
                      <td style="padding: 15px; background-color: #fffbeb; border-radius: 8px; text-align: center; width: 22%;">
                        <div style="font-size: 28px; font-weight: 700; color: #92400e;">${data.lateDays}</div>
                        <div style="font-size: 12px; color: #92400e; text-transform: uppercase; margin-top: 4px;">Late</div>
                      </td>
                      <td style="width: 4%;"></td>
                      <td style="padding: 15px; background-color: #eff6ff; border-radius: 8px; text-align: center; width: 22%;">
                        <div style="font-size: 28px; font-weight: 700; color: #1e40af;">${data.excusedDays}</div>
                        <div style="font-size: 12px; color: #1e40af; text-transform: uppercase; margin-top: 4px;">Excused</div>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Overall Rate -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 25px;">
                    <tr>
                      <td style="padding: 20px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td>
                              <span style="color: #6b7280; font-size: 14px;">Weekly Attendance Rate</span>
                            </td>
                            <td style="text-align: right;">
                              <span style="font-size: 24px; font-weight: 700; color: ${data.attendanceRate >= 80 ? '#166534' : data.attendanceRate >= 60 ? '#92400e' : '#991b1b'};">
                                ${data.attendanceRate}%
                              </span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <p class="body-text" style="margin: 0; color: #6b7280; font-size: 14px;">
                    Thank you for staying involved in your child's education.
                  </p>
                </td>
              </tr>
              
              ${buildFooter(branding, data.unsubscribeUrl)}
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

// ============================================================================
// EXPORT ALL TEMPLATES
// ============================================================================

export const emailTemplates = {
  attendance: generateAttendanceEmail,
  consecutiveAbsence: generateConsecutiveAbsenceEmail,
  lowAttendance: generateLowAttendanceEmail,
  weeklyReport: generateWeeklyReportEmail,
}

export default emailTemplates
