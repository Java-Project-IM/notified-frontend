import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ToastContainer } from '@/components/ui/toast'
import { ROUTES } from '@/utils/constants'
import { ProtectedRoute } from '@/components/ProtectedRoute'

// Lazy load pages for better performance
const LandingPage = lazy(() => import('@/pages/LandingPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const SignupPage = lazy(() => import('@/pages/SignupPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const StudentsPage = lazy(() => import('@/pages/StudentsPage'))
const SubjectsPage = lazy(() => import('@/pages/SubjectsPage'))
const RecordsPage = lazy(() => import('@/pages/RecordsPage'))
const EmailHistoryPage = lazy(() => import('@/pages/EmailHistoryPage'))

/**
 * Loading component shown while routes are being lazy loaded
 * Dark mode with creative pulsing dots animation
 */
function PageLoadingFallback() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="text-center space-y-6">
        {/* Animated logo/brand area */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 animate-pulse">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          {/* Glow effect */}
          <div className="absolute inset-0 w-20 h-20 rounded-2xl bg-blue-500/20 blur-xl animate-pulse" />
        </div>

        {/* Animated dots */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-bounce" />
        </div>

        <p className="text-slate-400 font-medium text-sm tracking-wide">Loading...</p>
      </div>
    </div>
  )
}

/**
 * Main application component with lazy-loaded routes
 *
 * NOTE: Attendance functionality has been integrated into the Subjects page.
 * The standalone /attendance route has been removed.
 */
function App() {
  return (
    <>
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          <Route path={ROUTES.HOME} element={<LandingPage />} />
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.SIGNUP} element={<SignupPage />} />

          {/* Protected Routes - All Roles */}
          {/* Dashboard: All authenticated users can access */}
          <Route
            path={ROUTES.DASHBOARD}
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          {/* Students: All authenticated users can view, but actions are controlled per-component */}
          <Route
            path={ROUTES.STUDENTS}
            element={
              <ProtectedRoute>
                <StudentsPage />
              </ProtectedRoute>
            }
          />
          {/* Subjects: All authenticated users can view, but actions are controlled per-component */}
          <Route
            path={ROUTES.SUBJECTS}
            element={
              <ProtectedRoute>
                <SubjectsPage />
              </ProtectedRoute>
            }
          />
          {/* Records: All authenticated users can view records */}
          <Route
            path={ROUTES.RECORDS}
            element={
              <ProtectedRoute>
                <RecordsPage />
              </ProtectedRoute>
            }
          />
          {/* Email History: Admin and Registrar only */}
          <Route
            path={ROUTES.EMAIL_HISTORY}
            element={
              <ProtectedRoute allowedRoles={['admin', 'superadmin', 'registrar']}>
                <EmailHistoryPage />
              </ProtectedRoute>
            }
          />

          {/* Redirect old attendance route to subjects */}
          <Route path="/attendance" element={<Navigate to={ROUTES.SUBJECTS} replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
      </Suspense>
      <ToastContainer />
    </>
  )
}

export default App
