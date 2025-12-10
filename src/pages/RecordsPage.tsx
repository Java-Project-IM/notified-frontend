import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Search,
  Calendar,
  Filter,
  BarChart3,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  BookOpen,
  Users,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import MainLayout from '@/layouts/MainLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { useToast } from '@/store/toastStore'
import { recordService } from '@/services/record.service'
import { AttendanceRecord } from '@/types'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

type FilterType = 'all' | 'present' | 'absent' | 'late' | 'excused'

export default function RecordsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const { addToast } = useToast()

  // Fetch attendance records (subject-specific attendance)
  const { data: attendanceRecords = [], isLoading } = useQuery({
    queryKey: ['attendance-records', selectedDate],
    queryFn: async () => {
      console.log('[Records] Fetching attendance records...')
      const filters: any = {}
      if (selectedDate) {
        filters.startDate = selectedDate
        filters.endDate = selectedDate
      }
      const data = await recordService.getAllAttendanceRecords(filters)
      console.log('[Records] Loaded attendance records:', data.length)
      return data
    },
  })

  // Filter records
  const filteredRecords = attendanceRecords.filter((record) => {
    const matchesSearch =
      record.studentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.subjectCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.subjectName?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === 'all' || record.status === filterType

    return matchesSearch && matchesType
  })

  // Calculate stats
  const todayRecords = attendanceRecords.filter((r) => {
    const recordDate = format(new Date(r.timestamp || r.createdAt), 'yyyy-MM-dd')
    const today = format(new Date(), 'yyyy-MM-dd')
    return recordDate === today
  })

  const present = filteredRecords.filter((r) => r.status === 'present').length
  const absent = filteredRecords.filter((r) => r.status === 'absent').length
  const late = filteredRecords.filter((r) => r.status === 'late').length
  const excused = filteredRecords.filter((r) => r.status === 'excused').length

  const handleShowSummary = () => {
    const summary = `
Records Summary

Total Records: ${filteredRecords.length}
Present: ${present}
Absent: ${absent}
Late: ${late}
Excused: ${excused}
Today's Records: ${todayRecords.length}

Date Range: ${selectedDate || 'All Time'}
    `.trim()

    addToast(summary, 'info')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return CheckCircle
      case 'absent':
        return XCircle
      case 'late':
        return Clock
      case 'excused':
        return AlertCircle
      default:
        return CheckCircle
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'emerald'
      case 'absent':
        return 'rose'
      case 'late':
        return 'amber'
      case 'excused':
        return 'purple'
      default:
        return 'slate'
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Attendance Records"
          description="Monitor student attendance across all subjects, track attendance status and patterns"
          icon={BookOpen}
          gradient="from-emerald-600 via-teal-600 to-cyan-600"
          actions={[
            {
              label: 'Summary',
              onClick: handleShowSummary,
              icon: BarChart3,
              variant: 'outline',
            },
            {
              label: 'Export',
              onClick: () => addToast('Export feature coming soon!', 'info'),
              icon: Download,
              variant: 'outline',
            },
          ]}
        />

        {/* Filters - Enterprise Grade */}
        <div className="bg-slate-800/50 rounded-2xl p-6 shadow-enterprise border border-slate-700/50 backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by student number, name, email, or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 border-slate-600 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as FilterType)}
                  className="appearance-none pl-10 pr-10 py-3 h-12 border border-slate-600 bg-slate-900/50 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer min-w-[160px]"
                >
                  <option value="all">All Status</option>
                  <option value="present">Present Only</option>
                  <option value="absent">Absent Only</option>
                  <option value="late">Late Only</option>
                  <option value="excused">Excused Only</option>
                </select>
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-10 w-52 h-12 border-slate-600 bg-slate-900/50 text-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </div>
              {(filterType !== 'all' || selectedDate) && (
                <Button
                  variant="outline"
                  className="border-slate-600 bg-slate-800/80 hover:bg-slate-700 hover:border-red-500 text-slate-200 hover:text-white transition-all h-12 px-5"
                  onClick={() => {
                    setFilterType('all')
                    setSelectedDate('')
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Present', value: present, color: 'emerald', icon: CheckCircle },
            { label: 'Absent', value: absent, color: 'rose', icon: XCircle },
            { label: 'Late', value: late, color: 'amber', icon: Clock },
            { label: 'Excused', value: excused, color: 'purple', icon: AlertCircle },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className={cn(
                  'bg-slate-800/50 rounded-xl p-4 border border-slate-700/50',
                  `hover:border-${stat.color}-500/30 transition-all`
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
                    <p className={cn('text-2xl font-bold', `text-${stat.color}-400`)}>
                      {stat.value}
                    </p>
                  </div>
                  <Icon className={cn('w-8 h-8', `text-${stat.color}-400 opacity-50`)} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Records Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 rounded-2xl shadow-enterprise-lg border border-slate-700/50 backdrop-blur-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-emerald-600 to-teal-600">
                <tr>
                  <th className="text-left p-5 font-semibold text-white text-sm tracking-wide">
                    Student Number
                  </th>
                  <th className="text-left p-5 font-semibold text-white text-sm tracking-wide">
                    Student Name
                  </th>
                  <th className="text-left p-5 font-semibold text-white text-sm tracking-wide">
                    Subject
                  </th>
                  <th className="text-left p-5 font-semibold text-white text-sm tracking-wide">
                    Status
                  </th>
                  <th className="text-left p-5 font-semibold text-white text-sm tracking-wide">
                    Schedule Slot
                  </th>
                  <th className="text-left p-5 font-semibold text-white text-sm tracking-wide">
                    Date & Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-900/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-400">
                      <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-3 h-3 rounded-full bg-teal-400 animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-bounce" />
                        </div>
                        <p className="font-medium">Loading attendance records...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-16 h-16 text-slate-600" />
                        <p className="font-medium text-lg">
                          {searchTerm || filterType !== 'all' || selectedDate
                            ? 'No records found matching your filters'
                            : 'No attendance records yet'}
                        </p>
                        <p className="text-sm text-slate-500">
                          Records will appear here as attendance is marked in subjects
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record, index) => {
                    const StatusIcon = getStatusIcon(record.status)
                    const statusColor = getStatusColor(record.status)

                    return (
                      <motion.tr
                        key={`${record.id}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-slate-700/30 hover:bg-slate-800/60 transition-colors group"
                      >
                        <td className="p-5 font-semibold text-slate-100 text-sm">
                          {record.studentNumber}
                        </td>
                        <td className="p-5 text-slate-200 font-medium text-sm">
                          {record.firstName} {record.lastName}
                        </td>
                        <td className="p-5">
                          {record.subjectCode ? (
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-indigo-400" />
                              <div>
                                <p className="text-slate-200 font-medium text-sm">
                                  {record.subjectCode}
                                </p>
                                <p className="text-xs text-slate-400">{record.subjectName}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-sm italic">General</span>
                          )}
                        </td>
                        <td className="p-5">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase',
                              `bg-${statusColor}-500/20 text-${statusColor}-300 border border-${statusColor}-500/30`
                            )}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />
                            {record.status}
                          </span>
                        </td>
                        <td className="p-5 text-slate-300 text-sm">
                          {(record as any).scheduleSlot ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-700/50 border border-slate-600 text-xs">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {(record as any).scheduleSlot}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs italic">-</span>
                          )}
                        </td>
                        <td className="p-5 text-slate-300 text-sm">
                          {format(
                            new Date(record.timestamp || record.createdAt),
                            'MMM dd, yyyy - hh:mm a'
                          )}
                        </td>
                      </motion.tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  )
}
