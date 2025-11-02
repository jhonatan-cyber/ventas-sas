import { z } from 'zod'

/**
 * Validadores de autenticación
 */

// Login Admin
export const adminLoginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('El email no es válido')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
})

export type AdminLoginInput = z.infer<typeof adminLoginSchema>

// Login SAS
export const sasLoginSchema = z.object({
  ci: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim().length > 0,
      'El CI no puede estar vacío'
    ),
  correo: z
    .string()
    .email('El correo electrónico no es válido')
    .toLowerCase()
    .trim()
    .optional(),
  contraseña: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
}).refine(
  (data) => data.ci || data.correo,
  {
    message: 'CI o correo electrónico es requerido',
    path: ['ci'] // Error en el campo ci
  }
)

export type SasLoginInput = z.infer<typeof sasLoginSchema>

// Cambio de contraseña
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'La contraseña actual es requerida'),
  newPassword: z
    .string()
    .min(6, 'La nueva contraseña debe tener al menos 6 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
    ),
  confirmPassword: z
    .string()
    .min(1, 'La confirmación de contraseña es requerida')
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword']
  }
)

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

