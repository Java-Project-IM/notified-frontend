import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, Users, BookOpen, ClipboardList, LogOut, Bell, CheckCircle } from 'lucide-react'
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
      colorClass: 'bg-gradient-to-r from-indigo-600 to-purple-600',
      hoverClass: 'hover:bg-indigo-50',
      textClass: 'text-indigo-700',
    },
    {
      label: 'Students',
      icon: Users,
      path: ROUTES.STUDENTS,
      colorClass: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      hoverClass: 'hover:bg-blue-50',
      textClass: 'text-blue-700',
    },
    {
      label: 'Subjects',
      icon: BookOpen,
      path: ROUTES.SUBJECTS,
      colorClass: 'bg-gradient-to-r from-purple-600 to-violet-600',
      hoverClass: 'hover:bg-purple-50',
      textClass: 'text-purple-700',
    },
    {
      label: 'Records',
      icon: ClipboardList,
      path: ROUTES.RECORDS,
      colorClass: 'bg-gradient-to-r from-green-600 to-emerald-600',
      hoverClass: 'hover:bg-green-50',
      textClass: 'text-green-700',
    },
  ]

  const currentPath = window.location.pathname

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <Bell className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">{APP_NAME}</h1>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  currentPath === item.path
                    ? `${item.colorClass} text-white shadow-lg transform scale-105`
                    : `text-gray-700 ${item.hoverClass}`
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t">
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">{children}</main>
    </div>
  )
}
