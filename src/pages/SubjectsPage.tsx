import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Plus, Search, Users, Edit2, Trash2, Eye } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import MainLayout from '@/layouts/MainLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
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
      console.log('[Subjects] Fetching all subjects...')
      const data = await subjectService.getAll()
      console.log('[Subjects] Loaded subjects:', data.length)
      return data
    },
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: subjectService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      addToast('Subject added successfully', 'success')
      setIsModalOpen(false)
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to add subject', 'error')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SubjectFormData> }) =>
      subjectService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      addToast('Subject updated successfully', 'success')
      setIsModalOpen(false)
      setEditingSubject(null)
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to update subject', 'error')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: subjectService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      addToast('Subject deleted successfully', 'success')
    },
    onError: (error: any) => {
      addToast(error?.message || 'Failed to delete subject', 'error')
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
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Subjects"
          description="Organize and manage academic subjects, sections, and year levels"
          icon={BookOpen}
          gradient="from-purple-600 via-violet-600 to-indigo-600"
          stats={[
            {
              label: 'Total Subjects',
              value: subjects.length,
              icon: BookOpen,
              color: 'purple',
            },
            {
              label: 'Year Levels',
              value: new Set(subjects.map((s) => s.yearLevel)).size,
              icon: BookOpen,
              color: 'blue',
            },
            {
              label: 'Sections',
              value: new Set(subjects.map((s) => s.section)).size,
              icon: Users,
              color: 'green',
            },
            {
              label: 'Active Classes',
              value: subjects.length,
              icon: Eye,
              color: 'orange',
            },
          ]}
          actions={[
            {
              label: 'Add Subject',
              onClick: handleAddSubject,
              icon: Plus,
              variant: 'primary',
            },
          ]}
        />

        {/* Search */}
        <div className="bg-white rounded-2xl p-6 shadow-enterprise border border-gray-200">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by subject code, name, or section..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500/20"
            />
          </div>
        </div>

        {/* Subjects Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-enterprise border border-gray-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-violet-600">
                <tr>
                  <th className="text-left p-5 font-semibold text-white text-sm tracking-wide">
                    Subject Code
                  </th>
                  <th className="text-left p-5 font-semibold text-white text-sm tracking-wide">
                    Subject Name
                  </th>
                  <th className="text-left p-5 font-semibold text-white text-sm tracking-wide">
                    Year Level
                  </th>
                  <th className="text-left p-5 font-semibold text-white text-sm tracking-wide">
                    Section
                  </th>
                  <th className="text-left p-5 font-semibold text-white text-sm tracking-wide">
                    Enrollment
                  </th>
                  <th className="text-center p-5 font-semibold text-white text-sm tracking-wide">
                    Actions
                  </th>
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
