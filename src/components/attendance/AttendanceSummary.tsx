/**
 * AttendanceSummary Component
 *
 * Displays comprehensive attendance statistics with:
 * - Daily summary cards
 * - Student-wise attendance breakdown
 * - Date range filtering
 * - Visual progress indicators
 * - Export to Excel functionality
 *
 * Integration: Use in dashboard or dedicated attendance page
 */

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  Download,
  TrendingUp,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/store/toastStore'
import { AttendanceSummary as AttendanceSummaryType, StudentAttendanceSummary } from '@/types'
import { enhancedAttendanceService } from '@/services/enhanced-attendance.service'
import { exportAttendanceSummaryReport } from '@/utils/attendanceExcelUtils'
import { format } from 'date-fns'

interface AttendanceSummaryProps {
  showStudentDetails?: boolean
  dateFilter?: 'today' | 'week' | 'month' | 'custom'
  className?: string
}

export const AttendanceSummary = ({
  showStudentDetails = true,
  dateFilter = 'today',
  className = '',
}: AttendanceSummaryProps) => {
  const [summary, setSummary] = useState<AttendanceSummaryType | null>(null)
  const [studentSummaries, setStudentSummaries] = useState<StudentAttendanceSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const toast = useToast()

  const loadSummary = useCallback(async () => {
    setIsLoading(true)
    try {
      // Load daily summary
      const dailySummary = await enhancedAttendanceService.getDailySummary()
      setSummary(dailySummary)

      // Load student summaries if enabled
      if (showStudentDetails) {
        const students = await enhancedAttendanceService.getAllStudentsSummary(
          startDate || undefined,
          endDate || undefined
        )
        setStudentSummaries(students)
      }
    } catch (error) {
      console.error('[AttendanceSummary] Failed to load summary:', error)
      toast.error('Failed to load attendance summary', 'Error')
    } finally {
      setIsLoading(false)
    }
  }, [showStudentDetails, startDate, endDate, toast])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  const handleExport = () => {
    if (!summary) return
    try {
      exportAttendanceSummaryReport(summary, studentSummaries)
      toast.success('Attendance summary exported successfully!', 'Export Complete')
    } catch (error) {
      console.error('[AttendanceSummary] Export failed:', error)
      toast.error('Failed to export summary', 'Export Error')
    }
  }

  if (isLoading) {
    // Show skeleton cards and table placeholders for enterprise loading state
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="w-56 h-6 bg-slate-700/40 rounded-md animate-pulse mb-2" />
            <div className="w-40 h-4 bg-slate-700/40 rounded-md animate-pulse" />
          </div>
          <div className="w-36 h-10 bg-slate-700/40 rounded-lg animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-4 bg-slate-800/50 border-slate-700/50 rounded-2xl shadow-enterprise-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-700/40" />
                <div className="flex-1">
                  <div className="w-24 h-5 bg-slate-700/40 rounded-md mb-2" />
                  <div className="w-12 h-6 bg-slate-700/40 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-800/50 rounded-2xl shadow-enterprise-lg">
            <div className="w-full h-20 bg-slate-700/40 rounded-md" />
          </div>
          <div className="p-4 bg-slate-800/50 rounded-2xl shadow-enterprise-lg">
            <div className="w-full h-20 bg-slate-700/40 rounded-md" />
          </div>
        </div>

        <div className="bg-slate-800/50 border-slate-700/50 rounded-2xl shadow-enterprise-lg p-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="p-3" />
                  <th className="p-3" />
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-3">
                      <div className="w-36 h-4 bg-slate-700/40 rounded-md" />
                    </td>
                    <td className="p-3">
                      <div className="w-24 h-4 bg-slate-700/40 rounded-md" />
                    </td>
                    <td className="p-3">
                      <div className="w-12 h-4 bg-slate-700/40 rounded-md" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400 font-medium">No attendance data available</p>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Students',
      value: summary.totalStudents,
      icon: Users,
      color: 'blue',
      bgGradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Present',
      value: summary.present,
      icon: CheckCircle,
      color: 'emerald',
      bgGradient: 'from-emerald-500 to-emerald-600',
      percentage: summary.totalStudents > 0 ? (summary.present / summary.totalStudents) * 100 : 0,
    },
    {
      title: 'Absent',
      value: summary.absent,
      icon: XCircle,
      color: 'red',
      bgGradient: 'from-red-500 to-red-600',
      percentage: summary.totalStudents > 0 ? (summary.absent / summary.totalStudents) * 100 : 0,
    },
    {
      title: 'Late',
      value: summary.late,
      icon: Clock,
      color: 'amber',
      bgGradient: 'from-amber-500 to-amber-600',
      percentage: summary.totalStudents > 0 ? (summary.late / summary.totalStudents) * 100 : 0,
    },
    {
      title: 'Excused',
      value: summary.excused,
      icon: AlertCircle,
      color: 'purple',
      bgGradient: 'from-purple-500 to-purple-600',
      percentage: summary.totalStudents > 0 ? (summary.excused / summary.totalStudents) * 100 : 0,
    },
    {
      title: 'Attendance Rate',
      value: `${summary.attendanceRate}%`,
      icon: TrendingUp,
      color: 'indigo',
      bgGradient: 'from-indigo-500 to-indigo-600',
    },
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Attendance Summary</h2>
          <p className="text-sm text-slate-400 mt-1">
            {format(new Date(summary.date), 'MMMM dd, yyyy')}
          </p>
        </div>
        <Button
          onClick={handleExport}
          variant="outline"
          className="flex items-center gap-2 border-slate-600 bg-slate-800/80 hover:bg-slate-700 text-slate-200"
        >
          <Download className="w-4 h-4" />
          Export to Excel
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.bgGradient} flex items-center justify-center shadow-lg`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-100 mb-1">{stat.value}</p>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    {stat.title}
                  </p>
                  {stat.percentage !== undefined && (
                    <div className="mt-3">
                      <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${stat.bgGradient} transition-all duration-500`}
                          style={{ width: `${stat.percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{stat.percentage.toFixed(1)}%</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Arrival/Departure Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-200 text-base">Check-ins Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-100">{summary.arrivalCount}</p>
                <p className="text-sm text-slate-400">Students checked in</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-200 text-base">Check-outs Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-100">{summary.departureCount}</p>
                <p className="text-sm text-slate-400">Students checked out</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Details Table */}
      {showStudentDetails && studentSummaries.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-slate-200">Student Attendance Details</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-700 to-slate-800">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wide">
                      Student
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wide">
                      Total Days
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wide">
                      Present
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wide">
                      Absent
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wide">
                      Late
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wide">
                      Attendance Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-900/50 divide-y divide-slate-700/30">
                  {studentSummaries.slice(0, 10).map((student, index) => (
                    <motion.tr
                      key={student.studentId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-slate-800/60 transition-colors"
                    >
                      <td className="px-6 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-200">
                            {student.studentName}
                          </p>
                          <p className="text-xs text-slate-500">{student.studentNumber}</p>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-center text-sm text-slate-300">
                        {student.totalDays}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300">
                          {student.presentDays}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300">
                          {student.absentDays}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300">
                          {student.lateDays}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                student.attendanceRate >= 90
                                  ? 'bg-emerald-500'
                                  : student.attendanceRate >= 75
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                              }`}
                              style={{ width: `${student.attendanceRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-slate-200">
                            {student.attendanceRate}%
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
