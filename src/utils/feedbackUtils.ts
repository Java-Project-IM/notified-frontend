/**
 * Feedback Utilities
 *
 * Provides audio and haptic feedback for user actions.
 * Used primarily for attendance marking confirmations.
 */

// Simple audio feedback using Web Audio API (no external files needed)
const audioContext =
  typeof window !== 'undefined'
    ? new (window.AudioContext || (window as any).webkitAudioContext)()
    : null

/**
 * Play a success beep sound
 * Short, pleasant tone for successful actions
 */
export function playSuccessSound() {
  if (!audioContext) return

  try {
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 880 // A5 note
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.1)
  } catch (e) {
    // Silently fail if audio not available
  }
}

/**
 * Play an error beep sound
 * Lower, shorter tone for errors
 */
export function playErrorSound() {
  if (!audioContext) return

  try {
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 220 // A3 note
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.15)
  } catch (e) {
    // Silently fail if audio not available
  }
}

/**
 * Play a subtle click sound
 * Very short tick for selection changes
 */
export function playClickSound() {
  if (!audioContext) return

  try {
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 1200
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.03)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.03)
  } catch (e) {
    // Silently fail if audio not available
  }
}

/**
 * Trigger haptic feedback if available
 * Uses Vibration API on mobile devices
 */
export function triggerHaptic(pattern: 'light' | 'medium' | 'heavy' = 'light') {
  if (!navigator.vibrate) return

  try {
    switch (pattern) {
      case 'light':
        navigator.vibrate(10)
        break
      case 'medium':
        navigator.vibrate(25)
        break
      case 'heavy':
        navigator.vibrate([50, 30, 50])
        break
    }
  } catch (e) {
    // Silently fail if vibration not available
  }
}

/**
 * Combined feedback for attendance marking
 */
export function attendanceMarkedFeedback(status: 'present' | 'absent' | 'late' | 'excused') {
  playSuccessSound()
  triggerHaptic('light')
}

/**
 * Combined feedback for errors
 */
export function errorFeedback() {
  playErrorSound()
  triggerHaptic('medium')
}

/**
 * Combined feedback for selection changes
 */
export function selectionFeedback() {
  playClickSound()
  triggerHaptic('light')
}
