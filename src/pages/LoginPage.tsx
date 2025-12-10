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
                  <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e293b" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
                  </linearGradient>
                  <filter id="loginGlow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="glass">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
                  </filter>
                </defs>

                {/* Central Hub Base */}
                <motion.g
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8 }}
                >
                  {/* Isometric base plates */}
                  <path
                    d="M 150 350 L 300 420 L 450 350 L 300 280 Z"
                    fill="url(#gridGradient)"
                    stroke="#3b82f6"
                    strokeWidth="1"
                    opacity="0.6"
                  />
                  <motion.path
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    d="M 150 370 L 300 440 L 450 370 L 300 300 Z"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="1"
                    strokeDasharray="5,5"
                  />
                </motion.g>

                {/* Orbiting Security Rings */}
                {[0, 1, 2].map((i) => (
                  <motion.ellipse
                    key={`ring-${i}`}
                    cx="300"
                    cy="350"
                    rx={100 + i * 40}
                    ry={40 + i * 15}
                    fill="none"
                    stroke={i === 0 ? '#3b82f6' : i === 1 ? '#8b5cf6' : '#6366f1'}
                    strokeWidth="2"
                    strokeDasharray="20 40"
                    strokeOpacity="0.4"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 20 + i * 10,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                ))}

                {/* Floating Central Core - Glassmorphic */}
                <motion.g
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {/* Core Cube Back */}
                  <path d="M 260 260 L 340 260 L 340 340 L 260 340 Z" fill="#1e293b" opacity="0.8" />
                  
                  {/* Data Streams entering core */}
                  {[0, 1, 2, 3].map((i) => (
                    <motion.path
                      key={`stream-${i}`}
                      d={`M ${100 + i * 130} ${500 - i * 50} Q 300 300 300 300`}
                      fill="none"
                      stroke="url(#loginGradient1)"
                      strokeWidth="2"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: [0, 0.5, 0] }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 0.8,
                        ease: 'linear'
                      }}
                    />
                  ))}

                  {/* Main Shield Icon */}
                  <motion.g transform="translate(270, 270) scale(0.6)">
                    <motion.path
                      d="M 50 10 L 90 30 V 55 C 90 80 50 95 50 95 C 50 95 10 80 10 55 V 30 L 50 10 Z"
                      fill="url(#loginGradient2)"
                      stroke="#fff"
                      strokeWidth="4"
                      filter="url(#loginGlow)"
                      animate={{ 
                        filter: ['url(#loginGlow) brightness(1)', 'url(#loginGlow) brightness(1.3)', 'url(#loginGlow) brightness(1)'] 
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                    <path
                      d="M 50 25 V 80 M 30 45 L 70 45"
                      stroke="#fff"
                      strokeWidth="4"
                      strokeLinecap="round"
                      opacity="0.8"
                    />
                  </motion.g>

                  {/* Scanning Laser Effect */}
                  <motion.rect
                    x="250"
                    y="250"
                    width="100"
                    height="2"
                    fill="#60a5fa"
                    filter="url(#loginGlow)"
                    animate={{ y: [0, 100, 0], opacity: [0, 1, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                </motion.g>

                {/* Floating "Verified" Badges */}
                <motion.g
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  transform="translate(420, 200)"
                >
                  <rect width="120" height="40" rx="8" fill="#1e293b" stroke="#334155" />
                  <circle cx="20" cy="20" r="6" fill="#10b981" />
                  <rect x="35" y="15" width="60" height="4" rx="2" fill="#94a3b8" />
                  <rect x="35" y="23" width="40" height="4" rx="2" fill="#475569" />
                </motion.g>

                <motion.g
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                  transform="translate(100, 450)"
                >
                  <rect width="140" height="50" rx="8" fill="#1e293b" stroke="#334155" />
                  <rect x="15" y="15" width="20" height="20" rx="4" fill="#3b82f6" />
                  <rect x="45" y="18" width="70" height="4" rx="2" fill="#94a3b8" />
                  <rect x="45" y="28" width="50" height="4" rx="2" fill="#475569" />
                </motion.g>

                {/* Background Particles */}
                {[...Array(8)].map((_, i) => (
                  <motion.circle
                    key={`p-${i}`}
                    cx={100 + Math.random() * 400}
                    cy={100 + Math.random() * 400}
                    r={Math.random() * 3}
                    fill="#60a5fa"
                    animate={{ 
                      y: [0, -30, 0],
                      opacity: [0.2, 0.8, 0.2]
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2
                    }}
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
