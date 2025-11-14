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
    bg: 'bg-blue-500/20',
    icon: 'text-blue-400',
    stat: 'text-blue-300',
    border: 'border-blue-500/30',
  },
  green: {
    bg: 'bg-emerald-500/20',
    icon: 'text-emerald-400',
    stat: 'text-emerald-300',
    border: 'border-emerald-500/30',
  },
  purple: {
    bg: 'bg-purple-500/20',
    icon: 'text-purple-400',
    stat: 'text-purple-300',
    border: 'border-purple-500/30',
  },
  orange: {
    bg: 'bg-orange-500/20',
    icon: 'text-orange-400',
    stat: 'text-orange-300',
    border: 'border-orange-500/30',
  },
  red: {
    bg: 'bg-red-500/20',
    icon: 'text-red-400',
    stat: 'text-red-300',
    border: 'border-red-500/30',
  },
  indigo: {
    bg: 'bg-indigo-500/20',
    icon: 'text-indigo-400',
    stat: 'text-indigo-300',
    border: 'border-indigo-500/30',
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
          className="flex items-center gap-2 text-sm text-slate-400"
        >
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && <span>/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-slate-200 transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span className="font-medium text-slate-200">{crumb.label}</span>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {/* Header with gradient background */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative bg-gradient-to-r ${gradient} rounded-2xl p-8 shadow-enterprise-lg overflow-hidden`}
      >
        {/* Enhanced Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-white/5 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Title with icon */}
              <div className="flex items-center gap-4 mb-2">
                {Icon && (
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
                    <Icon className="w-7 h-7 text-white drop-shadow-sm" />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-sm">
                    {title}
                  </h1>
                  {description && (
                    <p className="text-white/90 text-base mt-1.5 max-w-3xl drop-shadow-sm font-medium">
                      {description}
                    </p>
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
                        h-11 px-5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200
                        ${
                          action.variant === 'secondary'
                            ? 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border-0 hover:scale-105'
                            : action.variant === 'outline'
                              ? 'bg-transparent border-2 border-white/50 hover:border-white hover:bg-white/10 text-white hover:scale-105'
                              : 'bg-white hover:bg-gray-50 text-gray-900 border-0 hover:scale-105'
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {stats.map((stat, index) => {
            const StatIcon = stat.icon
            const colors = colorClasses[stat.color]
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + index * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className={`bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-enterprise border-l-4 ${colors.border} hover:shadow-enterprise-md hover:bg-slate-800/70 transition-all duration-300`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                      {stat.label}
                    </p>
                    <p className={`text-4xl font-bold ${colors.stat} tracking-tight`}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-4 ${colors.bg} rounded-xl shadow-sm border ${colors.border}`}>
                    <StatIcon className={`w-7 h-7 ${colors.icon}`} />
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
