import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { GraduationCap, Mail, Lock, Eye, EyeOff, Shield, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/store/toastStore'
import { ROUTES, APP_NAME, TOAST_MESSAGES } from '@/utils/constants'
import { AuthResponse } from '@/types'
import { validators } from '@/utils/validation-rules'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { addToast } = useToast()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [showPassword, setShowPassword] = useState(false)

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data: AuthResponse) => {
      console.log('[Login] Login success, full data:', data)
      const token = data.accessToken || data.token
      console.log('[Login] Extracted token:', token ? token.substring(0, 30) + '...' : 'NO TOKEN!')
      if (!token) {
        console.error('[Login] No token in response!')
        addToast('Login failed: No authentication token received', 'error')
        return
      }
      setAuth(data.user, token)
      addToast('Login successful! Redirecting to dashboard...', 'success')
      console.log('Toast added, navigating to dashboard')
      setTimeout(() => navigate(ROUTES.DASHBOARD), 500)
    },
    onError: (error: unknown) => {
      console.error('Login error:', error)
      const message = (error as { message?: string })?.message || TOAST_MESSAGES.ERROR
      addToast(message, 'error')
    },
  })

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('Login form submitted with:', formData)

    // Validation using comprehensive validators
    const newErrors: { email?: string; password?: string } = {}

    // Email validation using comprehensive validator
    const emailResult = validators.email(formData.email)
    if (!emailResult.isValid) {
      newErrors.email = emailResult.error
    }

    // Password validation (basic check for login - not full strength check)
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      addToast('Please fix the form errors', 'error')
      return
    }

    setErrors({})
    addToast('Signing in...', 'info')
    console.log('Calling login mutation...')
    loginMutation.mutate(formData)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_110%)] opacity-30" />

      {/* Animated gradient orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 30, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
          x: [0, -40, 0],
          y: [0, 40, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
        className="absolute bottom-20 left-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl"
      />

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
          className="absolute w-1 h-1 bg-blue-400 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}

      <div className="w-full max-w-6xl flex items-center justify-center gap-12 relative z-10">
        {/* Left side - Decorative SVG illustration */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:block flex-1 max-w-xl"
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-3xl blur-3xl" />

            <svg viewBox="0 0 600 600" className="w-full h-auto relative">
              <defs>
                <linearGradient id="loginGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="loginGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <filter id="loginGlow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Central secure lock illustration */}
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8, type: 'spring' }}
              >
                {/* Lock body */}
                <motion.rect
                  animate={{
                    y: [0, -5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  x="200"
                  y="280"
                  width="200"
                  height="180"
                  rx="20"
                  fill="url(#loginGradient1)"
                  opacity="0.9"
                  filter="url(#loginGlow)"
                />

                {/* Lock shackle */}
                <motion.path
                  animate={{
                    y: [0, -5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  d="M 240 280 Q 240 200, 300 200 Q 360 200, 360 280"
                  stroke="url(#loginGradient1)"
                  strokeWidth="30"
                  fill="none"
                  strokeLinecap="round"
                  opacity="0.9"
                  filter="url(#loginGlow)"
                />

                {/* Keyhole */}
                <motion.circle
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  cx="300"
                  cy="350"
                  r="20"
                  fill="#1e293b"
                />
                <motion.rect
                  animate={{
                    height: [40, 45, 40],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  x="290"
                  y="360"
                  width="20"
                  height="40"
                  rx="3"
                  fill="#1e293b"
                />
              </motion.g>

              {/* Orbiting shield icons */}
              {[0, 1, 2].map((i) => (
                <motion.g
                  key={i}
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 20 + i * 5,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{ transformOrigin: '300px 300px' }}
                >
                  <motion.circle
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                    cx={300 + Math.cos((i * 120 * Math.PI) / 180) * 180}
                    cy={300 + Math.sin((i * 120 * Math.PI) / 180) * 180}
                    r="15"
                    fill={i === 0 ? '#3b82f6' : i === 1 ? '#8b5cf6' : '#6366f1'}
                    filter="url(#loginGlow)"
                  />
                </motion.g>
              ))}

              {/* Connection lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.line
                  key={i}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: [0, 0.3, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.6,
                    ease: 'easeInOut',
                  }}
                  x1="300"
                  y1="300"
                  x2={300 + Math.cos((i * 72 * Math.PI) / 180) * 150}
                  y2={300 + Math.sin((i * 72 * Math.PI) / 180) * 150}
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              ))}

              {/* Floating data particles */}
              {[...Array(12)].map((_, i) => (
                <motion.circle
                  key={`particle-${i}`}
                  animate={{
                    y: [0, -30, 0],
                    opacity: [0.2, 0.8, 0.2],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 3,
                  }}
                  cx={150 + Math.random() * 300}
                  cy={150 + Math.random() * 300}
                  r={2 + Math.random() * 3}
                  fill="#60a5fa"
                  filter="url(#loginGlow)"
                />
              ))}

              {/* Checkmark indicators */}
              {[0, 1, 2].map((i) => (
                <motion.g
                  key={`check-${i}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: 1 + i * 0.2,
                    duration: 0.5,
                    type: 'spring',
                  }}
                >
                  <circle cx={100 + i * 200} cy={500} r="20" fill="#10b981" opacity="0.2" />
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      delay: 1.2 + i * 0.2,
                      duration: 0.5,
                    }}
                    d={`M ${90 + i * 200} 500 L ${98 + i * 200} 508 L ${112 + i * 200} 492`}
                    stroke="#10b981"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.g>
              ))}
            </svg>

            {/* Feature badges */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 backdrop-blur-sm rounded-full border border-slate-700"
              >
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-slate-300 font-medium">Secure Access</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.7 }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 backdrop-blur-sm rounded-full border border-slate-700"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-slate-300 font-medium">Fast & Reliable</span>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Right side - Login form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-slate-700/50 relative overflow-hidden">
            {/* Decorative corner gradient */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-tr-full" />

            {/* Logo */}
            <div className="flex items-center justify-center mb-8 relative">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="relative"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl blur-md opacity-50"
                />
                <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
              </motion.div>
              <h1 className="text-3xl font-bold text-white ml-3">{APP_NAME}</h1>
            </div>

            {/* Title */}
            <div className="text-center mb-8 relative">
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold text-white mb-2"
              >
                Welcome Back
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-slate-400"
              >
                Sign in to access your academic portal
              </motion.p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6 relative">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Label
                  htmlFor="email"
                  className="text-slate-300 font-medium flex items-center gap-2"
                >
                  <Mail className="w-4 h-4 text-blue-400" />
                  Email Address
                </Label>
                <div className="mt-2 relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 z-10" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="professor@university.edu"
                    className={`relative pl-10 h-12 rounded-xl border-2 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 transition-all ${
                      errors.email
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-slate-700 focus:border-blue-500 hover:border-slate-600'
                    }`}
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      if (errors.email) setErrors({ ...errors, email: undefined })
                    }}
                    disabled={loginMutation.isPending}
                  />
                </div>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-400 mt-2 flex items-center gap-1"
                  >
                    <span className="text-red-500">⚠</span> {errors.email}
                  </motion.p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Label
                  htmlFor="password"
                  className="text-slate-300 font-medium flex items-center gap-2"
                >
                  <Lock className="w-4 h-4 text-indigo-400" />
                  Password
                </Label>
                <div className="mt-2 relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 z-10" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className={`relative pl-10 pr-12 h-12 rounded-xl border-2 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 transition-all ${
                      errors.password
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-slate-700 focus:border-blue-500 hover:border-slate-600'
                    }`}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value })
                      if (errors.password) setErrors({ ...errors, password: undefined })
                    }}
                    disabled={loginMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 z-10 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={loginMutation.isPending}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-400 mt-2 flex items-center gap-1"
                  >
                    <span className="text-red-500">⚠</span> {errors.password}
                  </motion.p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-0 relative overflow-hidden group"
                  disabled={loginMutation.isPending}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                  {loginMutation.isPending ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="ml-2 inline-block"
                      >
                        →
                      </motion.span>
                    </>
                  )}
                </Button>
              </motion.div>
            </form>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-8 text-center relative"
            >
              <p className="text-sm text-slate-400">
                Don't have an account?{' '}
                <Link
                  to={ROUTES.SIGNUP}
                  className="text-blue-400 font-semibold hover:text-blue-300 hover:underline transition-colors"
                >
                  Create one now
                </Link>
              </p>
            </motion.div>
          </div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center mt-6 flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4 text-slate-500" />
            <p className="text-sm text-slate-500">© 2025 {APP_NAME}. Secure Academic Portal.</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
