import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Plus,
  Search,
  Mail,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle,
  FileText,
  Eye,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import MainLayout from '@/layouts/MainLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { TableSkeleton } from '@/components/ui/skeleton'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { useToast } from '@/store/toastStore'
import { useAuthStore } from '@/store/authStore'
import { studentService } from '@/services/student.service'
import { Student, StudentFormData } from '@/types'
import StudentModal from '@/components/modals/StudentModal'
import EmailModal, { EmailData } from '@/components/modals/EmailModal'
import { parseExcelFile, generateStudentTemplate, exportStudentsToExcel } from '@/utils/excelUtils'
import { sendEmail } from '@/services/email.service'
import { useDebounce } from '@/hooks/useDebounce'
import { useRef } from 'react'
import { canManageStudents, canSendEmails, canExportRecords } from '@/utils/permissions'
import StudentDetailsModal from '@/components/modals/StudentDetailsModal'

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [generatedNumber, setGeneratedNumber] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    student: Student | null
  }>({ isOpen: false, student: null })
  const [bulkDeleteConfirmation, setBulkDeleteConfirmation] = useState(false)
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  // Permission checks for role-based UI
  const userCanManageStudents = canManageStudents(user?.role)
  const userCanSendEmails = canSendEmails(user?.role)
  const userCanExport = canExportRecords(user?.role)

  // Fetch students
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      console.log('[Students] Fetching all students...')
      const data = await studentService.getAll()
      console.log('[Students] Loaded students:', data.length)
      return data
    },
  })

  // Generate student number when opening modal
  useState(() => {
    if (isModalOpen && !editingStudent) {
      studentService
        .generateStudentNumber()
        .then((res) => {
          console.log('[Students] Generated student number:', res.studentNumber)
          setGeneratedNumber(res.studentNumber)
        })
        .catch((err) => {
          console.error('[Students] Failed to generate student number:', err)
          addToast('Failed to generate student number', 'error')
        })
    }
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: studentService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      addToast('Student added successfully', 'success')
      setIsModalOpen(false)
      setGeneratedNumber('')
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to add student', 'error')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<StudentFormData> }) =>
      studentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      addToast('Student updated successfully', 'success')
      setIsModalOpen(false)
      setEditingStudent(null)
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to update student', 'error')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: studentService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.refetchQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      // Ensure subject queries (including enrolled students) are refreshed so SubjectDetailsModal shows up-to-date data
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      addToast('Student deleted successfully', 'success')
      console.log('[Students] Student deleted and queries invalidated')
    },
    onError: (error: any) => {
      console.error('[Students] Failed to delete student:', error)
      addToast(error?.message || 'Failed to delete student', 'error')
    },
  })

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (studentIds: number[]) => {
      const results = await Promise.allSettled(studentIds.map((id) => studentService.delete(id)))
      const successful = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.filter((r) => r.status === 'rejected').length
      return { successful, failed, total: studentIds.length }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.refetchQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      // Make sure to refresh subject lists and enrolled students so modals update accordingly
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      if (data.failed > 0) {
        addToast(
          `Deleted ${data.successful} of ${data.total} students. ${data.failed} failed.`,
          'info'
        )
      } else {
        addToast(`Successfully deleted ${data.successful} students`, 'success')
      }
      setSelectedStudents(new Set())
      setBulkDeleteConfirmation(false)
    },
    onError: (error: any) => {
      console.error('[Students] Failed to bulk delete students:', error)
      addToast(error?.message || 'Failed to delete students', 'error')
      setBulkDeleteConfirmation(false)
    },
  })

  // Filter students based on debounced search and status
  const filteredStudents = students.filter((student) => {
    // Search filter
    const matchesSearch =
      student.firstName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      student.studentNumber.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase())

    // Status filter
    const matchesStatus = statusFilter === 'all' || (student.status || 'active') === statusFilter

    return matchesSearch && matchesStatus
  })

  // Toggle selection
  const toggleSelection = (id: number) => {
    const newSelection = new Set(selectedStudents)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedStudents(newSelection)
  }

  // Select all / deselect all
  const toggleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(new Set(filteredStudents.map((s) => s.id)))
    }
  }

  const handleDelete = (student: Student) => {
    setDeleteConfirmation({ isOpen: true, student })
  }

  const confirmDelete = () => {
    if (deleteConfirmation.student) {
      deleteMutation.mutate(deleteConfirmation.student.id)
    }
  }

  const handleBulkDelete = () => {
    if (selectedStudents.size === 0) {
      addToast('No students selected', 'warning')
      return
    }
    setBulkDeleteConfirmation(true)
  }

  const confirmBulkDelete = () => {
    bulkDeleteMutation.mutate(Array.from(selectedStudents))
  }

  const handleAddStudent = () => {
    setEditingStudent(null)
    setIsModalOpen(true)
  }

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student)
    setIsModalOpen(true)
  }

  const handleModalSubmit = (data: StudentFormData) => {
    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingStudent(null)
    setGeneratedNumber('')
  }

  const handleEmailSend = async (emailData: EmailData): Promise<boolean> => {
    try {
      const success = await sendEmail(emailData)
      if (success) {
        setSelectedStudents(new Set())
        queryClient.invalidateQueries({ queryKey: ['email-history'] })
      }
      return success
    } catch (error: any) {
      console.error('Failed to send email:', error)
      addToast(error.message || 'Failed to send email', 'error')
      return false
    }
  }

  const getSelectedEmails = (): string[] => {
    return filteredStudents
      .filter((student) => selectedStudents.has(student.id))
      .map((student) => student.email)
  }

  const handleDownloadTemplate = () => {
    try {
      generateStudentTemplate()
      addToast('Template downloaded successfully', 'success')
    } catch (error) {
      addToast('Failed to download template', 'error')
    }
  }

  const handleExportStudents = () => {
    try {
      if (students.length === 0) {
        addToast('No students to export', 'info')
        return
      }
      exportStudentsToExcel(students)
      addToast(`Exported ${students.length} students successfully`, 'success')
    } catch (error) {
      addToast('Failed to export students', 'error')
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      addToast('Please select a valid Excel file (.xlsx or .xls)', 'error')
      return
    }

    setIsImporting(true)
    addToast('Importing students from Excel...', 'info')

    try {
      const studentsData = await parseExcelFile(file)

      if (studentsData.length === 0) {
        addToast('No valid student data found in the file', 'error')
        setIsImporting(false)
        return
      }

      let successCount = 0
      let failCount = 0

      for (const studentData of studentsData) {
        try {
          await studentService.create(studentData)
          successCount++
        } catch (error) {
          failCount++
          console.error('Failed to import student:', studentData.studentNumber, error)
        }
      }

      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.refetchQueries({ queryKey: ['students'] })

      if (successCount > 0) {
        addToast(
          `Successfully imported ${successCount} student${successCount > 1 ? 's' : ''}${failCount > 0 ? `, ${failCount} failed` : ''}`,
          failCount > 0 ? 'info' : 'success'
        )
      } else {
        addToast('Failed to import any students', 'error')
      }
    } catch (error: any) {
      addToast(error.message || 'Failed to import students', 'error')
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Students"
          description="Manage student records, track enrollment, and maintain student information"
          icon={Users}
          gradient="from-blue-600 via-indigo-600 to-purple-600"
          stats={[
            {
              label: 'Total Students',
              value: students.length,
              icon: Users,
              color: 'blue',
            },
            {
              label: 'Selected',
              value: selectedStudents.size,
              icon: CheckCircle,
              color: 'green',
            },
            {
              label: 'With Guardians',
              value: students.filter((s) => s.guardianName).length,
              icon: Users,
              color: 'purple',
            },
            {
              label: 'Active Today',
              value: 0,
              icon: Users,
              color: 'orange',
            },
          ]}
          actions={[
            // Only show import for users who can manage students
            ...(userCanManageStudents
              ? [
                  {
                    label: 'Import Excel',
                    onClick: () => fileInputRef.current?.click(),
                    icon: Upload,
                    variant: 'outline' as const,
                    disabled: isImporting,
                  },
                ]
              : []),
            // Only show add student for users who can manage students
            ...(userCanManageStudents
              ? [
                  {
                    label: 'Add Student',
                    onClick: () => {
                      setEditingStudent(null)
                      setIsModalOpen(true)
                    },
                    icon: Plus,
                    variant: 'primary' as const,
                  },
                ]
              : []),
          ]}
        />

        {/* Toolbar */}
        <div className="bg-slate-800/50 rounded-2xl p-6 shadow-enterprise border border-slate-700/50 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-3">
            {userCanManageStudents && (
              <Button
                variant="outline"
                className="border-slate-600 bg-slate-800/80 hover:bg-slate-700 hover:border-blue-500 text-slate-200 hover:text-white transition-all h-11 px-5 shadow-enterprise-sm"
                onClick={handleDownloadTemplate}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            )}
            {userCanExport && (
              <Button
                variant="outline"
                className="border-slate-600 bg-slate-800/80 hover:bg-slate-700 hover:border-emerald-500 text-slate-200 hover:text-white transition-all h-11 px-5 shadow-enterprise-sm"
                onClick={handleExportStudents}
                disabled={students.length === 0}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export Students
              </Button>
            )}
            {userCanManageStudents && selectedStudents.size > 0 && (
              <Button
                variant="outline"
                className="border-red-600 bg-red-900/20 hover:bg-red-900/40 hover:border-red-500 text-red-400 hover:text-red-300 transition-all h-11 px-5 shadow-enterprise-sm"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedStudents.size})
              </Button>
            )}
            {/* Status Filter Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 px-4 rounded-xl border border-slate-600 bg-slate-800/80 text-slate-200 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
              <option value="transferred">Transferred</option>
              <option value="suspended">Suspended</option>
              <option value="dropped">Dropped</option>
            </select>
            <div className="ml-auto flex items-center gap-2 text-slate-400 text-sm">
              <FileText className="w-4 h-4" />
              <span className="font-medium">
                Showing {filteredStudents.length} of {students.length} students
              </span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Search */}
        <div className="bg-slate-800/50 rounded-2xl p-6 shadow-enterprise border border-slate-700/50 backdrop-blur-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name, student number, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 border-slate-600 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>
          {searchTerm && (
            <p className="mt-3 text-sm text-slate-400">
              {filteredStudents.length === 0
                ? 'No results found'
                : `Found ${filteredStudents.length} student${filteredStudents.length !== 1 ? 's' : ''}`}
            </p>
          )}
        </div>

        {/* Students Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 rounded-2xl shadow-enterprise-lg border border-slate-700/50 backdrop-blur-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600">
                <tr>
                  <th className="text-left p-5">
                    <div className="flex items-center">
                      <Checkbox
                        checked={
                          selectedStudents.size === filteredStudents.length &&
                          filteredStudents.length > 0
                        }
                        onCheckedChange={() => toggleSelectAll()}
                        className="w-5 h-5 rounded-md border-2 border-white/30 text-blue-600 focus:ring-2 focus:ring-white/50 focus:ring-offset-0 cursor-pointer transition-all hover:scale-110 bg-white/10"
                      />
                    </div>
                  </th>
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
                    Section
                  </th>
                  <th className="text-left p-5 font-semibold text-white text-sm tracking-wide">
                    Guardian
                  </th>
                  <th className="text-left p-5 font-semibold text-white text-sm tracking-wide">
                    Status
                  </th>
                  <th className="text-center p-5 font-semibold text-white text-sm tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-900/50">
                {isLoading ? (
                  <TableSkeleton rows={5} columns={8} />
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-0">
                      <EmptyState
                        icon={Users}
                        title={searchTerm ? 'No students found' : 'No students yet'}
                        description={
                          searchTerm
                            ? 'Try adjusting your search terms or filters'
                            : 'Get started by adding your first student to the system'
                        }
                        action={
                          !searchTerm
                            ? {
                                label: 'Add Student',
                                onClick: handleAddStudent,
                              }
                            : undefined
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, index) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-slate-700/30 hover:bg-slate-800/60 transition-colors group"
                    >
                      <td className="p-5">
                        <div className="flex items-center">
                          <Checkbox
                            checked={selectedStudents.has(student.id)}
                            onCheckedChange={() => toggleSelection(student.id)}
                            className="w-5 h-5 rounded-md border-2 border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer transition-all hover:scale-110 hover:border-blue-400 bg-slate-800"
                          />
                        </div>
                      </td>
                      <td className="p-5">
                        <span className="font-semibold text-slate-100 text-sm">
                          {student.studentNumber}
                        </span>
                      </td>
                      <td className="p-5 text-slate-200 font-medium text-sm">
                        {student.firstName}
                      </td>
                      <td className="p-5 text-slate-200 font-medium text-sm">{student.lastName}</td>
                      <td className="p-5 text-slate-400 text-sm">{student.email}</td>
                      <td className="p-5">
                        <span className="inline-flex px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium border border-blue-500/30">
                          {student.section || '-'}
                        </span>
                      </td>
                      <td className="p-5 text-slate-400 text-sm">{student.guardianName || '-'}</td>
                      <td className="p-5">
                        {(() => {
                          const status = student.status || 'active'
                          const statusConfig: Record<
                            string,
                            { bg: string; text: string; border: string }
                          > = {
                            active: {
                              bg: 'bg-emerald-500/20',
                              text: 'text-emerald-300',
                              border: 'border-emerald-500/30',
                            },
                            inactive: {
                              bg: 'bg-slate-500/20',
                              text: 'text-slate-300',
                              border: 'border-slate-500/30',
                            },
                            graduated: {
                              bg: 'bg-blue-500/20',
                              text: 'text-blue-300',
                              border: 'border-blue-500/30',
                            },
                            transferred: {
                              bg: 'bg-amber-500/20',
                              text: 'text-amber-300',
                              border: 'border-amber-500/30',
                            },
                            suspended: {
                              bg: 'bg-red-500/20',
                              text: 'text-red-300',
                              border: 'border-red-500/30',
                            },
                            dropped: {
                              bg: 'bg-rose-500/20',
                              text: 'text-rose-300',
                              border: 'border-rose-500/30',
                            },
                          }
                          const config = statusConfig[status] || statusConfig.inactive
                          return (
                            <span
                              className={`inline-flex px-2.5 py-1 ${config.bg} ${config.text} rounded-full text-xs font-medium border ${config.border} capitalize`}
                            >
                              {status}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="p-5">
                        <div className="flex items-center justify-center gap-2">
                          {/* View - always visible */}
                          <button
                            onClick={() => setViewingStudent(student)}
                            className="p-2.5 text-slate-400 hover:bg-slate-500/20 rounded-lg transition-all hover:scale-110 border border-transparent hover:border-slate-500/30"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {/* Edit - only for users who can manage students */}
                          {userCanManageStudents && (
                            <button
                              onClick={() => handleEditStudent(student)}
                              disabled={updateMutation.isPending}
                              className="p-2.5 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all hover:scale-110 border border-transparent hover:border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {/* Delete - only for users who can manage students */}
                          {userCanManageStudents && (
                            <button
                              onClick={() => handleDelete(student)}
                              disabled={deleteMutation.isPending}
                              className="p-2.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-all hover:scale-110 border border-transparent hover:border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Floating Email Button */}
        {selectedStudents.size > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-8 right-8 z-50"
          >
            <button onClick={() => setIsEmailModalOpen(true)} className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity animate-pulse" />
              <div className="relative flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-enterprise-2xl hover:shadow-enterprise-2xl hover:scale-105 transition-all duration-300">
                <Mail className="w-5 h-5 text-white" />
                <span className="font-semibold text-white">
                  Email Selected ({selectedStudents.size})
                </span>
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-slate-900 animate-bounce">
                  {selectedStudents.size}
                </div>
              </div>
            </button>
          </motion.div>
        )}
      </div>

      {/* Student Modal */}
      <StudentModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        student={editingStudent}
        isLoading={createMutation.isPending || updateMutation.isPending}
        generatedNumber={generatedNumber}
      />

      {/* Email Modal */}
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        recipients={getSelectedEmails()}
        onSend={handleEmailSend}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, student: null })}
        onConfirm={confirmDelete}
        title="Delete Student"
        description={`Are you sure you want to delete ${deleteConfirmation.student?.firstName} ${deleteConfirmation.student?.lastName}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={bulkDeleteConfirmation}
        onClose={() => setBulkDeleteConfirmation(false)}
        onConfirm={confirmBulkDelete}
        title="Delete Multiple Students"
        description={`Are you sure you want to delete ${selectedStudents.size} selected students? This action cannot be undone and will remove all associated records.`}
        confirmText={`Delete ${selectedStudents.size} Students`}
        cancelText="Cancel"
        variant="danger"
        isLoading={bulkDeleteMutation.isPending}
      />

      {/* Student Details Modal */}
      <StudentDetailsModal
        isOpen={!!viewingStudent}
        onClose={() => setViewingStudent(null)}
        student={viewingStudent}
      />
    </MainLayout>
  )
}
