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

## 🚨 NEW: Smart Triggers & Alerts System

The frontend now includes an Alert Center for monitoring attendance issues automatically.

### NEW ENDPOINTS: Alert Management

#### 1. Get All Alerts

**Endpoint:** `GET /alerts`

**Query Parameters:**

- `type`: 'consecutive_absence' | 'low_attendance' | 'pattern_warning'
- `severity`: 'warning' | 'critical' | 'info'
- `acknowledged`: boolean
- `studentId`: string
- `subjectId`: string

**Response:**

```typescript
{
  success: true,
  data: Array<{
    id: string
    type: 'consecutive_absence' | 'low_attendance' | 'pattern_warning'
    severity: 'warning' | 'critical' | 'info'
    studentId: string
    studentName: string
    studentNumber: string
    subjectId?: string
    subjectName?: string
    message: string
    details: {
      consecutiveDays?: number
      attendanceRate?: number
      threshold?: number
      startDate?: string
      endDate?: string
    }
    acknowledged: boolean
    createdAt: string
    acknowledgedAt?: string
    acknowledgedBy?: string
  }>
}
```

#### 2. Get Alert Summary

**Endpoint:** `GET /alerts/summary`

**Response:**

```typescript
{
  success: true,
  data: {
    total: number
    critical: number
    warning: number
    unacknowledged: number
    byType: {
      consecutive_absence: number
      low_attendance: number
      pattern_warning: number
    }
  }
}
```

#### 3. Acknowledge Alert

**Endpoint:** `PUT /alerts/:alertId/acknowledge`

#### 4. Acknowledge Multiple Alerts

**Endpoint:** `PUT /alerts/acknowledge-multiple`

**Request Body:**

```json
{ "alertIds": ["id1", "id2", "id3"] }
```

#### 5. Dismiss Alert

**Endpoint:** `DELETE /alerts/:alertId`

#### 6. Get Students with Consecutive Absences

**Endpoint:** `GET /alerts/consecutive-absences?threshold=3`

**Response:**

```typescript
{
  success: true,
  data: Array<{
    studentId: string
    studentName: string
    consecutiveDays: number
    startDate: string
    subjects: string[]
  }>
}
```

#### 7. Get Students with Low Attendance

**Endpoint:** `GET /alerts/low-attendance?threshold=80`

**Response:**

```typescript
{
  success: true,
  data: Array<{
    studentId: string
    studentName: string
    attendanceRate: number
    totalClasses: number
    attendedClasses: number
  }>
}
```

#### 8. Get Alert Configuration

**Endpoint:** `GET /alerts/config`

**Response:**

```typescript
{
  success: true,
  data: {
    consecutiveAbsenceThreshold: number  // Default: 3
    lowAttendanceThreshold: number       // Default: 80
    enableConsecutiveAlerts: boolean
    enableLowAttendanceAlerts: boolean
    enablePatternAlerts: boolean
    autoSendEmail: boolean
    emailRecipients: ('guardian' | 'student' | 'admin')[]
  }
}
```

#### 9. Update Alert Configuration

**Endpoint:** `PUT /alerts/config`

#### 10. Run Alert Scan

**Endpoint:** `POST /alerts/scan`

Manually triggers a scan of all students to generate new alerts.

**Response:**

```typescript
{
  success: true,
  data: {
    newAlerts: number
    scannedStudents: number
  }
}
```

#### 11. Send Alert Notification

**Endpoint:** `POST /alerts/:alertId/notify`

**Request Body:**

```json
{ "recipients": ["guardian", "admin"] }
```

### Alert Model Schema

```javascript
const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['consecutive_absence', 'low_attendance', 'pattern_warning'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['warning', 'critical', 'info'],
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    },
    message: {
      type: String,
      required: true,
    },
    details: {
      consecutiveDays: Number,
      attendanceRate: Number,
      threshold: Number,
      startDate: Date,
      endDate: Date,
    },
    acknowledged: {
      type: Boolean,
      default: false,
    },
    acknowledgedAt: Date,
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
)

// Index for efficient queries
alertSchema.index({ student: 1, type: 1, acknowledged: 1 })
alertSchema.index({ severity: 1, acknowledged: 1 })
alertSchema.index({ createdAt: -1 })
```

### Alert Generation Logic

```javascript
// Run this as a scheduled job (e.g., daily at 6 AM)
async function generateAlerts() {
  const config = (await AlertConfig.findOne()) || DEFAULT_CONFIG

  if (config.enableConsecutiveAlerts) {
    await checkConsecutiveAbsences(config.consecutiveAbsenceThreshold)
  }

  if (config.enableLowAttendanceAlerts) {
    await checkLowAttendance(config.lowAttendanceThreshold)
  }
}

async function checkConsecutiveAbsences(threshold) {
  // Get all students
  const students = await Student.find({ status: 'active' })

  for (const student of students) {
    // Get last N attendance records
    const records = await Attendance.find({ student: student._id })
      .sort({ date: -1 })
      .limit(threshold + 2)

    // Count consecutive absences from most recent
    let consecutive = 0
    let startDate = null
    let endDate = null

    for (const record of records) {
      if (record.status === 'absent') {
        consecutive++
        if (!endDate) endDate = record.date
        startDate = record.date
      } else {
        break
      }
    }

    if (consecutive >= threshold) {
      // Check if alert already exists
      const existing = await Alert.findOne({
        student: student._id,
        type: 'consecutive_absence',
        acknowledged: false,
        'details.consecutiveDays': consecutive,
      })

      if (!existing) {
        await Alert.create({
          type: 'consecutive_absence',
          severity: consecutive >= 5 ? 'critical' : 'warning',
          student: student._id,
          message: `${student.firstName} ${student.lastName} has been absent for ${consecutive} consecutive days`,
          details: {
            consecutiveDays: consecutive,
            startDate,
            endDate,
            threshold,
          },
        })
      }
    }
  }
}

async function checkLowAttendance(threshold) {
  // Get attendance rates for all students
  const stats = await Attendance.aggregate([
    {
      $group: {
        _id: '$student',
        total: { $sum: 1 },
        attended: {
          $sum: {
            $cond: [{ $in: ['$status', ['present', 'late', 'excused']] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        attendanceRate: {
          $multiply: [{ $divide: ['$attended', '$total'] }, 100],
        },
        total: 1,
        attended: 1,
      },
    },
    {
      $match: {
        attendanceRate: { $lt: threshold },
        total: { $gte: 5 }, // Minimum records to trigger
      },
    },
  ])

  for (const stat of stats) {
    const student = await Student.findById(stat._id)
    if (!student) continue

    const existing = await Alert.findOne({
      student: stat._id,
      type: 'low_attendance',
      acknowledged: false,
    })

    if (!existing) {
      await Alert.create({
        type: 'low_attendance',
        severity: stat.attendanceRate < 60 ? 'critical' : 'warning',
        student: stat._id,
        message: `${student.firstName} ${student.lastName}'s attendance rate is ${Math.round(stat.attendanceRate)}%`,
        details: {
          attendanceRate: Math.round(stat.attendanceRate),
          threshold,
        },
      })
    }
  }
}
```

---

## ✉️ NEW: Enhanced Email System

### NEW ENDPOINTS: Email Enhancements

#### 1. Send HTML Email

**Endpoint:** `POST /emails/send-html`

**Request Body:**

```json
{
  "to": "email@example.com",
  "subject": "Subject line",
  "html": "<html>...</html>",
  "text": "Plain text fallback",
  "attachments": [
    {
      "filename": "document.pdf",
      "content": "base64...",
      "contentType": "application/pdf"
    }
  ],
  "tags": ["alert", "attendance"]
}
```

#### 2. Schedule Email

**Endpoint:** `POST /emails/schedule`

**Request Body:**

```json
{
  "to": "email@example.com",
  "subject": "Subject",
  "html": "<html>...</html>",
  "scheduledAt": "2024-12-04T09:00:00Z"
}
```

**Response:**

```typescript
{
  success: true,
  data: {
    id: string
    to: string
    subject: string
    scheduledAt: string
    status: 'pending'
    createdAt: string
  }
}
```

#### 3. Get Scheduled Emails

**Endpoint:** `GET /emails/scheduled?status=pending`

#### 4. Cancel Scheduled Email

**Endpoint:** `DELETE /emails/scheduled/:emailId`

#### 5. Get Email Bounces

**Endpoint:** `GET /emails/bounces`

**Response:**

```typescript
{
  success: true,
  data: Array<{
    id: string
    email: string
    type: 'hard' | 'soft'
    reason: string
    timestamp: string
  }>
}
```

#### 6. Check Email Bounce Status

**Endpoint:** `GET /emails/bounces/check/:email`

**Response:**

```json
{ "success": true, "data": { "bounced": true, "type": "hard" } }
```

#### 7. Get Unsubscribes

**Endpoint:** `GET /emails/unsubscribes`

#### 8. Check Unsubscribe Status

**Endpoint:** `GET /emails/unsubscribes/check/:email`

#### 9. Unsubscribe Email

**Endpoint:** `POST /emails/unsubscribes`

**Request Body:**

```json
{ "email": "user@example.com", "reason": "Too many emails" }
```

#### 10. Resubscribe Email

**Endpoint:** `DELETE /emails/unsubscribes/:email`

#### 11. Get Email Stats

**Endpoint:** `GET /emails/stats?period=week`

**Response:**

```typescript
{
  success: true,
  data: {
    totalSent: number
    delivered: number
    bounced: number
    pending: number
    opens: number
    clicks: number
    bounceRate: number
    deliveryRate: number
  }
}
```

### Email Models

```javascript
// ScheduledEmail model
const scheduledEmailSchema = new mongoose.Schema(
  {
    to: [String],
    subject: String,
    html: String,
    text: String,
    attachments: [
      {
        filename: String,
        content: String,
        contentType: String,
      },
    ],
    scheduledAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'cancelled'],
      default: 'pending',
    },
    sentAt: Date,
    error: String,
  },
  { timestamps: true }
)

// EmailBounce model
const emailBounceSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true },
    type: { type: String, enum: ['hard', 'soft'], required: true },
    reason: String,
    originalEmailId: String,
  },
  { timestamps: true }
)

// Unsubscribe model
const unsubscribeSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    reason: String,
    status: {
      type: String,
      enum: ['unsubscribed', 'resubscribed'],
      default: 'unsubscribed',
    },
    resubscribedAt: Date,
  },
  { timestamps: true }
)
```

### Scheduled Email Worker

```javascript
// Run every minute to check for emails to send
const cron = require('node-cron')

cron.schedule('* * * * *', async () => {
  const now = new Date()

  const emailsToSend = await ScheduledEmail.find({
    status: 'pending',
    scheduledAt: { $lte: now },
  }).limit(10)

  for (const email of emailsToSend) {
    try {
      await sendEmail(email)
      email.status = 'sent'
      email.sentAt = new Date()
    } catch (error) {
      email.status = 'failed'
      email.error = error.message
    }
    await email.save()
  }
})
```

---

## 📋 Updated Testing Checklist

After implementing all features, verify:

### Attendance & Stats

- [ ] `GET /attendance/today/stats` returns correct counts
- [ ] Unmarked students appear in subject attendance list
- [ ] Status filter counts match actual data
- [ ] `markedBy` field is populated when marking attendance

### Alerts System

- [ ] `GET /alerts` returns filtered alerts correctly
- [ ] `GET /alerts/summary` shows accurate counts
- [ ] Acknowledging alerts updates their status
- [ ] Consecutive absence detection works correctly
- [ ] Low attendance alerts trigger at threshold
- [ ] Alert notifications send emails

### Email System

- [ ] HTML emails render correctly
- [ ] Scheduled emails are sent at correct time
- [ ] Bounced emails are tracked
- [ ] Unsubscribe links work
- [ ] Email attachments are handled

---

## 🚀 Updated Features Summary

| Feature                    | Required Endpoint                    |
| -------------------------- | ------------------------------------ |
| Today's Summary Widget     | `GET /attendance/today/stats`        |
| Alert Center Dashboard     | `GET /alerts`, `GET /alerts/summary` |
| Consecutive Absence Alerts | `GET /alerts/consecutive-absences`   |
| Low Attendance Warnings    | `GET /alerts/low-attendance`         |
| Alert Notifications        | `POST /alerts/:id/notify`            |
| Scheduled Emails           | `POST /emails/schedule`              |
| Bounce Handling            | `GET /emails/bounces`                |
| Unsubscribe Management     | `GET/POST /emails/unsubscribes`      |
| Email Statistics           | `GET /emails/stats`                  |
