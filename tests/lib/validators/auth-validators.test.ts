import { describe, it, expect } from 'vitest'

import { adminLoginSchema, sasLoginSchema, changePasswordSchema } from '@/lib/validators/auth-validators'

describe('auth-validators', () => {
  describe('adminLoginSchema', () => {
    it('debería validar un login válido', () => {
      const validData = {
        email: 'admin@example.com',
        password: 'Password123',
      }

      const result = adminLoginSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('admin@example.com')
      }
    })

    it('debería normalizar el email a minúsculas', () => {
      const data = {
        email: 'ADMIN@EXAMPLE.COM',
        password: 'Password123',
      }

      const result = adminLoginSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('admin@example.com')
      }
    })

    it('debería rechazar email inválido', () => {
      const data = {
        email: 'invalid-email',
        password: 'Password123',
      }

      const result = adminLoginSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('debería rechazar email vacío', () => {
      const data = {
        email: '',
        password: 'Password123',
      }

      const result = adminLoginSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('debería rechazar contraseña menor a 6 caracteres', () => {
      const data = {
        email: 'admin@example.com',
        password: 'Pass1',
      }

      const result = adminLoginSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('debería rechazar contraseña vacía', () => {
      const data = {
        email: 'admin@example.com',
        password: '',
      }

      const result = adminLoginSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('sasLoginSchema', () => {
    it('debería validar login con CI', () => {
      const validData = {
        ci: '12345678',
        contraseña: 'Password123',
      }

      const result = sasLoginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('debería validar login con correo', () => {
      const validData = {
        email: 'user@example.com',
        password: 'Password123',
      }

      const result = sasLoginSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('user@example.com')
      }
    })

    it('debería validar login con CI y correo', () => {
      const validData = {
        ci: '12345678',
        email: 'user@example.com',
        password: 'Password123',
      }

      const result = sasLoginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('debería rechazar cuando no hay CI ni correo', () => {
      const data = {
        password: 'Password123',
      }

      const result = sasLoginSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('debería rechazar correo inválido', () => {
      const data = {
        email: 'invalid-email',
        password: 'Password123',
      }

      const result = sasLoginSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('debería rechazar CI vacío', () => {
      const data = {
        ci: '   ',
        password: 'Password123',
      }

      const result = sasLoginSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('debería rechazar contraseña menor a 6 caracteres', () => {
      const data = {
        ci: '12345678',
        password: 'Pass1',
      }

      const result = sasLoginSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('debería normalizar correo a minúsculas', () => {
      const data = {
        email: 'USER@EXAMPLE.COM',
        password: 'Password123',
      }

      const result = sasLoginSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('user@example.com')
      }
    })
  })

  describe('changePasswordSchema', () => {
    it('debería validar cambio de contraseña válido', () => {
      const validData = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      }

      const result = changePasswordSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('debería rechazar cuando las contraseñas no coinciden', () => {
      const data = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword123',
        confirmPassword: 'DifferentPassword123',
      }

      const result = changePasswordSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        const error = result.error.errors.find((e) => e.path.includes('confirmPassword'))
        expect(error).toBeDefined()
      }
    })

    it('debería rechazar nueva contraseña menor a 6 caracteres', () => {
      const data = {
        currentPassword: 'OldPassword123',
        newPassword: 'New1',
        confirmPassword: 'New1',
      }

      const result = changePasswordSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('debería rechazar nueva contraseña sin requisitos de complejidad', () => {
      const data = {
        currentPassword: 'OldPassword123',
        newPassword: 'simple',
        confirmPassword: 'simple',
      }

      const result = changePasswordSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('debería aceptar contraseña con mayúscula, minúscula y número', () => {
      const data = {
        currentPassword: 'OldPassword123',
        newPassword: 'ValidPass123',
        confirmPassword: 'ValidPass123',
      }

      const result = changePasswordSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('debería rechazar contraseña actual vacía', () => {
      const data = {
        currentPassword: '',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      }

      const result = changePasswordSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('debería rechazar confirmación de contraseña vacía', () => {
      const data = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword123',
        confirmPassword: '',
      }

      const result = changePasswordSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })
})

