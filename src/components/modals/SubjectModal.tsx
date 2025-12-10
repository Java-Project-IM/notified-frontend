import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BookOpen, Hash, GraduationCap, Users, User, MapPin, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Subject, SubjectFormData } from '@/types'
import { validators, sanitizers, VALIDATION_CONSTANTS } from '@/utils/validation-rules'

interface SubjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: SubjectFormData, id?: string | number) => void
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
    capacity: undefined,
    description: '',
    instructor: '',
    room: '',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof SubjectFormData, string>>>({})

  useEffect(() => {
    if (subject) {
      setFormData({
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        section: subject.section,
        yearLevel: subject.yearLevel,
        capacity: subject.capacity,
        description: subject.description || '',
        instructor: subject.instructor || '',
        room: subject.room || '',
      })
    }
  }, [subject])

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SubjectFormData, string>> = {}

    // Subject Code validation using comprehensive validator
    const subjectCodeResult = validators.subjectCode(formData.subjectCode)
    if (!subjectCodeResult.isValid) {
      newErrors.subjectCode = subjectCodeResult.error
    }

    // Subject Name validation using comprehensive validator
    const subjectNameResult = validators.subjectName(formData.subjectName)
    if (!subjectNameResult.isValid) {
      newErrors.subjectName = subjectNameResult.error
    }

    // Section validation using comprehensive validator
    const sectionResult = validators.section(formData.section)
    if (!sectionResult.isValid) {
      newErrors.section = sectionResult.error
    }

    // Year Level validation using comprehensive validator
    const yearLevelResult = validators.yearLevel(formData.yearLevel)
    if (!yearLevelResult.isValid) {
      newErrors.yearLevel = yearLevelResult.error
    }

    // Capacity validation (optional but if provided, validate)
    if (formData.capacity !== undefined && formData.capacity !== null) {
      const capacityResult = validators.capacity(formData.capacity)
      if (!capacityResult.isValid) {
        newErrors.capacity = capacityResult.error
      }
    }

    // Description validation (optional, just length check)
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less'
    }

    // Instructor name validation (optional)
    if (formData.instructor && formData.instructor.trim().length > 0) {
      const instructorResult = validators.personName(formData.instructor, 'Instructor name')
      if (!instructorResult.isValid) {
        newErrors.instructor = instructorResult.error
      }
    }

    // Room validation (optional, alphanumeric)
    if (formData.room && formData.room.trim().length > 0) {
      if (formData.room.length > 50) {
        newErrors.room = 'Room must be 50 characters or less'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      // Send the subject id if we're editing an existing subject.
      // This avoids relying on the parent's `editingSubject` closure
      // and ensures we always pass the correct id when updating.
      onSubmit(formData, subject?.id)
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
      capacity: undefined,
      description: '',
      instructor: '',
      room: '',
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

                {/* Capacity and Room */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <Users className="w-4 h-4 inline mr-1" />
                      Capacity (Optional)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="500"
                      value={formData.capacity || ''}
                      onChange={(e) =>
                        handleChange(
                          'capacity',
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      placeholder="e.g., 30, 50"
                      className={`h-12 rounded-xl border-2 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 ${
                        errors.capacity
                          ? 'border-red-500 focus:border-red-600'
                          : 'border-slate-600 focus:border-purple-500'
                      }`}
                    />
                    {errors.capacity && (
                      <p className="text-red-400 text-sm mt-1">{errors.capacity}</p>
                    )}
                    <p className="text-slate-500 text-xs mt-1">Maximum enrollment limit (1-500)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Room (Optional)
                    </label>
                    <Input
                      type="text"
                      value={formData.room || ''}
                      onChange={(e) => handleChange('room', e.target.value)}
                      placeholder="e.g., Room 101, Lab A"
                      className={`h-12 rounded-xl border-2 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 ${
                        errors.room
                          ? 'border-red-500 focus:border-red-600'
                          : 'border-slate-600 focus:border-purple-500'
                      }`}
                    />
                    {errors.room && <p className="text-red-400 text-sm mt-1">{errors.room}</p>}
                  </div>
                </div>

                {/* Instructor */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Instructor (Optional)
                  </label>
                  <Input
                    type="text"
                    value={formData.instructor || ''}
                    onChange={(e) => handleChange('instructor', e.target.value)}
                    placeholder="e.g., Dr. John Smith"
                    className={`h-12 rounded-xl border-2 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 ${
                      errors.instructor
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-slate-600 focus:border-purple-500'
                    }`}
                  />
                  {errors.instructor && (
                    <p className="text-red-400 text-sm mt-1">{errors.instructor}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Brief description of the subject..."
                    rows={3}
                    className={`w-full rounded-xl border-2 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 p-3 resize-none ${
                      errors.description
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-slate-600 focus:border-purple-500'
                    }`}
                  />
                  {errors.description && (
                    <p className="text-red-400 text-sm mt-1">{errors.description}</p>
                  )}
                  <p className="text-slate-500 text-xs mt-1">
                    {(formData.description || '').length}/500 characters
                  </p>
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
