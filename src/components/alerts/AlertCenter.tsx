import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  Check,
  Mail,
  ChevronRight,
  Bell,
  RefreshCw,
  UserX,
  TrendingDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  smartTriggersService,
  AttendanceAlert,
  AlertSummary,
} from '@/services/smart-triggers.service'
import { useToast } from '@/store/toastStore'
import { format } from 'date-fns'

interface AlertCenterProps {
  className?: string
  compact?: boolean
  maxItems?: number
  onAlertClick?: (alert: AttendanceAlert) => void
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    badgeColor: 'bg-red-100 text-red-700',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  info: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
}

const typeConfig = {
  consecutive_absence: {
    icon: UserX,
    label: 'Consecutive Absence',
    description: 'Student has been absent for multiple days in a row',
  },
  low_attendance: {
    icon: TrendingDown,
    label: 'Low Attendance',
    description: 'Student attendance rate below threshold',
  },
  pattern_warning: {
    icon: AlertTriangle,
    label: 'Pattern Warning',
    description: 'Irregular attendance pattern detected',
  },
}

export function AlertCenter({
  className,
  compact = false,
  maxItems = 10,
  onAlertClick,
}: AlertCenterProps) {
  const [alerts, setAlerts] = useState<AttendanceAlert[]>([])
  const [summary, setSummary] = useState<AlertSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unacknowledged' | 'critical'>('unacknowledged')
  const { addToast } = useToast()

  const fetchAlerts = useCallback(async () => {
    try {
      const [alertsData, summaryData] = await Promise.all([
        smartTriggersService.getAlerts({
          acknowledged: filter === 'unacknowledged' ? false : undefined,
          severity: filter === 'critical' ? 'critical' : undefined,
        }),
        smartTriggersService.getAlertSummary(),
      ])

      setAlerts(alertsData.slice(0, maxItems))
      setSummary(summaryData)
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [filter, maxItems])

  useEffect(() => {
    fetchAlerts()
    // Refresh every 2 minutes
    const interval = setInterval(fetchAlerts, 120000)
    return () => clearInterval(interval)
  }, [fetchAlerts])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchAlerts()
  }

  const handleAcknowledge = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await smartTriggersService.acknowledgeAlert(alertId)
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)))
      addToast('Alert acknowledged', 'success')
    } catch (error) {
      addToast('Failed to acknowledge alert', 'error')
    }
  }

  const handleDismiss = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await smartTriggersService.dismissAlert(alertId)
      setAlerts((prev) => prev.filter((a) => a.id !== alertId))
      addToast('Alert dismissed', 'success')
    } catch (error) {
      addToast('Failed to dismiss alert', 'error')
    }
  }

  const handleSendNotification = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await smartTriggersService.sendAlertEmail(alertId, ['guardian'])
      addToast('Notification sent to guardian', 'success')
    } catch (error) {
      addToast('Failed to send notification', 'error')
    }
  }

  if (compact) {
    return (
      <div className={cn('relative', className)}>
        {/* Compact Bell Icon with Badge */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          {summary && summary.unacknowledged > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
            >
              {summary.unacknowledged > 9 ? '9+' : summary.unacknowledged}
            </motion.span>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className={cn('bg-white rounded-xl shadow-sm border border-gray-200', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-700" />
            <h3 className="font-semibold text-gray-900">Alert Center</h3>
            {summary && summary.unacknowledged > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                {summary.unacknowledged} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'unacknowledged', label: 'New', count: summary?.unacknowledged },
            { key: 'critical', label: 'Critical', count: summary?.critical },
            { key: 'all', label: 'All', count: summary?.total },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as typeof filter)}
              className={cn(
                'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                filter === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {label}
              {count !== undefined && count > 0 && (
                <span className="ml-1.5 text-xs text-gray-500">({count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-3 gap-2 p-4 bg-gray-50 border-b border-gray-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {summary.byType.consecutive_absence}
            </div>
            <div className="text-xs text-gray-500">Absences</div>
          </div>
          <div className="text-center border-x border-gray-200">
            <div className="text-2xl font-bold text-amber-600">{summary.byType.low_attendance}</div>
            <div className="text-xs text-gray-500">Low Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.byType.pattern_warning}</div>
            <div className="text-xs text-gray-500">Patterns</div>
          </div>
        </div>
      )}

      {/* Alert List */}
      <div className="max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-sm">Loading alerts...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-gray-600 font-medium">All clear!</p>
            <p className="text-sm text-gray-500 mt-1">No alerts to display</p>
          </div>
        ) : (
          <AnimatePresence>
            {alerts.map((alert, index) => {
              const severity = severityConfig[alert.severity]
              const type = typeConfig[alert.type]
              const SeverityIcon = severity.icon
              const TypeIcon = type.icon

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onAlertClick?.(alert)}
                  className={cn(
                    'p-4 border-b border-gray-100 cursor-pointer transition-colors',
                    'hover:bg-gray-50',
                    !alert.acknowledged && severity.bgColor
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                        severity.bgColor,
                        severity.borderColor,
                        'border'
                      )}
                    >
                      <SeverityIcon className={cn('w-5 h-5', severity.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded-full',
                            severity.badgeColor
                          )}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <TypeIcon className="w-3 h-3" />
                          {type.label}
                        </span>
                      </div>

                      <p className="font-medium text-gray-900 text-sm">
                        {alert.studentName}
                        <span className="text-gray-500 font-normal ml-1">
                          ({alert.studentNumber})
                        </span>
                      </p>

                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{alert.message}</p>

                      {/* Details */}
                      {alert.details && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {alert.details.consecutiveDays && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {alert.details.consecutiveDays} days
                            </span>
                          )}
                          {alert.details.attendanceRate !== undefined && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {alert.details.attendanceRate}% rate
                            </span>
                          )}
                          {alert.subjectName && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {alert.subjectName}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Timestamp */}
                      <p className="text-xs text-gray-400 mt-2">
                        {format(new Date(alert.createdAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1">
                      {!alert.acknowledged && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleAcknowledge(alert.id, e)}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Acknowledge"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleSendNotification(alert.id, e)}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Send notification"
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDismiss(alert.id, e)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        title="Dismiss"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      {alerts.length > 0 && (
        <div className="p-3 border-t border-gray-100 bg-gray-50">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-sm text-gray-600 hover:text-gray-900"
          >
            View all alerts
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * Inline alert badge for use in tables/lists
 */
export function AlertBadge({
  type,
  severity,
  count,
}: {
  type?: AttendanceAlert['type']
  severity: AttendanceAlert['severity']
  count?: number
}) {
  const config = severityConfig[severity]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        config.badgeColor
      )}
    >
      <Icon className="w-3 h-3" />
      {type ? typeConfig[type].label : severity}
      {count !== undefined && count > 1 && <span className="ml-1 font-bold">×{count}</span>}
    </span>
  )
}

/**
 * Alert indicator dot for compact displays
 */
export function AlertDot({
  severity,
  pulse = true,
}: {
  severity: AttendanceAlert['severity']
  pulse?: boolean
}) {
  const colors = {
    critical: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
  }

  return (
    <span className="relative flex h-3 w-3">
      {pulse && (
        <span
          className={cn(
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
            colors[severity]
          )}
        />
      )}
      <span className={cn('relative inline-flex rounded-full h-3 w-3', colors[severity])} />
    </span>
  )
}

export default AlertCenter
