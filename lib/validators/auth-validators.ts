import { z } from 'zod'

/**
 * Validadores de autenticación
 */

// Login Admin
export const adminLoginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email o CI es requerido')
    .trim()
    .refine(
      (val) => {
        // Validar que sea un email válido O un CI (solo números)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const ciRegex = /^\d+$/
        return emailRegex.test(val) || ciRegex.test(val)
      },
      'Debe ser un email válido o un CI (solo números)'
    ),
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
  email: z
    .string()
    .email('El correo electrónico no es válido')
    .toLowerCase()
    .trim()
    .optional(),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
}).refine(
  (data) => data.ci || data.email,
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

