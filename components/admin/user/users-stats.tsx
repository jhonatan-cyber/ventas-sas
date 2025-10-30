"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, UserX, Shield } from "lucide-react"
import { UserWithDetails } from "@/lib/services/admin/user-admin-service"

interface UsersStatsProps {
  users: UserWithDetails[]
}

export function UsersStats({ users }: UsersStatsProps) {
  const totalUsers = users.length
  const activeUsers = users.filter(user => user.isActive).length
  const inactiveUsers = users.filter(user => !user.isActive).length
  const superAdmins = users.filter(user => user.isSuperAdmin).length

  const activePercentage = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
  const inactivePercentage = totalUsers > 0 ? Math.round((inactiveUsers / totalUsers) * 100) : 0
  const superAdminsPercentage = totalUsers > 0 ? Math.round((superAdmins / totalUsers) * 100) : 0

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total</CardTitle>
          <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{totalUsers}</div>
          <CardDescription className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Usuarios en el sistema
          </CardDescription>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Activos</CardTitle>
          <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{activeUsers}</div>
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
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Inactivos</CardTitle>
          <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{inactiveUsers}</div>
          <CardDescription className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {inactivePercentage}% del total
          </CardDescription>
          <div className="mt-2 w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-2">
            <div 
              className="bg-red-600 dark:bg-red-500 h-2 rounded-full transition-all" 
              style={{ width: `${inactivePercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Super Admins</CardTitle>
          <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{superAdmins}</div>
          <CardDescription className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {superAdminsPercentage}% del total
          </CardDescription>
          <div className="mt-2 w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-2">
            <div 
              className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full transition-all" 
              style={{ width: `${superAdminsPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

