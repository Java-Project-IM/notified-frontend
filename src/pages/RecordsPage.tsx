import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Search,
  Calendar,
  BarChart3,
  Download,
  HandIcon,
  CheckCircle2,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import MainLayout from '@/layouts/MainLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
      console.log('📋 Fetching all records...')
      const data = await recordService.getAll()
      console.log('✅ Loaded records:', data.length)
      return data
    },
  })

  // Filter records
  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.studentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.email.toLowerCase().includes(searchTerm.toLowerCase())

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
📊 Records Summary

Total Records: ${filteredRecords.length}
✅ Arrivals: ${arrivals}
🚪 Departures: ${departures}
📅 Today's Records: ${todayRecords.length}

Date Range: ${selectedDate || 'All Time'}
    `.trim()

    addToast(summary, 'info', '📊 Summary')
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="w-8 h-8 text-teal-600" />
              Attendance Records
            </h1>
            <p className="text-gray-600 mt-1">Track and manage student attendance</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="shadow-neumorphic" onClick={handleShowSummary}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Summary
            </Button>
            <Button
              variant="outline"
              className="shadow-neumorphic"
              onClick={() => addToast('Export feature coming soon!', 'info')}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-neumorphic"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Records</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{records.length}</p>
              </div>
              <FileText className="w-12 h-12 text-teal-500 " />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-neumorphic"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Arrivals</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{arrivals}</p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-green-500 text-5xl" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-neumorphic"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Departures</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{departures}</p>
              </div>
              <HandIcon className="w-12 h-12 text-orange-500 " />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-neumorphic"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Today's Records</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{todayRecords.length}</p>
              </div>
              <Calendar className="w-12 h-12 text-blue-500 " />
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-neumorphic">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by student number, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Types</option>
                <option value="Arrival">Arrival</option>
                <option value="Departure">Departure</option>
              </select>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-48"
              />
              {(filterType !== 'all' || selectedDate) && (
                <Button
                  variant="outline"
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
          className="bg-white rounded-xl shadow-neumorphic overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-teal-600 to-teal-700 text-white">
                <tr>
                  <th className="text-left p-4">Student Number</th>
                  <th className="text-left p-4">First Name</th>
                  <th className="text-left p-4">Last Name</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">Date & Time</th>
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
                      className="border-b border-gray-100 hover:bg-teal-50 transition-colors"
                    >
                      <td className="p-4 font-medium text-gray-900">{record.studentNumber}</td>
                      <td className="p-4 text-gray-700">{record.firstName}</td>
                      <td className="p-4 text-gray-700">{record.lastName}</td>
                      <td className="p-4 text-gray-600">{record.email}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            record.recordType === 'Arrival'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {record.recordType === 'Arrival' ? '✅' : '🚪'} {record.recordType}
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
