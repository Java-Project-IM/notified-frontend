import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BookOpen, Hash, GraduationCap, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Subject, SubjectFormData } from '@/types'

interface SubjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: SubjectFormData) => void
  subject?: Subject | null
  isLoading?: boolean
}

export default function SubjectModal({
  isOpen,
  onClose,
  onSubmit,
  subject,
  isLoading = false,
}: SubjectModalProps) {
  const [formData, setFormData] = useState<SubjectFormData>({
    subjectCode: '',
    subjectName: '',
    section: '',
    yearLevel: 1,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof SubjectFormData, string>>>({})

  useEffect(() => {
    if (subject) {
      setFormData({
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        section: subject.section,
        yearLevel: subject.yearLevel,
      })
    }
  }, [subject])

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SubjectFormData, string>> = {}

    // Subject Code validation
    if (!formData.subjectCode.trim()) {
      newErrors.subjectCode = 'Subject code is required'
    } else if (formData.subjectCode.trim().length < 2) {
      newErrors.subjectCode = 'Subject code must be at least 2 characters'
    } else if (formData.subjectCode.trim().length > 20) {
      newErrors.subjectCode = 'Subject code must be 20 characters or less'
    } else if (!/^[A-Z0-9-]+$/.test(formData.subjectCode.trim())) {
      newErrors.subjectCode =
        'Subject code can only contain uppercase letters, numbers, and hyphens'
    }

    // Subject Name validation
    if (!formData.subjectName.trim()) {
      newErrors.subjectName = 'Subject name is required'
    } else if (formData.subjectName.trim().length < 3) {
      newErrors.subjectName = 'Subject name must be at least 3 characters'
    } else if (formData.subjectName.trim().length > 100) {
      newErrors.subjectName = 'Subject name must be 100 characters or less'
    }

    // Section validation
    if (!formData.section.trim()) {
      newErrors.section = 'Section is required'
    } else if (formData.section.trim().length > 10) {
      newErrors.section = 'Section must be 10 characters or less'
    } else if (!/^[A-Z0-9-]+$/.test(formData.section.trim())) {
      newErrors.section = 'Section can only contain uppercase letters, numbers, and hyphens'
    }

    // Year Level validation
    if (!formData.yearLevel || isNaN(formData.yearLevel)) {
      newErrors.yearLevel = 'Year level is required'
    } else if (formData.yearLevel < 1 || formData.yearLevel > 12) {
      newErrors.yearLevel = 'Year level must be between 1 and 12'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const handleChange = (field: keyof SubjectFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleClose = () => {
    setFormData({
      subjectCode: '',
      subjectName: '',
      section: '',
      yearLevel: 1,
    })
    setErrors({})
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-6 h-6" />
                    <h2 className="text-2xl font-bold">
                      {subject ? 'Edit Subject' : 'Add New Subject'}
                    </h2>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Subject Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Hash className="w-4 h-4 inline mr-1" />
                    Subject Code *
                  </label>
                  <Input
                    type="text"
                    value={formData.subjectCode}
                    onChange={(e) => handleChange('subjectCode', e.target.value.toUpperCase())}
                    placeholder="e.g., CS101, MATH201"
                    disabled={!!subject}
                    className={errors.subjectCode ? 'border-red-500' : ''}
                  />
                  {errors.subjectCode && (
                    <p className="text-red-500 text-sm mt-1">{errors.subjectCode}</p>
                  )}
                </div>

                {/* Subject Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <BookOpen className="w-4 h-4 inline mr-1" />
                    Subject Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.subjectName}
                    onChange={(e) => handleChange('subjectName', e.target.value)}
                    placeholder="e.g., Introduction to Computer Science"
                    className={errors.subjectName ? 'border-red-500' : ''}
                  />
                  {errors.subjectName && (
                    <p className="text-red-500 text-sm mt-1">{errors.subjectName}</p>
                  )}
                </div>

                {/* Year Level and Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <GraduationCap className="w-4 h-4 inline mr-1" />
                      Year Level *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="12"
                      value={formData.yearLevel}
                      onChange={(e) => handleChange('yearLevel', parseInt(e.target.value))}
                      placeholder="1-12"
                      className={errors.yearLevel ? 'border-red-500' : ''}
                    />
                    {errors.yearLevel && (
                      <p className="text-red-500 text-sm mt-1">{errors.yearLevel}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Users className="w-4 h-4 inline mr-1" />
                      Section *
                    </label>
                    <Input
                      type="text"
                      value={formData.section}
                      onChange={(e) => handleChange('section', e.target.value.toUpperCase())}
                      placeholder="e.g., A, B, 1-A"
                      className={errors.section ? 'border-red-500' : ''}
                    />
                    {errors.section && (
                      <p className="text-red-500 text-sm mt-1">{errors.section}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 shadow-neumorphic bg-purple-600 hover:bg-purple-700"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : subject ? 'Update Subject' : 'Add Subject'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
