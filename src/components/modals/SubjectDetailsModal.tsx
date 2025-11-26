/**
 * SubjectDetailsModal - Enterprise-grade Subject Management
 *
 * Features:
 * - Subject information display with multiple schedules
 * - Student enrollment management with visual transfer
 * - Enroll All functionality
 * - Integrated attendance marking with email notifications
 * - Bulk operations (Mark All with email)
 * - Student list display by default with search
 * - Schedule management (add/edit multiple class schedules per day)
 * - Fixed checkbox selection issues
 * - Select All button for attendance marking
 * - Improved schedule clarification for professors
 * - Visual indicators for already-marked attendance
 * - Support for updating attendance status
 * - All 4 status buttons: Present, Absent, Late, Excused
 */

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  BookOpen,
  Users,
  ClipboardList,
  Calendar,
  Clock,
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
  RefreshCw,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { useToast } from '@/store/toastStore'
import { Subject, Student, AttendanceRecord } from '@/types'
import { SubjectEnhanced, EnrolledStudent, SubjectScheduleSlot } from '@/types/subject.types'
import { subjectEnrollmentService } from '@/services/subject-enrollment.service'
import { subjectAttendanceService } from '@/services/subject-attendance.service'
import { studentService } from '@/services/student.service'
import { subjectService } from '@/services/subject.service'

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

export default function SubjectDetailsModal({
  isOpen,
  onClose,
  subject,
}: SubjectDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set())
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

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && subject) {
      setActiveTab('overview')
      setSearchTerm('')
      setSelectedStudents(new Set())
      setSelectedDate(new Date().toISOString().split('T')[0])
      setIsEditingSchedules(false)
      setEditingScheduleIndex(null)
      setSelectedScheduleSlot(null)

      // Load existing schedules
      const subjectEnhanced = subject as any
      if (subjectEnhanced.schedules && Array.isArray(subjectEnhanced.schedules)) {
        setSchedules(subjectEnhanced.schedules)
      } else if (subjectEnhanced.schedule) {
        // Convert legacy schedule to new format
        setSchedules([
          {
            slotName: 'Main Class',
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

      // Reset schedule form
      setScheduleForm({
        slotName: '',
        days: [],
        startTime: '',
        endTime: '',
        room: '',
        building: '',
      })
    }
  }, [isOpen, subject])

  // Fetch enrolled students
  const {
    data: enrolledStudents = [],
    isLoading: loadingEnrolled,
    refetch: refetchEnrolled,
  } = useQuery({
    queryKey: ['subjects', subject?.id, 'students'],
    queryFn: () => subjectEnrollmentService.getEnrolledStudents(subject!.id),
    enabled: isOpen && !!subject,
  })

  // Only consider enrolled entries that have a valid `student` object.
  const validEnrolledStudents = useMemo(
    () => enrolledStudents.filter((e) => !!e.student),
    [enrolledStudents]
  )

  // Fetch all students for enrollment
  const { data: allStudents = [], isLoading: loadingAllStudents } = useQuery({
    queryKey: ['students'],
    queryFn: studentService.getAll,
    enabled: isOpen && activeTab === 'students',
  })

  // Fetch attendance records for selected date and schedule slot
  const {
    data: attendanceRecords = [],
    isLoading: loadingAttendance,
    refetch: refetchAttendance,
  } = useQuery({
    queryKey: ['subjects', subject?.id, 'attendance', selectedDate, selectedScheduleSlot],
    queryFn: () => subjectAttendanceService.getSubjectAttendanceByDate(subject!.id, selectedDate),
    enabled: isOpen && !!subject && activeTab === 'attendance',
  })

  // Filter attendance records by schedule slot if selected
  const filteredAttendanceRecords = useMemo(() => {
    if (!selectedScheduleSlot) return attendanceRecords
    return attendanceRecords.filter((record: any) => record.scheduleSlot === selectedScheduleSlot)
  }, [attendanceRecords, selectedScheduleSlot])

  // Enroll student mutation
  const enrollMutation = useMutation({
    mutationFn: (studentId: number) =>
      subjectEnrollmentService.enrollStudent({ subjectId: subject!.id, studentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects', subject?.id, 'students'] })
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      addToast('Student enrolled successfully', 'success')
      refetchEnrolled()
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to enroll student', 'error')
    },
  })

  // Unenroll student mutation - FIXED to use correct student ID
  const unenrollMutation = useMutation({
    mutationFn: (studentId: number) =>
      subjectEnrollmentService.unenrollStudent(subject!.id, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects', subject?.id, 'students'] })
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      addToast('Student unenrolled successfully', 'success')
      refetchEnrolled()
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to unenroll student', 'error')
    },
  })

  // Enroll all mutation
  const enrollAllMutation = useMutation({
    mutationFn: (studentIds: number[]) =>
      subjectEnrollmentService.enrollAllStudents(subject!.id, studentIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subjects', subject?.id, 'students'] })
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      addToast(`Successfully enrolled ${data.length} students`, 'success')
      refetchEnrolled()
      setEnrollAllConfirm(false)
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to enroll all students', 'error')
      setEnrollAllConfirm(false)
    },
  })

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: (data: {
      studentId: number
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['subjects', subject?.id, 'attendance', selectedDate, selectedScheduleSlot],
      })
      addToast('Attendance marked successfully', 'success')
      refetchAttendance()
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to mark attendance', 'error')
    },
  })

  // Bulk mark attendance mutation
  const bulkMarkMutation = useMutation({
    mutationFn: (data: {
      studentIds: number[]
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['subjects', subject?.id, 'attendance', selectedDate, selectedScheduleSlot],
      })
      const slotInfo = variables.scheduleSlot ? ` for ${variables.scheduleSlot}` : ''
      addToast(
        `Marked ${variables.studentIds.length} students as ${variables.status}${slotInfo}. Email notifications sent to students and guardians.`,
        'success'
      )
      setSelectedStudents(new Set())
      setMarkAllConfirm({ isOpen: false, status: null, scheduleSlot: null })
      refetchAttendance()
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to mark attendance', 'error')
      setMarkAllConfirm({ isOpen: false, status: null, scheduleSlot: null })
    },
  })

  // Update schedules mutation
  const updateSchedulesMutation = useMutation({
    mutationFn: (schedules: SubjectScheduleSlot[]) =>
      subjectService.updateSchedules(subject!.id, schedules),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      queryClient.invalidateQueries({ queryKey: ['subjects', subject?.id] })
      addToast('Schedules updated successfully', 'success')
      setIsEditingSchedules(false)
      setEditingScheduleIndex(null)
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to update schedules', 'error')
    },
  })

  // Available students (not enrolled)
  const availableStudents = useMemo(() => {
    const enrolledIds = new Set(validEnrolledStudents.map((e) => e.studentId))
    return allStudents.filter((s) => !enrolledIds.has(s.id))
  }, [allStudents, validEnrolledStudents])

  // Filtered enrolled students for attendance
  const filteredEnrolledStudents = useMemo(() => {
    if (!searchTerm) return validEnrolledStudents
    const term = searchTerm.toLowerCase()
    return validEnrolledStudents.filter((e) => {
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
  }, [validEnrolledStudents, searchTerm])

  // Attendance status map
  const attendanceStatusMap = useMemo(() => {
    const map = new Map<number, AttendanceRecord>()
    filteredAttendanceRecords.forEach((record: any) => {
      map.set(record.studentId, record)
    })
    return map
  }, [filteredAttendanceRecords])

  // Handle mark all with confirmation
  const handleMarkAll = (status: 'present' | 'absent' | 'late' | 'excused') => {
    const studentIds = filteredEnrolledStudents.map((e) => e.studentId)
    if (studentIds.length === 0) {
      addToast('No students to mark', 'warning')
      return
    }
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

  // Handle enroll all
  const handleEnrollAll = () => {
    if (availableStudents.length === 0) {
      addToast('No students available to enroll', 'warning')
      return
    }
    setEnrollAllConfirm(true)
  }

  const confirmEnrollAll = () => {
    const studentIds = availableStudents.map((s) => s.id)
    enrollAllMutation.mutate(studentIds)
  }

  // FIXED: Toggle student selection with proper event handling
  const toggleStudentSelection = (studentId: number, checked: boolean) => {
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

  // Select all/none - FIXED with proper state update
  const handleSelectAll = () => {
    setSelectedStudents((prev) => {
      const filteredIds = new Set(filteredEnrolledStudents.map((e) => e.studentId))
      // Check if all filtered students are already selected
      const allSelected = filteredEnrolledStudents.every((e) => prev.has(e.studentId))

      if (allSelected) {
        // Deselect all filtered students
        const newSelection = new Set(prev)
        filteredIds.forEach((id) => newSelection.delete(id))
        return newSelection
      } else {
        // Select all filtered students
        const newSelection = new Set(prev)
        filteredIds.forEach((id) => newSelection.add(id))
        return newSelection
      }
    })
  }

  // Check if all filtered students are selected
  const allFilteredSelected = useMemo(() => {
    if (filteredEnrolledStudents.length === 0) return false
    return filteredEnrolledStudents.every((e) => selectedStudents.has(e.studentId))
  }, [filteredEnrolledStudents, selectedStudents])

  // Schedule management functions
  const handleAddSchedule = () => {
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
  }

  const handleEditSchedule = (index: number) => {
    setScheduleForm(schedules[index])
    setEditingScheduleIndex(index)
    setIsEditingSchedules(true)
  }

  const handleDeleteSchedule = (index: number) => {
    const newSchedules = schedules.filter((_, i) => i !== index)
    setSchedules(newSchedules)
    updateSchedulesMutation.mutate(newSchedules)
  }

  const handleDayToggle = (day: Day) => {
    setScheduleForm((prev) => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter((d) => d !== day) : [...prev.days, day],
    }))
  }

  const handleScheduleSave = () => {
    if (!scheduleForm.slotName.trim()) {
      addToast('Please provide a schedule name (e.g., Lecture, Laboratory)', 'warning')
      return
    }
    if (scheduleForm.days.length === 0) {
      addToast('Please select at least one day', 'warning')
      return
    }
    if (!scheduleForm.startTime || !scheduleForm.endTime) {
      addToast('Please provide start and end times', 'warning')
      return
    }
    if (scheduleForm.startTime >= scheduleForm.endTime) {
      addToast('End time must be after start time', 'warning')
      return
    }

    let newSchedules: SubjectScheduleSlot[]
    if (editingScheduleIndex !== null) {
      // Update existing schedule
      newSchedules = schedules.map((s, i) => (i === editingScheduleIndex ? scheduleForm : s))
    } else {
      // Add new schedule
      newSchedules = [...schedules, scheduleForm]
    }

    setSchedules(newSchedules)
    updateSchedulesMutation.mutate(newSchedules)
  }

  const handleCancelScheduleEdit = () => {
    setIsEditingSchedules(false)
    setEditingScheduleIndex(null)
    setScheduleForm({
      slotName: '',
      days: [],
      startTime: '',
      endTime: '',
      room: '',
      building: '',
    })
  }

  if (!subject) return null

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: ClipboardList },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
  ]

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
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-slate-800/95 backdrop-blur-xl rounded-3xl shadow-enterprise-2xl border border-slate-700/50 w-full max-w-6xl max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white p-6 rounded-t-3xl shadow-lg border-b border-purple-500/30 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div
                      initial={{ rotate: -180, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className="bg-white/20 p-3 rounded-xl backdrop-blur-sm border border-white/30"
                    >
                      <BookOpen className="w-7 h-7" />
                    </motion.div>
                    <div>
                      <h2 className="text-2xl font-bold">{subject.subjectCode}</h2>
                      <p className="text-purple-100 text-sm mt-1">{subject.subjectName}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/20 rounded-lg text-xs">
                          <Users className="w-3 h-3" />
                          {validEnrolledStudents.length} students
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/20 rounded-lg text-xs">
                          Year {subject.yearLevel} - {subject.section}
                        </span>
                      </div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </motion.button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mt-6">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                          activeTab === tab.id
                            ? 'bg-white/30 text-white font-semibold'
                            : 'bg-white/10 text-purple-100 hover:bg-white/20'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{tab.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
                        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-purple-400" />
                          Subject Information
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm text-slate-500">Subject Code</label>
                            <p className="text-slate-200 font-medium">{subject.subjectCode}</p>
                          </div>
                          <div>
                            <label className="text-sm text-slate-500">Subject Name</label>
                            <p className="text-slate-200 font-medium">{subject.subjectName}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm text-slate-500">Year Level</label>
                              <p className="text-slate-200 font-medium">Year {subject.yearLevel}</p>
                            </div>
                            <div>
                              <label className="text-sm text-slate-500">Section</label>
                              <p className="text-slate-200 font-medium">{subject.section}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
                        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                          <Users className="w-5 h-5 text-blue-400" />
                          Enrollment Statistics
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Total Students</span>
                            <span className="text-2xl font-bold text-blue-400">
                              {validEnrolledStudents.length}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Today's Attendance</span>
                            <span className="text-2xl font-bold text-emerald-400">
                              {
                                filteredAttendanceRecords.filter((r: any) => r.status === 'present')
                                  .length
                              }
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Attendance Rate</span>
                            <span className="text-2xl font-bold text-purple-400">
                              {validEnrolledStudents.length > 0
                                ? Math.round(
                                    (filteredAttendanceRecords.filter(
                                      (r: any) => r.status === 'present'
                                    ).length /
                                      validEnrolledStudents.length) *
                                      100
                                  )
                                : 0}
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Students Tab */}
                {activeTab === 'students' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Search and Actions */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                          type="text"
                          placeholder="Search students..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-12 h-12 border-slate-600 bg-slate-900/50 text-slate-100"
                        />
                      </div>
                      <Button
                        onClick={handleEnrollAll}
                        disabled={availableStudents.length === 0 || enrollAllMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700 h-12 px-6"
                      >
                        {enrollAllMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <UserPlus className="w-4 h-4 mr-2" />
                        )}
                        Enroll All ({availableStudents.length})
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Enrolled Students List */}
                      <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden">
                        <div className="p-4 bg-slate-800/50 border-b border-slate-700/50">
                          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-400" />
                            Enrolled Students ({validEnrolledStudents.length})
                          </h3>
                        </div>
                        <div className="divide-y divide-slate-700/30 max-h-[500px] overflow-y-auto">
                          {loadingEnrolled ? (
                            <div className="p-8 text-center text-slate-400">
                              Loading students...
                            </div>
                          ) : validEnrolledStudents.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                              No students enrolled yet
                            </div>
                          ) : (
                            validEnrolledStudents.map((enrolled) => {
                              const student = enrolled.student
                              if (!student) return null
                              return (
                                <motion.div
                                  key={enrolled.id}
                                  layout
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 20 }}
                                  className="p-4 hover:bg-slate-800/60 transition-colors flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                                      {String(student.firstName ?? student.studentNumber ?? '?')[0]}
                                      {String(student.lastName ?? '?')[0]}
                                    </div>
                                    <div>
                                      <p className="text-slate-200 font-medium">
                                        {student.firstName ?? 'Unknown'} {student.lastName ?? ''}
                                      </p>
                                      <p className="text-sm text-slate-500">
                                        {student.studentNumber}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => unenrollMutation.mutate(enrolled.studentId)}
                                    disabled={unenrollMutation.isPending}
                                    className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                                  >
                                    <UserMinus className="w-4 h-4 mr-1" />
                                    Remove
                                  </Button>
                                </motion.div>
                              )
                            })
                          )}
                        </div>
                      </div>

                      {/* Available Students */}
                      <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden">
                        <div className="p-4 bg-slate-800/50 border-b border-slate-700/50">
                          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-emerald-400" />
                            Available Students ({availableStudents.length})
                          </h3>
                        </div>
                        <div className="divide-y divide-slate-700/30 max-h-[500px] overflow-y-auto">
                          {loadingAllStudents ? (
                            <div className="p-8 text-center text-slate-400">
                              Loading students...
                            </div>
                          ) : availableStudents.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                              All students are enrolled
                            </div>
                          ) : (
                            availableStudents.map((student) => (
                              <motion.div
                                key={student.id}
                                layout
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="p-4 hover:bg-slate-800/60 transition-colors flex items-center justify-between"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                                    {String(student.firstName ?? student.studentNumber ?? '?')[0]}
                                    {String(student.lastName ?? '?')[0]}
                                  </div>
                                  <div>
                                    <p className="text-slate-200 font-medium">
                                      {student.firstName ?? 'Unknown'} {student.lastName ?? ''}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                      {student.studentNumber}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => enrollMutation.mutate(student.id)}
                                  disabled={enrollMutation.isPending}
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Enroll
                                </Button>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Attendance Tab */}
                {activeTab === 'attendance' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Date Selector and Search */}
                    {/* STEP 1: Session Selection - Most Important */}
                    <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-6 border-2 border-blue-500/30">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="bg-blue-500/20 p-2 rounded-lg">
                          <Calendar className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-200 mb-1">
                            Step 1: Select Class Session
                          </h3>
                          <p className="text-sm text-slate-400">
                            Choose the date and class schedule to mark attendance
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Date
                          </label>
                          <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                              setSelectedDate(e.target.value)
                              setSelectedStudents(new Set())
                            }}
                            max={new Date().toISOString().split('T')[0]}
                            className="h-12 border-slate-600 bg-slate-900/50 text-slate-100"
                          />
                        </div>

                        {schedules.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Class Schedule
                            </label>
                            <select
                              value={selectedScheduleSlot || ''}
                              onChange={(e) => {
                                setSelectedScheduleSlot(e.target.value || null)
                                setSelectedStudents(new Set())
                              }}
                              className="w-full h-12 px-4 border border-slate-600 bg-slate-900/50 text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">⚠️ Select a schedule slot</option>
                              {schedules.map((schedule, index) => (
                                <option key={index} value={schedule.slotName}>
                                  📅 {schedule.slotName} • {schedule.startTime} - {schedule.endTime}
                                </option>
                              ))}
                            </select>
                            <p className="text-xs text-slate-500 mt-1">
                              💡 Tip: Each schedule tracks attendance separately
                            </p>
                          </div>
                        )}
                      </div>

                      {schedules.length === 0 && (
                        <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-amber-400">
                              No schedules configured
                            </p>
                            <p className="text-xs text-amber-300/80 mt-1">
                              Go to the Schedule tab to add class times before marking attendance
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* STEP 2: Quick Actions */}
                    {schedules.length > 0 && (
                      <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                            <h3 className="text-sm font-semibold text-slate-200">
                              Step 2: Quick Bulk Actions
                            </h3>
                          </div>
                          <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                            {filteredEnrolledStudents.length} students
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <Button
                            size="sm"
                            onClick={() => handleMarkAll('present')}
                            disabled={
                              bulkMarkMutation.isPending ||
                              filteredEnrolledStudents.length === 0 ||
                              !selectedScheduleSlot
                            }
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Mark All Present
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleMarkAll('absent')}
                            disabled={
                              bulkMarkMutation.isPending ||
                              filteredEnrolledStudents.length === 0 ||
                              !selectedScheduleSlot
                            }
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Mark All Absent
                          </Button>

                          <div className="w-px h-6 bg-slate-600" />

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleSelectAll}
                            disabled={filteredEnrolledStudents.length === 0}
                            className="border-slate-600"
                          >
                            {allFilteredSelected ? '☑️ Deselect All' : '☐ Select All'}
                          </Button>

                          {selectedStudents.size > 0 && (
                            <>
                              <div className="w-px h-6 bg-slate-600" />
                              <span className="text-sm font-medium text-blue-400 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                {selectedStudents.size} selected
                              </span>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const studentIds = Array.from(selectedStudents)
                                    bulkMarkMutation.mutate({
                                      studentIds,
                                      status: 'present',
                                      scheduleSlot: selectedScheduleSlot || undefined,
                                    })
                                  }}
                                  disabled={bulkMarkMutation.isPending || !selectedScheduleSlot}
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                  Present
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const studentIds = Array.from(selectedStudents)
                                    bulkMarkMutation.mutate({
                                      studentIds,
                                      status: 'absent',
                                      scheduleSlot: selectedScheduleSlot || undefined,
                                    })
                                  }}
                                  disabled={bulkMarkMutation.isPending || !selectedScheduleSlot}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Absent
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const studentIds = Array.from(selectedStudents)
                                    bulkMarkMutation.mutate({
                                      studentIds,
                                      status: 'late',
                                      scheduleSlot: selectedScheduleSlot || undefined,
                                    })
                                  }}
                                  disabled={bulkMarkMutation.isPending || !selectedScheduleSlot}
                                  className="bg-amber-600 hover:bg-amber-700"
                                >
                                  Late
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const studentIds = Array.from(selectedStudents)
                                    bulkMarkMutation.mutate({
                                      studentIds,
                                      status: 'excused',
                                      scheduleSlot: selectedScheduleSlot || undefined,
                                    })
                                  }}
                                  disabled={bulkMarkMutation.isPending || !selectedScheduleSlot}
                                  className="bg-purple-600 hover:bg-purple-700"
                                >
                                  Excused
                                </Button>
                              </div>
                            </>
                          )}
                        </div>

                        {!selectedScheduleSlot && (
                          <p className="text-xs text-amber-400 mt-3 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Please select a schedule slot above to use bulk actions
                          </p>
                        )}
                      </div>
                    )}

                    {/* STEP 3: Student Search */}
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                      <Input
                        type="text"
                        placeholder="🔍 Search students by name or student number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-12 border-slate-600 bg-slate-900/50 text-slate-100"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Students List with Attendance - WITH ALL 4 BUTTONS + VISUAL INDICATORS */}
                    <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden">
                      <div className="divide-y divide-slate-700/30 max-h-[500px] overflow-y-auto">
                        {loadingEnrolled || loadingAttendance ? (
                          <div className="p-8 text-center text-slate-400">Loading...</div>
                        ) : filteredEnrolledStudents.length === 0 ? (
                          <div className="p-8 text-center text-slate-400">
                            {searchTerm ? 'No students found' : 'No students enrolled'}
                          </div>
                        ) : (
                          filteredEnrolledStudents.map((enrolled) => {
                            const student = enrolled.student
                            const studentId = enrolled.studentId
                            if (!studentId) return null
                            const attendanceRecord = attendanceStatusMap.get(studentId)
                            const status = attendanceRecord?.status
                            const isSelected = selectedStudents.has(studentId)
                            const nameColor = status
                              ? status === 'present'
                                ? 'text-emerald-200'
                                : status === 'absent'
                                  ? 'text-red-300'
                                  : status === 'late'
                                    ? 'text-amber-300'
                                    : 'text-purple-300'
                              : 'text-slate-200'
                            const numberColor = status ? 'text-slate-300' : 'text-slate-500'

                            return (
                              <div
                                key={enrolled.id}
                                className={`p-4 transition-all ${
                                  status
                                    ? 'bg-slate-800/60 border-l-4 ' +
                                      (status === 'present'
                                        ? 'border-emerald-500 bg-emerald-500/5'
                                        : status === 'absent'
                                          ? 'border-red-500 bg-red-500/5'
                                          : status === 'late'
                                            ? 'border-amber-500 bg-amber-500/5'
                                            : 'border-purple-500 bg-purple-500/5')
                                    : 'hover:bg-slate-800/60 border-l-4 border-transparent'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) =>
                                        toggleStudentSelection(studentId, checked as boolean)
                                      }
                                      className="w-5 h-5"
                                    />
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                      {
                                        String(
                                          student?.firstName ?? student?.studentNumber ?? '?'
                                        )[0]
                                      }
                                      {String(student?.lastName ?? '?')[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`${nameColor} font-medium truncate`}>
                                        {student?.firstName ?? 'Unknown'} {student?.lastName ?? ''}
                                      </p>
                                      <p className={`text-sm ${numberColor}`}>
                                        {student?.studentNumber ?? ''}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                                    {status ? (
                                      <>
                                        <span
                                          className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                                            status === 'present'
                                              ? 'bg-emerald-500/30 text-emerald-300 border-2 border-emerald-500'
                                              : status === 'absent'
                                                ? 'bg-red-500/30 text-red-300 border-2 border-red-500'
                                                : status === 'late'
                                                  ? 'bg-amber-500/30 text-amber-300 border-2 border-amber-500'
                                                  : 'bg-purple-500/30 text-purple-300 border-2 border-purple-500'
                                          }`}
                                        >
                                          {status}
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            markAttendanceMutation.mutate({
                                              studentId: studentId,
                                              status: 'present',
                                              scheduleSlot: selectedScheduleSlot || undefined,
                                            })
                                          }
                                          disabled={markAttendanceMutation.isPending}
                                          className="border-blue-500/30 text-blue-400 hover:bg-blue-500/20 h-8 px-3"
                                          title="Change to another status"
                                        >
                                          <RefreshCw className="w-3 h-3 mr-1" />
                                          Change
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            markAttendanceMutation.mutate({
                                              studentId: studentId,
                                              status: 'present',
                                              scheduleSlot: selectedScheduleSlot || undefined,
                                            })
                                          }
                                          disabled={markAttendanceMutation.isPending}
                                          className="bg-emerald-600 hover:bg-emerald-700 h-8 px-2.5"
                                        >
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          Present
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            markAttendanceMutation.mutate({
                                              studentId: studentId,
                                              status: 'absent',
                                              scheduleSlot: selectedScheduleSlot || undefined,
                                            })
                                          }
                                          disabled={markAttendanceMutation.isPending}
                                          className="bg-red-600 hover:bg-red-700 h-8 px-2.5"
                                        >
                                          <XCircle className="w-3 h-3 mr-1" />
                                          Absent
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            markAttendanceMutation.mutate({
                                              studentId: studentId,
                                              status: 'late',
                                              scheduleSlot: selectedScheduleSlot || undefined,
                                            })
                                          }
                                          disabled={markAttendanceMutation.isPending}
                                          className="bg-amber-600 hover:bg-amber-700 h-8 px-2.5"
                                        >
                                          <Clock className="w-3 h-3 mr-1" />
                                          Late
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            markAttendanceMutation.mutate({
                                              studentId: studentId,
                                              status: 'excused',
                                              scheduleSlot: selectedScheduleSlot || undefined,
                                            })
                                          }
                                          disabled={markAttendanceMutation.isPending}
                                          className="bg-purple-600 hover:bg-purple-700 h-8 px-2.5"
                                        >
                                          <AlertCircle className="w-3 h-3 mr-1" />
                                          Excused
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>

                    {/* Attendance Summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                          <span className="text-sm text-emerald-400 font-medium">Present</span>
                        </div>
                        <p className="text-2xl font-bold text-emerald-400">
                          {
                            filteredAttendanceRecords.filter((r: any) => r.status === 'present')
                              .length
                          }
                        </p>
                      </div>
                      <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="w-5 h-5 text-red-400" />
                          <span className="text-sm text-red-400 font-medium">Absent</span>
                        </div>
                        <p className="text-2xl font-bold text-red-400">
                          {
                            filteredAttendanceRecords.filter((r: any) => r.status === 'absent')
                              .length
                          }
                        </p>
                      </div>
                      <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-5 h-5 text-amber-400" />
                          <span className="text-sm text-amber-400 font-medium">Late</span>
                        </div>
                        <p className="text-2xl font-bold text-amber-400">
                          {filteredAttendanceRecords.filter((r: any) => r.status === 'late').length}
                        </p>
                      </div>
                      <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-5 h-5 text-purple-400" />
                          <span className="text-sm text-purple-400 font-medium">Excused</span>
                        </div>
                        <p className="text-2xl font-bold text-purple-400">
                          {
                            filteredAttendanceRecords.filter((r: any) => r.status === 'excused')
                              .length
                          }
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Schedule Tab - keeping existing code */}
                {activeTab === 'schedule' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-400" />
                            Class Schedules
                          </h3>
                          <div className="group relative">
                            <Info className="w-4 h-4 text-slate-500 cursor-help" />
                            <div className="invisible group-hover:visible absolute z-10 left-0 top-full mt-1 w-80 p-4 bg-slate-800 border border-slate-700 rounded-lg shadow-xl text-xs text-slate-300">
                              <p className="font-semibold mb-2">Managing Class Schedules:</p>
                              <ul className="space-y-1 list-disc list-inside">
                                <li>
                                  Add multiple schedules for different class types (Lecture, Lab,
                                  Tutorial)
                                </li>
                                <li>Each schedule can have different days, times, and locations</li>
                                <li>
                                  Use schedule slots when marking attendance to track which session
                                  students attended
                                </li>
                                <li>Example: "Lecture" on Mon/Wed 9-11am, "Lab" on Fri 2-5pm</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                        {!isEditingSchedules && (
                          <Button
                            onClick={handleAddSchedule}
                            variant="outline"
                            className="border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Schedule
                          </Button>
                        )}
                      </div>

                      {isEditingSchedules ? (
                        <div className="space-y-6">
                          {/* Schedule Name */}
                          <div>
                            <Label className="text-slate-300 mb-2 block">
                              Schedule Name (e.g., Lecture, Laboratory, Tutorial)
                            </Label>
                            <Input
                              type="text"
                              placeholder="e.g., Lecture"
                              value={scheduleForm.slotName}
                              onChange={(e) =>
                                setScheduleForm({ ...scheduleForm, slotName: e.target.value })
                              }
                              className="h-12 border-slate-600 bg-slate-800 text-slate-100"
                            />
                          </div>

                          {/* Days Selection */}
                          <div>
                            <Label className="text-slate-300 mb-3 block">Class Days</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {DAYS_OF_WEEK.map((day) => (
                                <button
                                  key={day}
                                  onClick={() => handleDayToggle(day)}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    scheduleForm.days.includes(day)
                                      ? 'bg-blue-600 text-white border-2 border-blue-400'
                                      : 'bg-slate-800 text-slate-400 border-2 border-slate-700 hover:border-slate-600'
                                  }`}
                                >
                                  {day.slice(0, 3)}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Time Selection */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-slate-300 mb-2 block">Start Time</Label>
                              <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                  type="time"
                                  value={scheduleForm.startTime}
                                  onChange={(e) =>
                                    setScheduleForm({ ...scheduleForm, startTime: e.target.value })
                                  }
                                  className="pl-11 h-12 border-slate-600 bg-slate-800 text-slate-100"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-slate-300 mb-2 block">End Time</Label>
                              <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                  type="time"
                                  value={scheduleForm.endTime}
                                  onChange={(e) =>
                                    setScheduleForm({ ...scheduleForm, endTime: e.target.value })
                                  }
                                  className="pl-11 h-12 border-slate-600 bg-slate-800 text-slate-100"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Room and Building */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-slate-300 mb-2 block">Room (Optional)</Label>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                  type="text"
                                  placeholder="e.g., Room 301"
                                  value={scheduleForm.room}
                                  onChange={(e) =>
                                    setScheduleForm({ ...scheduleForm, room: e.target.value })
                                  }
                                  className="pl-11 h-12 border-slate-600 bg-slate-800 text-slate-100"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-slate-300 mb-2 block">
                                Building (Optional)
                              </Label>
                              <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                  type="text"
                                  placeholder="e.g., Science Building"
                                  value={scheduleForm.building}
                                  onChange={(e) =>
                                    setScheduleForm({ ...scheduleForm, building: e.target.value })
                                  }
                                  className="pl-11 h-12 border-slate-600 bg-slate-800 text-slate-100"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3 pt-4">
                            <Button
                              onClick={handleScheduleSave}
                              disabled={updateSchedulesMutation.isPending}
                              className="bg-blue-600 hover:bg-blue-700 flex-1"
                            >
                              {updateSchedulesMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4 mr-2" />
                              )}
                              {editingScheduleIndex !== null ? 'Update Schedule' : 'Save Schedule'}
                            </Button>
                            <Button
                              onClick={handleCancelScheduleEdit}
                              variant="outline"
                              className="border-slate-600"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : schedules.length > 0 ? (
                        <div className="space-y-4">
                          {schedules.map((schedule, index) => (
                            <div
                              key={index}
                              className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="text-lg font-semibold text-slate-200">
                                  {schedule.slotName}
                                </h4>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditSchedule(index)}
                                    className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSchedule(index)}
                                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="w-4 h-4 text-blue-400" />
                                    <span className="text-sm text-slate-400">Days</span>
                                  </div>
                                  <p className="text-slate-200 font-medium">
                                    {schedule.days.join(', ')}
                                  </p>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Clock className="w-4 h-4 text-blue-400" />
                                    <span className="text-sm text-slate-400">Time</span>
                                  </div>
                                  <p className="text-slate-200 font-medium">
                                    {schedule.startTime} - {schedule.endTime}
                                  </p>
                                </div>
                                {schedule.room && (
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <MapPin className="w-4 h-4 text-blue-400" />
                                      <span className="text-sm text-slate-400">Room</span>
                                    </div>
                                    <p className="text-slate-200 font-medium">{schedule.room}</p>
                                  </div>
                                )}
                                {schedule.building && (
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Building2 className="w-4 h-4 text-blue-400" />
                                      <span className="text-sm text-slate-400">Building</span>
                                    </div>
                                    <p className="text-slate-200 font-medium">
                                      {schedule.building}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-400">
                          <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                          <p className="font-medium">No schedules configured</p>
                          <p className="text-sm mt-2">
                            Click "Add Schedule" to configure class days, times, and location
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 px-6 py-4 bg-slate-900/50 border-t border-slate-700/50 rounded-b-3xl">
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={onClose} className="border-slate-600">
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Enroll All Confirmation Dialog */}
          <ConfirmationDialog
            isOpen={enrollAllConfirm}
            onClose={() => setEnrollAllConfirm(false)}
            onConfirm={confirmEnrollAll}
            title="Enroll All Students"
            description={`Are you sure you want to enroll all ${availableStudents.length} available students in this subject?`}
            confirmText="Enroll All"
            cancelText="Cancel"
            variant="info"
            isLoading={enrollAllMutation.isPending}
          />

          {/* Mark All Confirmation Dialog */}
          <ConfirmationDialog
            isOpen={markAllConfirm.isOpen}
            onClose={() => setMarkAllConfirm({ isOpen: false, status: null, scheduleSlot: null })}
            onConfirm={confirmMarkAll}
            title={`Mark All as ${markAllConfirm.status?.charAt(0).toUpperCase()}${markAllConfirm.status?.slice(1)}`}
            description={`Are you sure you want to mark all ${filteredEnrolledStudents.length} students as ${markAllConfirm.status}${markAllConfirm.scheduleSlot ? ` for ${markAllConfirm.scheduleSlot}` : ''}? Email notifications will be sent to students and their guardians.`}
            confirmText="Confirm"
            cancelText="Cancel"
            variant="info"
            isLoading={bulkMarkMutation.isPending}
          />
        </>
      )}
    </AnimatePresence>
  )
}
