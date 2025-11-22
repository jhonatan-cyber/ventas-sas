"use client"

import { HelpCircle, Clock, CheckCircle2, XCircle } from "lucide-react"
import { useTranslations } from "next-intl"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SupportTicketSummary {
  id: string
  ticketNumber: string
  title: string
  status: string
  priority: string
  category: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    comments: number
  }
}

interface SupportSasStatsProps {
  tickets: SupportTicketSummary[]
}

export function SupportSasStats({ tickets }: SupportSasStatsProps) {
  const t = useTranslations()
  const total = tickets.length
  const open = tickets.filter((t) => t.status === "open").length
  const inProgress = tickets.filter((t) => t.status === "in_progress").length
  const resolved = tickets.filter((t) => t.status === "resolved").length
  const closed = tickets.filter((t) => t.status === "closed").length

  const openPercentage = total > 0 ? Math.round((open / total) * 100) : 0
  const inProgressPercentage = total > 0 ? Math.round((inProgress / total) * 100) : 0
  const resolvedPercentage = total > 0 ? Math.round((resolved / total) * 100) : 0
  const closedPercentage = total > 0 ? Math.round((closed / total) * 100) : 0

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100">
            {t('support.stats.open')}
          </CardTitle>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
            <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100">
            {open}
          </div>
          <p className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-300 mt-1 line-clamp-2">
            {openPercentage}% {t('support.stats.total')} • {t('support.stats.openDescription')}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20 border-yellow-200 dark:border-yellow-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-yellow-900 dark:text-yellow-100">
            {t('support.stats.inProgress')}
          </CardTitle>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-yellow-500 dark:bg-yellow-600 flex items-center justify-center">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-bold text-yellow-900 dark:text-yellow-100">
            {inProgress}
          </div>
          <p className="text-[10px] sm:text-xs text-yellow-700 dark:text-yellow-300 mt-1 line-clamp-2">
            {inProgressPercentage}% {t('support.stats.total')} • {t('support.stats.inProgressDescription')}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-green-900 dark:text-green-100">
            {t('support.stats.resolved')}
          </CardTitle>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-green-500 dark:bg-green-600 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100">
            {resolved}
          </div>
          <p className="text-[10px] sm:text-xs text-green-700 dark:text-green-300 mt-1 line-clamp-2">
            {resolvedPercentage}% {t('support.stats.total')} • {t('support.stats.resolvedDescription')}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950/20 dark:to-gray-900/20 border-gray-200 dark:border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
            {t('support.stats.closed')}
          </CardTitle>
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gray-500 dark:bg-gray-600 flex items-center justify-center">
            <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            {closed}
          </div>
          <p className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">
            {closedPercentage}% {t('support.stats.total')} • {t('support.stats.closedDescription')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

