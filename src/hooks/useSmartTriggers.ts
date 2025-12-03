import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  smartTriggersService,
  AttendanceAlert,
  AlertSummary,
  AlertConfig,
  DEFAULT_ALERT_CONFIG,
} from '@/services/smart-triggers.service'
import { useToast } from '@/store/toastStore'

/**
 * Hook for managing smart attendance triggers and alerts
 *
 * Provides:
 * - Real-time alert monitoring
 * - Alert acknowledgment/dismissal
 * - Configuration management
 * - Alert notifications
 */
export function useSmartTriggers(options?: {
  autoRefresh?: boolean
  refreshInterval?: number
  filter?: {
    type?: AttendanceAlert['type']
    severity?: AttendanceAlert['severity']
    acknowledged?: boolean
  }
}) {
  const {
    autoRefresh = true,
    refreshInterval = 60000, // 1 minute default
    filter,
  } = options || {}

  const queryClient = useQueryClient()
  const { addToast } = useToast()

  // Fetch alerts
  const {
    data: alerts = [],
    isLoading: isLoadingAlerts,
    refetch: refetchAlerts,
  } = useQuery({
    queryKey: ['smart-triggers-alerts', filter],
    queryFn: () => smartTriggersService.getAlerts(filter),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 30000,
  })

  // Fetch summary
  const {
    data: summary,
    isLoading: isLoadingSummary,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['smart-triggers-summary'],
    queryFn: () => smartTriggersService.getAlertSummary(),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 30000,
  })

  // Fetch config
  const { data: config = DEFAULT_ALERT_CONFIG, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['smart-triggers-config'],
    queryFn: () => smartTriggersService.getConfig(),
    staleTime: 300000, // 5 minutes
  })

  // Acknowledge mutation
  const acknowledgeMutation = useMutation({
    mutationFn: smartTriggersService.acknowledgeAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-triggers-alerts'] })
      queryClient.invalidateQueries({ queryKey: ['smart-triggers-summary'] })
      addToast('Alert acknowledged', 'success')
    },
    onError: () => {
      addToast('Failed to acknowledge alert', 'error')
    },
  })

  // Acknowledge multiple mutation
  const acknowledgeMultipleMutation = useMutation({
    mutationFn: smartTriggersService.acknowledgeMultiple,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-triggers-alerts'] })
      queryClient.invalidateQueries({ queryKey: ['smart-triggers-summary'] })
      addToast('Alerts acknowledged', 'success')
    },
    onError: () => {
      addToast('Failed to acknowledge alerts', 'error')
    },
  })

  // Dismiss mutation
  const dismissMutation = useMutation({
    mutationFn: smartTriggersService.dismissAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-triggers-alerts'] })
      queryClient.invalidateQueries({ queryKey: ['smart-triggers-summary'] })
      addToast('Alert dismissed', 'success')
    },
    onError: () => {
      addToast('Failed to dismiss alert', 'error')
    },
  })

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: ({
      alertId,
      recipients,
    }: {
      alertId: string
      recipients: ('guardian' | 'student' | 'admin')[]
    }) => smartTriggersService.sendAlertEmail(alertId, recipients),
    onSuccess: () => {
      addToast('Notification sent', 'success')
    },
    onError: () => {
      addToast('Failed to send notification', 'error')
    },
  })

  // Update config mutation
  const updateConfigMutation = useMutation({
    mutationFn: smartTriggersService.updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-triggers-config'] })
      addToast('Alert settings updated', 'success')
    },
    onError: () => {
      addToast('Failed to update settings', 'error')
    },
  })

  // Run scan mutation
  const runScanMutation = useMutation({
    mutationFn: smartTriggersService.runAlertScan,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['smart-triggers-alerts'] })
      queryClient.invalidateQueries({ queryKey: ['smart-triggers-summary'] })
      addToast(
        `Scan complete: ${result.newAlerts} new alerts from ${result.scannedStudents} students`,
        'success'
      )
    },
    onError: () => {
      addToast('Failed to run scan', 'error')
    },
  })

  // Refresh all data
  const refresh = useCallback(() => {
    refetchAlerts()
    refetchSummary()
  }, [refetchAlerts, refetchSummary])

  // Convenience methods
  const acknowledgeAlert = useCallback(
    (alertId: string) => acknowledgeMutation.mutate(alertId),
    [acknowledgeMutation]
  )

  const acknowledgeAll = useCallback(
    (alertIds: string[]) => acknowledgeMultipleMutation.mutate(alertIds),
    [acknowledgeMultipleMutation]
  )

  const dismissAlert = useCallback(
    (alertId: string) => dismissMutation.mutate(alertId),
    [dismissMutation]
  )

  const sendNotification = useCallback(
    (alertId: string, recipients: ('guardian' | 'student' | 'admin')[] = ['guardian']) =>
      sendNotificationMutation.mutate({ alertId, recipients }),
    [sendNotificationMutation]
  )

  const updateConfig = useCallback(
    (newConfig: Partial<AlertConfig>) => updateConfigMutation.mutate(newConfig),
    [updateConfigMutation]
  )

  const runScan = useCallback(() => runScanMutation.mutate(), [runScanMutation])

  // Computed values
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged)
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical')
  const hasUnacknowledged = unacknowledgedAlerts.length > 0
  const hasCritical = criticalAlerts.length > 0

  return {
    // Data
    alerts,
    summary,
    config,

    // Loading states
    isLoading: isLoadingAlerts || isLoadingSummary,
    isLoadingConfig,
    isAcknowledging: acknowledgeMutation.isPending,
    isDismissing: dismissMutation.isPending,
    isSendingNotification: sendNotificationMutation.isPending,
    isUpdatingConfig: updateConfigMutation.isPending,
    isScanning: runScanMutation.isPending,

    // Actions
    refresh,
    acknowledgeAlert,
    acknowledgeAll,
    dismissAlert,
    sendNotification,
    updateConfig,
    runScan,

    // Computed
    unacknowledgedAlerts,
    criticalAlerts,
    hasUnacknowledged,
    hasCritical,
    unacknowledgedCount: unacknowledgedAlerts.length,
    criticalCount: criticalAlerts.length,
  }
}

/**
 * Hook for checking individual student alerts
 */
export function useStudentAlerts(studentId: string | undefined) {
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['student-alerts', studentId],
    queryFn: () =>
      studentId ? smartTriggersService.getAlerts({ studentId }) : Promise.resolve([]),
    enabled: !!studentId,
    staleTime: 60000,
  })

  const hasActiveAlerts = alerts.some((a) => !a.acknowledged)
  const criticalAlert = alerts.find((a) => a.severity === 'critical' && !a.acknowledged)
  const consecutiveAbsenceAlert = alerts.find(
    (a) => a.type === 'consecutive_absence' && !a.acknowledged
  )
  const lowAttendanceAlert = alerts.find((a) => a.type === 'low_attendance' && !a.acknowledged)

  return {
    alerts,
    isLoading,
    hasActiveAlerts,
    criticalAlert,
    consecutiveAbsenceAlert,
    lowAttendanceAlert,
  }
}

/**
 * Hook for alert notification preferences
 */
export function useAlertNotifications() {
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    // Check if browser notifications are supported and enabled
    if ('Notification' in window) {
      setIsEnabled(Notification.permission === 'granted')
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setIsEnabled(permission === 'granted')
      return permission === 'granted'
    }
    return false
  }, [])

  const showNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (isEnabled && 'Notification' in window) {
        return new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        })
      }
      return null
    },
    [isEnabled]
  )

  return {
    isSupported: 'Notification' in window,
    isEnabled,
    requestPermission,
    showNotification,
  }
}

export default useSmartTriggers
