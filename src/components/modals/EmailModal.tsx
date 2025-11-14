import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Mail, AlertCircle, Loader2, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/store/toastStore'

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

export default function EmailModal({ isOpen, onClose, recipients, onSend }: EmailModalProps) {
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const { addToast } = useToast()

  const recipientCount = Array.isArray(recipients)
    ? recipients.length
    : recipients.split(',').filter(Boolean).length

  const isMultipleRecipients = recipientCount > 1

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      const recipientString = Array.isArray(recipients) ? recipients.join(', ') : recipients
      setTo(recipientString)
      setSubject('')
      setMessage('')
      setAttachments([])
      setError('')
    }
  }, [isOpen, recipients])

  const validateEmail = (email: string): boolean => {
    const emailPattern =
      /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,7}$/
    return emailPattern.test(email.trim())
  }

  const validateForm = (): boolean => {
    setError('')

    if (!to.trim()) {
      setError('Please enter recipient email address')
      return false
    }

    // Validate all emails
    const emails = to.split(',').map((e) => e.trim())
    for (const email of emails) {
      if (!validateEmail(email)) {
        setError(`Invalid email address: ${email}`)
        return false
      }
    }

    if (!subject.trim()) {
      setError('Please enter email subject')
      return false
    }

    if (!message.trim()) {
      setError('Please enter email message')
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
          onClick={onClose}
          onKeyDown={handleKeyDown}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Gradient */}
            <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ rotate: -10, scale: 0.9 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                    className="p-3 bg-white/20 backdrop-blur-sm rounded-xl"
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
            <div className="p-8 space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
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
                <Label htmlFor="to" className="text-gray-700 font-medium">
                  To
                </Label>
                <Input
                  id="to"
                  type="text"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="recipient@example.com"
                  className="h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  disabled={isMultipleRecipients || isSending}
                  readOnly={isMultipleRecipients}
                />
                {isMultipleRecipients && (
                  <p className="text-xs text-gray-500">
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
                <Label htmlFor="subject" className="text-gray-700 font-medium">
                  Subject
                </Label>
                <Input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                  className="h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  disabled={isSending}
                />
              </motion.div>

              {/* Message Field */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <Label htmlFor="message" className="text-gray-700 font-medium">
                  Message
                </Label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  disabled={isSending}
                />
              </motion.div>

              {/* Attachments */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <Label htmlFor="attachments" className="text-gray-700 font-medium">
                  Attachments (Optional)
                </Label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                    <Paperclip className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">Add Files</span>
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
                    <span className="text-sm text-gray-600">
                      {attachments.length} file{attachments.length > 1 ? 's' : ''} selected
                    </span>
                  )}
                </div>
                {attachments.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          disabled={isSending}
                        >
                          <X className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Footer with Actions */}
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSending}
                className="px-6 h-11 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={isSending}
                className="px-6 h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Email
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
