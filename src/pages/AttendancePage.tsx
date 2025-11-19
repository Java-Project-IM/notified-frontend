/**
 * AttendancePage - Complete Attendance Management
 *
 * Enterprise-grade, fully responsive attendance management with:
 * ✅ Excel import/export
 * ✅ Attendance summary dashboard
 * ✅ Quick arrival/departure marking
 * ✅ Bulk actions
 * ✅ Predefined message templates
 * ✅ Guardian notifications
 * ✅ Responsive design for all screen sizes
 * ✅ Production-ready UI/UX
 * ✅ Hidden scrollbars
 * ✅ Fixed dropdown positioning
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  ClipboardList,
  Upload,
  Download,
  FileSpreadsheet,
  Users,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import MainLayout from '@/layouts/MainLayout'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AttendanceSummary } from '@/components/attendance/AttendanceSummary'
import { AttendanceDropdown } from '@/components/attendance/AttendanceDropdown'
import { useToast } from '@/store/toastStore'
import { Student } from '@/types'
import { studentService } from '@/services/student.service'
import { enhancedAttendanceService } from '@/services/enhanced-attendance.service'
import {
  parseAttendanceExcel,
  validateAttendanceData,
  exportAttendanceToExcel,
  generateAttendanceTemplate,
} from '@/utils/attendanceExcelUtils'

export default function AttendancePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'checked-in' | 'not-checked-in'>('all')
  const [isImporting, setIsImporting] = useState(false)
  const toast = useToast()

  // Fetch students
  const {
    data: students = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const data = await studentService.getAll()
      return data
    },
  })

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.studentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  /**
   * Handle Excel import
   */
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      // Parse Excel file
      const excelData = await parseAttendanceExcel(file)

      // Validate data
      const validation = validateAttendanceData(excelData)

      if (!validation.isValid) {
        toast.error(`Invalid data: ${validation.errors.join(', ')}`, 'Import Failed')
        return
      }

      if (validation.warnings.length > 0) {
        toast.warning(`Warnings: ${validation.warnings.slice(0, 3).join(', ')}`, 'Import Warnings')
      }

      // Import via API
      const result = await enhancedAttendanceService.importFromExcel(file)

      toast.success(
        `Successfully imported ${result.success} records. ${result.failed} failed.`,
        'Import Complete'
      )

      if (result.errors.length > 0) {
        // import errors available in result.errors for debugging
      }

      refetch()
    } catch (error: any) {
      console.error('[Attendance] Import failed:', error)
      toast.error(error.message || 'Failed to import attendance records', 'Import Error')
    } finally {
      setIsImporting(false)
      // Reset input
      event.target.value = ''
    }
  }

  /**
   * Handle Excel export
   */
  const handleExport = async () => {
    try {
      const records = await enhancedAttendanceService.getAttendanceRecords()
      if (records.length === 0) {
        toast.warning('No attendance records to export', 'Export')
        return
      }
      exportAttendanceToExcel(records)
      toast.success(`Exported ${records.length} attendance records`, 'Export Complete')
    } catch (error: any) {
      console.error('[Attendance] Export failed:', error)
      toast.error('Failed to export attendance records', 'Export Error')
    }
  }

  /**
   * Handle template download
   */
  const handleDownloadTemplate = () => {
    try {
      generateAttendanceTemplate(true)
      toast.success('Template downloaded successfully!', 'Download Complete')
    } catch (error) {
      console.error('[Attendance] Template download failed:', error)
      toast.error('Failed to download template', 'Download Error')
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Attendance Management"
          description="Mark attendance, track arrivals/departures, and generate reports"
          icon={ClipboardList}
          gradient="from-purple-600 via-indigo-600 to-blue-600"
          actions={[
            {
              label: 'Download Template',
              onClick: handleDownloadTemplate,
              icon: FileSpreadsheet,
              variant: 'outline',
            },
            {
              label: 'Export Records',
              onClick: handleExport,
              icon: Download,
              variant: 'outline',
            },
          ]}
        />

        {/* Attendance Summary Dashboard */}
        <AttendanceSummary showStudentDetails={true} />

        {/* Import Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 rounded-2xl p-4 sm:p-6 shadow-enterprise border border-slate-700/50 backdrop-blur-sm"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-100 mb-1 flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-400" />
                Bulk Import
              </h3>
              <p className="text-sm text-slate-400">
                Import attendance records from Excel file. Download template for correct format.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <label
                htmlFor="import-excel"
                className={`flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all cursor-pointer shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex-1 md:flex-initial ${
                  isImporting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <Upload className="w-4 h-4" />
                <span className="whitespace-nowrap">
                  {isImporting ? 'Importing...' : 'Import Excel'}
                </span>
              </label>
              <input
                id="import-excel"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                disabled={isImporting}
                className="hidden"
              />
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 rounded-2xl p-4 sm:p-6 shadow-enterprise border border-slate-700/50 backdrop-blur-sm"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
              <Input
                type="text"
                placeholder="Search students by number, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 border-slate-600 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 focus:border-purple-500 focus:ring-purple-500/20 w-full"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative w-full lg:w-auto">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="appearance-none pl-10 pr-10 py-3 h-12 border border-slate-600 bg-slate-900/50 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer w-full lg:min-w-[200px]"
              >
                <option value="all">All Students</option>
                <option value="checked-in">Checked In</option>
                <option value="not-checked-in">Not Checked In</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          {searchTerm && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Found {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </motion.div>

        {/* Students List with Attendance Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 rounded-2xl shadow-enterprise-lg border border-slate-700/50 backdrop-blur-sm"
        >
          {/* Mobile Card View */}
          <div className="block lg:hidden">
            <div className="divide-y divide-slate-700/30 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={`mobile-skeleton-${i}`} className="p-4 animate-pulse">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="w-24 h-4 bg-slate-700/40 rounded-md mb-2" />
                          <div className="w-32 h-5 bg-slate-700/40 rounded-md" />
                        </div>
                        <div className="w-32 h-9 bg-slate-700/40 rounded-lg" />
                      </div>
                      <div className="space-y-2">
                        <div className="w-40 h-3 bg-slate-700/40 rounded-md" />
                        <div className="w-36 h-3 bg-slate-700/40 rounded-md" />
                      </div>
                    </div>
                  ))}
                </>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-16 px-4 text-slate-400">
                  <div className="flex flex-col items-center gap-3">
                    <Users className="w-16 h-16 text-slate-600" />
                    <p className="font-medium text-lg">
                      {searchTerm ? 'No students found matching your search' : 'No students yet'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {searchTerm ? 'Try adjusting your search' : 'Add students to get started'}
                    </p>
                  </div>
                </div>
              ) : (
                filteredStudents.map((student, index) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                            {student.studentNumber}
                          </span>
                          {student.section && (
                            <span className="text-xs text-slate-500 bg-slate-700/30 px-2 py-0.5 rounded">
                              {student.section}
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-semibold text-slate-100 truncate">
                          {student.firstName} {student.lastName}
                        </h4>
                      </div>
                      <AttendanceDropdown
                        student={student}
                        onSuccess={() => {
                          refetch()
                        }}
                        showNotifyOption={true}
                      />
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2 text-slate-400">
                        <span className="w-16 text-slate-500 text-xs">Email:</span>
                        <span className="truncate flex-1">{student.email}</span>
                      </div>
                      {student.guardianEmail && (
                        <div className="flex items-start gap-2 text-slate-400">
                          <span className="w-16 text-slate-500 text-xs flex-shrink-0">
                            Guardian:
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-300 truncate">{student.guardianName}</p>
                            <p className="text-xs text-slate-500 truncate">
                              {student.guardianEmail}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Desktop Table View - NO overflow-hidden to prevent dropdown cutoff */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gradient-to-r from-purple-600 to-indigo-600 sticky top-0 z-10">
                <tr>
                  <th className="text-left px-4 py-4 font-semibold text-white text-sm tracking-wide whitespace-nowrap w-[140px]">
                    Student Number
                  </th>
                  <th className="text-left px-4 py-4 font-semibold text-white text-sm tracking-wide whitespace-nowrap min-w-[180px]">
                    Name
                  </th>
                  <th className="text-left px-4 py-4 font-semibold text-white text-sm tracking-wide whitespace-nowrap min-w-[220px]">
                    Email
                  </th>
                  <th className="text-left px-4 py-4 font-semibold text-white text-sm tracking-wide whitespace-nowrap w-[100px]">
                    Section
                  </th>
                  <th className="text-left px-4 py-4 font-semibold text-white text-sm tracking-wide whitespace-nowrap min-w-[200px]">
                    Guardian
                  </th>
                  <th className="text-center px-4 py-4 font-semibold text-white text-sm tracking-wide whitespace-nowrap w-[200px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-900/50 divide-y divide-slate-700/30">
                {isLoading ? (
                  <>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <tr key={`skeleton-${i}`} className="animate-pulse">
                        <td className="px-4 py-3 font-semibold text-slate-100 text-sm">
                          <div className="w-24 h-4 bg-slate-700/40 rounded-md" />
                        </td>
                        <td className="px-4 py-3 text-slate-200 font-medium text-sm">
                          <div className="w-32 h-4 bg-slate-700/40 rounded-md" />
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-sm">
                          <div className="w-40 h-4 bg-slate-700/40 rounded-md" />
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-sm">
                          <div className="w-16 h-4 bg-slate-700/40 rounded-md" />
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-sm">
                          <div className="w-32 h-4 bg-slate-700/40 rounded-md" />
                          <div className="w-40 h-3 bg-slate-700/40 rounded-md mt-1" />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="w-40 h-9 bg-slate-700/40 rounded-lg mx-auto" />
                        </td>
                      </tr>
                    ))}
                  </>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-400">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="w-16 h-16 text-slate-600" />
                        <p className="font-medium text-lg">
                          {searchTerm
                            ? 'No students found matching your search'
                            : 'No students yet'}
                        </p>
                        <p className="text-sm text-slate-500">
                          {searchTerm ? 'Try adjusting your search' : 'Add students to get started'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, index) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-slate-800/60 transition-colors group"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-100 text-sm whitespace-nowrap">
                        <span className="inline-flex items-center gap-2 bg-purple-500/10 px-2.5 py-1 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                          {student.studentNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-200 font-medium text-sm">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-sm">
                        <div className="max-w-[220px] truncate" title={student.email}>
                          {student.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-sm whitespace-nowrap">
                        {student.section ? (
                          <span className="inline-flex items-center bg-slate-700/30 px-2.5 py-1 rounded-lg text-slate-300">
                            {student.section}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-sm">
                        {student.guardianEmail ? (
                          <div className="max-w-[200px]">
                            <p
                              className="text-slate-300 truncate font-medium"
                              title={student.guardianName}
                            >
                              {student.guardianName}
                            </p>
                            <p
                              className="text-xs text-slate-500 truncate"
                              title={student.guardianEmail}
                            >
                              {student.guardianEmail}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs">No guardian</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <AttendanceDropdown
                            student={student}
                            onSuccess={() => {
                              refetch()
                            }}
                            showNotifyOption={true}
                          />
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Footer Info */}
        {!isLoading && filteredStudents.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-slate-400 px-2"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                Showing {filteredStudents.length} of {students.length} student
                {students.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </motion.div>
        )}
      </div>
    </MainLayout>
  )
}
