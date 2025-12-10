import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Send,
  Mail,
  AlertCircle,
  Loader2,
  Paperclip,
  ShieldAlert,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/store/toastStore'
import { useAuthStore } from '@/store/authStore'
import { ROLES } from '@/utils/constants'
import { generateEmailTemplate } from '@/utils/email-templates'

interface EmailModalProps {
  isOpen: boolean
  onClose: () => void
  recipients: string | string[]
  onSend: (data: EmailData) => Promise<boolean>
}

export interface EmailData {
  to: string
  subject: string
  message: string
  attachments?: File[]
}

// Backend validation constants (synced with backend)
const VALIDATION = {
  SUBJECT_MIN: 3,
  SUBJECT_MAX: 200,
  MESSAGE_MIN: 10,
  MESSAGE_MAX: 5000,
  MAX_RECIPIENTS: 100,
} as const

export default function EmailModal({ isOpen, onClose, recipients, onSend }: EmailModalProps) {
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const { addToast } = useToast()

  // Get user from auth store for permission checks
  const user = useAuthStore((state) => state.user)
  // Allow Superadmin, Admin, Registrar to send bulk emails
  const isBulkAllowed =
    !!user &&
    [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.REGISTRAR, ROLES.STAFF].includes(user.role as any)

  const recipientCount = Array.isArray(recipients)
    ? recipients.length
    : recipients.split(',').filter(Boolean).length

  const isMultipleRecipients = recipientCount > 1
  const hasPermissionIssue = isMultipleRecipients && !isBulkAllowed

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      const recipientString = Array.isArray(recipients) ? recipients.join(', ') : recipients
      setTo(recipientString)
      setSubject('')
      setMessage('')
      setAttachments([])
      setError('')
      setShowPreview(false)
    }
  }, [isOpen, recipients])

  // Generate email preview HTML
  const emailPreviewHtml = useMemo(() => {
    if (!subject && !message) return ''
    return generateEmailTemplate({
      recipientName: to.split(',')[0]?.trim() || 'Recipient',
      subject: subject || 'No Subject',
      message: message || 'No message content',
      senderName: user?.name || 'Administrator',
      senderRole: user?.role,
    })
  }, [subject, message, to, user])

  const validateEmail = (email: string): boolean => {
    const emailPattern =
      /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,7}$/
    return emailPattern.test(email.trim())
  }

  const validateForm = (): boolean => {
    setError('')

    // Check recipient email
    if (!to.trim()) {
      setError('Please enter recipient email address')
      return false
    }

    // Validate all email addresses
    const emails = to
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean)
    for (const email of emails) {
      if (!validateEmail(email)) {
        setError(`Invalid email address: ${email}`)
        return false
      }
    }

    // Backend validation: Max 100 recipients
    if (emails.length > VALIDATION.MAX_RECIPIENTS) {
      setError(`Cannot send to more than ${VALIDATION.MAX_RECIPIENTS} recipients at once`)
      return false
    }

    // Permission check for bulk email (superadmin/admin/staff only)
    if (emails.length > 1 && !isBulkAllowed) {
      setError(
        'Bulk email requires superadmin, admin, or staff role. You can only send to one recipient.'
      )
      return false
    }

    // Backend validation: Subject length (3-200 characters)
    if (!subject.trim()) {
      setError('Please enter email subject')
      return false
    }
    if (subject.trim().length < VALIDATION.SUBJECT_MIN) {
      setError(`Subject must be at least ${VALIDATION.SUBJECT_MIN} characters`)
      return false
    }
    if (subject.trim().length > VALIDATION.SUBJECT_MAX) {
      setError(`Subject must not exceed ${VALIDATION.SUBJECT_MAX} characters`)
      return false
    }

    // Backend validation: Message length (10-5000 characters)
    if (!message.trim()) {
      setError('Please enter email message')
      return false
    }
    if (message.trim().length < VALIDATION.MESSAGE_MIN) {
      setError(`Message must be at least ${VALIDATION.MESSAGE_MIN} characters`)
      return false
    }
    if (message.trim().length > VALIDATION.MESSAGE_MAX) {
      setError(`Message must not exceed ${VALIDATION.MESSAGE_MAX} characters`)
      return false
    }

    return true
  }

  const handleSend = async () => {
    if (!validateForm()) return

    setIsSending(true)
    setError('')

    try {
      const success = await onSend({
        to,
        subject,
        message,
        attachments: attachments.length > 0 ? attachments : undefined,
      })

      if (success) {
        addToast(
          `Email sent successfully to ${recipientCount} recipient${recipientCount > 1 ? 's' : ''}`,
          'success'
        )
        onClose()
      } else {
        setError('Failed to send email. Please try again.')
      }
    } catch (err) {
      console.error('Email send error:', err)
      setError('Failed to send email. Check console for details.')
    } finally {
      setIsSending(false)
    }
  }

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setAttachments((prev) => [...prev, ...newFiles])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
          onClick={onClose}
          onKeyDown={handleKeyDown}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-enterprise-2xl border border-slate-700/50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Gradient */}
            <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-6 border-b border-blue-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ rotate: -10, scale: 0.9 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                    className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30"
                  >
                    <Mail className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Send Email</h2>
                    {isMultipleRecipients && (
                      <p className="text-sm text-blue-100 mt-0.5">{recipientCount} recipients</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  disabled={isSending}
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-8 space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto thin-scrollbar">
              {/* Permission Warning for Bulk Email */}
              <AnimatePresence>
                {hasPermissionIssue && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl"
                  >
                    <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-300">Permission Required</p>
                      <p className="text-xs text-amber-400 mt-1">
                        Bulk email requires superadmin, admin, or staff role. You can only send to
                        one recipient at a time.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-300">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* To Field */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-2"
              >
                <Label htmlFor="to" className="text-slate-300 font-medium">
                  To
                </Label>
                <Input
                  id="to"
                  type="text"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="recipient@example.com"
                  className="h-12 rounded-xl border-2 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 border-slate-600 focus:border-blue-500"
                  disabled={isMultipleRecipients || isSending}
                  readOnly={isMultipleRecipients}
                />
                {isMultipleRecipients && (
                  <p className="text-xs text-slate-400">
                    Multiple recipients - email will be sent to all
                  </p>
                )}
              </motion.div>

              {/* Subject Field */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <Label htmlFor="subject" className="text-slate-300 font-medium">
                  Subject
                </Label>
                <Input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                  className="h-12 rounded-xl border-2 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 border-slate-600 focus:border-blue-500"
                  disabled={isSending}
                  maxLength={VALIDATION.SUBJECT_MAX}
                />
                <p className="text-xs text-slate-400">
                  {subject.length}/{VALIDATION.SUBJECT_MAX} characters (min {VALIDATION.SUBJECT_MIN}
                  )
                </p>
              </motion.div>

              {/* Message Field */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Label htmlFor="message" className="text-slate-300 font-medium">
                    Message
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                  >
                    {showPreview ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        Hide Preview
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        Show Preview
                      </>
                    )}
                  </button>
                </div>

                {showPreview && emailPreviewHtml ? (
                  <div className="border border-slate-600 rounded-xl overflow-hidden">
                    <div className="bg-slate-700/50 px-4 py-2 border-b border-slate-600 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/50" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                      <div className="w-3 h-3 rounded-full bg-green-500/50" />
                      <span className="ml-2 text-xs text-slate-400">Email Preview</span>
                    </div>
                    <iframe
                      srcDoc={emailPreviewHtml}
                      className="w-full h-80 bg-white"
                      title="Email Preview"
                      sandbox=""
                    />
                  </div>
                ) : (
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    rows={8}
                    className="w-full px-4 py-3 border-2 border-slate-600 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    disabled={isSending}
                    maxLength={VALIDATION.MESSAGE_MAX}
                  />
                )}
                <p className="text-xs text-slate-400">
                  {message.length}/{VALIDATION.MESSAGE_MAX} characters (min {VALIDATION.MESSAGE_MIN}
                  )
                </p>
              </motion.div>

              {/* Attachments */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <Label htmlFor="attachments" className="text-slate-300 font-medium">
                  Attachments (Optional)
                </Label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 border border-slate-600 bg-slate-900/50 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-colors">
                    <Paperclip className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">Add Files</span>
                    <input
                      id="attachments"
                      type="file"
                      multiple
                      onChange={handleAttachmentChange}
                      className="hidden"
                      disabled={isSending}
                    />
                  </label>
                  {attachments.length > 0 && (
                    <span className="text-sm text-slate-400">
                      {attachments.length} file{attachments.length > 1 ? 's' : ''} selected
                    </span>
                  )}
                </div>
                {attachments.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-700/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-300">{file.name}</span>
                          <span className="text-xs text-slate-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="p-1 hover:bg-slate-800 rounded transition-colors"
                          disabled={isSending}
                        >
                          <X className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Footer with Actions */}
            <div className="px-8 py-6 bg-slate-900/50 border-t border-slate-700/50 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSending}
                className="px-6 h-11 rounded-xl bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={isSending || hasPermissionIssue}
                className="px-6 h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border-0"
                title={hasPermissionIssue ? 'You do not have permission to send bulk emails' : ''}
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Email{isMultipleRecipients && isBulkAllowed ? ` (${recipientCount})` : ''}
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
