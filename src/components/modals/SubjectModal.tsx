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
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-slate-800/95 backdrop-blur-xl rounded-3xl shadow-enterprise-2xl border border-slate-700/50 w-full max-w-2xl"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white p-6 rounded-t-3xl shadow-lg border-b border-purple-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      initial={{ rotate: -180, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className="bg-white/20 p-2 rounded-xl backdrop-blur-sm border border-white/30"
                    >
                      <BookOpen className="w-6 h-6" />
                    </motion.div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {subject ? 'Edit Subject' : 'Add New Subject'}
                      </h2>
                      <p className="text-purple-100 text-sm mt-1">
                        {subject
                          ? 'Update subject information'
                          : 'Fill in the subject details below'}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleClose}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </motion.button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {/* Subject Code */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    <Hash className="w-4 h-4 inline mr-1" />
                    Subject Code *
                  </label>
                  <Input
                    type="text"
                    value={formData.subjectCode}
                    onChange={(e) => handleChange('subjectCode', e.target.value.toUpperCase())}
                    placeholder="e.g., CS101, MATH201"
                    disabled={!!subject}
                    className={`h-12 rounded-xl border-2 transition-all bg-slate-900/50 text-slate-100 placeholder:text-slate-500 ${
                      errors.subjectCode
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-slate-600 focus:border-purple-500'
                    }`}
                  />
                  {errors.subjectCode && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-sm mt-2 flex items-center gap-1"
                    >
                      ⚠️ {errors.subjectCode}
                    </motion.p>
                  )}
                </motion.div>

                {/* Subject Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <BookOpen className="w-4 h-4 inline mr-1" />
                    Subject Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.subjectName}
                    onChange={(e) => handleChange('subjectName', e.target.value)}
                    placeholder="e.g., Introduction to Computer Science"
                    className={`h-12 rounded-xl border-2 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 ${
                      errors.subjectName
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-slate-600 focus:border-purple-500'
                    }`}
                  />
                  {errors.subjectName && (
                    <p className="text-red-400 text-sm mt-1">{errors.subjectName}</p>
                  )}
                </div>

                {/* Year Level and Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
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
                      className={`h-12 rounded-xl border-2 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 ${
                        errors.yearLevel
                          ? 'border-red-500 focus:border-red-600'
                          : 'border-slate-600 focus:border-purple-500'
                      }`}
                    />
                    {errors.yearLevel && (
                      <p className="text-red-400 text-sm mt-1">{errors.yearLevel}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <Users className="w-4 h-4 inline mr-1" />
                      Section *
                    </label>
                    <Input
                      type="text"
                      value={formData.section}
                      onChange={(e) => handleChange('section', e.target.value.toUpperCase())}
                      placeholder="e.g., A, B, 1-A"
                      className={`h-12 rounded-xl border-2 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 ${
                        errors.section
                          ? 'border-red-500 focus:border-red-600'
                          : 'border-slate-600 focus:border-purple-500'
                      }`}
                    />
                    {errors.section && (
                      <p className="text-red-400 text-sm mt-1">{errors.section}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-6 border-t border-slate-700/50">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1 h-12 rounded-xl bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg border-0"
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
