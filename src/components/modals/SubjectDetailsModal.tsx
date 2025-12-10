/**
 * SubjectDetailsModal - Enhanced Version with Optimistic Updates
 *
 * Fixes:
 * 1. Proper spinner animations for marking attendance
 * 2. Reflects current attendance status (unmarked/present/late/absent)
 * 3. Snappy enrollment with optimistic updates
 * 4. Dynamic attendance stats updates
 * 5. Real-time enrolled student count
 * 6. Fixed: Students marked status updates immediately (no longer shows "unmarked" after marking)
 * 7. Defensive programming: Handles non-array API responses gracefully
 * 8. Error boundary wrapper for graceful error handling
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  BookOpen,
  Users,
  ClipboardList,
  Calendar,
  Clock,
  Mail,
  MapPin,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserPlus,
  UserMinus,
  Building2,
  Save,
  Loader2,
  Trash2,
  Edit,
  Info,
  ChevronRight,
  Keyboard,
  Download,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import ErrorBoundary from '@/components/ui/error-boundary'
import { useToast } from '@/store/toastStore'
import { Subject, AttendanceRecord } from '@/types'
import { SubjectScheduleSlot } from '@/types/subject.types'
import { subjectEnrollmentService } from '@/services/subject-enrollment.service'
import { subjectAttendanceService } from '@/services/subject-attendance.service'
import { studentService } from '@/services/student.service'
import { subjectService } from '@/services/subject.service'
import { getEmailHistory, EmailHistoryRecord } from '@/services/email.service'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import * as XLSX from 'xlsx'
import { attendanceMarkedFeedback, selectionFeedback } from '@/utils/feedbackUtils'

interface SubjectDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  subject: Subject | null
}

type TabType = 'overview' | 'students' | 'attendance' | 'schedule'

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

type Day = SubjectScheduleSlot['days'][number]

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = () => {
  const date = new Date()
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60 * 1000)
  return localDate.toISOString().split('T')[0]
}

function SubjectDetailsModal({ isOpen, onClose, subject }: SubjectDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState(getLocalDateString())
  const [selectedStudents, setSelectedStudents] = useState<Set<string | number>>(new Set())
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'present' | 'absent' | 'late' | 'excused' | 'unmarked'
  >('all')

  // Loading states for individual student marking
  const [markingStudents, setMarkingStudents] = useState<Set<string | number>>(new Set())

  // Keyboard navigation state
  const [focusedStudentIndex, setFocusedStudentIndex] = useState<number>(-1)
  const [showShortcutsHint, setShowShortcutsHint] = useState(false)

  // Dialog States
  const [enrollAllConfirm, setEnrollAllConfirm] = useState(false)
  const [markAllConfirm, setMarkAllConfirm] = useState<{
    isOpen: boolean
    status: 'present' | 'absent' | 'late' | 'excused' | null
    scheduleSlot: string | null
  }>({ isOpen: false, status: null, scheduleSlot: null })

  // Schedule management state
  const [schedules, setSchedules] = useState<SubjectScheduleSlot[]>([])
  const [isEditingSchedules, setIsEditingSchedules] = useState(false)
  const [editingScheduleIndex, setEditingScheduleIndex] = useState<number | null>(null)
  const [scheduleForm, setScheduleForm] = useState<SubjectScheduleSlot>({
    slotName: '',
    days: [],
    startTime: '',
    endTime: '',
    room: '',
    building: '',
  })

  // Selected schedule slot for attendance
  const [selectedScheduleSlot, setSelectedScheduleSlot] = useState<string | null>(null)

  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // --- Initialization & Data Normalization ---

  useEffect(() => {
    if (isOpen && subject) {
      setActiveTab('overview')
      setSearchTerm('')
      setSelectedStudents(new Set())
      setSelectedDate(getLocalDateString())
      setIsEditingSchedules(false)
      setEditingScheduleIndex(null)
      setSelectedScheduleSlot(null)
      setMarkingStudents(new Set())

      // Force refresh of students list to remove deleted ones
      queryClient.invalidateQueries({ queryKey: ['students'] })

      // Normalize Legacy Schedule Data
      const subjectEnhanced = subject as any
      if (subjectEnhanced.schedules && Array.isArray(subjectEnhanced.schedules)) {
        setSchedules(subjectEnhanced.schedules)
      } else if (subjectEnhanced.schedule) {
        setSchedules([
          {
            slotName: 'Regular Class',
            days: subjectEnhanced.schedule.days || [],
            startTime: subjectEnhanced.schedule.startTime || '',
            endTime: subjectEnhanced.schedule.endTime || '',
            room: subjectEnhanced.schedule.room || '',
            building: subjectEnhanced.schedule.building || '',
          },
        ])
      } else {
        setSchedules([])
      }

      setScheduleForm({
        slotName: '',
        days: [],
        startTime: '',
        endTime: '',
        room: '',
        building: '',
      })
    }
  }, [isOpen, subject, queryClient])

  // --- Queries ---

  const {
    data: enrolledStudents = [],
    isLoading: loadingEnrolled,
    refetch: refetchEnrolled,
  } = useQuery({
    queryKey: ['subjects', subject?.id, 'students'],
    queryFn: () => subjectEnrollmentService.getEnrolledStudents(subject!.id),
    enabled: isOpen && !!subject,
  })

  const validEnrolledStudents = useMemo(() => {
    const valid = enrolledStudents.filter((e) => !!e.student)
    const orphanedCount = enrolledStudents.length - valid.length
    if (orphanedCount > 0 && subject) {
      console.warn(
        `[SubjectDetails] Found ${orphanedCount} orphaned enrollment(s) in subject ${subject.subjectCode} - these students may have been deleted but their enrollment records remain`
      )
    }
    return valid
  }, [enrolledStudents, subject])

  const { data: allStudents = [], isLoading: loadingAllStudents } = useQuery({
    queryKey: ['students'],
    queryFn: studentService.getAll,
    enabled: isOpen && activeTab === 'students',
    staleTime: 0,
    refetchOnMount: true,
  })

  const {
    data: rawAttendanceRecords,
    isLoading: loadingAttendance,
    refetch: refetchAttendance,
  } = useQuery({
    queryKey: ['subjects', subject?.id, 'attendance', selectedDate],
    queryFn: () => subjectAttendanceService.getSubjectAttendanceByDate(subject!.id, selectedDate),
    enabled: isOpen && !!subject && activeTab === 'attendance',
  })

  // Ensure attendanceRecords is always an array (defensive programming)
  const attendanceRecords = useMemo(() => {
    if (!rawAttendanceRecords) return []
    if (Array.isArray(rawAttendanceRecords)) return rawAttendanceRecords
    // Handle case where API returns an object with records array
    if (typeof rawAttendanceRecords === 'object' && 'records' in rawAttendanceRecords) {
      return Array.isArray((rawAttendanceRecords as any).records)
        ? (rawAttendanceRecords as any).records
        : []
    }
    // Handle case where API returns an object with data array
    if (typeof rawAttendanceRecords === 'object' && 'data' in rawAttendanceRecords) {
      return Array.isArray((rawAttendanceRecords as any).data)
        ? (rawAttendanceRecords as any).data
        : []
    }
    return []
  }, [rawAttendanceRecords])

  // --- Computations ---

  const filteredAttendanceRecords = useMemo(() => {
    // Ensure we always work with an array
    const records = Array.isArray(attendanceRecords) ? attendanceRecords : []
    if (!selectedScheduleSlot) return records
    return records.filter((record: any) => record.scheduleSlot === selectedScheduleSlot)
  }, [attendanceRecords, selectedScheduleSlot])

  const availableStudents = useMemo(() => {
    // Convert all enrolled IDs to strings for consistent comparison
    const enrolledIds = new Set(validEnrolledStudents.map((e) => String(e.studentId)))
    return allStudents.filter((s) => s && s.id && !enrolledIds.has(String(s.id)))
  }, [allStudents, validEnrolledStudents])

  // Build a map of studentId (as string) to attendance record for quick lookup
  // The backend returns studentId as a string (MongoDB ObjectId), so we normalize all IDs to strings
  const attendanceStatusMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>()
    // Defensive check - ensure we have an array before iterating
    const records = Array.isArray(filteredAttendanceRecords) ? filteredAttendanceRecords : []
    records.forEach((record: any) => {
      if (!record) return // Skip null/undefined records
      // Extract the studentId - could be a string, number, or nested in student object
      const studentId = record.studentId
        ? String(record.studentId)
        : record.student?._id
          ? String(record.student._id)
          : record.student
            ? String(record.student)
            : null
      if (studentId) {
        map.set(studentId, record)
      }
    })
    return map
  }, [filteredAttendanceRecords])

  const filteredEnrolledStudents = useMemo(() => {
    let filtered = validEnrolledStudents

    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((e) => {
        const student = e.student
        if (!student) return false
        return (
          String(student.studentNumber ?? '')
            .toLowerCase()
            .includes(term) ||
          String(student.firstName ?? '')
            .toLowerCase()
            .includes(term) ||
          String(student.lastName ?? '')
            .toLowerCase()
            .includes(term) ||
          String(student.email ?? '')
            .toLowerCase()
            .includes(term)
        )
      })
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((e) => {
        const studentIdStr = String(e.studentId)
        const record = attendanceStatusMap.get(studentIdStr)

        if (statusFilter === 'unmarked') {
          return !record
        }

        return record?.status === statusFilter
      })
    }

    return filtered
  }, [validEnrolledStudents, searchTerm, statusFilter, attendanceStatusMap])

  // Status counts for filter badges
  const statusCounts = useMemo(() => {
    const counts = {
      all: validEnrolledStudents.length,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      unmarked: 0,
    }

    validEnrolledStudents.forEach((e) => {
      const studentIdStr = String(e.studentId)
      const record = attendanceStatusMap.get(studentIdStr)

      if (!record) {
        counts.unmarked++
      } else {
        counts[record.status as keyof typeof counts]++
      }
    })

    return counts
  }, [validEnrolledStudents, attendanceStatusMap])

  const allFilteredSelected = useMemo(() => {
    if (filteredEnrolledStudents.length === 0) return false
    return filteredEnrolledStudents.every((e) => selectedStudents.has(e.studentId))
  }, [filteredEnrolledStudents, selectedStudents])

  // --- Keyboard Shortcuts Handler ---
  const handleKeyboardShortcut = useCallback(
    (studentId: string | number, status: 'present' | 'absent' | 'late' | 'excused') => {
      if (!subject || markingStudents.has(studentId)) return

      // The mutation will be triggered by this callback
      // We'll wire this up after markAttendanceMutation is defined
    },
    [subject, markingStudents]
  )

  // Keyboard shortcuts for attendance marking
  useEffect(() => {
    if (!isOpen || activeTab !== 'attendance') return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const key = e.key.toLowerCase()

      // Navigation: Arrow keys
      if (key === 'arrowdown') {
        e.preventDefault()
        setFocusedStudentIndex((prev) =>
          prev < filteredEnrolledStudents.length - 1 ? prev + 1 : prev
        )
        return
      }

      if (key === 'arrowup') {
        e.preventDefault()
        setFocusedStudentIndex((prev) => (prev > 0 ? prev - 1 : 0))
        return
      }

      // Focus search: Ctrl+F or /
      if (key === '/' || (e.ctrlKey && key === 'f')) {
        e.preventDefault()
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement
        searchInput?.focus()
        return
      }

      // Toggle shortcuts hint: ?
      if (key === '?' && e.shiftKey) {
        e.preventDefault()
        setShowShortcutsHint((prev) => !prev)
        return
      }

      // Escape: Close modal or clear focus
      if (key === 'escape') {
        if (focusedStudentIndex >= 0) {
          setFocusedStudentIndex(-1)
        } else {
          onClose()
        }
        return
      }

      // Attendance marking shortcuts (only when a student is focused)
      if (focusedStudentIndex >= 0 && focusedStudentIndex < filteredEnrolledStudents.length) {
        const student = filteredEnrolledStudents[focusedStudentIndex]
        if (!student) return

        const studentId = student.studentId
        if (markingStudents.has(studentId)) return // Already marking

        let status: 'present' | 'absent' | 'late' | 'excused' | null = null

        if (key === 'p') status = 'present'
        else if (key === 'a') status = 'absent'
        else if (key === 'l') status = 'late'
        else if (key === 'e') status = 'excused'

        if (status) {
          e.preventDefault()
          // We'll trigger the mutation directly using a ref pattern
          // For now, dispatch a custom event that we'll listen for
          window.dispatchEvent(
            new CustomEvent('markAttendance', {
              detail: { studentId, status, scheduleSlot: selectedScheduleSlot },
            })
          )
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    isOpen,
    activeTab,
    focusedStudentIndex,
    filteredEnrolledStudents,
    markingStudents,
    selectedScheduleSlot,
    onClose,
  ])

  // --- Email History (Overview Tab) ---
  // Fetch more emails to have a better pool to filter from
  const { data: emailHistoryResponse, isLoading: loadingEmailHistory } = useQuery({
    queryKey: ['email-history', 'recent'],
    queryFn: () => getEmailHistory(1, 50),
    enabled: isOpen && !!subject && activeTab === 'overview',
    staleTime: 1000 * 10, // 10 seconds - keeps data fresh
    refetchInterval: 1000 * 30, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: true, // Refresh when user returns to tab
  })

  // Filter emails for students enrolled in this subject
  // Emails are sent to students when marked absent, so we match by student info
  const subjectEmails = useMemo(() => {
    const emails = emailHistoryResponse?.emails || []
    if (!subject || validEnrolledStudents.length === 0) return []

    // Get enrolled student identifiers (studentNumber, names, emails)
    const enrolledStudentNumbers = new Set(
      validEnrolledStudents.map((e) => e.student?.studentNumber?.toLowerCase()).filter(Boolean)
    )
    const enrolledStudentEmails = new Set(
      validEnrolledStudents.map((e) => e.student?.email?.toLowerCase()).filter(Boolean)
    )
    const enrolledStudentNames = new Set(
      validEnrolledStudents
        .map((e) => {
          if (e.student?.firstName && e.student?.lastName) {
            return `${e.student.firstName} ${e.student.lastName}`.toLowerCase()
          }
          return null
        })
        .filter(Boolean)
    )

    return emails
      .filter((e) => {
        // Check if email was sent to an enrolled student by matching:
        // 1. Student number in the email record
        if (
          e.student?.studentNumber &&
          enrolledStudentNumbers.has(e.student.studentNumber.toLowerCase())
        ) {
          return true
        }
        // 2. Student name in email subject line (e.g., "Attendance Alert for John Doe")
        const emailSubject = e.metadata?.subject?.toLowerCase() || ''
        for (const name of enrolledStudentNames) {
          if (name && emailSubject.includes(name)) {
            return true
          }
        }
        // 3. Recipient email matches enrolled student
        const recipient = e.metadata?.recipient?.toLowerCase() || ''
        if (recipient && enrolledStudentEmails.has(recipient)) {
          return true
        }
        // 4. Check recipients array for bulk emails
        const recipients = e.metadata?.recipients || []
        for (const r of recipients) {
          if (r && enrolledStudentEmails.has(r.toLowerCase())) {
            return true
          }
        }
        return false
      })
      .slice(0, 5) // Limit to 5 most recent
  }, [emailHistoryResponse, subject, validEnrolledStudents])

  const getRecipientDisplay = (email: EmailHistoryRecord) => {
    const isBulk = (email.metadata?.totalRecipients || email.metadata?.recipients?.length || 0) > 1
    if (isBulk) {
      const recipients = email.metadata?.recipients || []
      const count = email.metadata?.totalRecipients || recipients.length
      return {
        display: `${count} Recipients`,
        isBulk: true,
        recipients: recipients,
        count: count,
      }
    }

    const recipient =
      email.metadata?.recipient ||
      (email.student ? `${email.student.firstName} ${email.student.lastName}` : 'Unknown')
    return {
      display: recipient,
      isBulk: false,
      recipients: [email.metadata?.recipient || ''],
      count: 1,
    }
  }

  // --- Mutations ---

  const enrollMutation = useMutation({
    mutationFn: (studentId: number) =>
      subjectEnrollmentService.enrollStudent({ subjectId: subject!.id, studentId }),
    onMutate: async (studentId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['subjects', subject?.id, 'students'] })
      const previousData = queryClient.getQueryData(['subjects', subject?.id, 'students'])

      const student = allStudents.find((s) => s.id === studentId)
      if (student) {
        queryClient.setQueryData(['subjects', subject?.id, 'students'], (old: any) => [
          ...(old || []),
          {
            id: Date.now(),
            studentId,
            subjectId: subject!.id,
            enrolledAt: new Date().toISOString(),
            student,
          },
        ])
      }

      return { previousData }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects', subject?.id, 'students'] })
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      addToast('Student enrolled successfully', 'success')
    },
    onError: (error: any, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['subjects', subject?.id, 'students'], context.previousData)
      }
      addToast(error?.message || 'Failed to enroll', 'error')
    },
  })

  const unenrollMutation = useMutation({
    mutationFn: (studentId: number) =>
      subjectEnrollmentService.unenrollStudent(subject!.id, studentId),
    onMutate: async (studentId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['subjects', subject?.id, 'students'] })
      const previousData = queryClient.getQueryData(['subjects', subject?.id, 'students'])

      queryClient.setQueryData(['subjects', subject?.id, 'students'], (old: any) =>
        (old || []).filter((e: any) => e.studentId !== studentId)
      )

      return { previousData }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects', subject?.id, 'students'] })
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      addToast('Student removed successfully', 'success')
    },
    onError: (error: any, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['subjects', subject?.id, 'students'], context.previousData)
      }
      addToast(error?.message || 'Failed to remove', 'error')
    },
  })

  const enrollAllMutation = useMutation({
    mutationFn: (studentIds: number[]) =>
      subjectEnrollmentService.enrollAllStudents(subject!.id, studentIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subjects', subject?.id, 'students'] })
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      addToast(`Enrolled ${data.length} students`, 'success')
      setEnrollAllConfirm(false)
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to enroll all', 'error')
      setEnrollAllConfirm(false)
    },
  })

  const markAttendanceMutation = useMutation({
    mutationFn: (data: {
      studentId: string | number
      status: 'present' | 'absent' | 'late' | 'excused'
      scheduleSlot?: string
    }) =>
      subjectAttendanceService.markSubjectAttendance({
        subjectId: subject!.id,
        studentId: data.studentId,
        date: selectedDate,
        status: data.status,
        timeSlot: 'arrival',
        scheduleSlot: data.scheduleSlot,
      }),
    onMutate: async (variables) => {
      // Add to marking set
      setMarkingStudents((prev) => new Set(prev).add(variables.studentId))

      // Cancel outgoing queries to prevent race conditions
      await queryClient.cancelQueries({
        queryKey: ['subjects', subject?.id, 'attendance', selectedDate],
      })

      const previousData = queryClient.getQueryData([
        'subjects',
        subject?.id,
        'attendance',
        selectedDate,
      ])

      // Optimistically update the cache
      queryClient.setQueryData(
        ['subjects', subject?.id, 'attendance', selectedDate],
        (old: any) => {
          const oldRecords = Array.isArray(old) ? old : []
          // Remove any existing record for this student (compare as strings for consistency)
          const filtered = oldRecords.filter(
            (r: any) => String(r.studentId) !== String(variables.studentId)
          )
          // Add the new optimistic record
          return [
            ...filtered,
            {
              id: `temp-${Date.now()}`,
              studentId: String(variables.studentId), // Store as string for consistency
              subjectId: subject!.id,
              date: selectedDate,
              status: variables.status,
              scheduleSlot: variables.scheduleSlot,
              timeSlot: 'arrival',
              createdAt: new Date().toISOString(),
            },
          ]
        }
      )

      return { previousData }
    },
    onSuccess: (responseData, variables) => {
      // Play success feedback
      attendanceMarkedFeedback(variables.status)

      // Update the cache with the REAL data from the server response
      // This prevents the "unmarked" flicker by not invalidating immediately
      queryClient.setQueryData(
        ['subjects', subject?.id, 'attendance', selectedDate],
        (old: any) => {
          const oldRecords = Array.isArray(old) ? old : []
          // Remove the temporary/old record for this student
          const filtered = oldRecords.filter(
            (r: any) =>
              String(r.studentId) !== String(variables.studentId) &&
              String(r.studentId) !== String(responseData?.studentId)
          )
          // Add the real record from the server if we got one
          if (responseData && responseData.id) {
            return [
              ...filtered,
              {
                ...responseData,
                studentId: String(responseData.studentId || variables.studentId),
              },
            ]
          }
          // If no valid response, keep the optimistic record
          return [
            ...filtered,
            {
              id: `confirmed-${Date.now()}`,
              studentId: String(variables.studentId),
              subjectId: subject!.id,
              date: selectedDate,
              status: variables.status,
              scheduleSlot: variables.scheduleSlot,
              timeSlot: 'arrival',
              createdAt: new Date().toISOString(),
            },
          ]
        }
      )
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          ['subjects', subject?.id, 'attendance', selectedDate],
          context.previousData
        )
      }
      addToast(error?.message || 'Failed to mark', 'error')
    },
    onSettled: (_, __, variables) => {
      // Remove from marking set
      setMarkingStudents((prev) => {
        const next = new Set(prev)
        next.delete(variables.studentId)
        return next
      })
    },
  })

  // Listen for keyboard shortcut events to trigger attendance marking
  useEffect(() => {
    const handleMarkAttendance = (
      e: CustomEvent<{
        studentId: string | number
        status: 'present' | 'absent' | 'late' | 'excused'
        scheduleSlot: string | null
      }>
    ) => {
      const { studentId, status, scheduleSlot } = e.detail
      markAttendanceMutation.mutate({
        studentId,
        status,
        scheduleSlot: scheduleSlot || undefined,
      })
    }

    window.addEventListener('markAttendance', handleMarkAttendance as EventListener)
    return () => window.removeEventListener('markAttendance', handleMarkAttendance as EventListener)
  }, [markAttendanceMutation])

  const bulkMarkMutation = useMutation({
    mutationFn: (data: {
      studentIds: (string | number)[]
      status: 'present' | 'absent' | 'late' | 'excused'
      scheduleSlot?: string
    }) =>
      subjectAttendanceService.bulkMarkSubjectAttendance({
        subjectId: subject!.id,
        studentIds: data.studentIds,
        date: selectedDate,
        status: data.status,
        timeSlot: 'arrival',
        scheduleSlot: data.scheduleSlot,
      }),
    onMutate: async (variables) => {
      // Cancel outgoing queries to prevent race conditions
      await queryClient.cancelQueries({
        queryKey: ['subjects', subject?.id, 'attendance', selectedDate],
      })

      const previousData = queryClient.getQueryData([
        'subjects',
        subject?.id,
        'attendance',
        selectedDate,
      ])

      // Optimistically update the cache for all students being marked
      queryClient.setQueryData(
        ['subjects', subject?.id, 'attendance', selectedDate],
        (old: any) => {
          const oldRecords = Array.isArray(old) ? old : []
          const markedStudentIds = new Set(variables.studentIds.map(String))

          // Remove existing records for students being marked
          const filtered = oldRecords.filter((r: any) => !markedStudentIds.has(String(r.studentId)))

          // Add new optimistic records for all students
          const newRecords = variables.studentIds.map((studentId, idx) => ({
            id: `temp-bulk-${Date.now()}-${idx}`,
            studentId: String(studentId),
            subjectId: subject!.id,
            date: selectedDate,
            status: variables.status,
            scheduleSlot: variables.scheduleSlot,
            timeSlot: 'arrival',
            createdAt: new Date().toISOString(),
          }))

          return [...filtered, ...newRecords]
        }
      )

      return { previousData }
    },
    onSuccess: (responseData, variables) => {
      // Update the cache with the REAL data from the server response
      queryClient.setQueryData(
        ['subjects', subject?.id, 'attendance', selectedDate],
        (old: any) => {
          const oldRecords = Array.isArray(old) ? old : []
          const markedStudentIds = new Set(variables.studentIds.map(String))

          // Remove temp/old records for students that were marked
          const filtered = oldRecords.filter((r: any) => !markedStudentIds.has(String(r.studentId)))

          // Add real records from server if available
          if (Array.isArray(responseData) && responseData.length > 0) {
            const serverRecords = responseData.map((record: any) => ({
              ...record,
              studentId: String(record.studentId),
            }))
            return [...filtered, ...serverRecords]
          }

          // If no valid response, create confirmed records
          const confirmedRecords = variables.studentIds.map((studentId, idx) => ({
            id: `confirmed-bulk-${Date.now()}-${idx}`,
            studentId: String(studentId),
            subjectId: subject!.id,
            date: selectedDate,
            status: variables.status,
            scheduleSlot: variables.scheduleSlot,
            timeSlot: 'arrival',
            createdAt: new Date().toISOString(),
          }))

          return [...filtered, ...confirmedRecords]
        }
      )

      addToast(`Marked ${variables.studentIds.length} students`, 'success')
      setSelectedStudents(new Set())
      setMarkAllConfirm({ isOpen: false, status: null, scheduleSlot: null })
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          ['subjects', subject?.id, 'attendance', selectedDate],
          context.previousData
        )
      }
      addToast(error?.message || 'Failed to bulk mark', 'error')
      setMarkAllConfirm({ isOpen: false, status: null, scheduleSlot: null })
    },
  })

  const updateSchedulesMutation = useMutation({
    mutationFn: (schedules: SubjectScheduleSlot[]) =>
      subjectService.updateSchedules(subject!.id, schedules),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      addToast('Schedules updated', 'success')
      setIsEditingSchedules(false)
      setEditingScheduleIndex(null)
    },
    onError: (error: any) => addToast(error?.message || 'Update failed', 'error'),
  })

  // --- Handlers ---

  const handleMarkAll = (status: 'present' | 'absent' | 'late' | 'excused') => {
    if (filteredEnrolledStudents.length === 0) return addToast('No students to mark', 'warning')
    setMarkAllConfirm({ isOpen: true, status, scheduleSlot: selectedScheduleSlot })
  }

  const confirmMarkAll = () => {
    if (!markAllConfirm.status) return
    const studentIds = filteredEnrolledStudents.map((e) => e.studentId)
    bulkMarkMutation.mutate({
      studentIds,
      status: markAllConfirm.status,
      scheduleSlot: markAllConfirm.scheduleSlot || undefined,
    })
  }

  const handleEnrollAll = () => {
    if (availableStudents.length === 0) return addToast('No students available', 'warning')
    setEnrollAllConfirm(true)
  }

  const toggleStudentSelection = (studentId: string | number, checked: boolean) => {
    setSelectedStudents((prev) => {
      const newSelection = new Set(prev)
      if (checked) {
        newSelection.add(studentId)
      } else {
        newSelection.delete(studentId)
      }
      return newSelection
    })
  }

  // Export current attendance view to Excel
  const handleExportAttendance = useCallback(() => {
    if (!subject || !selectedScheduleSlot) {
      addToast('Please select a schedule slot first', 'warning')
      return
    }

    // Build export data from enrolled students and their attendance status
    const exportData = filteredEnrolledStudents
      .map((enrolled) => {
        const student = enrolled.student
        if (!student) return null

        const studentIdStr = String(enrolled.studentId)
        const record = attendanceStatusMap.get(studentIdStr)

        return {
          'Student Number': student.studentNumber || '',
          'First Name': student.firstName || '',
          'Last Name': student.lastName || '',
          Email: student.email || '',
          'Subject Code': subject.subjectCode || '',
          'Subject Name': subject.subjectName || '',
          'Schedule Slot': selectedScheduleSlot,
          Date: selectedDate,
          Status: record?.status
            ? record.status.charAt(0).toUpperCase() + record.status.slice(1)
            : 'Unmarked',
          'Marked At': record?.createdAt
            ? format(new Date(record.createdAt), 'yyyy-MM-dd HH:mm:ss')
            : '',
        }
      })
      .filter(Boolean)

    if (exportData.length === 0) {
      addToast('No data to export', 'warning')
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance')

    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // Student Number
      { wch: 15 }, // First Name
      { wch: 15 }, // Last Name
      { wch: 25 }, // Email
      { wch: 12 }, // Subject Code
      { wch: 20 }, // Subject Name
      { wch: 15 }, // Schedule Slot
      { wch: 12 }, // Date
      { wch: 10 }, // Status
      { wch: 20 }, // Marked At
    ]

    const filename = `${subject.subjectCode}_attendance_${selectedDate}.xlsx`
    XLSX.writeFile(workbook, filename)
    addToast(`Exported to ${filename}`, 'success')
  }, [
    subject,
    selectedScheduleSlot,
    selectedDate,
    filteredEnrolledStudents,
    attendanceStatusMap,
    addToast,
  ])

  const handleSelectAll = () => {
    setSelectedStudents((prev) => {
      const filteredIds = new Set(filteredEnrolledStudents.map((e) => e.studentId))
      const allSelected = filteredEnrolledStudents.every((e) => prev.has(e.studentId))
      const newSelection = new Set(prev)

      filteredIds.forEach((id) => {
        if (allSelected) {
          newSelection.delete(id)
        } else {
          newSelection.add(id)
        }
      })

      return newSelection
    })
  }

  // Schedule Handlers
  const handleScheduleSave = () => {
    if (!scheduleForm.slotName.trim()) return addToast('Schedule name required', 'warning')
    if (scheduleForm.days.length === 0) return addToast('Select at least one day', 'warning')
    if (!scheduleForm.startTime || !scheduleForm.endTime)
      return addToast('Times required', 'warning')
    if (scheduleForm.startTime >= scheduleForm.endTime)
      return addToast('Invalid time range', 'warning')

    const newSchedules =
      editingScheduleIndex !== null
        ? schedules.map((s, i) => (i === editingScheduleIndex ? scheduleForm : s))
        : [...schedules, scheduleForm]

    setSchedules(newSchedules)
    updateSchedulesMutation.mutate(newSchedules)
  }

  const deleteSchedule = (index: number) => {
    const newSchedules = schedules.filter((_, i) => i !== index)
    setSchedules(newSchedules)
    updateSchedulesMutation.mutate(newSchedules)
  }

  if (!subject) return null

  // --- UI Constants ---
  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: ClipboardList },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
  ]

  // Ensure stats computation works even if data is not an array
  const safeFilteredRecords = Array.isArray(filteredAttendanceRecords)
    ? filteredAttendanceRecords
    : []
  const stats = {
    present: safeFilteredRecords.filter((r: any) => r?.status === 'present').length,
    absent: safeFilteredRecords.filter((r: any) => r?.status === 'absent').length,
    late: safeFilteredRecords.filter((r: any) => r?.status === 'late').length,
    excused: safeFilteredRecords.filter((r: any) => r?.status === 'excused').length,
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-slate-900 border border-slate-700 w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="relative overflow-hidden bg-slate-900 border-b border-slate-700/50 p-6 flex-shrink-0">
                {/* Decorative Background Mesh */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                        {subject.subjectCode}
                      </h2>
                      <p className="text-slate-300 font-medium">{subject.subjectName}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300">
                          Year {subject.yearLevel}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300">
                          Section {subject.section}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-900/30 border border-blue-800 text-xs font-medium text-blue-300 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {validEnrolledStudents.length} Students
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start md:self-center">
                    <button
                      onClick={onClose}
                      className="p-2.5 rounded-full hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex gap-1 mt-8 overflow-x-auto pb-1 scrollbar-hide">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all relative
                          ${isActive ? 'text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'}
                        `}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-slate-800 rounded-xl"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                          <Icon className={cn('w-4 h-4', isActive ? 'text-purple-400' : '')} />
                          {tab.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto bg-slate-900 p-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent thin-scrollbar">
                {/* 1. OVERVIEW TAB */}
                {activeTab === 'overview' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                      <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Info className="w-5 h-5 text-indigo-400" />
                        Details
                      </h3>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                        <div>
                          <dt className="text-sm text-slate-400 mb-1">Subject Code</dt>
                          <dd className="text-slate-100 font-medium">{subject.subjectCode}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-slate-400 mb-1">Section</dt>
                          <dd className="text-slate-100 font-medium">{subject.section}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-sm text-slate-400 mb-1">Subject Name</dt>
                          <dd className="text-slate-100 font-medium">{subject.subjectName}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-slate-400 mb-1">Year Level</dt>
                          <dd className="text-slate-100 font-medium">Year {subject.yearLevel}</dd>
                        </div>
                      </dl>
                    </div>

                    {/* Quick Stats - Side by side with Details */}
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                          <Users className="w-5 h-5 text-emerald-400" />
                          Quick Stats
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-slate-800/80 rounded-xl border border-slate-700/50">
                            <span className="text-slate-300 text-sm">Total Enrolled</span>
                            <span className="text-xl font-bold text-white">
                              {validEnrolledStudents.length}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-800/80 rounded-xl border border-slate-700/50">
                            <span className="text-slate-300 text-sm">Present Today</span>
                            <span className="text-xl font-bold text-emerald-400">
                              {stats.present}
                            </span>
                          </div>
                        </div>
                      </div>

                      {validEnrolledStudents.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-slate-700/50">
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-sm font-medium text-slate-400">
                              Attendance Rate
                            </span>
                            <span className="text-2xl font-bold text-purple-400">
                              {Math.round((stats.present / validEnrolledStudents.length) * 100)}%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                              style={{
                                width: `${(stats.present / validEnrolledStudents.length) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Recent Email History for Subject - Full width below */}
                    <div className="md:col-span-2 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Mail className="w-5 h-5 text-orange-400" />
                          Recent Emails
                        </h3>
                        <button
                          onClick={() => navigate('/email-history')}
                          className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                        >
                          View all
                        </button>
                      </div>
                      {loadingEmailHistory ? (
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <div className="w-2 h-2 rounded-full bg-orange-400 animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce" />
                          <span className="ml-2">Loading...</span>
                        </div>
                      ) : subjectEmails.length === 0 ? (
                        <div className="text-sm text-slate-400 py-4 text-center">
                          <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          No recent emails for enrolled students
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {subjectEmails.map((email) => {
                            const r = getRecipientDisplay(email)
                            return (
                              <div
                                key={email._id}
                                className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-slate-700/30 hover:border-orange-500/30 transition-colors"
                              >
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                                  <Clock className="w-4 h-4 text-orange-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-slate-200 font-medium truncate">
                                    {email.metadata?.subject || 'Attendance Alert'}
                                  </p>
                                  <p className="text-xs text-slate-400 truncate">To: {r.display}</p>
                                </div>
                                <div className="text-xs text-slate-500 flex-shrink-0">
                                  {new Date(email.createdAt).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* 2. STUDENTS TAB */}
                {activeTab === 'students' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 h-full flex flex-col"
                  >
                    <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="Search enrolled students..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 h-11 bg-slate-800/50 border-slate-700 focus:bg-slate-800 text-slate-200 placeholder:text-slate-500"
                        />
                      </div>
                      <Button
                        onClick={handleEnrollAll}
                        disabled={availableStudents.length === 0 || enrollAllMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-11"
                      >
                        {enrollAllMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserPlus className="w-4 h-4 mr-2" />
                        )}
                        Enroll Available ({availableStudents.length})
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 flex-1">
                      {/* Enrolled List */}
                      <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-700/50 bg-slate-800/50 flex justify-between items-center">
                          <h3 className="font-semibold text-slate-200">
                            Enrolled ({validEnrolledStudents.length})
                          </h3>
                        </div>
                        <div className="overflow-y-auto p-2 space-y-1 flex-1 thin-scrollbar">
                          {loadingEnrolled ? (
                            <div className="flex justify-center p-8">
                              <Loader2 className="animate-spin text-slate-500" />
                            </div>
                          ) : validEnrolledStudents.length === 0 ? (
                            <div className="text-center p-8 text-slate-400">
                              No students enrolled
                            </div>
                          ) : (
                            filteredEnrolledStudents.map((enrolled) => (
                              <div
                                key={enrolled.id}
                                className="flex items-center justify-between p-3 hover:bg-slate-800/50 rounded-xl transition-colors group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                                    {enrolled.student?.firstName?.[0]}
                                    {enrolled.student?.lastName?.[0]}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-slate-200">
                                      {enrolled.student?.firstName} {enrolled.student?.lastName}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      {enrolled.student?.studentNumber}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    unenrollMutation.mutate(Number(enrolled.studentId))
                                  }
                                  disabled={unenrollMutation.isPending}
                                  className="h-8 w-8 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-300 transition-all"
                                >
                                  {unenrollMutation.isPending &&
                                  unenrollMutation.variables === Number(enrolled.studentId) ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <UserMinus className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Available List */}
                      <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-700/50 bg-slate-800/50">
                          <h3 className="font-semibold text-slate-200">Available to Enroll</h3>
                        </div>
                        <div className="overflow-y-auto p-2 space-y-1 flex-1 thin-scrollbar">
                          {loadingAllStudents ? (
                            <div className="flex justify-center p-8">
                              <Loader2 className="animate-spin text-slate-500" />
                            </div>
                          ) : availableStudents.length === 0 ? (
                            <div className="text-center p-8 text-slate-400">
                              All students enrolled
                            </div>
                          ) : (
                            availableStudents.map((student) => (
                              <div
                                key={student.id}
                                className="flex items-center justify-between p-3 hover:bg-slate-800/50 rounded-xl transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                                    {student.firstName?.[0]}
                                    {student.lastName?.[0]}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-slate-200">
                                      {student.firstName} {student.lastName}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      {student.studentNumber}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => enrollMutation.mutate(student.id)}
                                  disabled={enrollMutation.isPending}
                                  className="h-8 bg-slate-700 hover:bg-emerald-600 text-white transition-colors"
                                >
                                  {enrollMutation.isPending &&
                                  enrollMutation.variables === student.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <>
                                      <Plus className="w-3 h-3 mr-1" /> Enroll
                                    </>
                                  )}
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 3. ATTENDANCE TAB */}
                {activeTab === 'attendance' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Controls Card */}
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
                      <div className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 w-full space-y-2">
                          <Label className="text-slate-300 text-xs uppercase tracking-wider">
                            Date
                          </Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                              type="date"
                              value={selectedDate}
                              max={getLocalDateString()}
                              onChange={(e) => {
                                setSelectedDate(e.target.value)
                                setSelectedStudents(new Set())
                              }}
                              className="pl-10 bg-slate-900/50 border-slate-700 h-11 text-slate-100"
                            />
                          </div>
                        </div>
                        <div className="flex-1 w-full space-y-2">
                          <Label className="text-slate-300 text-xs uppercase tracking-wider">
                            Schedule Slot
                          </Label>
                          {schedules.length > 0 ? (
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <select
                                value={selectedScheduleSlot || ''}
                                onChange={(e) => {
                                  setSelectedScheduleSlot(e.target.value || null)
                                  setSelectedStudents(new Set())
                                }}
                                className="w-full h-11 pl-10 pr-4 rounded-md border border-slate-700 bg-slate-900/50 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none appearance-none"
                              >
                                <option value="">-- Select Class Time --</option>
                                {schedules.map((schedule, i) => (
                                  <option key={i} value={schedule.slotName}>
                                    {schedule.slotName} ({schedule.startTime} - {schedule.endTime})
                                  </option>
                                ))}
                              </select>
                              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 rotate-90" />
                            </div>
                          ) : (
                            <div className="h-11 flex items-center px-3 border border-amber-900/50 bg-amber-900/20 rounded-md text-amber-200 text-sm">
                              <AlertCircle className="w-4 h-4 mr-2" />
                              Please add a schedule first
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats & Bulk Actions */}
                    {schedules.length > 0 && selectedScheduleSlot && (
                      <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            {
                              label: 'Present',
                              val: stats.present,
                              color: 'emerald',
                              icon: CheckCircle,
                            },
                            { label: 'Absent', val: stats.absent, color: 'rose', icon: XCircle },
                            { label: 'Late', val: stats.late, color: 'amber', icon: Clock },
                            {
                              label: 'Excused',
                              val: stats.excused,
                              color: 'purple',
                              icon: AlertCircle,
                            },
                          ].map((stat) => (
                            <div
                              key={stat.label}
                              className={`bg-${stat.color}-500/10 border border-${stat.color}-500/20 rounded-xl p-3 flex items-center justify-between`}
                            >
                              <div className="flex items-center gap-2">
                                <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
                                <span className={`text-sm font-medium text-${stat.color}-200`}>
                                  {stat.label}
                                </span>
                              </div>
                              <span className={`text-lg font-bold text-${stat.color}-400`}>
                                {stat.val}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                          <div className="flex items-center gap-3 w-full md:w-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleSelectAll}
                              className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                              {allFilteredSelected ? 'Deselect All' : 'Select All'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleExportAttendance}
                              className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Export
                            </Button>
                            {selectedStudents.size > 0 && (
                              <span className="text-sm font-medium text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded">
                                {selectedStudents.size} selected
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                            {selectedStudents.size > 0 ? (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                  disabled={bulkMarkMutation.isPending}
                                  onClick={() =>
                                    bulkMarkMutation.mutate({
                                      studentIds: Array.from(selectedStudents),
                                      status: 'present',
                                      scheduleSlot: selectedScheduleSlot,
                                    })
                                  }
                                >
                                  {bulkMarkMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    'Present'
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-rose-600 hover:bg-rose-700"
                                  disabled={bulkMarkMutation.isPending}
                                  onClick={() =>
                                    bulkMarkMutation.mutate({
                                      studentIds: Array.from(selectedStudents),
                                      status: 'absent',
                                      scheduleSlot: selectedScheduleSlot,
                                    })
                                  }
                                >
                                  {bulkMarkMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    'Absent'
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-amber-600 hover:bg-amber-700"
                                  disabled={bulkMarkMutation.isPending}
                                  onClick={() =>
                                    bulkMarkMutation.mutate({
                                      studentIds: Array.from(selectedStudents),
                                      status: 'late',
                                      scheduleSlot: selectedScheduleSlot,
                                    })
                                  }
                                >
                                  {bulkMarkMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    'Late'
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-purple-600 hover:bg-purple-700"
                                  disabled={bulkMarkMutation.isPending}
                                  onClick={() =>
                                    bulkMarkMutation.mutate({
                                      studentIds: Array.from(selectedStudents),
                                      status: 'excused',
                                      scheduleSlot: selectedScheduleSlot,
                                    })
                                  }
                                >
                                  {bulkMarkMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    'Excused'
                                  )}
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                                  onClick={() => handleMarkAll('present')}
                                >
                                  Mark All Present
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                                  onClick={() => handleMarkAll('absent')}
                                >
                                  Mark All Absent
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Attendance List */}
                    <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden">
                      <div className="p-3 border-b border-slate-700/50 flex items-center gap-3">
                        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <input
                          data-search-input
                          placeholder="Filter student list... (Press / to focus)"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="bg-transparent border-none focus:ring-0 text-sm flex-1 min-w-0 text-slate-200 placeholder:text-slate-500"
                        />
                        {/* Status Filter Dropdown with counts */}
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value as any)}
                          className="px-2 py-1 text-xs rounded-md border border-slate-600 bg-slate-800 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        >
                          <option value="all">All ({statusCounts.all})</option>
                          <option value="unmarked">Unmarked ({statusCounts.unmarked})</option>
                          <option value="present">Present ({statusCounts.present})</option>
                          <option value="absent">Absent ({statusCounts.absent})</option>
                          <option value="late">Late ({statusCounts.late})</option>
                          <option value="excused">Excused ({statusCounts.excused})</option>
                        </select>
                        {/* Results count badge */}
                        <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {filteredEnrolledStudents.length}
                        </span>
                        <button
                          onClick={() => setShowShortcutsHint((prev) => !prev)}
                          className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
                          title="Keyboard shortcuts (Shift+?)"
                        >
                          <Keyboard className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Keyboard Shortcuts Hint */}
                      <AnimatePresence>
                        {showShortcutsHint && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-b border-slate-700/50"
                          >
                            <div className="p-3 bg-slate-900/50">
                              <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                                <span className="font-semibold text-slate-300">Shortcuts:</span>
                                <span>
                                  <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-[10px] font-mono">
                                    ↑/↓
                                  </kbd>{' '}
                                  Navigate
                                </span>
                                <span>
                                  <kbd className="px-1.5 py-0.5 bg-emerald-700/50 rounded text-[10px] font-mono text-emerald-300">
                                    P
                                  </kbd>{' '}
                                  Present
                                </span>
                                <span>
                                  <kbd className="px-1.5 py-0.5 bg-rose-700/50 rounded text-[10px] font-mono text-rose-300">
                                    A
                                  </kbd>{' '}
                                  Absent
                                </span>
                                <span>
                                  <kbd className="px-1.5 py-0.5 bg-amber-700/50 rounded text-[10px] font-mono text-amber-300">
                                    L
                                  </kbd>{' '}
                                  Late
                                </span>
                                <span>
                                  <kbd className="px-1.5 py-0.5 bg-purple-700/50 rounded text-[10px] font-mono text-purple-300">
                                    E
                                  </kbd>{' '}
                                  Excused
                                </span>
                                <span>
                                  <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-[10px] font-mono">
                                    /
                                  </kbd>{' '}
                                  Search
                                </span>
                                <span>
                                  <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-[10px] font-mono">
                                    Esc
                                  </kbd>{' '}
                                  Close
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="max-h-[500px] overflow-y-auto thin-scrollbar">
                        {!selectedScheduleSlot ? (
                          <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                            <Calendar className="w-12 h-12 mb-3 opacity-20" />
                            <p>Select a schedule slot to view attendance</p>
                          </div>
                        ) : filteredEnrolledStudents.length === 0 ? (
                          <div className="py-12 text-center text-slate-500">No students found</div>
                        ) : (
                          filteredEnrolledStudents.map((enrolled, index) => {
                            const student = enrolled.student
                            if (!student) return null
                            // Convert to string for consistent map lookup (backend returns string IDs)
                            const enrolledStudentId = String(enrolled.studentId)
                            const record = attendanceStatusMap.get(enrolledStudentId)
                            const status = record?.status
                            const isSelected = selectedStudents.has(enrolled.studentId)
                            const isMarking = markingStudents.has(enrolled.studentId)
                            const isFocused = focusedStudentIndex === index

                            return (
                              <div
                                key={enrolled.id}
                                onClick={() => setFocusedStudentIndex(index)}
                                className={cn(
                                  'flex items-center gap-4 p-4 border-b border-slate-700/30 transition-all hover:bg-slate-800/40 cursor-pointer',
                                  isSelected ? 'bg-indigo-500/10' : '',
                                  isFocused
                                    ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-500/10'
                                    : '',
                                  status === 'present'
                                    ? 'bg-emerald-500/5'
                                    : status === 'absent'
                                      ? 'bg-rose-500/5'
                                      : ''
                                )}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(c) =>
                                    toggleStudentSelection(enrolled.studentId, !!c)
                                  }
                                  className="border-slate-500 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-200 truncate">
                                    {student.firstName} {student.lastName}
                                    {isFocused && (
                                      <span className="ml-2 text-xs text-indigo-400">
                                        (Press P/A/L/E)
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-xs text-slate-400">{student.studentNumber}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                  {status ? (
                                    <span
                                      className={cn(
                                        'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border',
                                        status === 'present' &&
                                          'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                                        status === 'absent' &&
                                          'bg-rose-500/20 text-rose-400 border-rose-500/30',
                                        status === 'late' &&
                                          'bg-amber-500/20 text-amber-400 border-amber-500/30',
                                        status === 'excused' &&
                                          'bg-purple-500/20 text-purple-400 border-purple-500/30'
                                      )}
                                    >
                                      {status}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-slate-500 italic px-2">
                                      Unmarked
                                    </span>
                                  )}

                                  {/* Quick Actions per row (only if not selected in bulk) */}
                                  {selectedStudents.size === 0 && (
                                    <div className="flex gap-1 ml-2">
                                      {isMarking ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                                      ) : (
                                        <>
                                          <button
                                            onClick={() =>
                                              markAttendanceMutation.mutate({
                                                studentId: enrolled.studentId,
                                                status: 'present',
                                                scheduleSlot: selectedScheduleSlot,
                                              })
                                            }
                                            className="p-1 hover:bg-emerald-500/20 rounded text-emerald-500 transition-colors"
                                            title="Mark Present"
                                          >
                                            <CheckCircle className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() =>
                                              markAttendanceMutation.mutate({
                                                studentId: enrolled.studentId,
                                                status: 'absent',
                                                scheduleSlot: selectedScheduleSlot,
                                              })
                                            }
                                            className="p-1 hover:bg-rose-500/20 rounded text-rose-500 transition-colors"
                                            title="Mark Absent"
                                          >
                                            <XCircle className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() =>
                                              markAttendanceMutation.mutate({
                                                studentId: enrolled.studentId,
                                                status: 'late',
                                                scheduleSlot: selectedScheduleSlot,
                                              })
                                            }
                                            className="p-1 hover:bg-amber-500/20 rounded text-amber-500 transition-colors"
                                            title="Mark Late"
                                          >
                                            <Clock className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() =>
                                              markAttendanceMutation.mutate({
                                                studentId: enrolled.studentId,
                                                status: 'excused',
                                                scheduleSlot: selectedScheduleSlot,
                                              })
                                            }
                                            className="p-1 hover:bg-purple-500/20 rounded text-purple-500 transition-colors"
                                            title="Mark Excused"
                                          >
                                            <AlertCircle className="w-4 h-4" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 4. SCHEDULE TAB */}
                {activeTab === 'schedule' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Class Schedule Configuration
                        </h3>
                        <p className="text-sm text-slate-400">
                          Define multiple meeting times (Lecture, Lab, etc.)
                        </p>
                      </div>
                      {!isEditingSchedules && (
                        <Button
                          onClick={() => {
                            setScheduleForm({
                              slotName: '',
                              days: [],
                              startTime: '',
                              endTime: '',
                              room: '',
                              building: '',
                            })
                            setEditingScheduleIndex(null)
                            setIsEditingSchedules(true)
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Plus className="w-4 h-4 mr-2" /> Add Slot
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {isEditingSchedules ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-slate-800/50 p-6 rounded-2xl border border-indigo-500/30 shadow-lg"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="md:col-span-2">
                              <Label className="mb-2 block text-slate-300">Slot Name</Label>
                              <Input
                                placeholder="e.g. Lecture, Laboratory"
                                value={scheduleForm.slotName}
                                onChange={(e) =>
                                  setScheduleForm({ ...scheduleForm, slotName: e.target.value })
                                }
                                className="bg-slate-900/50 border-slate-700 text-slate-200"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <Label className="mb-3 block text-slate-300">Days</Label>
                              <div className="flex flex-wrap gap-2">
                                {DAYS_OF_WEEK.map((day) => {
                                  const isSelected = scheduleForm.days.includes(day)
                                  return (
                                    <button
                                      key={day}
                                      onClick={() =>
                                        setScheduleForm((prev) => ({
                                          ...prev,
                                          days: isSelected
                                            ? prev.days.filter((d) => d !== day)
                                            : [...prev.days, day],
                                        }))
                                      }
                                      className={cn(
                                        'px-4 py-2 rounded-lg text-sm font-medium transition-all border',
                                        isSelected
                                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                                      )}
                                    >
                                      {day.slice(0, 3)}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>

                            <div>
                              <Label className="mb-2 block text-slate-300">Start Time</Label>
                              <Input
                                type="time"
                                value={scheduleForm.startTime}
                                onChange={(e) =>
                                  setScheduleForm({ ...scheduleForm, startTime: e.target.value })
                                }
                                className="bg-slate-900/50 border-slate-700 text-slate-200"
                              />
                            </div>
                            <div>
                              <Label className="mb-2 block text-slate-300">End Time</Label>
                              <Input
                                type="time"
                                value={scheduleForm.endTime}
                                onChange={(e) =>
                                  setScheduleForm({ ...scheduleForm, endTime: e.target.value })
                                }
                                className="bg-slate-900/50 border-slate-700 text-slate-200"
                              />
                            </div>

                            <div>
                              <Label className="mb-2 block text-slate-300">Room (Optional)</Label>
                              <Input
                                placeholder="Room 301"
                                value={scheduleForm.room}
                                onChange={(e) =>
                                  setScheduleForm({ ...scheduleForm, room: e.target.value })
                                }
                                className="bg-slate-900/50 border-slate-700 text-slate-200"
                              />
                            </div>
                            <div>
                              <Label className="mb-2 block text-slate-300">
                                Building (Optional)
                              </Label>
                              <Input
                                placeholder="Science Wing"
                                value={scheduleForm.building}
                                onChange={(e) =>
                                  setScheduleForm({ ...scheduleForm, building: e.target.value })
                                }
                                className="bg-slate-900/50 border-slate-700 text-slate-200"
                              />
                            </div>
                          </div>

                          <div className="flex gap-3 pt-4 border-t border-slate-700/50">
                            <Button
                              onClick={handleScheduleSave}
                              className="bg-indigo-600 hover:bg-indigo-700 flex-1"
                            >
                              {updateSchedulesMutation.isPending ? (
                                <Loader2 className="animate-spin w-4 h-4" />
                              ) : (
                                <Save className="w-4 h-4 mr-2" />
                              )}
                              {editingScheduleIndex !== null ? 'Update' : 'Save'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setIsEditingSchedules(false)}
                              className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                            >
                              Cancel
                            </Button>
                          </div>
                        </motion.div>
                      ) : schedules.length > 0 ? (
                        <div className="grid gap-4">
                          {schedules.map((schedule, i) => (
                            <div
                              key={i}
                              className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50 hover:border-indigo-500/30 transition-all flex justify-between items-start group"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-white text-lg">
                                    {schedule.slotName}
                                  </h4>
                                  <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                                    {schedule.startTime} - {schedule.endTime}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {schedule.days.map((d) => (
                                    <span
                                      key={d}
                                      className="text-xs font-medium text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-md"
                                    >
                                      {d.slice(0, 3)}
                                    </span>
                                  ))}
                                </div>
                                {(schedule.room || schedule.building) && (
                                  <div className="flex items-center gap-2 text-sm text-slate-400 mt-2">
                                    <MapPin className="w-3 h-3" />
                                    {schedule.room}{' '}
                                    {schedule.building ? `• ${schedule.building}` : ''}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-blue-400 hover:bg-blue-500/10"
                                  onClick={() => {
                                    setScheduleForm(schedule)
                                    setEditingScheduleIndex(i)
                                    setIsEditingSchedules(true)
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-red-400 hover:bg-red-500/10"
                                  onClick={() => deleteSchedule(i)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-2xl">
                          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-8 h-8 text-slate-500" />
                          </div>
                          <h3 className="text-lg font-medium text-slate-300">No Schedules Set</h3>
                          <p className="text-slate-500 mb-6">
                            Create time slots for lectures or labs to enable attendance tracking.
                          </p>
                          <Button
                            onClick={() => setIsEditingSchedules(true)}
                            variant="outline"
                            className="border-indigo-500 text-indigo-400 hover:bg-indigo-500/10"
                          >
                            Create First Schedule
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Dialogs */}
          <ConfirmationDialog
            isOpen={enrollAllConfirm}
            onClose={() => setEnrollAllConfirm(false)}
            onConfirm={() => {
              const ids = availableStudents.map((s) => s.id)
              enrollAllMutation.mutate(ids)
            }}
            title="Enroll All Available Students?"
            description={`This will enroll ${availableStudents.length} students into ${subject.subjectCode}.`}
            confirmText="Yes, Enroll All"
            cancelText="Cancel"
            variant="info"
            isLoading={enrollAllMutation.isPending}
          />

          <ConfirmationDialog
            isOpen={markAllConfirm.isOpen}
            onClose={() => setMarkAllConfirm({ isOpen: false, status: null, scheduleSlot: null })}
            onConfirm={confirmMarkAll}
            title={`Mark filtered students as ${markAllConfirm.status}?`}
            description={`This applies to ${filteredEnrolledStudents.length} students currently visible in the list.`}
            confirmText="Confirm Marking"
            cancelText="Cancel"
            variant="info"
            isLoading={bulkMarkMutation.isPending}
          />
        </>
      )}
    </AnimatePresence>
  )
}

// Wrap the component with ErrorBoundary for graceful error handling
function SubjectDetailsModalWithErrorBoundary(props: SubjectDetailsModalProps) {
  return (
    <ErrorBoundary
      fallback={
        props.isOpen ? (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md mx-4 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Unable to Load Details</h3>
              <p className="text-sm text-slate-400 mb-6">
                There was an issue loading the subject details. Please close and try again.
              </p>
              <Button onClick={props.onClose} variant="outline" className="border-slate-600">
                Close
              </Button>
            </div>
          </div>
        ) : null
      }
    >
      <SubjectDetailsModal {...props} />
    </ErrorBoundary>
  )
}

export default SubjectDetailsModalWithErrorBoundary
