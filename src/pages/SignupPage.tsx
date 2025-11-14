import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { Bell, Mail, Lock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/store/toastStore'
import { ROUTES, APP_NAME, TOAST_MESSAGES } from '@/utils/constants'
import { validateEmail } from '@/lib/utils'
import { AuthResponse } from '@/types'

export default function SignupPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { addToast } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({})

  const signupMutation = useMutation({
    mutationFn: authService.signup,
    onSuccess: (data: AuthResponse) => {
      console.log('🎉 Signup success, full data:', data)
      const token = data.accessToken || data.token
      console.log('🔑 Extracted token:', token ? token.substring(0, 30) + '...' : 'NO TOKEN!')
      if (!token) {
        console.error('❌ No token in response!')
        addToast('Signup failed: No authentication token received', 'error', '❌ Error')
        return
      }
      setAuth(data.user, token)
      addToast('Account created successfully! Welcome aboard! 🎉', 'success', '✅ Success')
      setTimeout(() => navigate(ROUTES.DASHBOARD), 500)
    },
    onError: (error: unknown) => {
      console.error('Signup error:', error)
      const message = (error as { message?: string })?.message || TOAST_MESSAGES.ERROR
      addToast(message, 'error', '❌ Signup Failed')
    },
  })

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('Signup form submitted with:', formData)

    // Validation
    const newErrors: { name?: string; email?: string; password?: string } = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Name must be 100 characters or less'
    } else if (!/^[a-zA-Z\s-]+$/.test(formData.name.trim())) {
      newErrors.name = 'Name can only contain letters, spaces, and hyphens'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    } else if (formData.password.length > 100) {
      newErrors.password = 'Password must be 100 characters or less'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      addToast('Please fix the form errors', 'error', '⚠️ Validation Error')
      return
    }

    setErrors({})
    addToast('Creating your account...', 'info', '🔄 Processing')
    signupMutation.mutate(formData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg"
            >
              <Bell className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent ml-3">
              {APP_NAME}
            </h1>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
            <p className="text-gray-600 mt-2">Join us and start managing students</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="name" className="text-gray-700 font-medium">
                Full Name
              </Label>
              <div className="mt-2 relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className={`pl-10 h-12 rounded-xl border-2 transition-all ${
                    errors.name
                      ? 'border-red-500 focus:border-red-600'
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    if (errors.name) setErrors({ ...errors, name: undefined })
                  }}
                  disabled={signupMutation.isPending}
                />
              </div>
              {errors.name && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 mt-2 flex items-center gap-1"
                >
                  ⚠️ {errors.name}
                </motion.p>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email Address
              </Label>
              <div className="mt-2 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className={`pl-10 h-12 rounded-xl border-2 transition-all ${
                    errors.email
                      ? 'border-red-500 focus:border-red-600'
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    if (errors.email) setErrors({ ...errors, email: undefined })
                  }}
                  disabled={signupMutation.isPending}
                />
              </div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 mt-2 flex items-center gap-1"
                >
                  ⚠️ {errors.email}
                </motion.p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Password
              </Label>
              <div className="mt-2 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className={`pl-10 h-12 rounded-xl border-2 transition-all ${
                    errors.password
                      ? 'border-red-500 focus:border-red-600'
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    if (errors.password) setErrors({ ...errors, password: undefined })
                  }}
                  disabled={signupMutation.isPending}
                />
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-600 mt-2 flex items-start gap-1"
                >
                  ⚠️ <span>{errors.password}</span>
                </motion.p>
              )}
              {!errors.password && formData.password.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Must contain uppercase, lowercase, and number
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={signupMutation.isPending}
            >
              {signupMutation.isPending ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to={ROUTES.LOGIN}
                className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-gray-600 mt-6"
        >
          © 2025 {APP_NAME}. All rights reserved.
        </motion.p>
      </motion.div>
    </div>
  )
}
