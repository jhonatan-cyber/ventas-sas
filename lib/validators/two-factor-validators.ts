/**
 * Validadores Zod para autenticación de dos factores (2FA)
 */

import { z } from 'zod'

/**
 * Validación para código TOTP (6 dígitos)
 */
export const totpCodeSchema = z
  .string()
  .length(6, 'El código debe tener 6 dígitos')
  .regex(/^\d{6}$/, 'El código debe contener solo números')

/**
 * Validación para backup code (8 dígitos)
 */
export const backupCodeSchema = z
  .string()
  .length(8, 'El código de respaldo debe tener 8 dígitos')
  .regex(/^\d{8}$/, 'El código de respaldo debe contener solo números')

/**
 * Validación para código 2FA (puede ser TOTP o backup code)
 */
export const twoFactorCodeSchema = z
  .string()
  .min(6, 'El código debe tener al menos 6 dígitos')
  .max(8, 'El código no puede tener más de 8 dígitos')
  .regex(/^\d+$/, 'El código debe contener solo números')

/**
 * Schema para verificar código durante setup
 */
export const verifySetupSchema = z.object({
  code: totpCodeSchema,
})

/**
 * Schema para verificar código durante login
 */
export const verifyTwoFactorSchema = z.object({
  code: twoFactorCodeSchema,
  tempToken: z.string().min(1, 'Token temporal requerido'),
})

/**
 * Schema para deshabilitar 2FA (requiere contraseña)
 */
export const disableTwoFactorSchema = z.object({
  password: z.string().min(1, 'La contraseña es requerida'),
})

