import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToastStore } from '@/store/toastStore'
import { cn } from '@/lib/utils'

const toastVariants = {
  success: 'bg-green-50 border-green-200 text-green-900',
  error: 'bg-red-50 border-red-200 text-red-900',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  info: 'bg-blue-50 border-blue-200 text-blue-900',
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  console.log('🎨 ToastContainer rendering, toasts:', toasts.length, toasts)

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100 }}
            className={cn(
              'p-4 rounded-lg border shadow-lg flex items-start gap-3',
              toastVariants[toast.type]
            )}
          >
            <div className="flex-1">
              {toast.title && <div className="font-semibold mb-1">{toast.title}</div>}
              <div className="text-sm">{toast.message}</div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-current opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
