# 🔄 Complete Backend Sync Prompt for Notified Frontend

> **Version:** 2.0  
> **Date:** December 2024  
> **Purpose:** Sync backend with all frontend enhancements including Smart Triggers, Enhanced Emails, and Real-time Dashboard

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Models](#database-models)
3. [API Endpoints - Attendance](#api-endpoints---attendance)
4. [API Endpoints - Alerts](#api-endpoints---alerts)
5. [API Endpoints - Email](#api-endpoints---email)
6. [Background Jobs](#background-jobs)
7. [Response Format Standards](#response-format-standards)
8. [Testing Checklist](#testing-checklist)

---

## Overview

The Notified frontend has been enhanced with the following features that require backend support:

### Core Features

- ✅ **Real-time Dashboard Stats** - Today's attendance breakdown
- ✅ **Subject Attendance with Unmarked Students** - Show all enrolled students
- ✅ **Audit Trail** - Track who marked attendance (`markedBy` field)

### Smart Triggers System

- 🚨 **Consecutive Absence Alerts** - Auto-detect 3+ day absences
- 📉 **Low Attendance Warnings** - Alert when rate drops below 80%
- 🔔 **Alert Management** - Acknowledge, dismiss, notify

### Enhanced Email System

- 📧 **HTML Email Templates** - Professional branded emails
- ⏰ **Scheduled Delivery** - Queue emails for future sending
- 🔄 **Bounce Handling** - Track hard/soft bounces
- 🚫 **Unsubscribe Management** - GDPR-compliant opt-out

---

## Database Models

### 1. Alert Model (NEW)

```javascript
// models/Alert.js
const mongoose = require('mongoose')

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['consecutive_absence', 'low_attendance', 'pattern_warning'],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['warning', 'critical', 'info'],
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
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
      index: true,
    },
    acknowledgedAt: Date,
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
    notificationSentAt: Date,
  },
  {
    timestamps: true,
  }
)

// Compound indexes for common queries
alertSchema.index({ student: 1, type: 1, acknowledged: 1 })
alertSchema.index({ severity: 1, acknowledged: 1 })
alertSchema.index({ createdAt: -1 })

module.exports = mongoose.model('Alert', alertSchema)
```

### 2. Alert Configuration Model (NEW)

```javascript
// models/AlertConfig.js
const mongoose = require('mongoose')

const alertConfigSchema = new mongoose.Schema(
  {
    consecutiveAbsenceThreshold: {
      type: Number,
      default: 3,
      min: 1,
      max: 30,
    },
    lowAttendanceThreshold: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
    },
    enableConsecutiveAlerts: {
      type: Boolean,
      default: true,
    },
    enableLowAttendanceAlerts: {
      type: Boolean,
      default: true,
    },
    enablePatternAlerts: {
      type: Boolean,
      default: true,
    },
    autoSendEmail: {
      type: Boolean,
      default: false,
    },
    emailRecipients: [
      {
        type: String,
        enum: ['guardian', 'student', 'admin'],
      },
    ],
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('AlertConfig', alertConfigSchema)
```

### 3. Scheduled Email Model (NEW)

```javascript
// models/ScheduledEmail.js
const mongoose = require('mongoose')

const scheduledEmailSchema = new mongoose.Schema(
  {
    to: [
      {
        type: String,
        required: true,
      },
    ],
    subject: {
      type: String,
      required: true,
    },
    html: {
      type: String,
      required: true,
    },
    text: String,
    attachments: [
      {
        filename: String,
        content: String,
        contentType: String,
        encoding: String,
      },
    ],
    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    sentAt: Date,
    error: String,
    tags: [String],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
)

// Index for the scheduled email worker
scheduledEmailSchema.index({ status: 1, scheduledAt: 1 })

module.exports = mongoose.model('ScheduledEmail', scheduledEmailSchema)
```

### 4. Email Bounce Model (NEW)

```javascript
// models/EmailBounce.js
const mongoose = require('mongoose')

const emailBounceSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['hard', 'soft'],
      required: true,
    },
    reason: String,
    originalEmailId: String,
    bounceCount: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
)

// Unique index on email
emailBounceSchema.index({ email: 1 }, { unique: true })

module.exports = mongoose.model('EmailBounce', emailBounceSchema)
```

### 5. Unsubscribe Model (NEW)

```javascript
// models/Unsubscribe.js
const mongoose = require('mongoose')

const unsubscribeSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    reason: String,
    status: {
      type: String,
      enum: ['unsubscribed', 'resubscribed'],
      default: 'unsubscribed',
    },
    resubscribedAt: Date,
    token: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('Unsubscribe', unsubscribeSchema)
```

### 6. Update Attendance Model

Add `markedBy` field to existing Attendance model:

```javascript
// Add to existing Attendance schema
const attendanceSchema = new mongoose.Schema(
  {
    // ... existing fields ...

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
)
```

---

## API Endpoints - Attendance

### GET /api/attendance/today/stats

Returns today's attendance breakdown for dashboard.

**Response:**

```json
{
  "success": true,
  "data": {
    "present": 45,
    "absent": 8,
    "late": 12,
    "excused": 3,
    "unmarked": 22,
    "total": 90,
    "attendanceRate": 84
  }
}
```

**Implementation:**

```javascript
// controllers/attendanceController.js
exports.getTodayStats = async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get today's attendance records
    const records = await Attendance.find({
      date: { $gte: today, $lt: tomorrow },
    })

    // Count by status
    const stats = { present: 0, absent: 0, late: 0, excused: 0 }
    records.forEach((r) => {
      if (stats.hasOwnProperty(r.status)) stats[r.status]++
    })

    // Get total enrolled students
    const totalEnrolled = await Enrollment.countDocuments({ status: 'active' })
    const unmarked = Math.max(0, totalEnrolled - records.length)

    // Calculate attendance rate
    const marked = stats.present + stats.absent + stats.late + stats.excused
    const attendanceRate =
      marked > 0 ? Math.round(((stats.present + stats.late) / marked) * 100) : 0

    res.json({
      success: true,
      data: { ...stats, unmarked, total: totalEnrolled, attendanceRate },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
```

### GET /api/attendance/subject/:subjectId/date/:date

Returns ALL enrolled students with their attendance status.

**Response:**

```json
{
  "success": true,
  "data": {
    "subjectId": "507f1f77bcf86cd799439011",
    "date": "2024-12-03",
    "students": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "studentId": 1001,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "status": "present",
        "markedAt": "2024-12-03T08:30:00Z",
        "markedBy": "507f1f77bcf86cd799439013"
      },
      {
        "_id": "507f1f77bcf86cd799439014",
        "studentId": 1002,
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com",
        "status": "unmarked",
        "markedAt": null,
        "markedBy": null
      }
    ],
    "stats": {
      "present": 15,
      "absent": 3,
      "late": 2,
      "excused": 1,
      "unmarked": 4,
      "total": 25
    }
  }
}
```

### POST /api/attendance/subject/mark

Mark attendance with audit trail.

**Request:**

```json
{
  "subjectId": "507f1f77bcf86cd799439011",
  "studentId": "507f1f77bcf86cd799439012",
  "status": "present",
  "date": "2024-12-03"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "student": "507f1f77bcf86cd799439012",
    "subject": "507f1f77bcf86cd799439011",
    "status": "present",
    "date": "2024-12-03T00:00:00Z",
    "markedBy": "507f1f77bcf86cd799439013",
    "createdAt": "2024-12-03T08:30:00Z"
  },
  "message": "Attendance marked successfully"
}
```

**Implementation note:** Always set `markedBy` to `req.user._id`

---

## API Endpoints - Alerts

### GET /api/alerts

Get alerts with optional filters.

**Query Parameters:**

- `type`: consecutive_absence | low_attendance | pattern_warning
- `severity`: warning | critical | info
- `acknowledged`: true | false
- `studentId`: MongoDB ObjectId
- `subjectId`: MongoDB ObjectId

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439016",
      "type": "consecutive_absence",
      "severity": "critical",
      "studentId": "507f1f77bcf86cd799439012",
      "studentName": "John Doe",
      "studentNumber": "24-0001",
      "subjectId": "507f1f77bcf86cd799439011",
      "subjectName": "Mathematics",
      "message": "John Doe has been absent for 5 consecutive days",
      "details": {
        "consecutiveDays": 5,
        "startDate": "2024-11-27",
        "endDate": "2024-12-03",
        "threshold": 3
      },
      "acknowledged": false,
      "createdAt": "2024-12-03T06:00:00Z"
    }
  ]
}
```

### GET /api/alerts/summary

**Response:**

```json
{
  "success": true,
  "data": {
    "total": 15,
    "critical": 3,
    "warning": 10,
    "unacknowledged": 8,
    "byType": {
      "consecutive_absence": 5,
      "low_attendance": 8,
      "pattern_warning": 2
    }
  }
}
```

### PUT /api/alerts/:alertId/acknowledge

**Response:**

```json
{
  "success": true,
  "message": "Alert acknowledged"
}
```

### PUT /api/alerts/acknowledge-multiple

**Request:**

```json
{
  "alertIds": ["id1", "id2", "id3"]
}
```

### DELETE /api/alerts/:alertId

Dismiss/delete an alert.

### GET /api/alerts/consecutive-absences

**Query:** `?threshold=3`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "studentId": "507f1f77bcf86cd799439012",
      "studentName": "John Doe",
      "consecutiveDays": 5,
      "startDate": "2024-11-27",
      "subjects": ["Mathematics", "Science"]
    }
  ]
}
```

### GET /api/alerts/low-attendance

**Query:** `?threshold=80`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "studentId": "507f1f77bcf86cd799439012",
      "studentName": "John Doe",
      "attendanceRate": 65,
      "totalClasses": 40,
      "attendedClasses": 26
    }
  ]
}
```

### GET /api/alerts/config

**Response:**

```json
{
  "success": true,
  "data": {
    "consecutiveAbsenceThreshold": 3,
    "lowAttendanceThreshold": 80,
    "enableConsecutiveAlerts": true,
    "enableLowAttendanceAlerts": true,
    "enablePatternAlerts": true,
    "autoSendEmail": false,
    "emailRecipients": ["guardian"]
  }
}
```

### PUT /api/alerts/config

Update configuration.

### POST /api/alerts/scan

Manually trigger alert generation.

**Response:**

```json
{
  "success": true,
  "data": {
    "newAlerts": 5,
    "scannedStudents": 150
  }
}
```

### POST /api/alerts/:alertId/notify

Send notification email for an alert.

**Request:**

```json
{
  "recipients": ["guardian", "admin"]
}
```

---

## API Endpoints - Email

### POST /api/emails/send-html

Send HTML email.

**Request:**

```json
{
  "to": "parent@example.com",
  "subject": "Attendance Alert",
  "html": "<html>...</html>",
  "text": "Plain text fallback",
  "attachments": [
    {
      "filename": "report.pdf",
      "content": "base64...",
      "contentType": "application/pdf"
    }
  ],
  "tags": ["alert", "attendance"]
}
```

### POST /api/emails/schedule

**Request:**

```json
{
  "to": "parent@example.com",
  "subject": "Weekly Report",
  "html": "<html>...</html>",
  "scheduledAt": "2024-12-04T09:00:00Z"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439017",
    "to": ["parent@example.com"],
    "subject": "Weekly Report",
    "scheduledAt": "2024-12-04T09:00:00Z",
    "status": "pending",
    "createdAt": "2024-12-03T10:00:00Z"
  }
}
```

### GET /api/emails/scheduled

**Query:** `?status=pending`

### DELETE /api/emails/scheduled/:emailId

Cancel a scheduled email.

### PUT /api/emails/scheduled/:emailId

Reschedule an email.

**Request:**

```json
{
  "scheduledAt": "2024-12-05T09:00:00Z"
}
```

### GET /api/emails/bounces

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439018",
      "email": "invalid@example.com",
      "type": "hard",
      "reason": "Mailbox does not exist",
      "timestamp": "2024-12-03T08:00:00Z"
    }
  ]
}
```

### GET /api/emails/bounces/check/:email

**Response:**

```json
{
  "success": true,
  "data": {
    "bounced": true,
    "type": "hard"
  }
}
```

### DELETE /api/emails/bounces/:email

Remove from bounce list.

### GET /api/emails/unsubscribes

### GET /api/emails/unsubscribes/check/:email

**Response:**

```json
{
  "success": true,
  "data": {
    "unsubscribed": true
  }
}
```

### POST /api/emails/unsubscribes

**Request:**

```json
{
  "email": "user@example.com",
  "reason": "Too many emails"
}
```

### DELETE /api/emails/unsubscribes/:email

Resubscribe an email.

### GET /api/emails/stats

**Query:** `?period=week` (day | week | month)

**Response:**

```json
{
  "success": true,
  "data": {
    "totalSent": 250,
    "delivered": 240,
    "bounced": 8,
    "pending": 5,
    "opens": 180,
    "clicks": 45,
    "bounceRate": 3.2,
    "deliveryRate": 96
  }
}
```

---

## Background Jobs

### 1. Alert Scanner (Daily at 6 AM)

```javascript
// jobs/alertScanner.js
const cron = require('node-cron')
const Alert = require('../models/Alert')
const AlertConfig = require('../models/AlertConfig')
const Student = require('../models/Student')
const Attendance = require('../models/Attendance')

// Run daily at 6 AM
cron.schedule('0 6 * * *', async () => {
  console.log('Running alert scanner...')

  try {
    const config = (await AlertConfig.findOne()) || {
      consecutiveAbsenceThreshold: 3,
      lowAttendanceThreshold: 80,
      enableConsecutiveAlerts: true,
      enableLowAttendanceAlerts: true,
    }

    let newAlerts = 0

    if (config.enableConsecutiveAlerts) {
      newAlerts += await scanConsecutiveAbsences(config.consecutiveAbsenceThreshold)
    }

    if (config.enableLowAttendanceAlerts) {
      newAlerts += await scanLowAttendance(config.lowAttendanceThreshold)
    }

    console.log(`Alert scan complete: ${newAlerts} new alerts generated`)
  } catch (error) {
    console.error('Alert scanner error:', error)
  }
})

async function scanConsecutiveAbsences(threshold) {
  const students = await Student.find({ status: 'active' })
  let alertsCreated = 0

  for (const student of students) {
    const records = await Attendance.find({ student: student._id })
      .sort({ date: -1 })
      .limit(threshold + 5)

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
      // Check if similar alert exists
      const existing = await Alert.findOne({
        student: student._id,
        type: 'consecutive_absence',
        acknowledged: false,
        'details.consecutiveDays': { $gte: consecutive - 1 },
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
        alertsCreated++
      }
    }
  }

  return alertsCreated
}

async function scanLowAttendance(threshold) {
  // Use aggregation for efficiency
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
        rate: { $multiply: [{ $divide: ['$attended', '$total'] }, 100] },
        total: 1,
        attended: 1,
      },
    },
    { $match: { rate: { $lt: threshold }, total: { $gte: 10 } } },
  ])

  let alertsCreated = 0

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
        severity: stat.rate < 60 ? 'critical' : 'warning',
        student: stat._id,
        message: `${student.firstName} ${student.lastName}'s attendance rate is ${Math.round(stat.rate)}%`,
        details: {
          attendanceRate: Math.round(stat.rate),
          threshold,
        },
      })
      alertsCreated++
    }
  }

  return alertsCreated
}
```

### 2. Scheduled Email Worker (Every Minute)

```javascript
// jobs/emailWorker.js
const cron = require('node-cron')
const ScheduledEmail = require('../models/ScheduledEmail')
const { sendEmail } = require('../services/emailService')

// Run every minute
cron.schedule('* * * * *', async () => {
  const now = new Date()

  const emailsToSend = await ScheduledEmail.find({
    status: 'pending',
    scheduledAt: { $lte: now },
  }).limit(10)

  for (const email of emailsToSend) {
    try {
      await sendEmail({
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
        attachments: email.attachments,
      })

      email.status = 'sent'
      email.sentAt = new Date()
    } catch (error) {
      email.status = 'failed'
      email.error = error.message

      // Track bounce if applicable
      if (error.message.includes('bounce') || error.message.includes('invalid')) {
        await EmailBounce.findOneAndUpdate(
          { email: email.to[0] },
          {
            $set: { type: 'hard', reason: error.message },
            $inc: { bounceCount: 1 },
          },
          { upsert: true }
        )
      }
    }

    await email.save()
  }
})
```

---

## Response Format Standards

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "errors": {
    "field": ["Validation error message"]
  }
}
```

### Pagination Response

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Important Notes

1. **All MongoDB ObjectIds must be serialized as strings** - Frontend uses `String()` for comparisons
2. **Dates should be ISO 8601 format** - `2024-12-03T08:30:00Z`
3. **Always include `markedBy` in attendance responses**
4. **Check unsubscribe list before sending emails**
5. **Check bounce list before sending emails** (skip hard bounces)

---

## Testing Checklist

### Attendance Endpoints

- [ ] `GET /attendance/today/stats` returns accurate counts
- [ ] `GET /attendance/subject/:id/date/:date` includes ALL enrolled students
- [ ] Unmarked students have `status: 'unmarked'`
- [ ] `markedBy` is set when marking attendance
- [ ] Bulk mark works correctly

### Alert Endpoints

- [ ] `GET /alerts` filters work correctly
- [ ] `GET /alerts/summary` shows accurate counts
- [ ] Alert acknowledgment updates database
- [ ] Consecutive absence detection works (test with 3+ absent days)
- [ ] Low attendance detection works (test with <80% rate)
- [ ] Alert scan creates new alerts

### Email Endpoints

- [ ] HTML emails are sent correctly
- [ ] Scheduled emails are queued properly
- [ ] Scheduled email worker sends on time
- [ ] Bounced emails are tracked
- [ ] Unsubscribe prevents future emails
- [ ] Resubscribe works

### Background Jobs

- [ ] Alert scanner runs daily
- [ ] Email worker runs every minute
- [ ] Error handling doesn't crash jobs

---

## API Routes Summary

```javascript
// routes/index.js

// Attendance
router.get('/attendance/today/stats', auth, attendanceController.getTodayStats)
router.get(
  '/attendance/subject/:subjectId/date/:date',
  auth,
  attendanceController.getSubjectAttendance
)
router.post('/attendance/subject/mark', auth, attendanceController.markAttendance)
router.post('/attendance/subject/bulk-mark', auth, attendanceController.bulkMarkAttendance)

// Alerts
router.get('/alerts', auth, alertController.getAlerts)
router.get('/alerts/summary', auth, alertController.getSummary)
router.put('/alerts/:alertId/acknowledge', auth, alertController.acknowledge)
router.put('/alerts/acknowledge-multiple', auth, alertController.acknowledgeMultiple)
router.delete('/alerts/:alertId', auth, alertController.dismiss)
router.get('/alerts/consecutive-absences', auth, alertController.getConsecutiveAbsences)
router.get('/alerts/low-attendance', auth, alertController.getLowAttendance)
router.get('/alerts/config', auth, alertController.getConfig)
router.put('/alerts/config', auth, admin, alertController.updateConfig)
router.post('/alerts/scan', auth, admin, alertController.runScan)
router.post('/alerts/:alertId/notify', auth, alertController.sendNotification)

// Email
router.post('/emails/send-html', auth, emailController.sendHtml)
router.post('/emails/schedule', auth, emailController.schedule)
router.get('/emails/scheduled', auth, emailController.getScheduled)
router.delete('/emails/scheduled/:emailId', auth, emailController.cancelScheduled)
router.put('/emails/scheduled/:emailId', auth, emailController.reschedule)
router.get('/emails/bounces', auth, emailController.getBounces)
router.get('/emails/bounces/check/:email', auth, emailController.checkBounce)
router.delete('/emails/bounces/:email', auth, admin, emailController.removeBounce)
router.get('/emails/unsubscribes', auth, emailController.getUnsubscribes)
router.get('/emails/unsubscribes/check/:email', auth, emailController.checkUnsubscribe)
router.post('/emails/unsubscribes', emailController.unsubscribe) // Public for unsubscribe links
router.delete('/emails/unsubscribes/:email', auth, admin, emailController.resubscribe)
router.get('/emails/stats', auth, emailController.getStats)
```

---

This document should be used by the backend team to implement all required endpoints for the frontend enhancements.
