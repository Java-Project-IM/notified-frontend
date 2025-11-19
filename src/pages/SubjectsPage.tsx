import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Plus, Search, Users, Edit2, Trash2, Eye } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import MainLayout from '@/layouts/MainLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { TableSkeleton } from '@/components/ui/skeleton'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { useToast } from '@/store/toastStore'
import { subjectService } from '@/services/subject.service'
import { Subject, SubjectFormData } from '@/types'
import SubjectModal from '@/components/modals/SubjectModal'
import { useDebounce } from '@/hooks/useDebounce'

export default function SubjectsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    subject: Subject | null
  }>({ isOpen: false, subject: null })
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

  // Filter subjects based on debounced search
  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.subjectCode.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      subject.subjectName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      subject.section.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  )

  const handleDelete = (subject: Subject) => {
    setDeleteConfirmation({ isOpen: true, subject })
  }

  const confirmDelete = () => {
    if (deleteConfirmation.subject) {
      deleteMutation.mutate(deleteConfirmation.subject.id)
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
        <div className="bg-slate-800/50 rounded-2xl p-6 shadow-enterprise border border-slate-700/50 backdrop-blur-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by subject code, name, or section..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 border-slate-600 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 focus:border-purple-500 focus:ring-purple-500/20"
            />
          </div>
          {searchTerm && (
            <p className="mt-3 text-sm text-slate-400">
              {filteredSubjects.length === 0
                ? 'No results found'
                : `Found ${filteredSubjects.length} subject${filteredSubjects.length !== 1 ? 's' : ''}`}
            </p>
          )}
        </div>

        {/* Subjects Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 rounded-2xl shadow-enterprise-lg border border-slate-700/50 backdrop-blur-sm overflow-hidden"
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
              <tbody className="bg-slate-900/50">
                {isLoading ? (
                  <TableSkeleton rows={5} columns={6} />
                ) : filteredSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <EmptyState
                        icon={BookOpen}
                        title={searchTerm ? 'No subjects found' : 'No subjects yet'}
                        description={
                          searchTerm
                            ? 'Try adjusting your search terms or filters'
                            : 'Get started by adding your first subject to the system'
                        }
                        action={
                          !searchTerm
                            ? {
                                label: 'Add Subject',
                                onClick: handleAddSubject,
                              }
                            : undefined
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  filteredSubjects.map((subject, index) => (
                    <motion.tr
                      // Use a stable unique key for list items. Prefer `id` or `subjectCode`,
                      // fall back to index if neither is present.
                      key={subject.id ?? subject.subjectCode ?? `subject-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-slate-700/30 hover:bg-slate-800/60 transition-colors group"
                    >
                      <td className="p-5 font-semibold text-purple-400 text-sm">
                        {subject.subjectCode}
                      </td>
                      <td className="p-5 text-slate-200 font-medium text-sm">
                        {subject.subjectName}
                      </td>
                      <td className="p-5 text-slate-300 text-sm">Year {subject.yearLevel}</td>
                      <td className="p-5">
                        <span className="inline-flex px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium border border-purple-500/30">
                          {subject.section}
                        </span>
                      </td>
                      <td className="p-5 text-slate-400 text-sm">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-4 h-4" />0 students
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewDetails(subject)}
                            className="p-2.5 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all hover:scale-110 border border-transparent hover:border-blue-500/30"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditSubject(subject)}
                            disabled={updateMutation.isPending}
                            className="p-2.5 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-all hover:scale-110 border border-transparent hover:border-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(subject)}
                            disabled={deleteMutation.isPending}
                            className="p-2.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-all hover:scale-110 border border-transparent hover:border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, subject: null })}
        onConfirm={confirmDelete}
        title="Delete Subject"
        description={`Are you sure you want to delete ${deleteConfirmation.subject?.subjectCode} - ${deleteConfirmation.subject?.subjectName}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </MainLayout>
  )
}
