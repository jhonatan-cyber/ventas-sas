import {
  Organization,
  OrganizationSubscriptionStatus,
  SubscriptionPlan,
} from "@prisma/client";

import { PasswordService } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";

export interface OrganizationWithPlan extends Organization {
  subscriptionPlan?: SubscriptionPlan | null;
  _count: {
    organizationMembers: number;
    customerOrganizations: number;
    products: number;
    orders: number;
  };
}

export interface CreateOrganizationData {
  razonSocial: string; // Razón social de la empresa (requerido)
  nit?: string; // NIT de la empresa (opcional)
  address: string; // Dirección de la empresa (requerido)
  phone: string; // Teléfono de la empresa (requerido)
  slug: string; // Slug único de la empresa (requerido, generado desde razón social)
  ownerId?: string; // ID del cliente dueño (opcional, se crea automáticamente desde customerId)
  customerId: string; // ID del cliente dueño (requerido, se usa para crear el ownerId)
  subscriptionPlanId?: string;
  subscriptionStatus?: OrganizationSubscriptionStatus;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  settings?: any;
}

export interface UpdateOrganizationData {
  name?: string;
  razonSocial?: string; // Razón social de la empresa/organización
  nit?: string; // NIT de la empresa/organización
  address?: string; // Dirección de la empresa/organización
  phone?: string; // Teléfono de la empresa/organización
  slug?: string;
  subscriptionPlanId?: string;
  subscriptionStatus?: OrganizationSubscriptionStatus;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  settings?: any;
}

export class OrganizationAdminService {
  // Obtener todas las organizaciones con estadísticas
  static async getAllOrganizations(): Promise<OrganizationWithPlan[]> {
    return prisma.organization.findMany({
      include: {
        subscriptionPlan: true,
        _count: {
          select: {
            organizationMembers: true,
            customerOrganizations: true,
            products: true,
            orders: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Obtener organización por ID
  static async getOrganizationById(
    id: string
  ): Promise<OrganizationWithPlan | null> {
    return prisma.organization.findUnique({
      where: { id },
      include: {
        subscriptionPlan: true,
        _count: {
          select: {
            organizationMembers: true,
            customerOrganizations: true,
            products: true,
            orders: true,
          },
        },
      },
    });
  }

  // Crear nueva organización
  // Nota: Una organización es una empresa
  // El ownerId se crea automáticamente como un Profile basado en el cliente
  // El cliente se relaciona con la organización a través de CustomerOrganization
  // El UsuarioSas administrador se crea después y representa al dueño
  static async createOrganization(
    data: CreateOrganizationData
  ): Promise<Organization> {
    const { customerId, ...organizationData } = data;

    // Validar que customerId esté presente (es requerido para crear el Profile del dueño)
    if (!customerId) {
      throw new Error(
        "El cliente dueño es requerido para crear una organización"
      );
    }

    return prisma.$transaction(async (tx) => {
      try {
        // Obtener los datos del cliente para crear el usuario SAS
        const customer = await tx.customer.findUnique({
          where: { id: customerId },
          select: {
            id: true,
            ci: true,
            nombre: true,
            apellido: true,
            address: true,
            phone: true,
            email: true,
          },
        });

        if (!customer) {
          throw new Error("Cliente no encontrado");
        }

        // Crear o buscar un Profile para el usuario administrador de la organización
        // El Profile será el dueño (ownerId) de la organización según el schema
        // Se crea basado en los datos del cliente (que ya fue creado en el módulo de clientes)
        // NOTA: El dueño real es el UsuarioSas que se crea después, pero el schema requiere un Profile.id como ownerId
        const customerEmail =
          customer.email || `${customer.ci || customer.id}@organizacion.local`;
        const customerFullName =
          `${customer.nombre || ""} ${customer.apellido || ""}`.trim() ||
          customerEmail;

        // Buscar si ya existe un Profile con ese email
        let ownerProfile = await tx.profile.findUnique({
          where: { email: customerEmail },
        });

        // Si no existe, crear uno nuevo basado en los datos del cliente
        if (!ownerProfile) {
          ownerProfile = await tx.profile.create({
            data: {
              email: customerEmail,
              fullName: customerFullName,
              role: "user",
              isSuperAdmin: false,
              isActive: true,
              address: customer.address || undefined,
              phone: customer.phone || undefined,
            },
          });
        }

        const organization = await tx.organization.create({
          data: {
            name: organizationData.razonSocial || "Empresa",
            razonSocial: organizationData.razonSocial,
            nit: organizationData.nit !== undefined ? organizationData.nit : null,
            address:
              organizationData.address !== undefined
                ? organizationData.address
                : null,
            phone:
              organizationData.phone !== undefined
                ? organizationData.phone
                : null,
            slug: organizationData.slug,
            ownerId: ownerProfile.id,
            subscriptionStatus:
              organizationData.subscriptionStatus ||
              OrganizationSubscriptionStatus.active,
            subscriptionStartDate:
              organizationData.subscriptionStartDate || new Date(),
            subscriptionEndDate:
              organizationData.subscriptionEndDate ||
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            subscriptionPlanId:
              organizationData.subscriptionPlanId !== undefined
                ? organizationData.subscriptionPlanId
                : null,
            settings:
              organizationData.settings !== undefined
                ? organizationData.settings
                : null,
          },
        });

        await tx.customerOrganization.create({
          data: {
            customerId,
            organizationId: organization.id,
            isActive: true,
          },
        });

        const branch = await tx.branch.create({
          data: {
            name: "Principal",
            address: organizationData.address || customer.address || undefined,
            organizationId: organization.id,
            isActive: true,
          },
        });

        const role = await tx.roleSas.create({
          data: {
            nombre: "Administrador",
            descripcion: "Rol de administrador de la organización",
            organizationId: organization.id,
            sucursalId: branch.id,
            isActive: true,
          },
        });

        // Hashear la contraseña (CI del cliente)
        // La contraseña del UsuarioSas será el CI del cliente
        const hashedPassword = customer.ci
          ? await PasswordService.hashPassword(customer.ci)
          : null;

        // Crear el UsuarioSas (usuario administrador/dueño de la organización)
        // Se crea con los MISMOS datos del cliente que ya fue creado en el módulo de clientes
        // Este UsuarioSas es el dueño real de la organización
        await tx.usuarioSas.create({
          data: {
            ci: customer.ci || undefined,
            nombre: customer.nombre || "",
            apellido: customer.apellido || "",
            address: customer.address || organizationData.address || undefined,
            phone: customer.phone || organizationData.phone || undefined,
            email: customer.email || undefined,
            password: hashedPassword,
            organizationId: organization.id,
            sucursalId: branch.id,
            rolId: role.id,
            isActive: true,
          },
        });

        return organization;
      } catch (error: any) {
        // Log detallado del error para debugging
        console.error('Error al crear organización:', {
          error: error.message,
          code: error.code,
          meta: error.meta,
          customerId,
          organizationData: {
            razonSocial: organizationData.razonSocial,
            slug: organizationData.slug,
            hasAddress: !!organizationData.address,
            hasPhone: !!organizationData.phone,
          }
        });
        throw error;
      }
    });
  }

  // Actualizar organización
  static async updateOrganization(
    id: string,
    data: UpdateOrganizationData
  ): Promise<Organization> {
    // Construir el objeto de actualización asegurando que los campos se guarden correctamente
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.razonSocial !== undefined)
      updateData.razonSocial = data.razonSocial;
    if (data.nit !== undefined) updateData.nit = data.nit || null;
    if (data.address !== undefined) updateData.address = data.address || null; // Asegurar que se guarde la dirección
    if (data.phone !== undefined) updateData.phone = data.phone || null; // Asegurar que se guarde el teléfono
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.subscriptionPlanId !== undefined)
      updateData.subscriptionPlanId = data.subscriptionPlanId || null;
    if (data.subscriptionStatus !== undefined)
      updateData.subscriptionStatus = data.subscriptionStatus;
    if (data.subscriptionStartDate !== undefined)
      updateData.subscriptionStartDate = data.subscriptionStartDate;
    if (data.subscriptionEndDate !== undefined)
      updateData.subscriptionEndDate = data.subscriptionEndDate;
    if (data.settings !== undefined)
      updateData.settings = data.settings || null;

    return prisma.organization.update({
      where: { id },
      data: updateData,
    });
  }

  // Eliminar organización
  static async deleteOrganization(id: string): Promise<Organization> {
    return prisma.$transaction(async (tx) => {
      // Eliminar datos relacionados del sistema SAS en el orden correcto
      // Primero eliminar items (dependientes) antes de las entidades principales

      // 1. Eliminar items de cotizaciones
      await tx.quotationItem.deleteMany({
        where: {
          quotation: {
            organizationId: id,
          },
        },
      });

      // 2. Eliminar items de ventas
      await tx.saleItem.deleteMany({
        where: {
          sale: {
            organizationId: id,
          },
        },
      });

      // 3. Eliminar items de órdenes
      await tx.orderItem.deleteMany({
        where: {
          order: {
            organizationId: id,
          },
        },
      });

      // 4. Eliminar usuarios SAS (antes de eliminar roles y sucursales)
      await tx.usuarioSas.deleteMany({
        where: { organizationId: id },
      });

      // 5. Eliminar roles SAS
      await tx.roleSas.deleteMany({
        where: { organizationId: id },
      });

      // 6. Eliminar sucursales (branches) - después de usuarios y roles
      await tx.branch.deleteMany({
        where: { organizationId: id },
      });

      // 7. Eliminar relación CustomerOrganization
      await tx.customerOrganization.deleteMany({
        where: { organizationId: id },
      });

      // 8. Eliminar cotizaciones (después de items)
      await tx.quotation.deleteMany({
        where: { organizationId: id },
      });

      // 9. Eliminar ventas (después de items)
      await tx.sale.deleteMany({
        where: { organizationId: id },
      });

      // 10. Eliminar órdenes (después de items)
      await tx.order.deleteMany({
        where: { organizationId: id },
      });

      // 11. Eliminar productos (SalesProduct)
      await tx.salesProduct.deleteMany({
        where: { organizationId: id },
      });

      // 12. Eliminar productos legacy (Product)
      await tx.product.deleteMany({
        where: { organizationId: id },
      });

      // 13. Eliminar categorías (después de productos)
      await tx.category.deleteMany({
        where: { organizationId: id },
      });

      // 14. Eliminar clientes del sistema SAS (SalesCustomer)
      await tx.salesCustomer.deleteMany({
        where: { organizationId: id },
      });

      // 15. Desactivar relaciones de clientes con esta organización
      // Nota: No eliminamos los clientes, solo desactivamos su relación con la organización
      await tx.customerOrganization.updateMany({
        where: { organizationId: id },
        data: { isActive: false },
      });

      // 16. Eliminar usuarios del sistema SAS (SalesUser)
      await tx.salesUser.deleteMany({
        where: { organizationId: id },
      });

      // 17. Eliminar miembros de organización
      await tx.organizationMember.deleteMany({
        where: { organizationId: id },
      });

      // Nota: Profile (system_users) no tiene relación directa con Organization,
      // por lo que no se eliminan perfiles aquí

      // 18. Eliminar gastos
      await tx.expense.deleteMany({
        where: { organizationId: id },
      });

      // 20. Eliminar cajas registradoras
      await tx.cashRegister.deleteMany({
        where: { organizationId: id },
      });

      // 21. Eliminar notificaciones
      await tx.notification.deleteMany({
        where: { organizationId: id },
      });

      // 22. Eliminar sesiones SAS
      await tx.sasSession.deleteMany({
        where: { organizationId: id },
      });

      // 23. Eliminar suscripciones
      await tx.subscription.deleteMany({
        where: { organizationId: id },
      });

      // 24. Eliminar la organización
      return tx.organization.delete({
        where: { id },
      });
    });
  }

  // Suspender organización
  static async suspendOrganization(id: string): Promise<Organization> {
    return prisma.organization.update({
      where: { id },
      data: { subscriptionStatus: OrganizationSubscriptionStatus.suspended },
    });
  }

  // Reactivar organización
  static async reactivateOrganization(id: string): Promise<Organization> {
    return prisma.organization.update({
      where: { id },
      data: { subscriptionStatus: OrganizationSubscriptionStatus.active },
    });
  }

  // Cambiar plan de suscripción
  static async changeSubscriptionPlan(
    id: string,
    planId: string
  ): Promise<Organization> {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new Error("Plan de suscripción no encontrado");
    }

    return prisma.organization.update({
      where: { id },
      data: {
        subscriptionPlanId: planId,
        subscriptionStatus: OrganizationSubscriptionStatus.active,
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      },
    });
  }

  // Obtener estadísticas de organizaciones
  static async getOrganizationStats() {
    const total = await prisma.organization.count();
    const active = await prisma.organization.count({
      where: { subscriptionStatus: OrganizationSubscriptionStatus.active },
    });
    const suspended = await prisma.organization.count({
      where: { subscriptionStatus: OrganizationSubscriptionStatus.suspended },
    });
    const trial = await prisma.organization.count({
      where: { subscriptionStatus: OrganizationSubscriptionStatus.trial },
    });

    return { total, active, suspended, trial };
  }

  // Buscar organizaciones
  static async searchOrganizations(
    query: string
  ): Promise<OrganizationWithPlan[]> {
    return prisma.organization.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { slug: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        subscriptionPlan: true,
        _count: {
          select: {
            organizationMembers: true,
            customerOrganizations: true,
            products: true,
            orders: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
