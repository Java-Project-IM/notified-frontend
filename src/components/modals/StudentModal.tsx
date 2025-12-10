import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Mail, Users as UsersIcon, Hash, Calendar, Phone, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Student, StudentFormData, StudentStatus } from '@/types'
import {
  validators,
  sanitizers,
  VALIDATION_CONSTANTS,
  STUDENT_STATUS,
} from '@/utils/validation-rules'

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
    birthdate: '',
    contact: '',
    status: 'active',
    section: '',
    guardianName: '',
    guardianEmail: '',
    guardianContact: '',
    nfcId: '',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof StudentFormData, string>>>({})

  useEffect(() => {
    if (student) {
      setFormData({
        studentNumber: student.studentNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        birthdate: student.birthdate || '',
        contact: student.contact || '',
        status: student.status || 'active',
        section: student.section || '',
        guardianName: student.guardianName || '',
        guardianEmail: student.guardianEmail || '',
        guardianContact: student.guardianContact || '',
        nfcId: student.nfcId || '',
      })
    } else if (generatedNumber) {
      setFormData((prev) => ({ ...prev, studentNumber: generatedNumber }))
    }
  }, [student, generatedNumber])

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof StudentFormData, string>> = {}

    // Student Number validation using comprehensive validator
    const studentNumberResult = validators.studentNumber(formData.studentNumber)
    if (!studentNumberResult.isValid) {
      newErrors.studentNumber = studentNumberResult.error
    }

    // First Name validation using comprehensive validator
    const firstNameResult = validators.personName(formData.firstName, 'First name')
    if (!firstNameResult.isValid) {
      newErrors.firstName = firstNameResult.error
    }

    // Last Name validation using comprehensive validator
    const lastNameResult = validators.personName(formData.lastName, 'Last name')
    if (!lastNameResult.isValid) {
      newErrors.lastName = lastNameResult.error
    }

    // Email validation using comprehensive validator
    const emailResult = validators.email(formData.email)
    if (!emailResult.isValid) {
      newErrors.email = emailResult.error
    }

    // Birthdate validation (optional but if provided, validate)
    if (formData.birthdate && formData.birthdate.trim().length > 0) {
      const birthdateResult = validators.birthdate(formData.birthdate)
      if (!birthdateResult.isValid) {
        newErrors.birthdate = birthdateResult.error
      }
    }

    // Contact validation (optional but if provided, validate)
    if (formData.contact && formData.contact.trim().length > 0) {
      const contactResult = validators.contact(formData.contact)
      if (!contactResult.isValid) {
        newErrors.contact = contactResult.error
      }
    }

    // Section validation (optional but if provided, validate)
    if (formData.section && formData.section.trim().length > 0) {
      const sectionResult = validators.section(formData.section)
      if (!sectionResult.isValid) {
        newErrors.section = sectionResult.error
      }
    }

    // Guardian Name validation (optional but if provided, validate)
    if (formData.guardianName && formData.guardianName.trim().length > 0) {
      const guardianNameResult = validators.personName(formData.guardianName, 'Guardian name')
      if (!guardianNameResult.isValid) {
        newErrors.guardianName = guardianNameResult.error
      }
    }

    // Guardian Email validation (optional but if provided, validate)
    if (formData.guardianEmail && formData.guardianEmail.trim().length > 0) {
      const guardianEmailResult = validators.email(formData.guardianEmail)
      if (!guardianEmailResult.isValid) {
        newErrors.guardianEmail = 'Guardian: ' + guardianEmailResult.error
      }
    }

    // Guardian Contact validation (optional but if provided, validate)
    if (formData.guardianContact && formData.guardianContact.trim().length > 0) {
      const guardianContactResult = validators.contact(formData.guardianContact)
      if (!guardianContactResult.isValid) {
        newErrors.guardianContact = 'Guardian: ' + guardianContactResult.error
      }
    }

    // NFC ID validation (optional but if provided, validate)
    if (formData.nfcId && formData.nfcId.trim().length > 0) {
      const nfcResult = validators.nfcId(formData.nfcId)
      if (!nfcResult.isValid) {
        newErrors.nfcId = nfcResult.error
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
      birthdate: '',
      contact: '',
      status: 'active',
      section: '',
      guardianName: '',
      guardianEmail: '',
      guardianContact: '',
      nfcId: '',
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
              className="bg-slate-800/95 backdrop-blur-xl rounded-3xl shadow-enterprise-2xl border border-slate-700/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto thin-scrollbar"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-6 rounded-t-3xl shadow-lg z-10 border-b border-blue-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      initial={{ rotate: -180, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className="bg-white/20 p-2 rounded-xl backdrop-blur-sm border border-white/30"
                    >
                      <User className="w-6 h-6" />
                    </motion.div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {student ? 'Edit Student' : 'Add New Student'}
                      </h2>
                      <p className="text-blue-100 text-sm mt-1">
                        {student
                          ? 'Update student information'
                          : 'Fill in the student details below'}
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
                {/* Student Number */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    <Hash className="w-4 h-4 inline mr-1" />
                    Student Number *
                  </label>
                  <Input
                    type="text"
                    value={formData.studentNumber}
                    onChange={(e) => handleChange('studentNumber', e.target.value)}
                    placeholder="e.g., 25-0001"
                    disabled={!!student}
                    className={`h-12 rounded-xl border-2 transition-all bg-slate-900/50 text-slate-100 placeholder:text-slate-500 ${
                      errors.studentNumber
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-slate-600 focus:border-blue-500'
                    }`}
                  />
                  {errors.studentNumber && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-sm mt-2 flex items-center gap-1"
                    >
                      ⚠️ {errors.studentNumber}
                    </motion.p>
                  )}
                </motion.div>

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      First Name *
                    </label>
                    <Input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      placeholder="John"
                      className={`h-12 rounded-xl border-2 transition-all bg-slate-900/50 text-slate-100 placeholder:text-slate-500 ${
                        errors.firstName
                          ? 'border-red-500 focus:border-red-600'
                          : 'border-slate-600 focus:border-blue-500'
                      }`}
                    />
                    {errors.firstName && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-sm mt-2 flex items-center gap-1"
                      >
                        ⚠️ {errors.firstName}
                      </motion.p>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Last Name *
                    </label>
                    <Input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      placeholder="Doe"
                      className={`h-12 rounded-xl border-2 transition-all bg-slate-900/50 text-slate-100 placeholder:text-slate-500 ${
                        errors.lastName
                          ? 'border-red-500 focus:border-red-600'
                          : 'border-slate-600 focus:border-blue-500'
                      }`}
                    />
                    {errors.lastName && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-sm mt-2 flex items-center gap-1"
                      >
                        ⚠️ {errors.lastName}
                      </motion.p>
                    )}
                  </motion.div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="john.doe@example.com"
                    className={`h-12 rounded-xl border-2 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 ${
                      errors.email
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-slate-600 focus:border-blue-500'
                    }`}
                  />
                  {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                </div>

                {/* Birthdate and Contact */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Birthdate
                    </label>
                    <Input
                      type="date"
                      value={formData.birthdate || ''}
                      onChange={(e) => handleChange('birthdate', e.target.value)}
                      className={`h-12 rounded-xl border-2 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 ${
                        errors.birthdate
                          ? 'border-red-500 focus:border-red-600'
                          : 'border-slate-600 focus:border-blue-500'
                      }`}
                    />
                    {errors.birthdate && (
                      <p className="text-red-400 text-sm mt-1">{errors.birthdate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Contact Number
                    </label>
                    <Input
                      type="tel"
                      value={formData.contact || ''}
                      onChange={(e) => handleChange('contact', e.target.value)}
                      placeholder="+639123456789"
                      className={`h-12 rounded-xl border-2 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 ${
                        errors.contact
                          ? 'border-red-500 focus:border-red-600'
                          : 'border-slate-600 focus:border-blue-500'
                      }`}
                    />
                    {errors.contact && (
                      <p className="text-red-400 text-sm mt-1">{errors.contact}</p>
                    )}
                  </div>
                </div>

                {/* Section and Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <UsersIcon className="w-4 h-4 inline mr-1" />
                      Section
                    </label>
                    <Input
                      type="text"
                      value={formData.section || ''}
                      onChange={(e) => handleChange('section', e.target.value)}
                      placeholder="e.g., A, B, 1-A"
                      className={`h-12 rounded-xl border-2 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 ${
                        errors.section
                          ? 'border-red-500 focus:border-red-600'
                          : 'border-slate-600 focus:border-blue-500'
                      }`}
                    />
                    {errors.section && (
                      <p className="text-red-400 text-sm mt-1">{errors.section}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                    <select
                      value={formData.status || 'active'}
                      onChange={(e) => handleChange('status', e.target.value)}
                      className="w-full h-12 rounded-xl border-2 bg-slate-900/50 text-slate-100 border-slate-600 focus:border-blue-500 px-3"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="graduated">Graduated</option>
                      <option value="transferred">Transferred</option>
                      <option value="suspended">Suspended</option>
                      <option value="dropped">Dropped</option>
                    </select>
                  </div>
                </div>

                {/* NFC ID (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <CreditCard className="w-4 h-4 inline mr-1" />
                    NFC Card ID (Optional)
                  </label>
                  <Input
                    type="text"
                    value={formData.nfcId || ''}
                    onChange={(e) => handleChange('nfcId', e.target.value.toUpperCase())}
                    placeholder="e.g., A1B2C3D4E5F6"
                    className={`h-12 rounded-xl border-2 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 ${
                      errors.nfcId
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-slate-600 focus:border-blue-500'
                    }`}
                  />
                  {errors.nfcId && <p className="text-red-400 text-sm mt-1">{errors.nfcId}</p>}
                  <p className="text-slate-500 text-xs mt-1">
                    Hexadecimal format (8-32 characters)
                  </p>
                </div>

                {/* Guardian Info */}
                <div className="border-t border-slate-700/50 pt-6">
                  <h3 className="text-lg font-semibold text-slate-200 mb-4">
                    Guardian Information
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Guardian Name
                      </label>
                      <Input
                        type="text"
                        value={formData.guardianName}
                        onChange={(e) => handleChange('guardianName', e.target.value)}
                        placeholder="Jane Doe"
                        className={`h-12 rounded-xl border-2 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 ${
                          errors.guardianName
                            ? 'border-red-500 focus:border-red-600'
                            : 'border-slate-600 focus:border-blue-500'
                        }`}
                      />
                      {errors.guardianName && (
                        <p className="text-red-400 text-sm mt-1">{errors.guardianName}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Guardian Email
                        </label>
                        <Input
                          type="email"
                          value={formData.guardianEmail || ''}
                          onChange={(e) => handleChange('guardianEmail', e.target.value)}
                          placeholder="jane.doe@example.com"
                          className={`h-12 rounded-xl border-2 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 ${
                            errors.guardianEmail
                              ? 'border-red-500 focus:border-red-600'
                              : 'border-slate-600 focus:border-blue-500'
                          }`}
                        />
                        {errors.guardianEmail && (
                          <p className="text-red-400 text-sm mt-1">{errors.guardianEmail}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Guardian Contact
                        </label>
                        <Input
                          type="tel"
                          value={formData.guardianContact || ''}
                          onChange={(e) => handleChange('guardianContact', e.target.value)}
                          placeholder="+639123456789"
                          className={`h-12 rounded-xl border-2 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 ${
                            errors.guardianContact
                              ? 'border-red-500 focus:border-red-600'
                              : 'border-slate-600 focus:border-blue-500'
                          }`}
                        />
                        {errors.guardianContact && (
                          <p className="text-red-400 text-sm mt-1">{errors.guardianContact}</p>
                        )}
                      </div>
                    </div>
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
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg border-0"
                    disabled={isLoading}
                  >
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
