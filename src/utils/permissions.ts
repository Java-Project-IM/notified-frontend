/**
 * Role-Based Access Control (RBAC) Permissions
 *
 * Defines permissions for each role in the student management system:
 * - Professor: Can view assigned subjects, mark attendance, view student records
 * - Registrar: Full student/enrollment management, can manage subjects
 * - Admin: Full system access including user management
 */

import { UserRole } from '@/types'

// Permission categories
export const PERMISSIONS = {
  // Student permissions
  VIEW_STUDENTS: 'view_students',
  CREATE_STUDENT: 'create_student',
  EDIT_STUDENT: 'edit_student',
  DELETE_STUDENT: 'delete_student',

  // Subject permissions
  VIEW_SUBJECTS: 'view_subjects',
  CREATE_SUBJECT: 'create_subject',
  EDIT_SUBJECT: 'edit_subject',
  DELETE_SUBJECT: 'delete_subject',

  // Enrollment permissions
  VIEW_ENROLLMENTS: 'view_enrollments',
  MANAGE_ENROLLMENTS: 'manage_enrollments',

  // Attendance permissions
  VIEW_ATTENDANCE: 'view_attendance',
  MARK_ATTENDANCE: 'mark_attendance',

  // Records permissions
  VIEW_RECORDS: 'view_records',
  EXPORT_RECORDS: 'export_records',

  // Email permissions
  SEND_EMAILS: 'send_emails',
  VIEW_EMAIL_HISTORY: 'view_email_history',

  // User management (admin only)
  MANAGE_USERS: 'manage_users',
} as const

type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

// Role permission mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  professor: [
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.VIEW_SUBJECTS,
    PERMISSIONS.VIEW_ENROLLMENTS,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.MARK_ATTENDANCE,
    PERMISSIONS.VIEW_RECORDS,
    PERMISSIONS.SEND_EMAILS,
    PERMISSIONS.VIEW_EMAIL_HISTORY,
  ],
  registrar: [
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.CREATE_STUDENT,
    PERMISSIONS.EDIT_STUDENT,
    PERMISSIONS.DELETE_STUDENT,
    PERMISSIONS.VIEW_SUBJECTS,
    PERMISSIONS.CREATE_SUBJECT,
    PERMISSIONS.EDIT_SUBJECT,
    PERMISSIONS.DELETE_SUBJECT,
    PERMISSIONS.VIEW_ENROLLMENTS,
    PERMISSIONS.MANAGE_ENROLLMENTS,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.VIEW_RECORDS,
    PERMISSIONS.EXPORT_RECORDS,
    PERMISSIONS.SEND_EMAILS,
    PERMISSIONS.VIEW_EMAIL_HISTORY,
  ],
  admin: [
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.CREATE_STUDENT,
    PERMISSIONS.EDIT_STUDENT,
    PERMISSIONS.DELETE_STUDENT,
    PERMISSIONS.VIEW_SUBJECTS,
    PERMISSIONS.CREATE_SUBJECT,
    PERMISSIONS.EDIT_SUBJECT,
    PERMISSIONS.DELETE_SUBJECT,
    PERMISSIONS.VIEW_ENROLLMENTS,
    PERMISSIONS.MANAGE_ENROLLMENTS,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.MARK_ATTENDANCE,
    PERMISSIONS.VIEW_RECORDS,
    PERMISSIONS.EXPORT_RECORDS,
    PERMISSIONS.SEND_EMAILS,
    PERMISSIONS.VIEW_EMAIL_HISTORY,
    PERMISSIONS.MANAGE_USERS,
  ],
  // Keep superadmin as alias for admin (full access)
  superadmin: [
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.CREATE_STUDENT,
    PERMISSIONS.EDIT_STUDENT,
    PERMISSIONS.DELETE_STUDENT,
    PERMISSIONS.VIEW_SUBJECTS,
    PERMISSIONS.CREATE_SUBJECT,
    PERMISSIONS.EDIT_SUBJECT,
    PERMISSIONS.DELETE_SUBJECT,
    PERMISSIONS.VIEW_ENROLLMENTS,
    PERMISSIONS.MANAGE_ENROLLMENTS,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.MARK_ATTENDANCE,
    PERMISSIONS.VIEW_RECORDS,
    PERMISSIONS.EXPORT_RECORDS,
    PERMISSIONS.SEND_EMAILS,
    PERMISSIONS.VIEW_EMAIL_HISTORY,
    PERMISSIONS.MANAGE_USERS,
  ],
  // Staff role kept for backwards compatibility but with limited permissions
  staff: [
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.VIEW_SUBJECTS,
    PERMISSIONS.VIEW_ENROLLMENTS,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.VIEW_RECORDS,
  ],
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole | undefined, permissions: Permission[]): boolean {
  if (!role) return false
  return permissions.some((p) => hasPermission(role, p))
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole | undefined, permissions: Permission[]): boolean {
  if (!role) return false
  return permissions.every((p) => hasPermission(role, p))
}

// Convenience functions for common permission checks
export const canManageStudents = (role?: UserRole) =>
  hasAnyPermission(role, [
    PERMISSIONS.CREATE_STUDENT,
    PERMISSIONS.EDIT_STUDENT,
    PERMISSIONS.DELETE_STUDENT,
  ])

export const canViewStudents = (role?: UserRole) => hasPermission(role, PERMISSIONS.VIEW_STUDENTS)

export const canManageSubjects = (role?: UserRole) =>
  hasAnyPermission(role, [
    PERMISSIONS.CREATE_SUBJECT,
    PERMISSIONS.EDIT_SUBJECT,
    PERMISSIONS.DELETE_SUBJECT,
  ])

export const canViewSubjects = (role?: UserRole) => hasPermission(role, PERMISSIONS.VIEW_SUBJECTS)

export const canManageEnrollments = (role?: UserRole) =>
  hasPermission(role, PERMISSIONS.MANAGE_ENROLLMENTS)

export const canMarkAttendance = (role?: UserRole) =>
  hasPermission(role, PERMISSIONS.MARK_ATTENDANCE)

export const canViewAttendance = (role?: UserRole) =>
  hasPermission(role, PERMISSIONS.VIEW_ATTENDANCE)

export const canViewRecords = (role?: UserRole) => hasPermission(role, PERMISSIONS.VIEW_RECORDS)

export const canExportRecords = (role?: UserRole) => hasPermission(role, PERMISSIONS.EXPORT_RECORDS)

export const canSendEmails = (role?: UserRole) => hasPermission(role, PERMISSIONS.SEND_EMAILS)

export const canManageUsers = (role?: UserRole) => hasPermission(role, PERMISSIONS.MANAGE_USERS)

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    professor: 'Professor',
    registrar: 'Registrar',
    admin: 'Administrator',
    superadmin: 'Super Administrator',
    staff: 'Staff',
  }
  return names[role] || role
}

/**
 * Get roles that have access to a specific route/feature
 */
export function getRolesWithPermission(permission: Permission): UserRole[] {
  return (Object.entries(ROLE_PERMISSIONS) as [UserRole, Permission[]][])
    .filter(([, perms]) => perms.includes(permission))
    .map(([role]) => role)
}
