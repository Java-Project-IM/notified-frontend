/**
 * AttendanceDropdown Component
 *
 * Reusable dropdown for marking student arrival/departure with:
 * - Quick action selection (Arrival/Departure)
 * - Status selection (Present/Late/Excused)
 * - Automatic message generation
 * - Guardian notification option
 * - Fixed positioning to prevent cutoff issues
 *
 * Integration: Drop into any page needing attendance marking
 */

import { useState, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, DoorOpen, Clock, AlertCircle, Mail, ChevronDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import EditAttendanceModal from '@/components/attendance/EditAttendanceModal'
import { useToast } from '@/store/toastStore'
import { AttendanceStatus, TimeSlot, Student, AttendanceRecord } from '@/types'
import { enhancedAttendanceService } from '@/services/enhanced-attendance.service'
import { generateAttendanceMessage } from '@/utils/messageTemplates'
import emailService from '@/services/email.service'

interface AttendanceDropdownProps {
  student: Student
  subjectId?: number
  onSuccess?: (timeSlot: TimeSlot, status: AttendanceStatus) => void
  onError?: (error: Error) => void
  showNotifyOption?: boolean
  className?: string
}

export const AttendanceDropdown = ({
  student,
  subjectId,
  onSuccess,
  onError,
  showNotifyOption = true,
  className = '',
}: AttendanceDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [existingRecord, setExistingRecord] = useState<AttendanceRecord | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sendNotification, setSendNotification] = useState(true)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const toast = useToast()
  const queryClient = useQueryClient()

  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuId = `attendance-dropdown-menu-${student.id}`

  /**
   * Calculate dropdown position to prevent cutoff
   */
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const dropdownWidth = 320 // w-80 = 320px
      const dropdownHeight = 400 // estimated height

      let top = rect.bottom + 8
      let left = rect.left

      // Check if dropdown would overflow bottom
      if (top + dropdownHeight > viewportHeight) {
        top = rect.top - dropdownHeight - 8
      }

      // Check if dropdown would overflow right
      if (left + dropdownWidth > viewportWidth) {
        left = viewportWidth - dropdownWidth - 16
      }

      // Check if dropdown would overflow left
      if (left < 16) {
        left = 16
      }

      setDropdownPosition({ top, left })
    }
  }, [isOpen])

  // Fetch existing attendance for today when opening dropdown
  useEffect(() => {
    if (!isOpen) return
    ;(async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        const records = await enhancedAttendanceService.getAttendanceRecords({
          studentId: student.id as any,
          subjectId,
          dateRange: { startDate: today, endDate: today },
        })
        setExistingRecord(records.length > 0 ? records[0] : null)
      } catch (err) {
        console.error('[AttendanceDropdown] Failed fetching existing record', err)
      }
    })()
  }, [isOpen, student.id, subjectId])

  /**
   * Handle attendance marking
   */
  const handleMark = async (timeSlot: TimeSlot, status: AttendanceStatus) => {
    setIsLoading(true)
    try {
      // Build payload defensively to satisfy backend validation
      const payload: any = {
        studentId: student.id || (student.id as unknown as string),
        status,
        date: new Date().toISOString(),
        remarks:
          status === 'late'
            ? 'Arrived late'
            : status === 'excused'
              ? 'Excused absence'
              : `${timeSlot} marked on time`,
        timeSlot,
      }

      if (typeof subjectId === 'number' || typeof subjectId === 'string') {
        payload.subjectId = String(subjectId)
      }

      // Mark attendance
      await enhancedAttendanceService.markAttendance(payload)

      // Generate message and show success
      const studentName = `${student.firstName} ${student.lastName}`
      const message = generateAttendanceMessage(timeSlot, studentName, student.studentNumber, {
        status: status.charAt(0).toUpperCase() + status.slice(1),
      })

      toast.success(
        `${timeSlot === 'arrival' ? 'Arrival' : 'Departure'} marked successfully!`,
        'Attendance Recorded'
      )

      // Show the predefined notification message (informational)
      setTimeout(() => {
        toast.info(message, `${timeSlot === 'arrival' ? 'Arrival' : 'Departure'} Notification`)
      }, 500)

      // Send email notification if guardian email exists and option is enabled
      if (sendNotification && student.guardianEmail) {
        try {
          await emailService.sendEmail({
            to: student.guardianEmail,
            subject: `${timeSlot === 'arrival' ? 'Arrival' : 'Departure'} Notification - ${studentName}`,
            message,
          })
          toast.success('Guardian notified via email', 'Email Sent')
          queryClient.invalidateQueries({ queryKey: ['email-history'] })
        } catch (emailError) {
          toast.warning('Attendance marked, but email notification failed', 'Partial Success')
        }
      }

      onSuccess?.(timeSlot, status)
      setIsOpen(false)
    } catch (err) {
      const errorAny = err as any
      // If attendance is already marked, fetch the existing record and open editor
      if (errorAny?.response?.status === 409 || errorAny?.status === 409) {
        try {
          const today = new Date().toISOString().split('T')[0]
          const records = await enhancedAttendanceService.getAttendanceRecords({
            studentId: student.id as any,
            subjectId,
            dateRange: { startDate: today, endDate: today },
          })
          setExistingRecord(records.length > 0 ? records[0] : null)
          setIsEditOpen(true)
        } catch (er) {
          console.error('[AttendanceDropdown] Failed to fetch existing record after conflict', er)
        }
        return
      }
      if (errorAny?.status === 422 || errorAny?.response?.status === 422) {
        const errors = errorAny?.response?.data?.errors || errorAny?.errors
        const messages = Array.isArray(errors)
          ? errors.flat().slice(0, 5)
          : typeof errors === 'object'
            ? Object.values(errors).flat().slice(0, 5)
            : []
        if (messages.length > 0) {
          toast.error(messages.join('; '), 'Validation failed')
        } else {
          toast.error(errorAny?.response?.data?.message || 'Validation failed', 'Error')
        }
      } else {
        toast.error('Failed to mark attendance. Please try again.', 'Error')
      }

      onError?.(err as Error)
    } finally {
      setIsLoading(false)
    }
  }

  const attendanceOptions = [
    {
      timeSlot: 'arrival' as TimeSlot,
      status: 'present' as AttendanceStatus,
      icon: CheckCircle,
      label: 'Mark Arrival (Present)',
      color: 'emerald',
      description: 'Student arrived on time',
    },
    {
      timeSlot: 'arrival' as TimeSlot,
      status: 'late' as AttendanceStatus,
      icon: Clock,
      label: 'Mark Arrival (Late)',
      color: 'amber',
      description: 'Student arrived late',
    },
    {
      timeSlot: 'departure' as TimeSlot,
      status: 'present' as AttendanceStatus,
      icon: DoorOpen,
      label: 'Mark Departure',
      color: 'blue',
      description: 'Student left school',
    },
    {
      timeSlot: 'arrival' as TimeSlot,
      status: 'excused' as AttendanceStatus,
      icon: AlertCircle,
      label: 'Mark Excused',
      color: 'purple',
      description: 'Excused absence',
    },
  ]

  useEffect(() => {
    if (!isOpen) return
    const menu = document.getElementById(menuId)
    const first = menu?.querySelector('[role="menuitem"]') as HTMLElement | null
    first?.focus()
  }, [isOpen, menuId])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  return (
    <div className={`relative ${className}`}>
      {/* Dropdown Trigger */}
      <Button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setIsOpen(true)
          }
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen((s) => !s)
          }
          if (e.key === 'Escape') {
            setIsOpen(false)
          }
        }}
        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-enterprise-lg transition-all"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4" />
            Mark
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </Button>

      {/* Dropdown Menu - Using Portal for proper positioning */}
      {isOpen &&
        !isLoading &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              id={menuId}
              role="menu"
              aria-label={`Attendance actions for ${student.firstName} ${student.lastName}`}
              style={{
                position: 'fixed',
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                zIndex: 9999,
              }}
              className="w-80 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-slate-700 to-slate-800 border-b border-slate-600">
                <p className="text-sm font-semibold text-white">
                  {student.firstName} {student.lastName}
                </p>
                <p className="text-xs text-slate-400">{student.studentNumber}</p>
              </div>

              {/* Options */}
              <div className="p-2 max-h-80 overflow-y-auto">
                {attendanceOptions.map((option, index) => {
                  const Icon = option.icon
                  return (
                    <motion.button
                      key={index}
                      role="menuitem"
                      tabIndex={0}
                      onClick={() => handleMark(option.timeSlot, option.status)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleMark(option.timeSlot, option.status)
                        }
                        if (e.key === 'ArrowDown') {
                          e.preventDefault()
                          ;(e.currentTarget.nextElementSibling as HTMLElement | null)?.focus()
                        }
                        if (e.key === 'ArrowUp') {
                          e.preventDefault()
                          ;(e.currentTarget.previousElementSibling as HTMLElement | null)?.focus()
                        }
                      }}
                      className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-700/50 transition-all text-left group focus:outline-none focus:ring-2 focus:ring-purple-500/30`}
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-lg ${
                          option.color === 'emerald'
                            ? 'bg-emerald-500/20 group-hover:bg-emerald-500/30'
                            : option.color === 'amber'
                              ? 'bg-amber-500/20 group-hover:bg-amber-500/30'
                              : option.color === 'blue'
                                ? 'bg-blue-500/20 group-hover:bg-blue-500/30'
                                : 'bg-purple-500/20 group-hover:bg-purple-500/30'
                        } flex items-center justify-center transition-colors`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            option.color === 'emerald'
                              ? 'text-emerald-400'
                              : option.color === 'amber'
                                ? 'text-amber-400'
                                : option.color === 'blue'
                                  ? 'text-blue-400'
                                  : 'text-purple-400'
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-200 group-hover:text-white">
                          {option.label}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{option.description}</p>
                      </div>
                    </motion.button>
                  )
                })}
                {/* If already marked today, show a small row to view/edit */}
                {existingRecord && (
                  <div className="p-3 mt-2 rounded-lg bg-slate-900/50 border border-slate-700 text-slate-300 text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Already marked: {existingRecord.status}</div>
                        <div className="text-xs text-slate-500">
                          ID: {String(existingRecord.id).slice(0, 8)}
                        </div>
                      </div>
                      <div>
                        <Button size="sm" variant="outline" onClick={() => setIsEditOpen(true)}>
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Option */}
              {showNotifyOption && student.guardianEmail && (
                <div className="px-4 py-3 bg-slate-900/50 border-t border-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={sendNotification}
                      onChange={(e) => setSendNotification(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <Mail className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                    <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                      Notify guardian via email
                    </span>
                  </label>
                  <p className="text-xs text-slate-600 ml-6 mt-1">{student.guardianEmail}</p>
                </div>
              )}

              {/* Close button */}
              <div className="px-4 py-2 bg-slate-900/50 border-t border-slate-700">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors py-1"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}

      {/* Edit attendance modal (controlled by isEditOpen) */}
      <EditAttendanceModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        record={existingRecord as AttendanceRecord}
        onUpdated={(rec) => {
          // Refresh parent with updated record info
          onSuccess?.(rec.timeSlot, rec.status)
        }}
      />
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-black/20"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
