import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Plus, Search, Users, Edit2, Trash2, Eye } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import MainLayout from '@/layouts/MainLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/store/toastStore'
import { subjectService } from '@/services/subject.service'
import { Subject, SubjectFormData } from '@/types'
import SubjectModal from '@/components/modals/SubjectModal'

export default function SubjectsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const { addToast } = useToast()
  const queryClient = useQueryClient()

  // Fetch subjects
  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      console.log('📚 Fetching all subjects...')
      const data = await subjectService.getAll()
      console.log('✅ Loaded subjects:', data.length)
      return data
    },
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: subjectService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      addToast('Subject added successfully', 'success', '✅ Success')
      setIsModalOpen(false)
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to add subject', 'error', '❌ Error')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SubjectFormData> }) =>
      subjectService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      addToast('Subject updated successfully', 'success', '✅ Success')
      setIsModalOpen(false)
      setEditingSubject(null)
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to update subject', 'error', '❌ Error')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: subjectService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      addToast('Subject deleted successfully', 'success', '✅ Success')
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to delete subject', 'error', '❌ Error')
    },
  })

  // Filter subjects based on search
  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.subjectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.section.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = (subject: Subject) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${subject.subjectCode} - ${subject.subjectName}?`
      )
    ) {
      deleteMutation.mutate(subject.id)
    }
  }

  const handleViewDetails = (subject: Subject) => {
    addToast(`Viewing details for ${subject.subjectCode}`, 'info')
    // TODO: Navigate to subject details page or open modal
  }

  const handleAddSubject = () => {
    setEditingSubject(null)
    setIsModalOpen(true)
  }

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject)
    setIsModalOpen(true)
  }

  const handleModalSubmit = (data: SubjectFormData) => {
    if (editingSubject) {
      updateMutation.mutate({ id: editingSubject.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingSubject(null)
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-purple-600" />
              Subjects
            </h1>
            <p className="text-gray-600 mt-1">Manage subjects and class sections</p>
          </div>
          <Button
            className="shadow-neumorphic bg-purple-600 hover:bg-purple-700"
            onClick={handleAddSubject}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Subject
          </Button>
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
                <p className="text-gray-600 text-sm">Total Subjects</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{subjects.length}</p>
              </div>
              <BookOpen className="w-12 h-12 text-purple-500 " />
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
                <p className="text-gray-600 text-sm">Year Levels</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {new Set(subjects.map((s) => s.yearLevel)).size}
                </p>
              </div>
              <BookOpen className="w-12 h-12 text-blue-500 " />
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
                <p className="text-gray-600 text-sm">Sections</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {new Set(subjects.map((s) => s.section)).size}
                </p>
              </div>
              <Users className="w-12 h-12 text-green-500 " />
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
                <p className="text-gray-600 text-sm">Active Classes</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{subjects.length}</p>
              </div>
              <Users className="w-12 h-12 text-orange-500 " />
            </div>
          </motion.div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl p-6 shadow-neumorphic">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by subject code, name, or section..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Subjects Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-neumorphic overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                <tr>
                  <th className="text-left p-4">Subject Code</th>
                  <th className="text-left p-4">Subject Name</th>
                  <th className="text-left p-4">Year Level</th>
                  <th className="text-left p-4">Section</th>
                  <th className="text-left p-4">Enrollment</th>
                  <th className="text-center p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500">
                      Loading subjects...
                    </td>
                  </tr>
                ) : filteredSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500">
                      {searchTerm
                        ? 'No subjects found matching your search'
                        : 'No subjects added yet'}
                    </td>
                  </tr>
                ) : (
                  filteredSubjects.map((subject, index) => (
                    <motion.tr
                      key={subject.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-purple-50 transition-colors"
                    >
                      <td className="p-4 font-medium text-purple-700">{subject.subjectCode}</td>
                      <td className="p-4 text-gray-900">{subject.subjectName}</td>
                      <td className="p-4 text-gray-700">Year {subject.yearLevel}</td>
                      <td className="p-4 text-gray-700">{subject.section}</td>
                      <td className="p-4 text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-4 h-4" />0 students
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewDetails(subject)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditSubject(subject)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(subject)}
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

      {/* Subject Modal */}
      <SubjectModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        subject={editingSubject}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </MainLayout>
  )
}
