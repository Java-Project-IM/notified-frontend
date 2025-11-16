import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, Users, BookOpen, ClipboardList, Mail, LogOut, Bell, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/store/toastStore'
import { ROUTES, APP_NAME, TOAST_MESSAGES } from '@/utils/constants'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()
  const toast = useToast()

  const handleLogout = () => {
    // logging out
    clearAuth()
    toast.success(TOAST_MESSAGES.LOGOUT_SUCCESS, 'Goodbye')
    setTimeout(() => navigate(ROUTES.LOGIN), 500)
  }

  const navItems = [
    {
      label: 'Dashboard',
      icon: Home,
      path: ROUTES.DASHBOARD,
      color: '#3B82F6',
    },
    {
      label: 'Students',
      icon: Users,
      path: ROUTES.STUDENTS,
      color: '#6366F1',
    },
    {
      label: 'Subjects',
      icon: BookOpen,
      path: ROUTES.SUBJECTS,
      color: '#8B5CF6',
    },
    {
      label: 'Records',
      icon: ClipboardList,
      path: ROUTES.RECORDS,
      color: '#10B981',
    },
    {
      label: 'Attendance',
      icon: CheckCircle,
      path: ROUTES.ATTENDANCE,
      color: '#8B5CF6',
    },
    {
      label: 'Email History',
      icon: Mail,
      path: ROUTES.EMAIL_HISTORY,
      color: '#F59E0B',
    },
  ]

  const currentPath = window.location.pathname

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Enterprise Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 shadow-enterprise-2xl z-40">
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl blur-md opacity-50" />
              <div className="relative p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Bell className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">{APP_NAME}</h1>
              <p className="text-xs text-slate-400 font-medium">Enterprise Edition</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = currentPath === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'sidebar-nav-item w-full group',
                  isActive
                    ? 'bg-slate-800/80 text-white shadow-lg'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                )}
                style={{
                  borderLeft: isActive ? `3px solid ${item.color}` : '3px solid transparent',
                }}
              >
                <div
                  className={cn(
                    'p-2 rounded-lg transition-all duration-200',
                    isActive ? 'bg-slate-700/50' : 'bg-slate-800/30 group-hover:bg-slate-700/50'
                  )}
                  style={{
                    backgroundColor: isActive ? `${item.color}20` : undefined,
                  }}
                >
                  <item.icon
                    className="w-5 h-5"
                    style={{ color: isActive ? item.color : undefined }}
                  />
                </div>
                <span className="font-medium">{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-current" />}
              </button>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
          <div className="mb-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all duration-200"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-72 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
