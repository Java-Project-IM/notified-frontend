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
  DoorOpen,
  ClipboardList,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import MainLayout from '@/layouts/MainLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { useToast } from '@/store/toastStore'
import { recordService } from '@/services/record.service'
import { Record } from '@/types'
import { format } from 'date-fns'

export default function RecordsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'Arrival' | 'Departure'>('all')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const { addToast } = useToast()

  // Fetch records
  const { data: records = [], isLoading } = useQuery({
    queryKey: ['records'],
    queryFn: async () => {
      console.log('[Records] Fetching all records...')
      const data = await recordService.getAll()
      console.log('[Records] Loaded records:', data.length)
      return data
    },
  })

  // Filter records
  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.studentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === 'all' || record.recordType === filterType

    const matchesDate =
      !selectedDate || format(new Date(record.createdAt), 'yyyy-MM-dd') === selectedDate

    return matchesSearch && matchesType && matchesDate
  })

  // Calculate stats
  const todayRecords = records.filter(
    (r) => format(new Date(r.createdAt), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  )
  const arrivals = filteredRecords.filter((r) => r.recordType === 'Arrival').length
  const departures = filteredRecords.filter((r) => r.recordType === 'Departure').length

  const handleShowSummary = () => {
    const summary = `
Records Summary

Total Records: ${filteredRecords.length}
Arrivals: ${arrivals}
Departures: ${departures}
Today's Records: ${todayRecords.length}

Date Range: ${selectedDate || 'All Time'}
    `.trim()

    addToast(summary, 'info')
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Attendance Records"
          description="Monitor student attendance, track arrival and departure times"
          icon={ClipboardList}
          gradient="from-emerald-600 via-teal-600 to-cyan-600"
          stats={[
            {
              label: 'Total Records',
              value: filteredRecords.length,
              icon: FileText,
              color: 'blue',
            },
            {
              label: 'Arrivals',
              value: arrivals,
              icon: CheckCircle,
              color: 'green',
            },
            {
              label: 'Departures',
              value: departures,
              icon: DoorOpen,
              color: 'orange',
            },
            {
              label: "Today's Activity",
              value: todayRecords.length,
              icon: Calendar,
              color: 'purple',
            },
          ]}
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
                placeholder="Search by student number, name, or email..."
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
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'Arrival' | 'Departure')}
                  className="appearance-none pl-10 pr-10 py-3 h-12 border border-slate-600 bg-slate-900/50 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer min-w-[160px]"
                >
                  <option value="all">All Types</option>
                  <option value="Arrival">Arrival Only</option>
                  <option value="Departure">Departure Only</option>
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
                    First Name
                  </th>
                  <th className="text-left p-5 font-semibold text-white text-sm tracking-wide">
                    Last Name
                  </th>
                  <th className="text-left p-5 font-semibold text-white text-sm tracking-wide">
                    Email
                  </th>
                  <th className="text-left p-5 font-semibold text-white text-sm tracking-wide">
                    Type
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
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 border-4 border-emerald-900 border-t-emerald-500 rounded-full animate-spin" />
                        <p className="font-medium">Loading records...</p>
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
                          Records will appear here as students check in and out
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record, index) => (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-slate-700/30 hover:bg-slate-800/60 transition-colors group"
                    >
                      <td className="p-5 font-semibold text-slate-100 text-sm">
                        {record.studentNumber}
                      </td>
                      <td className="p-5 text-slate-200 font-medium text-sm">{record.firstName}</td>
                      <td className="p-5 text-slate-200 font-medium text-sm">{record.lastName}</td>
                      <td className="p-5 text-slate-400 text-sm">{record.email}</td>
                      <td className="p-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                            record.recordType === 'Arrival'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                          }`}
                        >
                          {record.recordType === 'Arrival' ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            <DoorOpen className="w-3.5 h-3.5" />
                          )}
                          {record.recordType}
                        </span>
                      </td>
                      <td className="p-5 text-slate-300 text-sm">
                        {format(new Date(record.createdAt), 'MMM dd, yyyy - hh:mm a')}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  )
}
