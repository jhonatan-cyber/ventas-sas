import { prisma } from '../prisma'

import type { Profile, Organization, OrganizationSubscriptionStatus } from '@prisma/client'

export class AuthService {
  // Crear un nuevo perfil de usuario
  static async createProfile(data: {
    id: string
    email: string
    fullName?: string
    role?: string
    isSuperAdmin?: boolean
  }) {
    return await prisma.profile.create({
      data
    })
  }

  // Obtener perfil por ID
  static async getProfileById(id: string) {
    return await prisma.profile.findUnique({
      where: { id }
    })
  }

  // Actualizar perfil
  static async updateProfile(id: string, data: Partial<Omit<Profile, 'id' | 'createdAt'>>) {
    return await prisma.profile.update({
      where: { id },
      data: data as any
    })
  }

  // Verificar si es super administrador
  static async isSuperAdmin(userId: string) {
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { isSuperAdmin: true }
    })
    
    return profile?.isSuperAdmin || false
  }

  // Verificar si tiene acceso de administrador
  // Permite acceso a cualquier usuario que:
  // 1. Exista y esté activo
  // 2. Tenga un rol que exista en la base de datos
  // 3. El rol esté activo
  // NOTA: Los usuarios del sistema de administración NO pertenecen a organizaciones
  // Las organizaciones son solo para usuarios del sistema SAS
  static async hasAdminAccess(userId: string): Promise<boolean> {
    const profile = await prisma.profile.findUnique({
      where: { id: userId }
    })
    
    if (!profile || !profile.isActive) {
      return false
    }

    // Si es super admin, tiene acceso completo
    if (profile.isSuperAdmin) {
      return true
    }

    // Si tiene un rol asignado, permitir acceso (no importa si el rol existe en la tabla Role)
    // Esto permite que usuarios con roles como "support", "user", etc. puedan acceder
    if (profile.role) {
      return true
    }

    // Si no tiene rol, no tiene acceso
    return false
  }

  // Obtener organización del usuario
  // NOTA: Los usuarios del sistema de administración NO tienen organizaciones
  // Esta función retorna null para usuarios admin
  static async getUserOrganization(_userId: string) {
    // Los usuarios del sistema de administración no tienen organizaciones
    // Las organizaciones son solo para usuarios del sistema SAS (SalesUser)
    return null
  }

  // Obtener todas las organizaciones (solo super admin)
  static async getAllOrganizations() {
    return await prisma.organization.findMany({
      include: {
        subscriptionPlan: true
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Crear organización
  static async createOrganization(data: {
    name: string
    slug: string
    ownerId: string
    subscriptionPlanId?: string
    subscriptionStatus?: OrganizationSubscriptionStatus
    subscriptionStartDate?: Date
    subscriptionEndDate?: Date
    settings?: any
  }) {
    return await prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        ownerId: data.ownerId,
        subscriptionPlanId: data.subscriptionPlanId,
        subscriptionStatus: data.subscriptionStatus,
        subscriptionStartDate: data.subscriptionStartDate,
        subscriptionEndDate: data.subscriptionEndDate,
        settings: data.settings
      },
      include: {
        subscriptionPlan: true
      }
    })
  }

  // Actualizar organización
  static async updateOrganization(id: string, data: Partial<Omit<Organization, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>>) {
    return await prisma.organization.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      } as any,
      include: {
        subscriptionPlan: true
      }
    })
  }

  // Obtener roles disponibles
  static async getRoles() {
    return await prisma.role.findMany({
      orderBy: { name: 'asc' }
    })
  }

  // Crear rol
  static async createRole(data: {
    name: string
    description?: string
    permissions?: any
  }) {
    return await prisma.role.create({
      data
    })
  }

  // Actualizar rol
  static async updateRole(id: string, data: Partial<Omit<typeof prisma.role, 'id' | 'createdAt'>>) {
    return await prisma.role.update({
      where: { id },
      data
    })
  }

  // Eliminar rol
  static async deleteRole(id: string) {
    return await prisma.role.delete({
      where: { id }
    })
  }

  // Obtener planes de suscripción
  static async getSubscriptionPlans() {
    return await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
  }

  // Crear plan de suscripción
  static async createSubscriptionPlan(data: {
    name: string
    description?: string
    priceMonthly?: number
    priceYearly?: number
    hasMonthly?: boolean
    hasYearly?: boolean
    features?: any
    modules?: any
    maxUsers?: number
    maxProducts?: number
    maxBranches?: number
    isActive?: boolean
  }) {
    return await prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        description: data.description,
        priceMonthly: data.priceMonthly as any,
        priceYearly: data.priceYearly as any,
        hasMonthly: data.hasMonthly,
        hasYearly: data.hasYearly,
        features: data.features,
        modules: data.modules,
        maxUsers: data.maxUsers,
        maxProducts: data.maxProducts,
        maxBranches: data.maxBranches,
        isActive: data.isActive,
      }
    })
  }

  // Actualizar plan de suscripción
  static async updateSubscriptionPlan(id: string, data: Partial<Omit<typeof prisma.subscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>>) {
    return await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })
  }

  // Eliminar plan de suscripción
  static async deleteSubscriptionPlan(id: string) {
    return await prisma.subscriptionPlan.delete({
      where: { id }
    })
  }

  // Obtener estadísticas de usuarios
  static async getUserStats() {
    const [totalUsers, superAdmins, organizations] = await Promise.all([
      prisma.profile.count(),
      prisma.profile.count({
        where: { isSuperAdmin: true }
      }),
      prisma.organization.count()
    ])

    return { totalUsers, superAdmins, organizations }
  }

  // Buscar usuarios
  static async searchUsers(query: string) {
    return await prisma.profile.findMany({
      where: {
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { ci: { contains: query, mode: 'insensitive' } }
        ]
      },
      // organizationMembers removed - users del sistema admin no tienen organizaciones
      orderBy: { createdAt: 'desc' }
    })
  }
}
