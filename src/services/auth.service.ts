import apiClient from './api'
import { LoginCredentials, SignupData, AuthResponse, User } from '@/types'
import { fetchWithRetry, logError, withTimeout } from '@/utils/errorHandling'
import { validateEmail, validatePassword, sanitizeString, validateName } from '@/utils/validation'
import {
  validators,
  sanitizers,
  VALIDATION_RULES,
  validateLoginForm,
  validateSignupForm,
} from '@/utils/validation-rules'

/**
 * Authentication service for user login, registration, and profile management
 */
export const authService = {
  /**
   * Authenticate user with email and password
   * @param credentials - User email and password
   * @returns Authentication response with user data and token
   * @throws {Error} When validation fails or API request fails
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // login attempt for credentials.email

    // Comprehensive form validation
    const formValidation = validateLoginForm({
      email: credentials.email,
      password: credentials.password,
    })
    if (!formValidation.isValid) {
      throw new Error(
        Object.values(formValidation.errors).filter(Boolean)[0] || 'Invalid login credentials'
      )
    }

    // Sanitize email
    const sanitizedCredentials: LoginCredentials = {
      email: sanitizers.email(credentials.email),
      password: credentials.password, // Never modify password
    }

    try {
      const response = await withTimeout(
        fetchWithRetry(() => apiClient.post<AuthResponse>('/auth/login', sanitizedCredentials)),
        15000, // 15 second timeout
        'Login request timeout - Please try again'
      )

      // login successful

      return response.data
    } catch (error) {
      logError('AuthService', 'login', error)
      throw error
    }
  },

  /**
   * Register a new user account
   * @param data - User registration data
   * @returns Authentication response with user data and token
   * @throws {Error} When validation fails or API request fails
   */
  async signup(data: SignupData): Promise<AuthResponse> {
    // signup attempt

    // Comprehensive form validation
    const formValidation = validateSignupForm({
      name: data.name,
      email: data.email,
      password: data.password,
      confirmPassword: data.password, // Assuming confirmPassword matches
    })
    if (!formValidation.isValid) {
      throw new Error(
        Object.values(formValidation.errors).filter(Boolean)[0] || 'Invalid signup data'
      )
    }

    // Additional password strength check
    const strengthCheck = validators.passwordStrength(data.password)
    if (!strengthCheck.isValid) {
      throw new Error(strengthCheck.error)
    }

    // Sanitize all inputs
    const sanitizedData: SignupData = {
      name: sanitizers.name(data.name),
      email: sanitizers.email(data.email),
      password: data.password, // Never modify password
    }

    try {
      const response = await withTimeout(
        fetchWithRetry(() => apiClient.post<AuthResponse>('/auth/register', sanitizedData)),
        15000,
        'Signup request timeout - Please try again'
      )

      // signup successful
      return response.data
    } catch (error) {
      logError('AuthService', 'signup', error)
      throw error
    }
  },

  /**
   * Logout current user
   * @throws {Error} When API request fails
   */
  async logout(): Promise<void> {
    try {
      await withTimeout(apiClient.post('/auth/logout'), 10000, 'Logout request timeout')
    } catch (error) {
      logError('AuthService', 'logout', error)
      throw error
    }
  },

  /**
   * Get current authenticated user data
   * @returns Current user data
   * @throws {Error} When API request fails
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await withTimeout(
        fetchWithRetry(() => apiClient.get<User>('/auth/me')),
        10000,
        'Get user request timeout'
      )
      return response.data
    } catch (error) {
      logError('AuthService', 'getCurrentUser', error)
      throw error
    }
  },

  /**
   * Refresh authentication token
   * @returns New authentication token
   * @throws {Error} When API request fails
   */
  async refreshToken(): Promise<{ token: string }> {
    try {
      const response = await withTimeout(
        fetchWithRetry(() => apiClient.post<{ token: string }>('/auth/refresh-token')),
        10000,
        'Token refresh timeout'
      )
      return response.data
    } catch (error) {
      logError('AuthService', 'refreshToken', error)
      throw error
    }
  },

  /**
   * Update user password
   * @param data - Current and new password
   * @throws {Error} When validation fails or API request fails
   */
  async updatePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    // updating password

    // Validate current password is provided
    if (!data.currentPassword || data.currentPassword.length === 0) {
      throw new Error('Current password is required')
    }

    // Comprehensive new password validation
    const passwordValidation = validators.password(data.newPassword)
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.error)
    }

    // Password strength check
    const strengthCheck = validators.passwordStrength(data.newPassword)
    if (!strengthCheck.isValid) {
      throw new Error(strengthCheck.error)
    }

    // Ensure new password is different from current
    if (data.currentPassword === data.newPassword) {
      throw new Error('New password must be different from current password')
    }

    try {
      await withTimeout(
        apiClient.put('/auth/update-password', data),
        10000,
        'Update password timeout'
      )
      // password updated successfully
    } catch (error) {
      logError('AuthService', 'updatePassword', error)
      throw error
    }
  },

  /**
   * Update user profile information
   * @param data - Partial user data to update
   * @returns Updated user data
   * @throws {Error} When API request fails
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    // updating profile

    // Validate name if provided
    if (data.name !== undefined) {
      const nameValidation = validateName(data.name)
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.error)
      }
    }

    // Validate email if provided
    if (data.email !== undefined) {
      const emailValidation = validators.email(data.email)
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.error)
      }
    }

    // Sanitize all provided fields
    const sanitizedData: Partial<User> = {}
    if (data.name !== undefined) {
      sanitizedData.name = sanitizers.name(data.name)
    }
    if (data.email !== undefined) {
      sanitizedData.email = sanitizers.email(data.email)
    }
    // Copy other fields as-is
    Object.keys(data).forEach((key) => {
      if (key !== 'name' && key !== 'email') {
        ;(sanitizedData as Record<string, unknown>)[key] = (data as Record<string, unknown>)[key]
      }
    })

    try {
      const response = await withTimeout(
        apiClient.put<User>('/auth/update-profile', sanitizedData),
        10000,
        'Update profile timeout'
      )
      // profile updated successfully
      return response.data
    } catch (error) {
      logError('AuthService', 'updateProfile', error)
      throw error
    }
  },
}
