/**
 * AttendancePage - Complete Attendance Management
 *
 * Full-featured attendance management page with:
 * ✅ Excel import/export
 * ✅ Attendance summary dashboard
 * ✅ Quick arrival/departure marking
 * ✅ Bulk actions
 * ✅ Predefined message templates
 * ✅ Guardian notifications
 *
 * Integration: Add to your routes and navigation
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
      // Fetch students for attendance listing
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
          className="bg-slate-800/50 rounded-2xl p-6 shadow-enterprise border border-slate-700/50 backdrop-blur-sm"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-100 mb-1">Bulk Import</h3>
              <p className="text-sm text-slate-400">
                Import attendance records from Excel file. Download template for correct format.
              </p>
            </div>
            <div className="flex gap-2">
              <label
                htmlFor="import-excel"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all cursor-pointer shadow-lg"
              >
                <Upload className="w-4 h-4" />
                {isImporting ? 'Importing...' : 'Import Excel'}
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
          className="bg-slate-800/50 rounded-2xl p-6 shadow-enterprise border border-slate-700/50 backdrop-blur-sm"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search students by number, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 border-slate-600 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 focus:border-purple-500 focus:ring-purple-500/20"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="appearance-none pl-10 pr-10 py-3 h-12 border border-slate-600 bg-slate-900/50 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer min-w-[180px]"
              >
                <option value="all">All Students</option>
                <option value="checked-in">Checked In</option>
                <option value="not-checked-in">Not Checked In</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Students List with Attendance Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 rounded-2xl shadow-enterprise-lg border border-slate-700/50 backdrop-blur-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-indigo-600">
                <tr>
                  <th className="text-left p-5 font-semibold text-white text-sm tracking-wide">
                    Student Number
                  </th>
                  <th className="text-left p-5 font-semibold text-white text-sm tracking-wide">
                    Name
                  </th>
                  <th className="text-left p-5 font-semibold text-white text-sm tracking-wide">
                    Email
                  </th>
                  <th className="text-left p-5 font-semibold text-white text-sm tracking-wide">
                    Section
                  </th>
                  <th className="text-left p-5 font-semibold text-white text-sm tracking-wide">
                    Guardian
                  </th>
                  <th className="text-center p-5 font-semibold text-white text-sm tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-900/50 divide-y divide-slate-700/30">
                {isLoading ? (
                  <>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <tr key={`skeleton-${i}`} className="animate-pulse">
                        <td className="p-5 font-semibold text-slate-100 text-sm">
                          <div className="w-28 h-4 bg-slate-700/40 rounded-md" />
                        </td>
                        <td className="p-5 text-slate-200 font-medium text-sm">
                          <div className="w-40 h-4 bg-slate-700/40 rounded-md" />
                        </td>
                        <td className="p-5 text-slate-400 text-sm">
                          <div className="w-36 h-4 bg-slate-700/40 rounded-md" />
                        </td>
                        <td className="p-5 text-slate-400 text-sm">
                          <div className="w-20 h-4 bg-slate-700/40 rounded-md" />
                        </td>
                        <td className="p-5 text-slate-400 text-sm">
                          <div className="w-32 h-4 bg-slate-700/40 rounded-md" />
                        </td>
                        <td className="p-5 text-center">
                          <div className="w-28 h-8 bg-slate-700/40 rounded-lg mx-auto" />
                        </td>
                      </tr>
                    ))}
                  </>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-400">
                      <div className="flex flex-col items-center gap-2">
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
                      className="hover:bg-slate-800/60 transition-colors"
                    >
                      <td className="p-5 font-semibold text-slate-100 text-sm">
                        {student.studentNumber}
                      </td>
                      <td className="p-5 text-slate-200 font-medium text-sm">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="p-5 text-slate-400 text-sm">{student.email}</td>
                      <td className="p-5 text-slate-400 text-sm">{student.section || '-'}</td>
                      <td className="p-5 text-slate-400 text-sm">
                        {student.guardianEmail ? (
                          <div>
                            <p className="text-slate-300">{student.guardianName}</p>
                            <p className="text-xs text-slate-500">{student.guardianEmail}</p>
                          </div>
                        ) : (
                          <span className="text-slate-600">No guardian</span>
                        )}
                      </td>
                      <td className="p-5 text-center">
                        <AttendanceDropdown
                          student={student}
                          onSuccess={() => {
                            refetch()
                          }}
                          showNotifyOption={true}
                        />
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
