import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users,
  BookOpen,
  ClipboardList,
  TrendingUp,
  ArrowRight,
  Activity,
  LayoutDashboard,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Mail,
  Calendar,
  UserCheck,
  UserX,
  Percent,
  History,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { recordService } from '@/services/record.service'
import { attendanceService } from '@/services/attendance.service'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/store/toastStore'
import { ROUTES } from '@/utils/constants'
import { getGreeting, cn } from '@/lib/utils'
import MainLayout from '@/layouts/MainLayout'
import { format } from 'date-fns'

// Enhanced stats interface
interface EnhancedDashboardStats {
  totalStudents: number
  totalSubjects: number
  totalRecords: number
  todayRecords: number
  // Today's attendance breakdown
  todayPresent?: number
  todayAbsent?: number
  todayLate?: number
  todayExcused?: number
  todayUnmarked?: number
  attendanceRate?: number
  // Email stats
  emailsSentToday?: number
  emailsBounced?: number
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      console.log('[Dashboard] Fetching dashboard stats...')
      try {
        const data = await recordService.getStats()
        console.log('[Dashboard] Dashboard stats loaded:', data)
        return data
      } catch (err) {
        console.error('[Dashboard] Failed to load dashboard stats:', err)
        addToast('Failed to load dashboard statistics', 'error')
        throw err
      }
    },
    retry: 1,
  })

  const statCards = [
    {
      title: 'Total Students',
      value: stats?.totalStudents || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      gradient: 'from-blue-500 to-blue-600',
      action: () => navigate(ROUTES.STUDENTS),
      description: 'Enrolled students',
    },
    {
      title: 'Total Subjects',
      value: stats?.totalSubjects || 0,
      icon: BookOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      gradient: 'from-green-500 to-green-600',
      action: () => navigate(ROUTES.SUBJECTS),
      description: 'Active subjects',
    },
    {
      title: 'Total Records',
      value: stats?.totalRecords || 0,
      icon: ClipboardList,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      gradient: 'from-purple-500 to-purple-600',
      action: () => navigate(ROUTES.RECORDS),
      description: 'Attendance records',
    },
    {
      title: "Today's Activity",
      value: stats?.todayRecords || 0,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      gradient: 'from-orange-500 to-orange-600',
      description: 'Records today',
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  // Fetch today's attendance breakdown
  const { data: todayStats, isLoading: loadingTodayStats } = useQuery({
    queryKey: ['today-attendance-stats'],
    queryFn: () => attendanceService.getTodayStats(),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Enhanced stats with real attendance breakdown
  const enhancedStats: EnhancedDashboardStats = {
    ...stats,
    todayPresent: todayStats?.present || 0,
    todayAbsent: todayStats?.absent || 0,
    todayLate: todayStats?.late || 0,
    todayExcused: todayStats?.excused || 0,
    todayUnmarked: todayStats?.unmarked || 0,
    attendanceRate: todayStats?.attendanceRate || 0,
  }

  // Recent activity from today's records
  const recentActivity = [
    {
      id: 1,
      action: 'Present today',
      subject: `${enhancedStats.todayPresent} students`,
      time: new Date(),
      count: enhancedStats.todayPresent,
      color: 'emerald',
    },
    {
      id: 2,
      action: 'Absent today',
      subject: `${enhancedStats.todayAbsent} students`,
      time: new Date(),
      count: enhancedStats.todayAbsent,
      color: 'rose',
    },
    {
      id: 3,
      action: 'Late arrivals',
      subject: `${enhancedStats.todayLate} students`,
      time: new Date(),
      count: enhancedStats.todayLate,
      color: 'amber',
    },
  ]

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <PageHeader
          title={`${getGreeting()}, ${user?.name}!`}
          description="Welcome to your command center. Here's your overview at a glance."
          icon={LayoutDashboard}
          gradient="from-blue-600 via-indigo-600 to-violet-600"
          stats={[
            {
              label: 'Total Students',
              value: isLoading ? '...' : stats?.totalStudents || 0,
              icon: Users,
              color: 'blue',
            },
            {
              label: 'Total Subjects',
              value: isLoading ? '...' : stats?.totalSubjects || 0,
              icon: BookOpen,
              color: 'green',
            },
            {
              label: 'Total Records',
              value: isLoading ? '...' : stats?.totalRecords || 0,
              icon: ClipboardList,
              color: 'purple',
            },
            {
              label: "Today's Activity",
              value: isLoading ? '...' : stats?.todayRecords || 0,
              icon: Activity,
              color: 'orange',
            },
          ]}
        />

        {/* Today's Summary Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
        >
          <div className="bg-slate-800/50 rounded-2xl shadow-enterprise-lg border border-slate-700/50 backdrop-blur-sm overflow-hidden">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                    <Calendar className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-100">Today's Summary</h2>
                    <p className="text-slate-400 text-sm mt-0.5">
                      {format(new Date(), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-lg">
                  <Percent className="w-4 h-4 text-emerald-400" />
                  <span className="text-lg font-semibold text-emerald-400">
                    {loadingTodayStats ? '...' : `${enhancedStats.attendanceRate}%`}
                  </span>
                  <span className="text-sm text-slate-400">attendance</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Present */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <UserCheck className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">Present</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-100">
                    {loadingTodayStats ? '...' : enhancedStats.todayPresent}
                  </p>
                </motion.div>

                {/* Absent */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <UserX className="w-5 h-5 text-red-400" />
                    <span className="text-sm font-medium text-red-400">Absent</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-100">
                    {loadingTodayStats ? '...' : enhancedStats.todayAbsent}
                  </p>
                </motion.div>

                {/* Late */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <span className="text-sm font-medium text-amber-400">Late</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-100">
                    {loadingTodayStats ? '...' : enhancedStats.todayLate}
                  </p>
                </motion.div>

                {/* Excused */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-medium text-blue-400">Excused</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-100">
                    {loadingTodayStats ? '...' : enhancedStats.todayExcused}
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions & Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="bg-slate-800/50 rounded-2xl shadow-enterprise-lg border border-slate-700/50 backdrop-blur-sm overflow-hidden h-full">
              <div className="p-6 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-500/30">
                    <Activity className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-100">Quick Actions</h2>
                    <p className="text-slate-400 text-sm mt-0.5">Navigate to key features</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      onClick={() => navigate(ROUTES.ATTENDANCE)}
                      className="w-full h-auto py-4 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-enterprise hover:shadow-enterprise-lg transition-all group border-0"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <UserCheck className="w-5 h-5" />
                          <span className="font-semibold">Mark Attendance</span>
                        </div>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      onClick={() => navigate(ROUTES.STUDENTS)}
                      className="w-full h-auto py-4 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-enterprise hover:shadow-enterprise-lg transition-all group border-0"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5" />
                          <span className="font-semibold">Manage Students</span>
                        </div>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      onClick={() => navigate(ROUTES.SUBJECTS)}
                      className="w-full h-auto py-4 px-5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-enterprise hover:shadow-enterprise-lg transition-all group border-0"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-5 h-5" />
                          <span className="font-semibold">View Subjects</span>
                        </div>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      onClick={() => navigate(ROUTES.RECORDS)}
                      className="w-full h-auto py-4 px-5 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 shadow-enterprise hover:shadow-enterprise-lg transition-all group border-0"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <ClipboardList className="w-5 h-5" />
                          <span className="font-semibold">View Records</span>
                        </div>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="bg-slate-800/50 rounded-2xl shadow-enterprise-lg border border-slate-700/50 backdrop-blur-sm overflow-hidden h-full">
              <div className="p-6 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/20 rounded-xl border border-purple-500/30">
                    <History className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-100">Recent Activity</h2>
                    <p className="text-slate-400 text-sm mt-0.5">Latest actions in your system</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-start gap-4 p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="p-2 bg-slate-600/50 rounded-lg">
                        <Activity className="w-4 h-4 text-slate-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {activity.action}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {activity.subject} • {activity.count}{' '}
                          {activity.count === 1 ? 'student' : 'students'}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {format(activity.time, 'h:mm a')}
                      </span>
                    </motion.div>
                  ))}

                  {recentActivity.length === 0 && (
                    <div className="text-center py-8">
                      <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">No recent activity</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-4">
            <div className="flex items-center justify-center gap-6 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-slate-700 rounded text-xs font-mono">P</kbd>
                Present
              </span>
              <span className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-slate-700 rounded text-xs font-mono">A</kbd>
                Absent
              </span>
              <span className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-slate-700 rounded text-xs font-mono">L</kbd>
                Late
              </span>
              <span className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-slate-700 rounded text-xs font-mono">E</kbd>
                Excused
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-500">
                Keyboard shortcuts available in attendance view
              </span>
            </div>
          </div>
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <div className="bg-slate-800/50 rounded-2xl shadow-enterprise border border-slate-700/50 backdrop-blur-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500 rounded-full blur-md opacity-30 animate-pulse" />
                    <div className="relative w-3 h-3 bg-emerald-500 rounded-full shadow-lg ring-4 ring-emerald-500/20" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      System Status:{' '}
                      <span className="text-emerald-400">All systems operational</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Last updated: {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  )
}
