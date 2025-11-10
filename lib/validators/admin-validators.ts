import { z } from 'zod'
import { SubscriptionBillingPeriod, SubscriptionStatus } from '@prisma/client'

/**
 * Validadores para el sistema de administración
 */

// Cliente (Admin) - Solo datos personales. Razón social y NIT se manejan en Organization
export const createCustomerSchema = z.object({
  ci: z
    .string()
    .min(1, 'El CI es requerido')
    .max(20, 'El CI es demasiado largo')
    .regex(/^\d+$/, 'El CI solo puede contener números'),
  nombre: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre es demasiado largo')
    .trim()
    .optional()
    .nullable(),
  apellido: z
    .string()
    .max(100, 'El apellido es demasiado largo')
    .trim()
    .optional()
    .nullable(),
  address: z
    .string()
    .max(500, 'La dirección es demasiado larga')
    .optional()
    .nullable(),
  phone: z
    .string()
    .max(20, 'El teléfono es demasiado largo')
    .regex(/^[\d\s\-\+\(\)]+$/, 'El teléfono contiene caracteres inválidos')
    .optional()
    .nullable(),
  email: z
    .string()
    .email('El email no es válido')
    .toLowerCase()
    .optional()
    .nullable()
})

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  ci: z
    .string()
    .max(20, 'El CI es demasiado largo')
    .regex(/^\d+$/, 'El CI solo puede contener números')
    .optional()
    .nullable(),
  isActive: z.boolean().optional()
})

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>

// Usuario Admin
export const createUserSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('El email no es válido')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña es demasiado larga'),
  fullName: z
    .string()
    .min(1, 'El nombre completo es requerido')
    .max(200, 'El nombre es demasiado largo')
    .trim(),
  role: z
    .string()
    .max(50, 'El rol es demasiado largo')
    .default('user'),
  isSuperAdmin: z
    .boolean()
    .default(false),
  isActive: z
    .boolean()
    .default(true),
  address: z
    .string()
    .max(500, 'La dirección es demasiado larga')
    .optional()
    .nullable(),
  phone: z
    .string()
    .max(20, 'El teléfono es demasiado largo')
    .regex(/^[\d\s\-\+\(\)]+$/, 'El teléfono contiene caracteres inválidos')
    .optional()
    .nullable(),
  ci: z
    .string()
    .max(20, 'El CI es demasiado largo')
    .regex(/^\d+$/, 'El CI solo puede contener números')
    .optional()
    .nullable(),
  photo: z
    .string()
    .max(500, 'La URL de la foto es demasiado larga')
    .optional()
    .nullable()
})

export type CreateUserInput = z.infer<typeof createUserSchema>

export const updateUserSchema = createUserSchema.partial().extend({
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña es demasiado larga')
    .optional()
    .nullable()
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>

// Plan de Suscripción
const subscriptionPlanBaseSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre del plan es requerido')
    .max(100, 'El nombre es demasiado largo')
    .trim(),
  description: z
    .string()
    .max(1000, 'La descripción es demasiado larga')
    .optional()
    .nullable(),
  hasMonthly: z
    .boolean()
    .default(false),
  hasYearly: z
    .boolean()
    .default(false),
  priceMonthly: z
    .number()
    .nonnegative('El precio mensual no puede ser negativo')
    .max(999999.99, 'El precio mensual máximo es 999,999.99')
    .optional()
    .nullable(),
  priceYearly: z
    .number()
    .nonnegative('El precio anual no puede ser negativo')
    .max(9999999.99, 'El precio anual máximo es 9,999,999.99')
    .optional()
    .nullable(),
  features: z
    .array(z.string())
    .optional()
    .nullable(),
  modules: z
    .array(z.string())
    .optional()
    .nullable(),
  maxUsers: z
    .number()
    .int('El máximo de usuarios debe ser un número entero')
    .positive('El máximo de usuarios debe ser mayor a 0')
    .optional()
    .nullable(),
  maxProducts: z
    .number()
    .int('El máximo de productos debe ser un número entero')
    .positive('El máximo de productos debe ser mayor a 0')
    .optional()
    .nullable(),
  maxBranches: z
    .number()
    .int('El máximo de sucursales debe ser un número entero')
    .positive('El máximo de sucursales debe ser mayor a 0')
    .optional()
    .nullable(),
  isActive: z
    .boolean()
    .default(true)
})

export const createSubscriptionPlanSchema = subscriptionPlanBaseSchema.refine(
  (data) => data.hasMonthly || data.hasYearly,
  {
    message: 'Debe habilitarse al menos un período (mensual o anual)',
    path: ['hasMonthly']
  }
)

export type CreateSubscriptionPlanInput = z.infer<typeof createSubscriptionPlanSchema>

export const updateSubscriptionPlanSchema = subscriptionPlanBaseSchema.partial()

export type UpdateSubscriptionPlanInput = z.infer<typeof updateSubscriptionPlanSchema>

// Suscripción
const subscriptionBaseSchema = z.object({
  organizationId: z
    .string()
    .uuid('El ID de organización no es válido'),
  planId: z
    .string()
    .uuid('El ID del plan no es válido'),
  billingPeriod: z
    .nativeEnum(SubscriptionBillingPeriod)
    .default(SubscriptionBillingPeriod.monthly),
  status: z
    .nativeEnum(SubscriptionStatus)
    .default(SubscriptionStatus.active),
  autoRenew: z
    .boolean()
    .default(true),
  startDate: z
    .string()
    .datetime('La fecha de inicio no es válida')
    .optional(),
  endDate: z
    .string()
    .datetime('La fecha de fin no es válida')
    .optional()
    .nullable()
})

export const createSubscriptionSchema = subscriptionBaseSchema

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>

export const updateSubscriptionSchema = subscriptionBaseSchema.partial()

export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>

// Rol Admin
export const createRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre del rol es requerido')
    .max(100, 'El nombre es demasiado largo')
    .trim(),
  description: z
    .string()
    .max(500, 'La descripción es demasiado larga')
    .optional()
    .nullable(),
  permissions: z
    .array(z.string())
    .optional()
    .nullable(),
  isActive: z
    .boolean()
    .default(true)
})

export type CreateRoleInput = z.infer<typeof createRoleSchema>

export const updateRoleSchema = createRoleSchema.partial()

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>

// Rol SAS
export const createRoleSasSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre del rol es requerido')
    .max(100, 'El nombre es demasiado largo')
    .trim(),
  descripcion: z
    .string()
    .max(500, 'La descripción es demasiado larga')
    .optional()
    .nullable()
})

export type CreateRoleSasInput = z.infer<typeof createRoleSasSchema>

export const updateRoleSasSchema = createRoleSasSchema.partial()

export type UpdateRoleSasInput = z.infer<typeof updateRoleSasSchema>

