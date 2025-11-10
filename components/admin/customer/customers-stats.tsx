"use client"

import { Users, UserCheck, UserX, Building } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Customer } from "@/lib/types"

interface CustomersStatsProps {
  customers: Customer[]
}

export function CustomersStats({ customers }: CustomersStatsProps) {
  const totalCustomers = customers.length
  const activeCustomers = customers.filter(customer => customer.isActive).length
  const inactiveCustomers = customers.filter(customer => !customer.isActive).length
  const companiesCustomers = customers.filter(customer => customer.razonSocial).length

  const activePercentage = totalCustomers > 0 ? Math.round((activeCustomers / totalCustomers) * 100) : 0
  const inactivePercentage = totalCustomers > 0 ? Math.round((inactiveCustomers / totalCustomers) * 100) : 0
  const companiesPercentage = totalCustomers > 0 ? Math.round((companiesCustomers / totalCustomers) * 100) : 0

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-0 p-1.5 md:p-4">
          <CardTitle className="text-[10px] md:text-sm font-medium text-gray-700 dark:text-gray-300">Total</CardTitle>
          <Users className="h-3 w-3 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent className="p-1.5 md:p-4 pt-0 pb-1 -mt-4 md:mt-0">
          <div className="text-base md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">{totalCustomers}</div>
          <CardDescription className="text-[9px] md:text-xs text-gray-600 dark:text-gray-400 mt-0">
            Clientes en el sistema
          </CardDescription>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-0 p-1.5 md:p-4">
          <CardTitle className="text-[10px] md:text-sm font-medium text-gray-700 dark:text-gray-300">Activos</CardTitle>
          <UserCheck className="h-3 w-3 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent className="p-1.5 md:p-4 pt-0 pb-1 -mt-4 md:mt-0">
          <div className="text-base md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">{activeCustomers}</div>
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
          <CardTitle className="text-[10px] md:text-sm font-medium text-gray-700 dark:text-gray-300">Inactivos</CardTitle>
          <UserX className="h-3 w-3 md:h-5 md:w-5 text-red-600 dark:text-red-400" />
        </CardHeader>
        <CardContent className="p-1.5 md:p-4 pt-0 pb-1 -mt-4 md:mt-0">
          <div className="text-base md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">{inactiveCustomers}</div>
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
          <CardTitle className="text-[10px] md:text-sm font-medium text-gray-700 dark:text-gray-300">Empresas</CardTitle>
          <Building className="h-3 w-3 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
        </CardHeader>
        <CardContent className="p-1.5 md:p-4 pt-0 pb-1 -mt-4 md:mt-0">
          <div className="text-base md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">{companiesCustomers}</div>
          <CardDescription className="text-[9px] md:text-xs text-gray-600 dark:text-gray-400 mt-0">
            {companiesPercentage}% del total
          </CardDescription>
          <div className="mt-1 w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-1">
            <div 
              className="bg-purple-600 dark:bg-purple-500 h-1 rounded-full transition-all" 
              style={{ width: `${companiesPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
