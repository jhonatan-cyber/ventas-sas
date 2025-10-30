"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserCog, Users, UserPlus, UserMinus, Power, PowerOff } from "lucide-react"
import { RoleWithStats } from "@/lib/services/admin/role-admin-service"

interface RolesStatsProps {
  roles: RoleWithStats[]
}

export function RolesStats({ roles }: RolesStatsProps) {
  const totalRoles = roles.length
  const rolesInUse = roles.filter(role => role._count.organizationMembers > 0).length
  const rolesNotUsed = roles.filter(role => role._count.organizationMembers === 0).length
  const rolesActive = roles.filter(role => role.isActive ?? true).length
  const rolesInactive = roles.filter(role => !(role.isActive ?? true)).length

  const usagePercentage = totalRoles > 0 ? Math.round((rolesInUse / totalRoles) * 100) : 0
  const activePercentage = totalRoles > 0 ? Math.round((rolesActive / totalRoles) * 100) : 0

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total</CardTitle>
          <UserCog className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{totalRoles}</div>
          <CardDescription className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Roles en el sistema
          </CardDescription>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">En Uso</CardTitle>
          <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{rolesInUse}</div>
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
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{rolesActive}</div>
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
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Inactivos</CardTitle>
          <PowerOff className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{rolesInactive}</div>
          <CardDescription className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {totalRoles - rolesActive > 0 ? Math.round(((totalRoles - rolesActive) / totalRoles) * 100) : 0}% del total
          </CardDescription>
          <div className="mt-2 w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-2">
            <div 
              className="bg-orange-600 dark:bg-orange-500 h-2 rounded-full transition-all" 
              style={{ width: `${totalRoles > 0 ? Math.round(((totalRoles - rolesActive) / totalRoles) * 100) : 0}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
