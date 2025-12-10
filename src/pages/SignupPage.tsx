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
                  <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e293b" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
                  </linearGradient>
                  <filter id="signupGlow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Background Isometric Grid Platform */}
                <motion.g
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1 }}
                >
                   <path
                    d="M 100 400 L 300 500 L 500 400 L 300 300 Z"
                    fill="url(#gridGradient)"
                    stroke="#3b82f6"
                    strokeWidth="1"
                    opacity="0.5"
                  />
                  <motion.path
                    d="M 100 400 L 300 500 L 500 400 L 300 300 Z"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="1"
                    strokeDasharray="5,5"
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </motion.g>

                {/* Floating Profile Cards Assembly */}
                <motion.g transform="translate(300, 320)">
                  {/* Base Card */}
                  <motion.rect
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    x="-120" y="-160" width="240" height="180" rx="12"
                    fill="#1e293b" stroke="#475569" strokeWidth="2"
                    filter="url(#signupGlow)"
                  />
                  
                  {/* Header Bar */}
                  <motion.rect
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    x="-100" y="-140" width="200" height="30" rx="6"
                    fill="url(#signupGradient1)"
                  />
                  
                  {/* Profile Photo Placeholder */}
                  <motion.circle
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.7, type: "spring" }}
                    cx="-70" cy="-80" r="25"
                    fill="#334155" stroke="#6366f1" strokeWidth="2"
                  />

                  {/* Text Lines */}
                  {[0, 1, 2].map((i) => (
                    <motion.rect
                      key={`line-${i}`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.9 + i * 0.2, duration: 0.5 }}
                      x="-30" y={-95 + i * 15} width={100 + (i % 2) * 20} height="8" rx="4"
                      fill="#475569"
                    />
                  ))}
                </motion.g>

                {/* Connecting Network Nodes */}
                <motion.g>
                   {/* Node 1: Academic Cap */}
                   <motion.g 
                     animate={{ y: [-5, 5, -5] }}
                     transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                     transform="translate(150, 250)"
                   >
                     <circle r="30" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
                     <path d="M -15 0 L 0 -10 L 15 0 L 0 10 Z M 15 0 V 10" stroke="#60a5fa" strokeWidth="2" fill="none" />
                   </motion.g>

                   {/* Node 2: Growth Chart */}
                   <motion.g 
                     animate={{ y: [5, -5, 5] }}
                     transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                     transform="translate(450, 280)"
                   >
                     <circle r="30" fill="#1e293b" stroke="#8b5cf6" strokeWidth="2" />
                      <motion.path
                        d="M -15 10 L -5 0 L 5 5 L 15 -10"
                        stroke="#a78bfa" strokeWidth="2" fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                      />
                   </motion.g>

                   {/* Connecting Lines */}
                   <motion.line
                     x1="180" y1="260" x2="250" y2="290"
                     stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4"
                     animate={{ opacity: [0.2, 0.6, 0.2] }}
                     transition={{ duration: 2, repeat: Infinity }}
                   />
                   <motion.line
                     x1="420" y1="290" x2="350" y2="310"
                     stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4 4"
                     animate={{ opacity: [0.2, 0.6, 0.2] }}
                     transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                   />
                </motion.g>

                {/* Floating Plus Signs (Growth) */}
                {[...Array(5)].map((_, i) => (
                  <motion.text
                    key={`plus-${i}`}
                    x={100 + Math.random() * 400}
                    y={150 + Math.random() * 300}
                    fill="#10b981"
                    fontSize="24"
                    fontWeight="bold"
                    opacity="0.6"
                    animate={{ 
                      y: [0, -20, 0],
                      opacity: [0, 0.8, 0],
                      scale: [0.8, 1.2, 0.8]
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2
                    }}
                  >
                    +
                  </motion.text>
                ))}

                {/* Success Checkmarks */}
                <motion.g transform="translate(300, 480)">
                   <motion.circle
                     animate={{ scale: [1, 1.1, 1] }}
                     transition={{ duration: 1.5, repeat: Infinity }}
                     r="20" fill="#10b981" opacity="0.2"
                   />
                   <circle r="12" fill="#10b981" />
                   <path d="M -4 0 L -1 3 L 5 -3" stroke="#fff" strokeWidth="2" fill="none" />
                </motion.g>
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
