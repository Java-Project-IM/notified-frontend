# Backend Sync Prompt for Notified Frontend Enhancements

## Overview

This document provides instructions for updating the **Notified Backend** to sync with recent frontend enhancements. The frontend has been upgraded with real-time statistics, enhanced attendance tracking, and improved UX features that require corresponding backend API endpoints.

---

## 🎯 Required Backend Changes

### 1. NEW ENDPOINT: Today's Attendance Statistics

**Frontend Expectation:** `GET /attendance/today/stats`

The dashboard now displays a "Today's Summary" widget showing real-time attendance breakdown.

#### Expected Response Format:

```typescript
interface TodayAttendanceStats {
  present: number // Count of students marked present today
  absent: number // Count of students marked absent today
  late: number // Count of students marked late today
  excused: number // Count of students marked excused today
  unmarked: number // Count of enrolled students not yet marked
  total: number // Total enrolled students across all subjects
  attendanceRate: number // Percentage: (present + late) / (total - unmarked) * 100
}
```

#### Implementation Notes:

```javascript
// Route: GET /api/attendance/today/stats
// File: routes/attendance.routes.js (or similar)

router.get('/today/stats', authenticateToken, async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get all attendance records for today
    const todayRecords = await Attendance.find({
      date: { $gte: today, $lt: tomorrow },
    })

    // Count by status
    const statusCounts = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    }

    todayRecords.forEach((record) => {
      if (statusCounts.hasOwnProperty(record.status)) {
        statusCounts[record.status]++
      }
    })

    // Get total enrolled students (across all subjects for today)
    const totalEnrolled = await SubjectEnrollment.countDocuments({ status: 'active' })

    // Calculate unmarked (enrolled but not yet marked today)
    const markedCount = todayRecords.length
    const unmarked = Math.max(0, totalEnrolled - markedCount)

    // Calculate attendance rate (excluding unmarked)
    const markedTotal =
      statusCounts.present + statusCounts.absent + statusCounts.late + statusCounts.excused
    const attendanceRate =
      markedTotal > 0
        ? Math.round(((statusCounts.present + statusCounts.late) / markedTotal) * 100)
        : 0

    res.json({
      success: true,
      data: {
        present: statusCounts.present,
        absent: statusCounts.absent,
        late: statusCounts.late,
        excused: statusCounts.excused,
        unmarked,
        total: totalEnrolled,
        attendanceRate,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})
```

---

### 2. ENHANCE: Subject Attendance Response

**Frontend Expectation:** `GET /attendance/subject/:subjectId/date/:date`

The Subject Details Modal now filters students by attendance status and shows count badges.

#### Expected Response Format:

```typescript
interface SubjectAttendanceResponse {
  success: true
  data: {
    subjectId: string
    date: string
    students: Array<{
      _id: string // Student MongoDB ObjectId
      studentId: number // Student display ID (for UI)
      firstName: string
      lastName: string
      email: string
      status: 'present' | 'absent' | 'late' | 'excused' | 'unmarked'
      markedAt?: string // ISO timestamp when attendance was marked
      markedBy?: string // User ID who marked attendance (for audit)
    }>
    stats: {
      // NEW: Include inline stats
      present: number
      absent: number
      late: number
      excused: number
      unmarked: number
      total: number
    }
  }
}
```

#### Key Requirements:

1. **Return ALL enrolled students** for the subject, not just those with attendance records
2. **Include `unmarked` status** for students without attendance records for that date
3. **Include `markedBy` field** for audit trail (user who marked the attendance)
4. **Include `stats` object** with counts per status

#### Implementation Enhancement:

```javascript
// Route: GET /api/attendance/subject/:subjectId/date/:date
router.get('/subject/:subjectId/date/:date', authenticateToken, async (req, res) => {
  try {
    const { subjectId, date } = req.params

    // Parse the date
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    const nextDate = new Date(targetDate)
    nextDate.setDate(nextDate.getDate() + 1)

    // Get all enrolled students for this subject
    const enrollments = await SubjectEnrollment.find({
      subject: subjectId,
      status: 'active',
    }).populate('student', 'studentId firstName lastName email')

    // Get existing attendance records for this date
    const attendanceRecords = await Attendance.find({
      subject: subjectId,
      date: { $gte: targetDate, $lt: nextDate },
    })

    // Create a map of student attendance
    const attendanceMap = new Map()
    attendanceRecords.forEach((record) => {
      attendanceMap.set(record.student.toString(), {
        status: record.status,
        markedAt: record.updatedAt || record.createdAt,
        markedBy: record.markedBy,
      })
    })

    // Build response with all students
    const stats = { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0, total: 0 }

    const students = enrollments.map((enrollment) => {
      const student = enrollment.student
      const attendance = attendanceMap.get(student._id.toString())

      const status = attendance?.status || 'unmarked'
      stats[status]++
      stats.total++

      return {
        _id: student._id,
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        status,
        markedAt: attendance?.markedAt || null,
        markedBy: attendance?.markedBy || null,
      }
    })

    res.json({
      success: true,
      data: {
        subjectId,
        date: targetDate.toISOString(),
        students,
        stats,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})
```

---

### 3. ENHANCE: Attendance Marking Response

**Frontend Expectation:** `POST /attendance/subject/mark` and `POST /attendance/subject/bulk-mark`

#### Single Mark Request:

```typescript
// Request
{
  subjectId: string
  studentId: string // MongoDB ObjectId as string
  status: 'present' | 'absent' | 'late' | 'excused'
  date: string // ISO date string
}

// Response
{
  success: true
  data: {
    _id: string
    student: string | { _id: string, studentId: number, firstName: string, lastName: string }
    subject: string
    status: string
    date: string
    markedAt: string
    markedBy: string // IMPORTANT: Include this for audit
  }
  message: 'Attendance marked successfully'
}
```

#### Bulk Mark Request:

```typescript
// Request
{
  subjectId: string
  date: string
  records: Array<{
    studentId: string // MongoDB ObjectId as string
    status: 'present' | 'absent' | 'late' | 'excused'
  }>
}

// Response
{
  success: true
  data: {
    updated: number // Count of records updated
    created: number // Count of new records created
    records: Array<{
      // All affected records
      _id: string
      student: string
      status: string
      markedBy: string
    }>
  }
  message: 'Bulk attendance updated successfully'
}
```

#### Implementation Note - Add `markedBy` field:

```javascript
// In your Attendance model (models/Attendance.js)
const attendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: true,
    },
    date: { type: Date, required: true },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ADD THIS
  },
  { timestamps: true }
)

// In your mark attendance controller
const markAttendance = async (req, res) => {
  const { subjectId, studentId, status, date } = req.body
  const userId = req.user._id // From auth middleware

  const attendance = await Attendance.findOneAndUpdate(
    { student: studentId, subject: subjectId, date: new Date(date) },
    {
      status,
      markedBy: userId, // Track who marked it
    },
    { upsert: true, new: true }
  )

  res.json({ success: true, data: attendance })
}
```

---

### 4. ENHANCE: Dashboard Stats Endpoint

**Frontend Expectation:** `GET /records/stats`

The dashboard uses this for the main stats cards.

#### Expected Response Format:

```typescript
interface DashboardStats {
  totalStudents: number // Total active students
  totalSubjects: number // Total active subjects
  totalRecords: number // Total attendance records ever
  todayRecords: number // Records marked today
}
```

This endpoint should already exist but verify it returns accurate counts.

---

### 5. NEW ENDPOINT: Subject Attendance History (Optional Enhancement)

**Frontend Could Use:** `GET /attendance/subject/:subjectId/history`

For future attendance trends feature.

#### Expected Response:

```typescript
{
  success: true
  data: {
    subjectId: string
    history: Array<{
      date: string
      stats: {
        present: number
        absent: number
        late: number
        excused: number
        unmarked: number
        rate: number
      }
    }>
  }
}
```

---

## 🗄️ Database Schema Updates

### Attendance Model

Ensure your Attendance model includes:

```javascript
const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: true,
    },
    date: {
      type: Date,
      required: true,
      index: true, // Add index for date queries
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: String, // Optional: for excused absences
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
)

// Compound index for common queries
attendanceSchema.index({ subject: 1, date: 1 })
attendanceSchema.index({ student: 1, date: 1 })
```

---

## 🔌 API Routes Summary

Add/update these routes in your backend:

```javascript
// attendance.routes.js

// Get today's stats for dashboard
router.get('/today/stats', authenticateToken, getTodayStats)

// Get subject attendance for a specific date (with all enrolled students)
router.get('/subject/:subjectId/date/:date', authenticateToken, getSubjectAttendance)

// Mark single attendance
router.post('/subject/mark', authenticateToken, markAttendance)

// Bulk mark attendance
router.post('/subject/bulk-mark', authenticateToken, bulkMarkAttendance)

// Get attendance records with filters
router.get('/records', authenticateToken, getAttendanceRecords)
```

---

## 📋 Testing Checklist

After implementing, verify:

- [ ] `GET /attendance/today/stats` returns correct counts
- [ ] Unmarked students appear in subject attendance list
- [ ] Status filter counts match actual data
- [ ] `markedBy` field is populated when marking attendance
- [ ] Bulk mark creates/updates records correctly
- [ ] Dashboard stats refresh shows updated data
- [ ] All MongoDB ObjectIds are returned as strings

---

## 🚀 Frontend Features Dependent on These Changes

| Feature                  | Required Endpoint                                     |
| ------------------------ | ----------------------------------------------------- |
| Today's Summary Widget   | `GET /attendance/today/stats`                         |
| Status Filter Badges     | `GET /attendance/subject/:id/date/:date` (with stats) |
| Attendance Audit Trail   | `markedBy` field in all responses                     |
| Real-time Dashboard      | Auto-refresh calls to stats endpoints                 |
| Unmarked Student Display | Include unmarked students in responses                |

---

## 📝 Notes

1. **ID Format Consistency**: Frontend uses `String()` to compare IDs. Ensure MongoDB ObjectIds are serialized as strings in all responses.

2. **Date Handling**: Frontend sends dates in `YYYY-MM-DD` format. Backend should parse these correctly considering timezone.

3. **Error Responses**: Use consistent format:

   ```json
   { "success": false, "message": "Error description", "code": "ERROR_CODE" }
   ```

4. **Rate Limiting**: Consider adding rate limiting to stats endpoints since they auto-refresh every 30 seconds.

5. **Caching**: Consider caching today's stats with a 30-60 second TTL to reduce database load.

---

## 🔄 Migration Script (If Needed)

If you need to add the `markedBy` field to existing records:

```javascript
// migration/add-markedBy.js
const Attendance = require('../models/Attendance')

async function migrate() {
  // Find records without markedBy
  const records = await Attendance.find({ markedBy: { $exists: false } })

  console.log(`Found ${records.length} records without markedBy`)

  // Option 1: Set to null (unknown)
  await Attendance.updateMany({ markedBy: { $exists: false } }, { $set: { markedBy: null } })

  // Option 2: Set to a system user or admin
  // const adminUser = await User.findOne({ role: 'admin' })
  // await Attendance.updateMany(
  //   { markedBy: { $exists: false } },
  //   { $set: { markedBy: adminUser._id } }
  // )

  console.log('Migration complete')
}

migrate()
```

---

This prompt should be given to the backend developer or used when working on the backend repository to ensure all frontend features work correctly with dynamic data.

---

## 🆕 NEW: Ghost Student Prevention (Cascade Delete)

**Issue:** When a student is deleted, their enrollment records and attendance records remain orphaned in the database, causing "ghost students" to appear in enrollment lists (showing as blank/null entries).

### Required Backend Changes:

#### 1. Update Student Delete Endpoint

When deleting a student via `DELETE /students/:id`, cascade delete related records:

```javascript
// Route: DELETE /api/students/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.id
    
    // 1. Delete all enrollment records for this student
    const enrollmentResult = await SubjectEnrollment.deleteMany({ studentId })
    console.log(`Deleted ${enrollmentResult.deletedCount} enrollment records for student ${studentId}`)
    
    // 2. Delete or mark orphaned attendance records
    const attendanceResult = await Attendance.deleteMany({ studentId })
    console.log(`Deleted ${attendanceResult.deletedCount} attendance records for student ${studentId}`)
    
    // 3. Delete the student
    const student = await Student.findByIdAndDelete(studentId)
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' })
    }
    
    res.json({ 
      success: true, 
      message: 'Student and all related records deleted successfully',
      deletedEnrollments: enrollmentResult.deletedCount,
      deletedAttendance: attendanceResult.deletedCount
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})
```

#### 2. Alternative: Populate and Filter in getEnrolledStudents

If cascade delete is not feasible, ensure the `GET /subjects/:id/enrollments` endpoint filters out null students:

```javascript
// In the populate, filter out null student references
const enrollments = await SubjectEnrollment.find({ subjectId })
  .populate('studentId')
  .lean()

// Filter out orphaned enrollments
const validEnrollments = enrollments.filter(e => e.studentId != null)
```

---

## 🆕 NEW: Role-Based Access Control (RBAC)

**Frontend Update:** The frontend now supports three primary roles with different permissions:

### Role Definitions:

| Role | Permissions |
|------|-------------|
| **professor** | View students, view subjects, view/mark attendance, view records, send emails |
| **registrar** | All of above + create/edit/delete students, create/edit/delete subjects, manage enrollments, export records |
| **admin** | All permissions including user management |

### Required Backend Changes:

#### 1. Update User Model

Ensure the `User` model `role` field accepts the new roles:

```javascript
// models/User.js
const userSchema = new mongoose.Schema({
  // ... other fields
  role: {
    type: String,
    enum: ['professor', 'registrar', 'admin', 'superadmin', 'staff'],
    default: 'professor'
  }
})
```

#### 2. Create Role Middleware

```javascript
// middleware/roleMiddleware.js

const ROLE_PERMISSIONS = {
  professor: [
    'view_students', 'view_subjects', 'view_enrollments',
    'view_attendance', 'mark_attendance', 'view_records',
    'send_emails', 'view_email_history'
  ],
  registrar: [
    'view_students', 'create_student', 'edit_student', 'delete_student',
    'view_subjects', 'create_subject', 'edit_subject', 'delete_subject',
    'view_enrollments', 'manage_enrollments',
    'view_attendance', 'view_records', 'export_records',
    'send_emails', 'view_email_history'
  ],
  admin: [
    // All permissions
    'view_students', 'create_student', 'edit_student', 'delete_student',
    'view_subjects', 'create_subject', 'edit_subject', 'delete_subject',
    'view_enrollments', 'manage_enrollments',
    'view_attendance', 'mark_attendance', 'view_records', 'export_records',
    'send_emails', 'view_email_history', 'manage_users'
  ],
  superadmin: [/* Same as admin */]
}

const hasPermission = (role, permission) => {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

const requirePermission = (permission) => {
  return (req, res, next) => {
    const userRole = req.user?.role
    if (!userRole || !hasPermission(userRole, permission)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      })
    }
    next()
  }
}

module.exports = { hasPermission, requirePermission }
```

#### 3. Apply Middleware to Routes

```javascript
// Example: Protect student management routes
router.post('/students', 
  authenticateToken, 
  requirePermission('create_student'),
  studentController.create
)

router.put('/students/:id', 
  authenticateToken, 
  requirePermission('edit_student'),
  studentController.update
)

router.delete('/students/:id', 
  authenticateToken, 
  requirePermission('delete_student'),
  studentController.delete
)
```

---

## 🆕 NEW: Individual Student Records (Future Enhancement)

### Suggested Endpoints for Student Details:

#### 1. Get Student Enrollments

**Endpoint:** `GET /students/:id/enrollments`

```typescript
interface StudentEnrollmentHistory {
  id: string
  subject: {
    id: string
    subjectCode: string
    subjectName: string
    section: string
  }
  enrolledAt: string
  status: 'active' | 'dropped' | 'completed'
}
```

#### 2. Get Student Attendance Summary

**Endpoint:** `GET /students/:id/attendance/summary`

```typescript
interface StudentAttendanceSummary {
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
    late: number
    excused: number
    attendanceRate: number
  }>
}
```

---

## 🆕 NEW: Professional Email Templates

**Frontend Update:** The frontend now generates professional HTML email templates with modern styling. The backend should use these templates when sending emails.

### Email Template Structure

The frontend provides an email template generator at `src/utils/email-templates.ts` that creates professional HTML emails with:
- **Gradient headers** with school branding
- **Styled content area** with proper typography
- **Signature block** with sender info
- **Footer** with copyright information

### API Changes Required

#### 1. Accept HTML Content in Email Endpoint

Update `POST /emails/send` to accept HTML formatted emails:

```typescript
interface SendEmailRequest {
  to: string | string[]
  subject: string
  message: string          // Plain text message from user input
  html?: string            // Optional HTML formatted email
  attachments?: File[]
}
```

#### 2. Backend Email Template (Alternative)

If the backend prefers to generate HTML templates server-side, here's the recommended template structure:

```javascript
// utils/emailTemplate.js
function generateEmailTemplate({ recipientName, subject, message, senderName, senderRole, schoolName }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f4f7;">
  <table width="100%" style="background-color: #f4f4f7;">
    <tr>
      <td style="padding: 40px 20px;">
        <table style="max-width: 600px; margin: 0 auto;">
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%); padding: 40px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px;">${schoolName || 'School Administration'}</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Student Management System</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="background: #ffffff; padding: 40px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
              <p style="color: #6b7280;">Dear <strong style="color: #1f2937;">${recipientName}</strong>,</p>
              <h2 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px;">${subject}</h2>
              <div style="font-size: 15px; color: #374151; line-height: 1.6;">
                ${message.replace(/\n/g, '<br>')}
              </div>
              <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
              <div style="color: #6b7280; font-size: 14px;">
                <p style="margin: 0 0 8px;">Best regards,</p>
                <p style="margin: 0; font-weight: 600; color: #1f2937;">${senderName}</p>
                ${senderRole ? `<p style="margin: 4px 0 0; font-size: 13px; color: #9ca3af;">${senderRole}</p>` : ''}
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background: #f9fafb; padding: 24px; border-radius: 0 0 16px 16px; text-align: center; border: 1px solid #e5e7eb; border-top: none;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">This is an automated message from the Student Management System.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
```

### Template Types

The frontend supports these template types (backend can implement matching templates):

| Template | Use Case | Function |
|----------|----------|----------|
| `generateEmailTemplate` | General emails | Basic styled email with custom message |
| `generateAttendanceNotificationEmail` | Attendance alerts | Notify guardian of absence/late/excused |
| `generateWelcomeEmail` | New registration | Welcome email with student number |

### Example Usage

```javascript
// In your email sending controller
const { generateEmailTemplate } = require('./utils/emailTemplate');

router.post('/emails/send', async (req, res) => {
  const { to, subject, message, senderName, senderRole } = req.body;
  
  const htmlContent = generateEmailTemplate({
    recipientName: extractNameFromEmail(to),
    subject,
    message,
    senderName: senderName || req.user.name,
    senderRole: senderRole || req.user.role,
    schoolName: process.env.SCHOOL_NAME,
  });
  
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text: message, // Plain text fallback
    html: htmlContent,
  });
  
  res.json({ success: true });
});
```

---

## 🆕 NEW: Student Status Management

**Frontend Update:** The frontend now displays and filters students by status.

### Status Values

The frontend supports these student status values:

| Status | Color | Description |
|--------|-------|-------------|
| `active` | Green | Currently enrolled and attending |
| `inactive` | Gray | Temporarily not attending |
| `graduated` | Blue | Completed program |
| `transferred` | Amber | Transferred to another school |
| `suspended` | Red | Temporarily suspended |
| `dropped` | Rose | Dropped out |

### Backend Requirements

#### 1. Student Model Status Field

Ensure the Student model has a `status` field:

```javascript
const studentSchema = new mongoose.Schema({
  // ... other fields
  status: {
    type: String,
    enum: ['active', 'inactive', 'graduated', 'transferred', 'suspended', 'dropped'],
    default: 'active'
  }
})
```

#### 2. API Response Format

The `GET /students` endpoint should return students with their status:

```typescript
interface Student {
  id: string
  studentNumber: string
  firstName: string
  lastName: string
  email: string
  section?: string
  guardianName?: string
  guardianEmail?: string
  status: 'active' | 'inactive' | 'graduated' | 'transferred' | 'suspended' | 'dropped'
  createdAt: string
  updatedAt: string
}
```

#### 3. Filter Support (Optional Enhancement)

Consider adding query parameter support for status filtering:

```javascript
// GET /api/students?status=active
router.get('/', async (req, res) => {
  const { status } = req.query
  const filter = status ? { status } : {}
  const students = await Student.find(filter)
  res.json({ success: true, data: students })
})
```

---
