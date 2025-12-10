/**
 * Email Templates
 *
 * Professional HTML email templates for the student management system.
 * These templates can be used by the backend to send styled emails.
 * The frontend generates and previews these templates.
 */

export interface EmailTemplateData {
  recipientName?: string
  subject: string
  message: string
  senderName?: string
  senderRole?: string
  schoolName?: string
  schoolLogo?: string
  footerText?: string
}

/**
 * Generate a professional HTML email template
 * @param data - Template data including message content
 * @returns Formatted HTML email string
 */
export function generateEmailTemplate(data: EmailTemplateData): string {
  const {
    recipientName = 'Student/Guardian',
    subject,
    message,
    senderName = 'Student Management System',
    senderRole = '',
    schoolName = 'School Administration',
    footerText = 'This is an automated message from the Student Management System.',
  } = data

  // Convert plain text message to HTML paragraphs
  const formattedMessage = message
    .split('\n\n')
    .map(
      (paragraph) =>
        `<p style="margin: 0 0 16px 0; line-height: 1.6;">${paragraph.replace(/\n/g, '<br>')}</p>`
    )
    .join('')

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f7; color: #333333;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f7;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%); padding: 40px 40px 30px 40px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                ${schoolName}
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.85);">
                Student Management System
              </p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #6b7280;">
                Dear <strong style="color: #1f2937;">${recipientName}</strong>,
              </p>
              
              <!-- Subject Line -->
              <h2 style="margin: 0 0 24px 0; font-size: 20px; font-weight: 600; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px;">
                ${subject}
              </h2>
              
              <!-- Message Content -->
              <div style="font-size: 15px; color: #374151;">
                ${formattedMessage}
              </div>
              
              <!-- Divider -->
              <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
              
              <!-- Signature -->
              <div style="font-size: 14px; color: #6b7280;">
                <p style="margin: 0 0 8px 0;">Best regards,</p>
                <p style="margin: 0; font-weight: 600; color: #1f2937;">${senderName}</p>
                ${senderRole ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #9ca3af;">${senderRole}</p>` : ''}
              </div>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-radius: 0 0 16px 16px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="margin: 0 0 12px 0; font-size: 12px; color: #9ca3af; text-align: center;">
                ${footerText}
              </p>
              <p style="margin: 0; font-size: 11px; color: #d1d5db; text-align: center;">
                © ${new Date().getFullYear()} ${schoolName}. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim()
}

/**
 * Generate a simple plain text version of the email
 * @param data - Template data
 * @returns Plain text email string
 */
export function generatePlainTextEmail(data: EmailTemplateData): string {
  const {
    recipientName = 'Student/Guardian',
    subject,
    message,
    senderName = 'Student Management System',
    senderRole = '',
    schoolName = 'School Administration',
    footerText = 'This is an automated message from the Student Management System.',
  } = data

  return `
${schoolName}
Student Management System
${'─'.repeat(50)}

Dear ${recipientName},

RE: ${subject}

${message}

${'─'.repeat(50)}

Best regards,
${senderName}${senderRole ? `\n${senderRole}` : ''}

${'─'.repeat(50)}
${footerText}
© ${new Date().getFullYear()} ${schoolName}
`.trim()
}

/**
 * Attendance notification email template
 */
export function generateAttendanceNotificationEmail(data: {
  studentName: string
  guardianName: string
  date: string
  status: 'absent' | 'late' | 'excused'
  subjectName: string
  subjectCode: string
  notes?: string
}): string {
  const statusMessages = {
    absent: 'was marked absent',
    late: 'arrived late',
    excused: 'has an excused absence',
  }

  const statusColors = {
    absent: '#ef4444',
    late: '#f59e0b',
    excused: '#3b82f6',
  }

  return generateEmailTemplate({
    recipientName: data.guardianName,
    subject: `Attendance Notice: ${data.studentName} - ${data.subjectCode}`,
    message: `
We would like to inform you that your child, <strong>${data.studentName}</strong>, ${statusMessages[data.status]} for <strong>${data.subjectName} (${data.subjectCode})</strong> on <strong>${data.date}</strong>.

${
  data.notes
    ? `<p style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; border-left: 4px solid ${statusColors[data.status]};">
<strong>Note from instructor:</strong><br>
${data.notes}
</p>`
    : ''
}

If you have any questions or concerns regarding this notice, please don't hesitate to contact the school administration.

We appreciate your attention to your child's academic progress.
    `.trim(),
    senderName: 'Attendance Office',
    senderRole: 'Student Management System',
  })
}

/**
 * Welcome email for new student registration
 */
export function generateWelcomeEmail(data: {
  studentName: string
  studentNumber: string
  guardianName?: string
}): string {
  return generateEmailTemplate({
    recipientName: data.guardianName || data.studentName,
    subject: `Welcome to Our School - Student Registration Confirmed`,
    message: `
We are pleased to confirm that <strong>${data.studentName}</strong> has been successfully registered in our student management system.

<div style="background-color: #f0fdf4; padding: 20px; border-radius: 12px; border: 1px solid #86efac; margin: 20px 0;">
  <p style="margin: 0 0 8px 0; font-size: 14px; color: #166534;"><strong>Student Details:</strong></p>
  <p style="margin: 0; font-size: 16px;"><strong>Name:</strong> ${data.studentName}</p>
  <p style="margin: 4px 0 0 0; font-size: 16px;"><strong>Student Number:</strong> ${data.studentNumber}</p>
</div>

This student number will be used for all academic records, attendance tracking, and school communications.

If you have any questions or need to update any information, please contact our registrar's office.

We look forward to a successful academic journey together!
    `.trim(),
    senderName: "Registrar's Office",
    senderRole: 'Student Management System',
  })
}

export default {
  generateEmailTemplate,
  generatePlainTextEmail,
  generateAttendanceNotificationEmail,
  generateWelcomeEmail,
}
