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
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { recordService } from '@/services/record.service'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/store/toastStore'
import { ROUTES } from '@/utils/constants'
import { getGreeting } from '@/lib/utils'
import MainLayout from '@/layouts/MainLayout'

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

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

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

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Card className="border border-gray-200 shadow-enterprise bg-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-gray-900">Quick Actions</CardTitle>
                  <p className="text-gray-600 text-sm mt-0.5">
                    Navigate to the most commonly used features
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => navigate(ROUTES.STUDENTS)}
                    className="w-full h-auto py-5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-enterprise hover:shadow-enterprise-lg transition-all group border-0"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5" />
                        <span className="font-semibold text-base">Manage Students</span>
                      </div>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => navigate(ROUTES.SUBJECTS)}
                    className="w-full h-auto py-5 px-6 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-enterprise hover:shadow-enterprise-lg transition-all group border-0"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5" />
                        <span className="font-semibold text-base">View Subjects</span>
                      </div>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => navigate(ROUTES.RECORDS)}
                    className="w-full h-auto py-5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-enterprise hover:shadow-enterprise-lg transition-all group border-0"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <ClipboardList className="w-5 h-5" />
                        <span className="font-semibold text-base">View Records</span>
                      </div>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Card className="border border-gray-200 shadow-enterprise bg-gradient-to-br from-emerald-50 via-white to-teal-50/50">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500 rounded-full blur-md opacity-30 animate-pulse" />
                    <div className="relative w-3 h-3 bg-emerald-500 rounded-full shadow-lg" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      System Status:{' '}
                      <span className="text-emerald-600">All systems operational</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Last updated: {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  )
}
