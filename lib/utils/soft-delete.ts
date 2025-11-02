/**
 * Utilidades para Soft Deletes
 * 
 * Proporciona helpers para trabajar con soft deletes en Prisma
 */

import { Prisma } from '@prisma/client'

/**
 * Agregar filtro de soft delete a un where clause
 */
export function excludeDeleted<T extends Prisma.JsonObject>(
  where: T
): T & { deletedAt: null } {
  return {
    ...where,
    deletedAt: null,
  }
}

/**
 * Incluir elementos eliminados (soft deleted)
 */
export function includeDeleted<T extends Prisma.JsonObject>(
  where: T
): T & { deletedAt?: { not: null } | null } {
  return {
    ...where,
    deletedAt: { not: null },
  }
}

/**
 * Incluir todos (eliminados y no eliminados)
 */
export function includeAll<T extends Prisma.JsonObject>(
  where: T
): T {
  return where
}

/**
 * Crear operación de soft delete
 */
export function createSoftDeleteData(): { deletedAt: Date } {
  return {
    deletedAt: new Date(),
  }
}

/**
 * Crear operación de restore (deshacer soft delete)
 */
export function createRestoreData(): { deletedAt: null } {
  return {
    deletedAt: null,
  }
}

/**
 * Verificar si un objeto está soft deleted
 */
export function isSoftDeleted(obj: { deletedAt?: Date | null }): boolean {
  return obj.deletedAt !== null && obj.deletedAt !== undefined
}

