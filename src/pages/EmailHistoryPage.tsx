import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Mail,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import api from '@/services/api'
import { useToast } from '@/store/toastStore'
import MainLayout from '@/layouts/MainLayout'

interface EmailRecord {
  _id: string
  description: string
  performedBy: {
    name: string
    email: string
  }
  student?: {
    studentNumber: string
    firstName: string
    lastName: string
  }
  createdAt: string
  metadata?: {
    recipient?: string
    subject?: string
    messageId?: string
    sentCount?: number
    totalRecipients?: number
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function EmailHistoryPage() {
  const [emails, setEmails] = useState<EmailRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'single' | 'bulk'>('all')
  const toast = useToast()

  const fetchEmailHistory = useCallback(
    async (page = 1) => {
      setIsLoading(true)
      try {
        console.log('[EmailHistory] Fetching email history, page:', page)

        const response = await api.get('/emails/history', {
          params: {
            page,
            limit: 20,
            search: searchTerm || undefined,
          },
        })

        // Response structure: { success, data: records[], pagination: {...} }
        const emailData = response.data?.data || []
        const paginationData = response.data?.pagination

        console.log(
          '[EmailHistory] Loaded emails:',
          emailData.length,
          'pagination:',
          paginationData
        )
        setEmails(emailData)
        setPagination(
          paginationData || {
            page,
            limit: 20,
            total: emailData.length,
            totalPages: 1,
          }
        )
      } catch (error: any) {
        console.error('[EmailHistory] Failed to fetch email history:', error)

        if (error.response?.status === 404) {
          toast.error('Email history endpoint not available')
        } else {
          toast.error(error.response?.data?.message || 'Failed to load email history')
        }
      } finally {
        setIsLoading(false)
      }
    },
    [searchTerm, toast]
  )

  useEffect(() => {
    fetchEmailHistory(1)
  }, [fetchEmailHistory])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchEmailHistory(newPage)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filteredEmails = emails.filter((email) => {
    if (filterType === 'single') {
      return !email.metadata?.totalRecipients || email.metadata.totalRecipients === 1
    } else if (filterType === 'bulk') {
      return email.metadata?.totalRecipients && email.metadata.totalRecipients > 1
    }
    return true
  })

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Email History"
          description="View all sent emails and notifications"
          icon={Mail}
          gradient="from-orange-600 via-amber-600 to-yellow-600"
          stats={[
            {
              label: 'Total Emails',
              value: pagination.total,
              icon: Mail,
              color: 'orange',
            },
            {
              label: 'Displayed',
              value: filteredEmails.length,
              icon: Filter,
              color: 'blue',
            },
          ]}
        />

        {/* Filters - Enterprise Grade */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 rounded-2xl shadow-enterprise border border-slate-700/50 backdrop-blur-sm p-6"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by recipient, subject, or student..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 border-slate-600 bg-slate-900/50 text-slate-100 placeholder:text-slate-500 focus:border-orange-500 focus:ring-orange-500/20"
              />
            </div>

            {/* Filter Type */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="appearance-none pl-10 pr-10 py-3 h-12 border border-slate-600 bg-slate-900/50 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer min-w-[180px]"
              >
                <option value="all">All Emails</option>
                <option value="single">Single Recipients</option>
                <option value="bulk">Bulk Emails</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Email List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 rounded-2xl shadow-enterprise-lg border border-slate-700/50 backdrop-blur-sm overflow-hidden"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block w-12 h-12 border-4 border-orange-900 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400 font-medium">Loading email history...</p>
              </div>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Mail className="w-16 h-16 text-slate-600 mb-4" />
              <p className="text-slate-300 text-lg font-medium">No emails found</p>
              <p className="text-slate-500 text-sm mt-1">
                {searchTerm ? 'Try adjusting your search' : 'No emails have been sent yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-orange-600 to-amber-600">
                  <tr>
                    <th className="px-6 py-5 text-left text-sm font-semibold text-white tracking-wide">
                      Date & Time
                    </th>
                    <th className="px-6 py-5 text-left text-sm font-semibold text-white tracking-wide">
                      Recipient(s)
                    </th>
                    <th className="px-6 py-5 text-left text-sm font-semibold text-white tracking-wide">
                      Subject
                    </th>
                    <th className="px-6 py-5 text-left text-sm font-semibold text-white tracking-wide">
                      Sent By
                    </th>
                    <th className="px-6 py-5 text-left text-sm font-semibold text-white tracking-wide">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-900/50 divide-y divide-slate-700/30">
                  {filteredEmails.map((email, index) => (
                    <motion.tr
                      key={email._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-800/60 transition-colors group"
                    >
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-slate-200 font-medium">
                          <Clock className="w-4 h-4 text-slate-400" />
                          {formatDate(email.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm text-slate-200 font-medium">
                          {email.metadata?.recipient || email.student
                            ? `${email.student?.firstName} ${email.student?.lastName}`
                            : 'Multiple Recipients'}
                        </div>
                        {email.metadata?.totalRecipients && email.metadata.totalRecipients > 1 && (
                          <div className="text-xs text-slate-500 mt-1">
                            {email.metadata.sentCount || email.metadata.totalRecipients} of{' '}
                            {email.metadata.totalRecipients} recipients
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm text-slate-300 max-w-xs truncate">
                          {email.metadata?.subject || 'No subject'}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-semibold text-xs">
                            {email.performedBy.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm text-slate-200 font-medium">
                              {email.performedBy.name}
                            </div>
                            <div className="text-xs text-slate-500">{email.performedBy.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                            email.metadata?.totalRecipients && email.metadata.totalRecipients > 1
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {email.metadata?.totalRecipients && email.metadata.totalRecipients > 1
                            ? 'Bulk'
                            : 'Single'}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        {!isLoading && filteredEmails.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 backdrop-blur-sm"
          >
            <p className="text-sm text-slate-400 font-medium">
              Showing {filteredEmails.length} of {pagination.total} emails
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="h-10 px-4 rounded-xl border-slate-600 bg-slate-900/50 text-slate-200 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <span className="px-4 py-2 text-sm text-slate-300 font-medium">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="h-10 px-4 rounded-xl border-slate-600 bg-slate-900/50 text-slate-200 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </MainLayout>
  )
}
