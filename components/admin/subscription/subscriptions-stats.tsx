"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, CheckCircle, XCircle, Clock } from "lucide-react"

interface SubscriptionWithDetails {
  id: string
  status: string
  organization: any
  plan: any
}

interface SubscriptionsStatsProps {
  subscriptions: SubscriptionWithDetails[]
}

export function SubscriptionsStats({ subscriptions }: SubscriptionsStatsProps) {
  const totalSubscriptions = subscriptions.length
  const activeSubscriptions = subscriptions.filter(s => s.status === "active").length
  const cancelledSubscriptions = subscriptions.filter(s => s.status === "cancelled").length
  const trialSubscriptions = subscriptions.filter(s => s.status === "trial").length

  const activePercentage = totalSubscriptions > 0 ? Math.round((activeSubscriptions / totalSubscriptions) * 100) : 0
  const cancelledPercentage = totalSubscriptions > 0 ? Math.round((cancelledSubscriptions / totalSubscriptions) * 100) : 0
  const trialPercentage = totalSubscriptions > 0 ? Math.round((trialSubscriptions / totalSubscriptions) * 100) : 0

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total</CardTitle>
          <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{totalSubscriptions}</div>
          <CardDescription className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Suscripciones en el sistema
          </CardDescription>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Activas</CardTitle>
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{activeSubscriptions}</div>
          <CardDescription className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {activePercentage}% del total
          </CardDescription>
          <div className="mt-2 w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-2">
            <div 
              className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all" 
              style={{ width: `${activePercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Canceladas</CardTitle>
          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{cancelledSubscriptions}</div>
          <CardDescription className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {cancelledPercentage}% del total
          </CardDescription>
          <div className="mt-2 w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-2">
            <div 
              className="bg-red-600 dark:bg-red-500 h-2 rounded-full transition-all" 
              style={{ width: `${cancelledPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Prueba</CardTitle>
          <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{trialSubscriptions}</div>
          <CardDescription className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {trialPercentage}% del total
          </CardDescription>
          <div className="mt-2 w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-2">
            <div 
              className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full transition-all" 
              style={{ width: `${trialPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
