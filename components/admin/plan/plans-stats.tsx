"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, DollarSign, Power, PowerOff, TrendingUp } from "lucide-react"
import { SerializedSubscriptionPlanWithStats } from "./types"

interface PlansStatsProps {
  plans: SerializedSubscriptionPlanWithStats[]
}

export function PlansStats({ plans }: PlansStatsProps) {
  const totalPlans = plans.length
  const plansInUse = plans.filter(plan => plan._count.organizations > 0).length
  const plansNotUsed = plans.filter(plan => plan._count.organizations === 0).length
  const plansActive = plans.filter(plan => plan.isActive ?? true).length
  const plansInactive = plans.filter(plan => !(plan.isActive ?? true)).length
  const totalRevenue = plans.reduce((sum, plan) => {
    return sum + (plan.price * plan._count.organizations)
  }, 0)

  const usagePercentage = totalPlans > 0 ? Math.round((plansInUse / totalPlans) * 100) : 0
  const activePercentage = totalPlans > 0 ? Math.round((plansActive / totalPlans) * 100) : 0

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total</CardTitle>
          <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{totalPlans}</div>
          <CardDescription className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Planes en el sistema
          </CardDescription>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">En Uso</CardTitle>
          <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{plansInUse}</div>
          <CardDescription className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {usagePercentage}% del total
          </CardDescription>
          <div className="mt-2 w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-2">
            <div 
              className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all" 
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Activos</CardTitle>
          <Power className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{plansActive}</div>
          <CardDescription className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {activePercentage}% del total
          </CardDescription>
          <div className="mt-2 w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-2">
            <div 
              className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full transition-all" 
              style={{ width: `${activePercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Ingresos</CardTitle>
          <DollarSign className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            ${totalRevenue.toLocaleString()}
          </div>
          <CardDescription className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Ingresos mensuales
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}

