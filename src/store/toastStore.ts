import { create } from 'zustand'
import { useMemo } from 'react'

interface ToastMessage {
  id: string
  title?: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

interface ToastState {
  toasts: ToastMessage[]
  addToast: (toast: Omit<ToastMessage, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(7)
    console.log('🍞 Adding toast:', { id, ...toast })
    set((state) => {
      const newToasts = [...state.toasts, { ...toast, id }]
      console.log('📊 Current toasts:', newToasts.length)
      return { toasts: newToasts }
    })
    // Auto-remove after 5 seconds
    setTimeout(() => {
      console.log('🗑️ Removing toast:', id)
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, 5000)
  },
  removeToast: (id) => {
    console.log('❌ Manually removing toast:', id)
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
  clearToasts: () => {
    console.log('🧹 Clearing all toasts')
    set({ toasts: [] })
  },
}))

// Helper hook for toast notifications
export const useToast = () => {
  // Select the base addToast directly from the store so it's stable across renders
  const addToast = useToastStore((s) => s.addToast)

  // Memoize wrapper functions so they keep the same identity between renders
  return useMemo(
    () => ({
      addToast: (message: string, type: 'success' | 'error' | 'warning' | 'info', title?: string) =>
        addToast({ message, title, type }),
      success: (message: string, title?: string) => addToast({ message, title, type: 'success' }),
      error: (message: string, title?: string) => addToast({ message, title, type: 'error' }),
      warning: (message: string, title?: string) => addToast({ message, title, type: 'warning' }),
      info: (message: string, title?: string) => addToast({ message, title, type: 'info' }),
    }),
    [addToast]
  )
}
