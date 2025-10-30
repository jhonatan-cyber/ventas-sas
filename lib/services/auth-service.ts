import { prisma } from '../prisma'
import type { Profile, Organization } from '@prisma/client'

export class AuthService {
  // Crear un nuevo perfil de usuario
  static async createProfile(data: {
    id: string
    fullName?: string
    companyName?: string
    role?: string
    organizationId?: string
    isSuperAdmin?: boolean
  }) {
    return await prisma.profile.create({
      data
    })
  }

  // Obtener perfil por ID
  static async getProfileById(id: string) {
    return await prisma.profile.findUnique({
      where: { id },
      include: {
        organizationMembers: {
          include: {
            organization: true,
            role: true
          }
        }
      }
    })
  }

  // Actualizar perfil
  static async updateProfile(id: string, data: Partial<Omit<Profile, 'id' | 'createdAt'>>) {
    return await prisma.profile.update({
      where: { id },
      data
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

  // Obtener organización del usuario
  static async getUserOrganization(userId: string) {
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      include: {
        organizationMembers: {
          include: {
            organization: true
          }
        }
      }
    })
    
    return profile?.organizationMembers?.[0]?.organization
  }

  // Obtener todas las organizaciones (solo super admin)
  static async getAllOrganizations() {
    return await prisma.organization.findMany({
      include: {
        subscriptionPlan: true,
        profiles: true
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
    subscriptionStatus?: string
    subscriptionStartDate?: Date
    subscriptionEndDate?: Date
    settings?: any
  }) {
    return await prisma.organization.create({
      data,
      include: {
        subscriptionPlan: true
      }
    })
  }

  // Actualizar organización
  static async updateOrganization(id: string, data: Partial<Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>>) {
    return await prisma.organization.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      },
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
      orderBy: { price: 'asc' }
    })
  }

  // Crear plan de suscripción
  static async createSubscriptionPlan(data: {
    name: string
    description?: string
    price: number
    billingPeriod: string
    features?: any
    maxUsers?: number
    maxProducts?: number
    maxOrders?: number
    isActive?: boolean
  }) {
    return await prisma.subscriptionPlan.create({
      data
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
      include: {
        organizationMembers: {
          include: {
            organization: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }
}
