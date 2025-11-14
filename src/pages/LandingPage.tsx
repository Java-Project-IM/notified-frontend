import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, Users, BookOpen, ClipboardList } from 'lucide-react'
import { ROUTES, APP_NAME } from '@/utils/constants'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 relative z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl blur-md opacity-50" />
              <div className="relative p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Bell className="w-7 h-7 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white">{APP_NAME}</h1>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(ROUTES.LOGIN)}
              className="border-slate-600 bg-slate-800/50 hover:bg-slate-700 text-slate-200 hover:text-white transition-all h-11 px-5"
            >
              Login
            </Button>
            <Button
              onClick={() => navigate(ROUTES.SIGNUP)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-11 px-5 shadow-lg hover:shadow-xl transition-all border-0"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20 relative">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto relative z-10"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-semibold mb-6"
          >
            ✨ Enterprise-Grade Student Management
          </motion.div>

          <h2 className="text-6xl font-bold text-white mb-6 leading-tight">
            Student Management{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              Made Simple
            </span>
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Track attendance, manage records, and communicate with students and guardians all in one
            modern, powerful platform designed for educational excellence.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate(ROUTES.SIGNUP)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-14 px-8 text-lg shadow-enterprise-xl hover:shadow-enterprise-2xl hover:scale-105 transition-all border-0"
            >
              Start Free Trial
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate(ROUTES.LOGIN)}
              className="h-14 px-8 text-lg border-2 border-slate-600 bg-slate-800/50 hover:bg-slate-700 text-slate-200 hover:text-white hover:border-slate-500 hover:scale-105 transition-all"
            >
              Sign In
            </Button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid md:grid-cols-3 gap-6 mt-24 relative z-10"
        >
          <FeatureCard
            icon={<Users className="w-12 h-12 text-blue-400" />}
            title="Student Management"
            description="Easily add, edit, and manage student information with a clean, intuitive interface designed for efficiency."
            gradient="from-blue-600 to-indigo-600"
          />
          <FeatureCard
            icon={<BookOpen className="w-12 h-12 text-purple-400" />}
            title="Subject Tracking"
            description="Organize subjects, sections, and year levels with comprehensive tracking tools and analytics."
            gradient="from-purple-600 to-violet-600"
          />
          <FeatureCard
            icon={<ClipboardList className="w-12 h-12 text-emerald-400" />}
            title="Records & Reports"
            description="Keep detailed attendance and activity logs with powerful filtering options and export capabilities."
            gradient="from-emerald-600 to-teal-600"
          />
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-24 text-center"
        >
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-12 border border-slate-700/50 shadow-enterprise-xl">
            <h3 className="text-3xl font-bold text-white mb-12">
              Trusted by Educational Institutions
            </h3>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-2">
                  99.9%
                </p>
                <p className="text-slate-400 font-medium">Uptime</p>
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-400 mb-2">
                  24/7
                </p>
                <p className="text-slate-400 font-medium">Support</p>
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-2">
                  10k+
                </p>
                <p className="text-slate-400 font-medium">Students</p>
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400 mb-2">
                  500+
                </p>
                <p className="text-slate-400 font-medium">Schools</p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t border-slate-800">
        <div className="text-center text-slate-400">
          <p className="font-medium">
            © 2025 {APP_NAME}. Built with React, TypeScript, and TailwindCSS.
          </p>
          <p className="text-sm text-slate-500 mt-2">Enterprise Edition</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: ReactNode
  title: string
  description: string
  gradient: string
}) {
  return (
    <motion.div whileHover={{ scale: 1.03, y: -4 }} className="relative group">
      {/* Gradient glow on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
      />

      {/* Card content */}
      <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-slate-600 shadow-enterprise hover:shadow-enterprise-lg transition-all duration-300">
        <div className={`inline-flex p-4 bg-gradient-to-br ${gradient} rounded-xl shadow-lg mb-6`}>
          {icon}
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
        <p className="text-slate-400 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  )
}
