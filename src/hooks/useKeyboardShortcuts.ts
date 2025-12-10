/**
 * Keyboard Shortcuts Hook
 *
 * Provides comprehensive keyboard shortcuts for attendance management.
 *
 * Navigation:
 * - ↑/↓: Navigate through student list
 * - Enter: Toggle selection on focused student
 * - Space: Mark focused student with last used status
 *
 * Attendance Shortcuts:
 * - P: Mark selected/focused as Present
 * - A: Mark selected/focused as Absent
 * - L: Mark selected/focused as Late
 * - E: Mark selected/focused as Excused
 * - U: Undo last action (within 5 seconds)
 *
 * Selection:
 * - Ctrl/Cmd + A: Select all students
 * - Ctrl/Cmd + D: Deselect all
 *
 * Search & Navigation:
 * - /: Focus search input
 * - Escape: Close modal/clear selection
 * - ?: Show keyboard shortcuts help
 */

import { useEffect, useCallback, useRef } from 'react'

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export interface KeyboardShortcutHandlers {
  onMarkPresent?: () => void
  onMarkAbsent?: () => void
  onMarkLate?: () => void
  onMarkExcused?: () => void
  onFocusSearch?: () => void
  onEscape?: () => void
  onSelectAll?: () => void
  onDeselectAll?: () => void
  onNavigateUp?: () => void
  onNavigateDown?: () => void
  onToggleSelection?: () => void
  onUndo?: () => void
  onShowHelp?: () => void
  onQuickMark?: () => void // Mark with last used status
  enabled?: boolean
}

// Store for undo functionality
interface UndoAction {
  type: 'mark_attendance'
  studentId: string | number
  previousStatus: AttendanceStatus | null
  newStatus: AttendanceStatus
  timestamp: number
}

// Global undo stack (persists across hook re-renders)
const undoStack: UndoAction[] = []
const UNDO_TIMEOUT = 5000 // 5 seconds to undo

export function pushUndoAction(action: Omit<UndoAction, 'timestamp'>) {
  undoStack.push({ ...action, timestamp: Date.now() })
  // Keep only last 10 actions
  if (undoStack.length > 10) {
    undoStack.shift()
  }
}

export function popUndoAction(): UndoAction | null {
  const now = Date.now()
  // Find the most recent action that's still within the undo window
  while (undoStack.length > 0) {
    const action = undoStack.pop()
    if (action && now - action.timestamp < UNDO_TIMEOUT) {
      return action
    }
  }
  return null
}

export function getLastUsedStatus(): AttendanceStatus {
  if (undoStack.length > 0) {
    return undoStack[undoStack.length - 1].newStatus
  }
  return 'present' // Default
}

export function useKeyboardShortcuts({
  onMarkPresent,
  onMarkAbsent,
  onMarkLate,
  onMarkExcused,
  onFocusSearch,
  onEscape,
  onSelectAll,
  onDeselectAll,
  onNavigateUp,
  onNavigateDown,
  onToggleSelection,
  onUndo,
  onShowHelp,
  onQuickMark,
  enabled = true,
}: KeyboardShortcutHandlers) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Don't trigger shortcuts when typing in inputs (except navigation keys)
      const target = event.target as HTMLElement
      const isInputFocused =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable

      // Navigation keys work even in inputs
      if (event.key === 'ArrowUp' && !isInputFocused) {
        event.preventDefault()
        onNavigateUp?.()
        return
      }

      if (event.key === 'ArrowDown' && !isInputFocused) {
        event.preventDefault()
        onNavigateDown?.()
        return
      }

      // Allow Escape even in inputs
      if (event.key === 'Escape') {
        event.preventDefault()
        onEscape?.()
        return
      }

      // Don't trigger letter shortcuts when typing
      if (isInputFocused) return

      // Focus search with /
      if (event.key === '/') {
        event.preventDefault()
        onFocusSearch?.()
        return
      }

      // Show help with ?
      if (event.key === '?' && event.shiftKey) {
        event.preventDefault()
        onShowHelp?.()
        return
      }

      // Select all with Ctrl/Cmd + A
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault()
        onSelectAll?.()
        return
      }

      // Deselect all with Ctrl/Cmd + D
      if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault()
        onDeselectAll?.()
        return
      }

      // Undo with Ctrl/Cmd + Z
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault()
        onUndo?.()
        return
      }

      // Toggle selection with Enter
      if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        onToggleSelection?.()
        return
      }

      // Quick mark with Space (use last status)
      if (event.key === ' ') {
        event.preventDefault()
        onQuickMark?.()
        return
      }

      // Attendance marking shortcuts (single letter, no modifiers)
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        switch (event.key.toLowerCase()) {
          case 'p':
            event.preventDefault()
            onMarkPresent?.()
            break
          case 'a':
            event.preventDefault()
            onMarkAbsent?.()
            break
          case 'l':
            event.preventDefault()
            onMarkLate?.()
            break
          case 'e':
            event.preventDefault()
            onMarkExcused?.()
            break
          case 'u':
            event.preventDefault()
            onUndo?.()
            break
        }
      }
    },
    [
      enabled,
      onMarkPresent,
      onMarkAbsent,
      onMarkLate,
      onMarkExcused,
      onFocusSearch,
      onEscape,
      onSelectAll,
      onDeselectAll,
      onNavigateUp,
      onNavigateDown,
      onToggleSelection,
      onUndo,
      onShowHelp,
      onQuickMark,
    ]
  )

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleKeyDown])
}

/**
 * Keyboard shortcuts help text for display
 */
export const KEYBOARD_SHORTCUTS = [
  { key: 'P', description: 'Mark as Present', category: 'Attendance' },
  { key: 'A', description: 'Mark as Absent', category: 'Attendance' },
  { key: 'L', description: 'Mark as Late', category: 'Attendance' },
  { key: 'E', description: 'Mark as Excused', category: 'Attendance' },
  { key: 'Space', description: 'Quick mark (repeat last)', category: 'Attendance' },
  { key: '↑/↓', description: 'Navigate students', category: 'Navigation' },
  { key: 'Enter', description: 'Toggle selection', category: 'Selection' },
  { key: '/', description: 'Focus search', category: 'Navigation' },
  { key: 'Ctrl+A', description: 'Select all', category: 'Selection' },
  { key: 'Ctrl+D', description: 'Deselect all', category: 'Selection' },
  { key: 'U / Ctrl+Z', description: 'Undo last action', category: 'Actions' },
  { key: 'Esc', description: 'Close / Clear', category: 'Navigation' },
  { key: 'Shift+?', description: 'Show shortcuts', category: 'Help' },
] as const

export type KeyboardShortcut = (typeof KEYBOARD_SHORTCUTS)[number]

export default useKeyboardShortcuts
