import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Mail, Users as UsersIcon, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Student, StudentFormData } from '@/types'

interface StudentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: StudentFormData) => void
  student?: Student | null
  isLoading?: boolean
  generatedNumber?: string
}

export default function StudentModal({
  isOpen,
  onClose,
  onSubmit,
  student,
  isLoading = false,
  generatedNumber = '',
}: StudentModalProps) {
  const [formData, setFormData] = useState<StudentFormData>({
    studentNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    section: '',
    guardianName: '',
    guardianEmail: '',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof StudentFormData, string>>>({})

  useEffect(() => {
    if (student) {
      setFormData({
        studentNumber: student.studentNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        section: student.section || '',
        guardianName: student.guardianName || '',
        guardianEmail: student.guardianEmail || '',
      })
    } else if (generatedNumber) {
      setFormData((prev) => ({ ...prev, studentNumber: generatedNumber }))
    }
  }, [student, generatedNumber])

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof StudentFormData, string>> = {}

    // Student Number validation
    if (!formData.studentNumber.trim()) {
      newErrors.studentNumber = 'Student number is required'
    } else if (formData.studentNumber.trim().length < 3) {
      newErrors.studentNumber = 'Student number must be at least 3 characters'
    }

    // First Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters'
    } else if (!/^[a-zA-Z\s-]+$/.test(formData.firstName.trim())) {
      newErrors.firstName = 'First name can only contain letters, spaces, and hyphens'
    }

    // Last Name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters'
    } else if (!/^[a-zA-Z\s-]+$/.test(formData.lastName.trim())) {
      newErrors.lastName = 'Last name can only contain letters, spaces, and hyphens'
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Section validation (optional but if provided, validate format)
    if (formData.section && formData.section.trim().length > 0) {
      if (formData.section.trim().length > 10) {
        newErrors.section = 'Section must be 10 characters or less'
      }
    }

    // Guardian Name validation (optional but if provided, validate)
    if (formData.guardianName && formData.guardianName.trim().length > 0) {
      if (formData.guardianName.trim().length < 2) {
        newErrors.guardianName = 'Guardian name must be at least 2 characters'
      } else if (!/^[a-zA-Z\s-]+$/.test(formData.guardianName.trim())) {
        newErrors.guardianName = 'Guardian name can only contain letters, spaces, and hyphens'
      }
    }

    // Guardian Email validation (optional but if provided, validate)
    if (formData.guardianEmail && formData.guardianEmail.trim().length > 0) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guardianEmail)) {
        newErrors.guardianEmail = 'Please enter a valid guardian email address'
      }
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

  const handleChange = (field: keyof StudentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleClose = () => {
    setFormData({
      studentNumber: '',
      firstName: '',
      lastName: '',
      email: '',
      section: '',
      guardianName: '',
      guardianEmail: '',
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="w-6 h-6" />
                    <h2 className="text-2xl font-bold">
                      {student ? 'Edit Student' : 'Add New Student'}
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
                {/* Student Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Hash className="w-4 h-4 inline mr-1" />
                    Student Number *
                  </label>
                  <Input
                    type="text"
                    value={formData.studentNumber}
                    onChange={(e) => handleChange('studentNumber', e.target.value)}
                    placeholder="e.g., 25-0001"
                    disabled={!!student}
                    className={errors.studentNumber ? 'border-red-500' : ''}
                  />
                  {errors.studentNumber && (
                    <p className="text-red-500 text-sm mt-1">{errors.studentNumber}</p>
                  )}
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <Input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      placeholder="John"
                      className={errors.firstName ? 'border-red-500' : ''}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <Input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      placeholder="Doe"
                      className={errors.lastName ? 'border-red-500' : ''}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="john.doe@example.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                {/* Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <UsersIcon className="w-4 h-4 inline mr-1" />
                    Section
                  </label>
                  <Input
                    type="text"
                    value={formData.section}
                    onChange={(e) => handleChange('section', e.target.value)}
                    placeholder="e.g., A, B, 1-A"
                  />
                </div>

                {/* Guardian Info */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Guardian Information</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Guardian Name
                      </label>
                      <Input
                        type="text"
                        value={formData.guardianName}
                        onChange={(e) => handleChange('guardianName', e.target.value)}
                        placeholder="Jane Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Guardian Email
                      </label>
                      <Input
                        type="email"
                        value={formData.guardianEmail}
                        onChange={(e) => handleChange('guardianEmail', e.target.value)}
                        placeholder="jane.doe@example.com"
                        className={errors.guardianEmail ? 'border-red-500' : ''}
                      />
                      {errors.guardianEmail && (
                        <p className="text-red-500 text-sm mt-1">{errors.guardianEmail}</p>
                      )}
                    </div>
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
                  <Button type="submit" className="flex-1 shadow-neumorphic" disabled={isLoading}>
                    {isLoading ? 'Saving...' : student ? 'Update Student' : 'Add Student'}
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
