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

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-enterprise border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by student number, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'Arrival' | 'Departure')}
                className="pl-4 pr-10 py-3 h-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              >
                <option value="all">All Types</option>
                <option value="Arrival">Arrival</option>
                <option value="Departure">Departure</option>
              </select>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-48 h-12 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20"
              />
              {(filterType !== 'all' || selectedDate) && (
                <Button
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50 hover:border-emerald-400 transition-all h-12"
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
          className="bg-white rounded-2xl shadow-enterprise border border-gray-200 overflow-hidden"
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
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500">
                      Loading records...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500">
                      {searchTerm || filterType !== 'all' || selectedDate
                        ? 'No records found matching your filters'
                        : 'No records yet'}
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record, index) => (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-emerald-50 transition-colors"
                    >
                      <td className="p-4 font-medium text-gray-900">{record.studentNumber}</td>
                      <td className="p-4 text-gray-700">{record.firstName}</td>
                      <td className="p-4 text-gray-700">{record.lastName}</td>
                      <td className="p-4 text-gray-600">{record.email}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                            record.recordType === 'Arrival'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {record.recordType === 'Arrival' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <DoorOpen className="w-4 h-4" />
                          )}
                          {record.recordType}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">
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
