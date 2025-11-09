"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Building2, Building, XCircle, Users } from "lucide-react"

interface Customer {
  id: string
  organizations: Array<{
    organization: {
      subscriptionStatus?: string
    }
  }>
}

interface CustomerOrganizationsStatsProps {
  customers: Customer[]
  organizations: Array<{
    subscriptionStatus?: string
  }>
}

export function CustomerOrganizationsStats({ customers, organizations }: CustomerOrganizationsStatsProps) {
  const totalOrganizations = organizations.length
  const activeOrganizations = organizations.filter(
    (org) => org.subscriptionStatus === 'active' || org.subscriptionStatus === 'trial'
  ).length
  const inactiveOrganizations = organizations.filter(
    (org) => org.subscriptionStatus !== 'active' && org.subscriptionStatus !== 'trial'
  ).length
  const totalCustomers = customers.length

  const activePercentage =
    totalOrganizations > 0 ? Math.round((activeOrganizations / totalOrganizations) * 100) : 0
  const inactivePercentage =
    totalOrganizations > 0 ? Math.round((inactiveOrganizations / totalOrganizations) * 100) : 0

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-0 p-1.5 md:p-4">
          <CardTitle className="text-[10px] md:text-sm font-medium text-gray-700 dark:text-gray-300">
            Total
          </CardTitle>
          <Building2 className="h-3 w-3 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent className="p-1.5 md:p-4 pt-0 pb-1 -mt-4 md:mt-0">
          <div className="text-base md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
            {totalOrganizations}
          </div>
          <CardDescription className="text-[9px] md:text-xs text-gray-600 dark:text-gray-400 mt-0">
            Organizaciones registradas
          </CardDescription>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-0 p-1.5 md:p-4">
          <CardTitle className="text-[10px] md:text-sm font-medium text-gray-700 dark:text-gray-300">
            Activas
          </CardTitle>
          <Building className="h-3 w-3 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent className="p-1.5 md:p-4 pt-0 pb-1 -mt-4 md:mt-0">
          <div className="text-base md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
            {activeOrganizations}
          </div>
          <CardDescription className="text-[9px] md:text-xs text-gray-600 dark:text-gray-400 mt-0">
            {activePercentage}% del total
          </CardDescription>
          <div className="mt-1 w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-1">
            <div
              className="bg-green-600 dark:bg-green-500 h-1 rounded-full transition-all"
              style={{ width: `${activePercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-0 p-1.5 md:p-4">
          <CardTitle className="text-[10px] md:text-sm font-medium text-gray-700 dark:text-gray-300">
            Inactivas
          </CardTitle>
          <XCircle className="h-3 w-3 md:h-5 md:w-5 text-red-600 dark:text-red-400" />
        </CardHeader>
        <CardContent className="p-1.5 md:p-4 pt-0 pb-1 -mt-4 md:mt-0">
          <div className="text-base md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
            {inactiveOrganizations}
          </div>
          <CardDescription className="text-[9px] md:text-xs text-gray-600 dark:text-gray-400 mt-0">
            {inactivePercentage}% del total
          </CardDescription>
          <div className="mt-1 w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-1">
            <div
              className="bg-red-600 dark:bg-red-500 h-1 rounded-full transition-all"
              style={{ width: `${inactivePercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-0 p-1.5 md:p-4">
          <CardTitle className="text-[10px] md:text-sm font-medium text-gray-700 dark:text-gray-300">
            Clientes
          </CardTitle>
          <Users className="h-3 w-3 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
        </CardHeader>
        <CardContent className="p-1.5 md:p-4 pt-0 pb-1 -mt-4 md:mt-0">
          <div className="text-base md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
            {totalCustomers}
          </div>
          <CardDescription className="text-[9px] md:text-xs text-gray-600 dark:text-gray-400 mt-0">
            Clientes registrados
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}

