import { cookies } from 'next/headers'

import { AuthSasService } from './auth-sas-service'

import { prisma } from '@/lib/prisma'

export interface UserPermissions {
  permissions: string[]
  userId?: string
  roleName?: string
  isAdmin: boolean
  isAuthenticated: boolean
}

export class UserPermissionsService {
  /**
   * Obtiene los permisos del usuario actual desde el servidor
   * Esta función se ejecuta en el servidor y no causa bucles de peticiones
   */
  static async getUserPermissions(organizationSlug: string, request?: any): Promise<UserPermissions> {
    try {
      let token: string | undefined
      
      if (request && request.cookies) {
        // Si tenemos request (API routes), usar request.cookies
        token = request.cookies.get("sas-auth-token")?.value
      } else {
        // Si no tenemos request (Server Components), usar cookies()
        const cookieStore = await cookies()
        token = cookieStore.get("sas-auth-token")?.value
      }

      if (!token) {
        return {
          permissions: [],
          isAdmin: false,
          isAuthenticated: false
        }
      }

      // Verificar el token y obtener el usuario
      const user = await AuthSasService.verifyToken(organizationSlug, token)
      
      if (!user) {
        return {
          permissions: [],
          isAdmin: false,
          isAuthenticated: false
        }
      }

      // Obtener permisos del rol
      const rolePermissions = user.rol?.permissions as string[] | null || []

      // Filtrar solo los permisos que están activos en el sistema
      const activePermissions = await prisma.permissionSas.findMany({
        where: {
          name: { in: rolePermissions },
          isActive: true,
        },
        select: { name: true },
      })

      const filteredPermissions = activePermissions.map(p => p.name)

      // Verificar si el usuario es administrador
      // Un usuario es admin si su rol se llama "Administrador" o "Admin" (case insensitive)
      const roleName = user.rol?.nombre || ''
      const isAdmin = roleName.toLowerCase().includes('admin') || roleName.toLowerCase() === 'administrador'

      return {
        permissions: filteredPermissions,
        userId: user.id,
        roleName: user.rol?.nombre || undefined,
        isAdmin: isAdmin,
        isAuthenticated: true
      }
    } catch (error) {
      console.error('Error obteniendo permisos del usuario:', error)
      return {
        permissions: [],
        isAdmin: false,
        isAuthenticated: false
      }
    }
  }
}