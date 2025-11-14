import { useState, useEffect, useRef } from 'react'
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
  XCircle,
  AlertTriangle,
  Info,
  BookOpen,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import MainLayout from '@/layouts/MainLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { useToast } from '@/store/toastStore'
import { studentService } from '@/services/student.service'
import { Student, StudentFormData } from '@/types'
import StudentModal from '@/components/modals/StudentModal'
import EmailModal, { EmailData } from '@/components/modals/EmailModal'
import { parseExcelFile, generateStudentTemplate, exportStudentsToExcel } from '@/utils/excelUtils'
import { sendEmail } from '@/services/email.service'

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [generatedNumber, setGeneratedNumber] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addToast } = useToast()
  const queryClient = useQueryClient()

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
  useEffect(() => {
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
  }, [isModalOpen, editingStudent])

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
      // Force refetch to ensure we get the latest data from the server
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.refetchQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      addToast('Student deleted successfully', 'success')
      console.log('[Students] Student deleted and queries invalidated')
    },
    onError: (error: any) => {
      console.error('[Students] Failed to delete student:', error)
      addToast(error?.message || 'Failed to delete student', 'error')
    },
  })

  // Filter students based on search
  const filteredStudents = students.filter(
    (student) =>
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
    if (
      window.confirm(`Are you sure you want to delete ${student.firstName} ${student.lastName}?`)
    ) {
      deleteMutation.mutate(student.id)
    }
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
        // Clear selection after successful send
        setSelectedStudents(new Set())
      }
      return success
    } catch (error: any) {
      console.error('Failed to send email:', error)
      addToast(error.message || 'Failed to send email', 'error')
      return false
    }
  }

  // Get email addresses for selected students
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

    // Validate file type
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

      // Import students one by one
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

      // Refresh the student list
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.refetchQueries({ queryKey: ['students'] })

      // Show results
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
      // Reset file input
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
            {
              label: 'Import Excel',
              onClick: () => fileInputRef.current?.click(),
              icon: Upload,
              variant: 'outline',
              disabled: isImporting,
            },
            {
              label: 'Add Student',
              onClick: () => {
                setEditingStudent(null)
                setIsModalOpen(true)
              },
              icon: Plus,
              variant: 'primary',
            },
          ]}
        />

        {/* Toolbar */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-gray-300 hover:bg-gray-50 hover:border-blue-400 transition-all h-11"
            onClick={handleDownloadTemplate}
          >
            <Download className="w-4 h-4 mr-2" />
            Template
          </Button>
          <Button
            variant="outline"
            className="border-gray-300 hover:bg-gray-50 hover:border-blue-400 transition-all h-11"
            onClick={handleExportStudents}
            disabled={students.length === 0}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Search and Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-enterprise border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, student number, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
            {selectedStudents.size > 0 && (
              <Button
                variant="outline"
                className="h-12 px-5 border-gray-300 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-all"
                onClick={() => setIsEmailModalOpen(true)}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email Selected ({selectedStudents.size})
              </Button>
            )}
          </div>
        </div>

        {/* Students Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-enterprise border border-gray-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600">
                <tr>
                  <th className="text-left p-5">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={
                          selectedStudents.size === filteredStudents.length &&
                          filteredStudents.length > 0
                        }
                        onChange={toggleSelectAll}
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
                  <th className="text-center p-5 font-semibold text-white text-sm tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                        <p className="font-medium">Loading students...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="w-16 h-16 text-gray-300" />
                        <p className="font-medium text-lg">
                          {searchTerm
                            ? 'No students found matching your search'
                            : 'No students added yet'}
                        </p>
                        <p className="text-sm text-gray-400">
                          {!searchTerm && 'Get started by adding your first student'}
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
                      className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors group"
                    >
                      <td className="p-5">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedStudents.has(student.id)}
                            onChange={() => toggleSelection(student.id)}
                            className="w-5 h-5 rounded-md border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer transition-all hover:scale-110 hover:border-blue-400"
                          />
                        </div>
                      </td>
                      <td className="p-5">
                        <span className="font-semibold text-gray-900 text-sm">
                          {student.studentNumber}
                        </span>
                      </td>
                      <td className="p-5 text-gray-700 font-medium text-sm">{student.firstName}</td>
                      <td className="p-5 text-gray-700 font-medium text-sm">{student.lastName}</td>
                      <td className="p-5 text-gray-600 text-sm">{student.email}</td>
                      <td className="p-5">
                        <span className="inline-flex px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
                          {student.section || '-'}
                        </span>
                      </td>
                      <td className="p-5 text-gray-600 text-sm">{student.guardianName || '-'}</td>
                      <td className="p-5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditStudent(student)}
                            className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:scale-110 border border-transparent hover:border-blue-200"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(student)}
                            className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-110 border border-transparent hover:border-red-200"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
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
    </MainLayout>
  )
}
