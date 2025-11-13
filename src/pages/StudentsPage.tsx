import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Plus, Search, Mail, Edit2, Trash2, FileSpreadsheet, Download } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import MainLayout from '@/layouts/MainLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/store/toastStore'
import { studentService } from '@/services/student.service'
import { Student, StudentFormData } from '@/types'
import StudentModal from '@/components/modals/StudentModal'

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [generatedNumber, setGeneratedNumber] = useState('')
  const { addToast } = useToast()
  const queryClient = useQueryClient()

  // Fetch students
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      console.log('📚 Fetching all students...')
      const data = await studentService.getAll()
      console.log('✅ Loaded students:', data.length)
      return data
    },
  })

  // Generate student number when opening modal
  useEffect(() => {
    if (isModalOpen && !editingStudent) {
      studentService
        .generateStudentNumber()
        .then((res) => {
          console.log('✅ Generated student number:', res.studentNumber)
          setGeneratedNumber(res.studentNumber)
        })
        .catch((err) => {
          console.error('❌ Failed to generate student number:', err)
          addToast('Failed to generate student number', 'error', '❌ Error')
        })
    }
  }, [isModalOpen, editingStudent])

  // Create mutation
  const createMutation = useMutation({
    mutationFn: studentService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      addToast('Student added successfully', 'success', '✅ Success')
      setIsModalOpen(false)
      setGeneratedNumber('')
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to add student', 'error', '❌ Error')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<StudentFormData> }) =>
      studentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      addToast('Student updated successfully', 'success', '✅ Success')
      setIsModalOpen(false)
      setEditingStudent(null)
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to update student', 'error', '❌ Error')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: studentService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      addToast('Student deleted successfully', 'success', '✅ Success')
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to delete student', 'error', '❌ Error')
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
              onClick={() => addToast('Download template feature coming soon!', 'info')}
            >
              <Download className="w-4 h-4 mr-2" />
              Template
            </Button>
            <Button
              variant="outline"
              className="shadow-neumorphic"
              onClick={() => addToast('Import feature coming soon!', 'info')}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button className="shadow-neumorphic" onClick={handleAddStudent}>
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
            className="bg-white rounded-xl p-6 shadow-neumorphic"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Students</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{students.length}</p>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-20" />
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
                <p className="text-gray-600 text-sm">Selected</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{selectedStudents.size}</p>
              </div>
              <Users className="w-12 h-12 text-green-500 opacity-20" />
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
                <p className="text-gray-600 text-sm">Active Today</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
              </div>
              <Users className="w-12 h-12 text-orange-500 opacity-20" />
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
                <p className="text-gray-600 text-sm">With Guardians</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {students.filter((s) => s.guardianName).length}
                </p>
              </div>
              <Users className="w-12 h-12 text-purple-500 opacity-20" />
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
                onClick={() => addToast(`Send email to ${selectedStudents.size} students`, 'info')}
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
                    <input
                      type="checkbox"
                      checked={
                        selectedStudents.size === filteredStudents.length &&
                        filteredStudents.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left p-4">Student Number</th>
                  <th className="text-left p-4">First Name</th>
                  <th className="text-left p-4">Last Name</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Section</th>
                  <th className="text-left p-4">Guardian</th>
                  <th className="text-center p-4">Actions</th>
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
                        <input
                          type="checkbox"
                          checked={selectedStudents.has(student.id)}
                          onChange={() => toggleSelection(student.id)}
                          className="rounded border-gray-300"
                        />
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
    </MainLayout>
  )
}
