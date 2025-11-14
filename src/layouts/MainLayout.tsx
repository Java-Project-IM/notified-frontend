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
    console.log('Logging out user...')
    clearAuth()
    toast.success(TOAST_MESSAGES.LOGOUT_SUCCESS, 'Goodbye')
    setTimeout(() => navigate(ROUTES.LOGIN), 500)
  }

  const navItems = [
    {
      label: 'Dashboard',
      icon: Home,
      path: ROUTES.DASHBOARD,
      gradient: 'from-slate-600 to-indigo-600',
      hoverClass: 'hover:bg-slate-50',
      activeClass: 'bg-gradient-to-r from-slate-600 to-indigo-600',
    },
    {
      label: 'Students',
      icon: Users,
      path: ROUTES.STUDENTS,
      gradient: 'from-blue-600 to-indigo-600',
      hoverClass: 'hover:bg-blue-50',
      activeClass: 'bg-gradient-to-r from-blue-600 to-indigo-600',
    },
    {
      label: 'Subjects',
      icon: BookOpen,
      path: ROUTES.SUBJECTS,
      gradient: 'from-purple-600 to-violet-600',
      hoverClass: 'hover:bg-purple-50',
      activeClass: 'bg-gradient-to-r from-purple-600 to-violet-600',
    },
    {
      label: 'Records',
      icon: ClipboardList,
      path: ROUTES.RECORDS,
      gradient: 'from-emerald-600 to-teal-600',
      hoverClass: 'hover:bg-emerald-50',
      activeClass: 'bg-gradient-to-r from-emerald-600 to-teal-600',
    },
    {
      label: 'Email History',
      icon: Mail,
      path: ROUTES.EMAIL_HISTORY,
      gradient: 'from-amber-600 to-orange-600',
      hoverClass: 'hover:bg-amber-50',
      activeClass: 'bg-gradient-to-r from-amber-600 to-orange-600',
    },
  ]

  const currentPath = window.location.pathname

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm z-40">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-gradient-to-br from-slate-600 to-indigo-600 rounded-xl">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{APP_NAME}</h1>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium',
                  currentPath === item.path
                    ? `${item.activeClass} text-white shadow-md`
                    : `text-gray-700 ${item.hoverClass}`
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-white">
          <div className="mb-3">
            <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <Button
            variant="outline"
            className="w-full border-gray-300 hover:bg-gray-50"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8 min-h-screen">{children}</main>
    </div>
  )
}
