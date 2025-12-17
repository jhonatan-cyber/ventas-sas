"use client"

import { Profile } from "@prisma/client"
import { User, Mail, Shield } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

interface ProfileHeaderProps {
  profile: Profile
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const initials = (profile.fullName || profile.email || 'U')
    .split(" ")
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Mi Perfil
        </h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
          Gestiona tu información personal y configuración de seguridad
        </p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <Avatar className="w-20 h-20 md:w-24 md:h-24">
            <AvatarFallback className="text-2xl md:text-3xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">
                {profile.fullName || 'Sin nombre'}
              </h2>
              {profile.isSuperAdmin && (
                <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">
                  <Shield className="h-3 w-3 mr-1" />
                  Super Admin
                </Badge>
              )}
              {!profile.isSuperAdmin && profile.role && (
                <Badge variant="secondary">
                  {profile.role}
                </Badge>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{profile.email}</span>
              </div>
              {profile.ci && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>CI: {profile.ci}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
              <span>Último acceso:</span>
              <span>
                {profile.lastLoginAt 
                  ? new Date(profile.lastLoginAt).toLocaleString('es-ES', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })
                  : 'Nunca'}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

