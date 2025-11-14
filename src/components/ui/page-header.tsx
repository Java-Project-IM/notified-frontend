import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { Button } from './button'

interface PageHeaderAction {
  label: string
  onClick: () => void
  icon?: LucideIcon
  variant?: 'primary' | 'secondary' | 'outline'
  disabled?: boolean
}

interface PageHeaderStat {
  label: string
  value: string | number
  icon: LucideIcon
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo'
}

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  gradient?: string
  actions?: PageHeaderAction[]
  stats?: PageHeaderStat[]
  breadcrumbs?: Array<{ label: string; href?: string }>
  children?: ReactNode
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    stat: 'text-blue-700',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    stat: 'text-green-700',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    stat: 'text-purple-700',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'text-orange-600',
    stat: 'text-orange-700',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    stat: 'text-red-700',
  },
  indigo: {
    bg: 'bg-indigo-50',
    icon: 'text-indigo-600',
    stat: 'text-indigo-700',
  },
}

/**
 * Enterprise-grade page header component with consistent design
 * Supports gradients, stats, actions, breadcrumbs, and custom content
 */
export function PageHeader({
  title,
  description,
  icon: Icon,
  gradient = 'from-slate-600 via-indigo-600 to-violet-600',
  actions = [],
  stats = [],
  breadcrumbs = [],
  children,
}: PageHeaderProps) {
  return (
    <div className="space-y-6 mb-8">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-sm text-gray-600"
        >
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && <span>/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-gray-900 transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span className="font-medium text-gray-900">{crumb.label}</span>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {/* Header with gradient background */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-r ${gradient} rounded-2xl p-8 shadow-lg relative overflow-hidden`}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Title with icon */}
              <div className="flex items-center gap-4 mb-2">
                {Icon && (
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">{title}</h1>
                  {description && (
                    <p className="text-white/90 text-base mt-1 max-w-3xl">{description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            {actions.length > 0 && (
              <div className="flex items-center gap-3 ml-6">
                {actions.map((action, index) => {
                  const ActionIcon = action.icon
                  return (
                    <Button
                      key={index}
                      onClick={action.onClick}
                      disabled={action.disabled}
                      className={`
                        h-11 px-5 rounded-xl font-semibold shadow-md transition-all duration-200
                        ${
                          action.variant === 'secondary'
                            ? 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border-0'
                            : action.variant === 'outline'
                              ? 'bg-transparent border-2 border-white/50 hover:border-white hover:bg-white/10 text-white'
                              : 'bg-white hover:bg-gray-50 text-gray-900 border-0'
                        }
                      `}
                    >
                      {ActionIcon && <ActionIcon className="w-4 h-4 mr-2" />}
                      {action.label}
                    </Button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Custom content */}
          {children && <div className="mt-6">{children}</div>}
        </div>
      </motion.div>

      {/* Stats Grid */}
      {stats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {stats.map((stat, index) => {
            const StatIcon = stat.icon
            const colors = colorClasses[stat.color]
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                    <p className={`text-3xl font-bold ${colors.stat}`}>{stat.value}</p>
                  </div>
                  <div className={`p-4 ${colors.bg} rounded-xl`}>
                    <StatIcon className={`w-6 h-6 ${colors.icon}`} />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
