import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Shield,
  Sparkles,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/store/toastStore'
import { ROUTES, APP_NAME, TOAST_MESSAGES } from '@/utils/constants'
import { AuthResponse } from '@/types'
import { validators, sanitizers } from '@/utils/validation-rules'

export default function SignupPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { addToast } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    password?: string
    confirmPassword?: string
  }>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const signupMutation = useMutation({
    mutationFn: authService.signup,
    onSuccess: (data: AuthResponse) => {
      console.log('[Signup] Signup success, full data:', data)
      const token = data.accessToken || data.token
      console.log('[Signup] Extracted token:', token ? token.substring(0, 30) + '...' : 'NO TOKEN!')
      if (!token) {
        console.error('[Signup] No token in response!')
        addToast('Signup failed: No authentication token received', 'error')
        return
      }
      setAuth(data.user, token)
      addToast('Account created successfully! Welcome aboard!', 'success')
      setTimeout(() => navigate(ROUTES.DASHBOARD), 500)
    },
    onError: (error: unknown) => {
      console.error('Signup error:', error)
      const message = (error as { message?: string })?.message || TOAST_MESSAGES.ERROR
      addToast(message, 'error')
    },
  })

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('Signup form submitted with:', formData)

    // Validation using comprehensive validators
    const newErrors: {
      name?: string
      email?: string
      password?: string
      confirmPassword?: string
    } = {}

    // Name validation using comprehensive validator
    const nameResult = validators.personName(formData.name, 'Name')
    if (!nameResult.isValid) {
      newErrors.name = nameResult.error
    }

    // Email validation using comprehensive validator
    const emailResult = validators.email(formData.email)
    if (!emailResult.isValid) {
      newErrors.email = emailResult.error
    }

    // Password validation using comprehensive validator
    const passwordResult = validators.password(formData.password)
    if (!passwordResult.isValid) {
      newErrors.password = passwordResult.error
    }

    // Confirm password validation using comprehensive validator
    const confirmResult = validators.passwordConfirmation(
      formData.password,
      formData.confirmPassword
    )
    if (!confirmResult.isValid) {
      newErrors.confirmPassword = confirmResult.error
      if (
        formData.password &&
        formData.confirmPassword &&
        formData.password !== formData.confirmPassword
      ) {
        setErrors({ ...newErrors, confirmPassword: 'Passwords do not match' })
        addToast('Passwords do not match', 'error')
        return
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      addToast('Please fix the form errors', 'error')
      return
    }

    setErrors({})
    addToast('Creating your account...', 'info')
    // Only send the required fields (exclude confirmPassword)
    signupMutation.mutate({
      name: sanitizers.input(formData.name),
      email: sanitizers.email(formData.email),
      password: formData.password,
    })
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
          x: [0, -30, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
          x: [0, 40, 0],
          y: [0, -40, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
        className="absolute bottom-20 right-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"
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
        className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl"
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
                <linearGradient id="signupGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="signupGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="signupGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <filter id="signupGlow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Central user profile creation illustration */}
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8, type: 'spring' }}
              >
                {/* Main card */}
                <motion.rect
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  x="150"
                  y="200"
                  width="300"
                  height="250"
                  rx="24"
                  fill="url(#signupGradient1)"
                  opacity="0.9"
                  filter="url(#signupGlow)"
                />

                {/* User avatar circle */}
                <motion.circle
                  animate={{
                    scale: [1, 1.05, 1],
                    y: [0, -8, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  cx="300"
                  cy="280"
                  r="50"
                  fill="#1e293b"
                  stroke="url(#signupGradient3)"
                  strokeWidth="4"
                />

                {/* User icon inside circle */}
                <motion.path
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  d="M 300 260 Q 300 250, 310 250 Q 320 250, 320 260 Q 320 270, 310 270 Q 300 270, 300 260 M 285 300 Q 285 285, 300 285 Q 315 285, 315 300"
                  fill="#60a5fa"
                />

                {/* Form fields representation */}
                {[0, 1, 2].map((i) => (
                  <motion.g
                    key={i}
                    animate={{
                      y: [0, -8, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <motion.rect
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{
                        delay: 0.8 + i * 0.2,
                        duration: 0.6,
                      }}
                      x="180"
                      y={350 + i * 30}
                      width="240"
                      height="20"
                      rx="10"
                      fill="#1e293b"
                      style={{ transformOrigin: 'left' }}
                    />
                    <motion.circle
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 1 + i * 0.2,
                        type: 'spring',
                      }}
                      cx={195}
                      cy={360 + i * 30}
                      r="6"
                      fill={i === 0 ? '#3b82f6' : i === 1 ? '#8b5cf6' : '#10b981'}
                    />
                  </motion.g>
                ))}
              </motion.g>

              {/* Orbiting plus icons */}
              {[0, 1, 2, 3].map((i) => (
                <motion.g
                  key={i}
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 15 + i * 3,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{ transformOrigin: '300px 325px' }}
                >
                  <motion.g
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.4,
                    }}
                  >
                    <line
                      x1={300 + Math.cos((i * 90 * Math.PI) / 180) * 200}
                      y1={325 + Math.sin((i * 90 * Math.PI) / 180) * 200 - 12}
                      x2={300 + Math.cos((i * 90 * Math.PI) / 180) * 200}
                      y2={325 + Math.sin((i * 90 * Math.PI) / 180) * 200 + 12}
                      stroke={i % 2 === 0 ? '#3b82f6' : '#8b5cf6'}
                      strokeWidth="3"
                      strokeLinecap="round"
                      filter="url(#signupGlow)"
                    />
                    <line
                      x1={300 + Math.cos((i * 90 * Math.PI) / 180) * 200 - 12}
                      y1={325 + Math.sin((i * 90 * Math.PI) / 180) * 200}
                      x2={300 + Math.cos((i * 90 * Math.PI) / 180) * 200 + 12}
                      y2={325 + Math.sin((i * 90 * Math.PI) / 180) * 200}
                      stroke={i % 2 === 0 ? '#3b82f6' : '#8b5cf6'}
                      strokeWidth="3"
                      strokeLinecap="round"
                      filter="url(#signupGlow)"
                    />
                  </motion.g>
                </motion.g>
              ))}

              {/* Connection lines */}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <motion.line
                  key={i}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: [0, 0.3, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.5,
                    ease: 'easeInOut',
                  }}
                  x1="300"
                  y1="325"
                  x2={300 + Math.cos((i * 60 * Math.PI) / 180) * 160}
                  y2={325 + Math.sin((i * 60 * Math.PI) / 180) * 160}
                  stroke="#8b5cf6"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              ))}

              {/* Floating sparkles */}
              {[...Array(15)].map((_, i) => (
                <motion.g
                  key={`sparkle-${i}`}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.2, 0.8, 0.2],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 3,
                  }}
                >
                  <path
                    d={`M ${100 + Math.random() * 400} ${100 + Math.random() * 400} l 3 0 l -1.5 -3 z`}
                    fill="#60a5fa"
                    filter="url(#signupGlow)"
                  />
                </motion.g>
              ))}

              {/* Progress indicators */}
              {[0, 1, 2, 3].map((i) => (
                <motion.circle
                  key={`progress-${i}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1, 1] }}
                  transition={{
                    delay: 1.5 + i * 0.15,
                    duration: 0.4,
                  }}
                  cx={200 + i * 50}
                  cy={500}
                  r="8"
                  fill={i < 3 ? '#10b981' : '#334155'}
                  stroke={i < 3 ? '#10b981' : '#475569'}
                  strokeWidth="2"
                />
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
                <UserPlus className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-slate-300 font-medium">Quick Setup</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.7 }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 backdrop-blur-sm rounded-full border border-slate-700"
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-slate-300 font-medium">Secure</span>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Right side - Signup form */}
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
                Join Our Platform
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-slate-400"
              >
                Create your account and start managing students
              </motion.p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 relative">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Label
                  htmlFor="name"
                  className="text-slate-300 font-medium flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-purple-400" />
                  Full Name
                </Label>
                <div className="mt-2 relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 z-10" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Dr. John Doe"
                    className={`relative pl-10 h-12 rounded-xl border-2 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 transition-all ${
                      errors.name
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-slate-700 focus:border-purple-500 hover:border-slate-600'
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
                    className="text-sm text-red-400 mt-2 flex items-center gap-1"
                  >
                    <span className="text-red-500">⚠</span> {errors.name}
                  </motion.p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.65 }}
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
                    disabled={signupMutation.isPending}
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
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 z-10" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    className={`relative pl-10 pr-12 h-12 rounded-xl border-2 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 transition-all ${
                      errors.password
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-slate-700 focus:border-indigo-500 hover:border-slate-600'
                    }`}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value })
                      if (errors.password) setErrors({ ...errors, password: undefined })
                    }}
                    disabled={signupMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 z-10 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={signupMutation.isPending}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-400 mt-2 flex items-start gap-1"
                  >
                    <span className="text-red-500">⚠</span> <span>{errors.password}</span>
                  </motion.p>
                )}
                {!errors.password && formData.password.length > 0 && (
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Must contain uppercase, lowercase, and number
                  </p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.75 }}
              >
                <Label
                  htmlFor="confirmPassword"
                  className="text-slate-300 font-medium flex items-center gap-2"
                >
                  <Lock className="w-4 h-4 text-emerald-400" />
                  Confirm Password
                </Label>
                <div className="mt-2 relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 z-10" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    className={`relative pl-10 pr-12 h-12 rounded-xl border-2 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 transition-all ${
                      errors.confirmPassword
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-slate-700 focus:border-emerald-500 hover:border-slate-600'
                    }`}
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, confirmPassword: e.target.value })
                      if (errors.confirmPassword)
                        setErrors({ ...errors, confirmPassword: undefined })
                    }}
                    disabled={signupMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 z-10 transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    disabled={signupMutation.isPending}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-400 mt-2 flex items-center gap-1"
                  >
                    <span className="text-red-500">⚠</span> {errors.confirmPassword}
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
                  disabled={signupMutation.isPending}
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
                    <>
                      Create Account
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
                Already have an account?{' '}
                <Link
                  to={ROUTES.LOGIN}
                  className="text-blue-400 font-semibold hover:text-blue-300 hover:underline transition-colors"
                >
                  Sign in here
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
