/**
 * Keyboard Shortcuts Hook
 *
 * Provides keyboard shortcuts for common actions throughout the application.
 *
 * Shortcuts:
 * - P: Mark selected as Present
 * - A: Mark selected as Absent
 * - L: Mark selected as Late
 * - E: Mark selected as Excused
 * - /: Focus search
 * - Escape: Close modal/clear selection
 */

import { useEffect, useCallback } from 'react'

export interface KeyboardShortcutHandlers {
  onMarkPresent?: () => void
  onMarkAbsent?: () => void
  onMarkLate?: () => void
  onMarkExcused?: () => void
  onFocusSearch?: () => void
  onEscape?: () => void
  onSelectAll?: () => void
  enabled?: boolean
}

export function useKeyboardShortcuts({
  onMarkPresent,
  onMarkAbsent,
  onMarkLate,
  onMarkExcused,
  onFocusSearch,
  onEscape,
  onSelectAll,
  enabled = true,
}: KeyboardShortcutHandlers) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement
      const isInputFocused =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable

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

      // Select all with Ctrl/Cmd + A
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault()
        onSelectAll?.()
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
  { key: 'P', description: 'Mark selected as Present' },
  { key: 'A', description: 'Mark selected as Absent' },
  { key: 'L', description: 'Mark selected as Late' },
  { key: 'E', description: 'Mark selected as Excused' },
  { key: '/', description: 'Focus search' },
  { key: 'Esc', description: 'Close modal / Clear selection' },
  { key: 'Ctrl+A', description: 'Select all' },
] as const

export default useKeyboardShortcuts
