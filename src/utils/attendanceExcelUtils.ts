/**
 * Attendance Excel Import/Export Utilities
 *
 * Handles Excel file operations for attendance records:
 * - Import attendance from Excel files
 * - Export attendance to Excel with formatting
 * - Generate Excel templates for bulk import
 * - Validate Excel data before import
 *
 * Integration: Works with existing excelUtils.ts for students
 */

import * as XLSX from 'xlsx'
import { AttendanceRecord, AttendanceFormData, AttendanceStatus, TimeSlot } from '@/types'
import { format } from 'date-fns'

/**
 * Excel attendance record format
 */
export interface ExcelAttendanceRecord {
  'Student Number': string
  'First Name': string
  'Last Name': string
  Email: string
  'Subject Code'?: string
  'Subject Name'?: string
  Status: string // present, absent, late, excused
  'Time Slot': string // arrival, departure
  Date: string // YYYY-MM-DD
  Time: string // HH:MM AM/PM
  Notes?: string
}

/**
 * Validation result for Excel import
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Parse Excel file and extract attendance data
 *
 * Expected Excel format:
 * - Student Number | First Name | Last Name | Email | Status | Time Slot | Date | Time | Notes
 *
 * @param file - Excel file to parse
 * @returns Promise resolving to array of parsed attendance data
 */
export const parseAttendanceExcel = (file: File): Promise<ExcelAttendanceRecord[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<ExcelAttendanceRecord>(worksheet)

        // parsed records count: jsonData.length
        resolve(jsonData)
      } catch (error) {
        // parse error
        reject(new Error('Failed to parse Excel file. Please check the format.'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsBinaryString(file)
  })
}

/**
 * Validate attendance Excel data before import
 *
 * Checks for:
 * - Required fields (Student Number, Status, Time Slot, Date)
 * - Valid status values
 * - Valid time slot values
 * - Valid date format
 *
 * @param records - Array of Excel attendance records
 * @returns Validation result with errors and warnings
 */
export const validateAttendanceData = (records: ExcelAttendanceRecord[]): ValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []

  if (records.length === 0) {
    errors.push('Excel file is empty or has no valid data')
    return { isValid: false, errors, warnings }
  }

  const validStatuses: AttendanceStatus[] = ['present', 'absent', 'late', 'excused']
  const validTimeSlots: TimeSlot[] = ['arrival', 'departure']

  records.forEach((record, index) => {
    const rowNum = index + 2 // Excel row number (1-based + header)

    // Check required fields
    if (!record['Student Number']?.trim()) {
      errors.push(`Row ${rowNum}: Student Number is required`)
    }
    if (!record['Status']?.trim()) {
      errors.push(`Row ${rowNum}: Status is required`)
    }
    if (!record['Time Slot']?.trim()) {
      errors.push(`Row ${rowNum}: Time Slot is required`)
    }
    if (!record['Date']?.trim()) {
      errors.push(`Row ${rowNum}: Date is required`)
    }

    // Validate status
    const status = record['Status']?.toLowerCase().trim()
    if (status && !validStatuses.includes(status as AttendanceStatus)) {
      errors.push(
        `Row ${rowNum}: Invalid status "${record['Status']}". Must be: present, absent, late, or excused`
      )
    }

    // Validate time slot
    const timeSlot = record['Time Slot']?.toLowerCase().trim()
    if (timeSlot && !validTimeSlots.includes(timeSlot as TimeSlot)) {
      errors.push(
        `Row ${rowNum}: Invalid time slot "${record['Time Slot']}". Must be: arrival or departure`
      )
    }

    // Validate date format
    if (record['Date']) {
      const dateStr = String(record['Date']).trim()
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(dateStr)) {
        errors.push(`Row ${rowNum}: Invalid date format "${dateStr}". Use YYYY-MM-DD format`)
      }
    }

    // Warnings for optional fields
    if (!record['First Name'] && !record['Last Name']) {
      warnings.push(`Row ${rowNum}: Student name is missing`)
    }
    if (!record['Email']) {
      warnings.push(`Row ${rowNum}: Email is missing`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Transform Excel data to AttendanceFormData format
 *
 * Note: Student ID lookup must be done separately via API
 * This function prepares the data structure
 *
 * @param records - Array of Excel attendance records
 * @returns Array of attendance form data (without student IDs)
 */
export const transformExcelToAttendanceData = (
  records: ExcelAttendanceRecord[]
): Partial<AttendanceFormData>[] => {
  return records
    .map((record) => {
      const status = record['Status']?.toLowerCase().trim() as AttendanceStatus
      const timeSlot = record['Time Slot']?.toLowerCase().trim() as TimeSlot
      const date = record['Date']?.trim()
      const time = record['Time']?.trim()

      // Combine date and time into ISO timestamp
      let timestamp = date
      if (time) {
        try {
          // Parse time (e.g., "09:30 AM") and combine with date
          const dateTime = new Date(`${date} ${time}`)
          if (!isNaN(dateTime.getTime())) {
            timestamp = dateTime.toISOString()
          }
        } catch (e) {
          // Keep just the date if time parsing fails
        }
      }

      return {
        studentNumber: record['Student Number']?.trim(),
        status,
        timeSlot,
        timestamp,
        notes: record['Notes']?.trim(),
        // Student ID must be resolved via API lookup by studentNumber
      }
    })
    .filter((data) => data.studentNumber && data.status && data.timeSlot)
}

/**
 * Export attendance records to Excel file
 *
 * Creates a formatted Excel file with:
 * - Headers with styling
 * - Auto-sized columns
 * - Date/time formatting
 * - Status color coding (via conditional formatting)
 *
 * @param records - Array of attendance records to export
 * @param filename - Output filename (defaults to attendance_export_YYYY-MM-DD.xlsx)
 */
export const exportAttendanceToExcel = (records: AttendanceRecord[], filename?: string): void => {
  const exportData = records.map((record) => ({
    'Student Number': record.studentNumber,
    'First Name': record.firstName,
    'Last Name': record.lastName,
    Email: record.email,
    'Subject Code': record.subjectCode || '',
    'Subject Name': record.subjectName || '',
    Status: record.status.charAt(0).toUpperCase() + record.status.slice(1),
    'Time Slot': record.timeSlot.charAt(0).toUpperCase() + record.timeSlot.slice(1),
    Date: format(new Date(record.timestamp), 'yyyy-MM-DD'),
    Time: format(new Date(record.timestamp), 'hh:mm a'),
    Notes: record.notes || '',
    'Created At': format(new Date(record.createdAt), 'yyyy-MM-dd HH:mm:ss'),
  }))

  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance')

  // Set column widths for better readability
  worksheet['!cols'] = [
    { wch: 15 }, // Student Number
    { wch: 15 }, // First Name
    { wch: 15 }, // Last Name
    { wch: 25 }, // Email
    { wch: 12 }, // Subject Code
    { wch: 20 }, // Subject Name
    { wch: 10 }, // Status
    { wch: 10 }, // Time Slot
    { wch: 12 }, // Date
    { wch: 12 }, // Time
    { wch: 30 }, // Notes
    { wch: 20 }, // Created At
  ]

  const finalFilename = filename || `attendance_export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
  XLSX.writeFile(workbook, finalFilename)

  // Exported attendance file: finalFilename
}

/**
 * Generate Excel template for bulk attendance import
 *
 * Creates a sample Excel file with:
 * - Column headers
 * - Example data rows
 * - Instructions sheet
 *
 * @param includeInstructions - Whether to include an instructions sheet
 */
export const generateAttendanceTemplate = (includeInstructions: boolean = true): void => {
  const today = format(new Date(), 'yyyy-MM-dd')
  const now = format(new Date(), 'hh:mm a')

  // Sample data for template
  const templateData: ExcelAttendanceRecord[] = [
    {
      'Student Number': '24-0001',
      'First Name': 'John',
      'Last Name': 'Doe',
      Email: 'john.doe@example.com',
      'Subject Code': 'CS101',
      'Subject Name': 'Computer Science 101',
      Status: 'present',
      'Time Slot': 'arrival',
      Date: today,
      Time: '08:00 AM',
      Notes: 'On time',
    },
    {
      'Student Number': '24-0002',
      'First Name': 'Alice',
      'Last Name': 'Smith',
      Email: 'alice.smith@example.com',
      'Subject Code': 'CS101',
      'Subject Name': 'Computer Science 101',
      Status: 'late',
      'Time Slot': 'arrival',
      Date: today,
      Time: '08:15 AM',
      Notes: '15 minutes late',
    },
    {
      'Student Number': '24-0003',
      'First Name': 'Bob',
      'Last Name': 'Johnson',
      Email: 'bob.johnson@example.com',
      'Subject Code': 'CS101',
      'Subject Name': 'Computer Science 101',
      Status: 'present',
      'Time Slot': 'departure',
      Date: today,
      Time: '05:00 PM',
      Notes: '',
    },
  ]

  const worksheet = XLSX.utils.json_to_sheet(templateData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Template')

  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 25 },
    { wch: 12 },
    { wch: 20 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 30 },
  ]

  // Add instructions sheet if requested
  if (includeInstructions) {
    const instructions = [
      ['ATTENDANCE IMPORT TEMPLATE - INSTRUCTIONS'],
      [''],
      ['Required Fields:'],
      ['• Student Number - Must match existing student (e.g., 24-0001)'],
      ['• Status - Must be one of: present, absent, late, excused'],
      ['• Time Slot - Must be one of: arrival, departure'],
      ['• Date - Format: YYYY-MM-DD (e.g., 2025-01-15)'],
      [''],
      ['Optional Fields:'],
      ['• First Name, Last Name, Email - For reference only'],
      ['• Subject Code, Subject Name - Link to specific subject'],
      ['• Time - Format: HH:MM AM/PM (e.g., 08:30 AM)'],
      ['• Notes - Any additional information'],
      [''],
      ['Tips:'],
      ['• Remove example data before importing your records'],
      ['• All student numbers must exist in the system'],
      ['• Use lowercase for status and time slot values'],
      ['• Leave notes empty if not needed'],
      [''],
      ['Valid Status Values:'],
      ['• present - Student attended'],
      ['• absent - Student did not attend'],
      ['• late - Student arrived late'],
      ['• excused - Student excused absence'],
      [''],
      ['Valid Time Slot Values:'],
      ['• arrival - Student check-in time'],
      ['• departure - Student check-out time'],
    ]

    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions)
    instructionsSheet['!cols'] = [{ wch: 80 }]
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions')
  }

  const filename = `attendance_import_template_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
  XLSX.writeFile(workbook, filename)

  // Generated template: filename
}

/**
 * Download attendance summary as Excel report
 *
 * Creates a comprehensive Excel report with multiple sheets:
 * - Daily summary
 * - Student-wise summary
 * - Subject-wise summary (if applicable)
 *
 * @param dailySummary - Daily attendance summary data
 * @param studentSummaries - Student-wise summaries
 * @param reportDate - Date for the report (defaults to today)
 */
export const exportAttendanceSummaryReport = (
  dailySummary: any,
  studentSummaries: any[],
  reportDate?: string
): void => {
  const workbook = XLSX.utils.book_new()
  const date = reportDate || format(new Date(), 'yyyy-MM-dd')

  // Sheet 1: Daily Summary
  const dailyData = [
    ['DAILY ATTENDANCE SUMMARY'],
    ['Date:', dailySummary.date],
    [''],
    ['Total Students:', dailySummary.totalStudents],
    ['Present:', dailySummary.present],
    ['Absent:', dailySummary.absent],
    ['Late:', dailySummary.late],
    ['Excused:', dailySummary.excused],
    ['Attendance Rate:', `${dailySummary.attendanceRate}%`],
    [''],
    ['Arrivals:', dailySummary.arrivalCount],
    ['Departures:', dailySummary.departureCount],
  ]
  const dailySheet = XLSX.utils.aoa_to_sheet(dailyData)
  dailySheet['!cols'] = [{ wch: 20 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(workbook, dailySheet, 'Daily Summary')

  // Sheet 2: Student-wise Summary
  if (studentSummaries && studentSummaries.length > 0) {
    const studentData = studentSummaries.map((s) => ({
      'Student Number': s.studentNumber,
      'Student Name': s.studentName,
      'Total Days': s.totalDays,
      Present: s.presentDays,
      Absent: s.absentDays,
      Late: s.lateDays,
      Excused: s.excusedDays,
      'Attendance Rate': `${s.attendanceRate}%`,
      'Last Attendance': s.lastAttendance
        ? format(new Date(s.lastAttendance), 'yyyy-MM-dd')
        : 'N/A',
    }))
    const studentSheet = XLSX.utils.json_to_sheet(studentData)
    studentSheet['!cols'] = [
      { wch: 15 },
      { wch: 20 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
    ]
    XLSX.utils.book_append_sheet(workbook, studentSheet, 'Student Summary')
  }

  const filename = `attendance_summary_${date}.xlsx`
  XLSX.writeFile(workbook, filename)

  // Generated summary report: filename
}
