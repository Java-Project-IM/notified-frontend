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
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              Students
            </h1>
            <p className="text-gray-600 mt-1">Manage student records and information</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="shadow-neumorphic"
              onClick={handleDownloadTemplate}
            >
              <Download className="w-4 h-4 mr-2" />
              Template
            </Button>
            <Button
              variant="outline"
              className="shadow-neumorphic"
              onClick={handleExportStudents}
              disabled={students.length === 0}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              className="shadow-neumorphic"
              onClick={handleImportClick}
              disabled={isImporting}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? 'Importing...' : 'Import'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              className="shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              onClick={handleAddStudent}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-t-4 border-blue-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Students</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{students.length}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl">
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-t-4 border-green-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Selected</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{selectedStudents.size}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl">
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-t-4 border-orange-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Today</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl">
                <Users className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-t-4 border-purple-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">With Guardians</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {students.filter((s) => s.guardianName).length}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl">
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search and Actions */}
        <div className="bg-white rounded-xl p-6 shadow-neumorphic">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, student number, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {selectedStudents.size > 0 && (
              <Button
                variant="outline"
                className="shadow-neumorphic"
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
          className="bg-white rounded-xl shadow-neumorphic overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <tr>
                  <th className="text-left p-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={
                          selectedStudents.size === filteredStudents.length &&
                          filteredStudents.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="w-5 h-5 rounded-md border-2 border-white/30 text-blue-600 focus:ring-2 focus:ring-white/50 focus:ring-offset-0 cursor-pointer transition-all hover:scale-110"
                      />
                    </div>
                  </th>
                  <th className="text-left p-4 font-semibold">Student Number</th>
                  <th className="text-left p-4 font-semibold">First Name</th>
                  <th className="text-left p-4 font-semibold">Last Name</th>
                  <th className="text-left p-4 font-semibold">Email</th>
                  <th className="text-left p-4 font-semibold">Section</th>
                  <th className="text-left p-4 font-semibold">Guardian</th>
                  <th className="text-center p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-500">
                      Loading students...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-500">
                      {searchTerm
                        ? 'No students found matching your search'
                        : 'No students added yet'}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, index) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-blue-50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedStudents.has(student.id)}
                            onChange={() => toggleSelection(student.id)}
                            className="w-5 h-5 rounded-md border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer transition-all hover:scale-110 hover:border-blue-400"
                          />
                        </div>
                      </td>
                      <td className="p-4 font-medium text-gray-900">{student.studentNumber}</td>
                      <td className="p-4 text-gray-700">{student.firstName}</td>
                      <td className="p-4 text-gray-700">{student.lastName}</td>
                      <td className="p-4 text-gray-600">{student.email}</td>
                      <td className="p-4 text-gray-600">{student.section || '-'}</td>
                      <td className="p-4 text-gray-600">{student.guardianName || '-'}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditStudent(student)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(student)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
