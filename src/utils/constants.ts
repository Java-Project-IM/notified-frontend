// Use environment variable when provided, otherwise default to local backend
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Notified'
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  STUDENTS: '/students',
  SUBJECTS: '/subjects',
  RECORDS: '/records',
  EMAIL_HISTORY: '/email-history',
  ATTENDANCE: '/attendance',
} as const

export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  REGISTRAR: 'registrar',
  PROFESSOR: 'professor',
  STAFF: 'staff',
} as const

export const RECORD_TYPES = {
  ATTENDANCE: 'Attendance',
  ENROLLMENT: 'Enrollment',
  WITHDRAWAL: 'Withdrawal',
  GRADE_UPDATE: 'Grade Update',
} as const

export const TOAST_MESSAGES = {
  LOGIN_SUCCESS: 'Welcome back!',
  LOGOUT_SUCCESS: 'Logged out successfully',
  SIGNUP_SUCCESS: 'Account created successfully',
  STUDENT_ADDED: 'Student added successfully',
  STUDENT_UPDATED: 'Student updated successfully',
  STUDENT_DELETED: 'Student deleted successfully',
  SUBJECT_ADDED: 'Subject added successfully',
  SUBJECT_UPDATED: 'Subject updated successfully',
  SUBJECT_DELETED: 'Subject deleted successfully',
  EMAIL_SENT: 'Email sent successfully',
  ERROR: 'An error occurred. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  VALIDATION_ERROR: 'Please check your input and try again.',
} as const
