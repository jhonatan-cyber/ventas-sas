import { describe, it, expect } from 'vitest'
import { PasswordService } from '@/lib/auth/password'

describe('PasswordService', () => {
  describe('hashPassword', () => {
    it('debería generar un hash diferente para la misma contraseña', async () => {
      const password = 'TestPassword123!'
      const hash1 = await PasswordService.hashPassword(password)
      const hash2 = await PasswordService.hashPassword(password)

      expect(hash1).not.toBe(hash2)
      expect(hash1).toMatch(/^\$2[aby]\$/)
      expect(hash2).toMatch(/^\$2[aby]\$/)
    })

    it('debería generar hashes de longitud razonable', async () => {
      const password = 'TestPassword123!'
      const hash = await PasswordService.hashPassword(password)

      expect(hash.length).toBeGreaterThan(50)
      expect(hash.length).toBeLessThan(200)
    })

    it('debería manejar contraseñas vacías', async () => {
      const hash = await PasswordService.hashPassword('')
      expect(hash).toBeDefined()
      expect(hash).toMatch(/^\$2[aby]\$/)
    })
  })

  describe('verifyPassword', () => {
    it('debería verificar correctamente una contraseña válida', async () => {
      const password = 'TestPassword123!'
      const hash = await PasswordService.hashPassword(password)
      const isValid = await PasswordService.verifyPassword(password, hash)

      expect(isValid).toBe(true)
    })

    it('debería rechazar una contraseña incorrecta', async () => {
      const password = 'TestPassword123!'
      const wrongPassword = 'WrongPassword123!'
      const hash = await PasswordService.hashPassword(password)
      const isValid = await PasswordService.verifyPassword(wrongPassword, hash)

      expect(isValid).toBe(false)
    })

    it('debería rechazar cuando el hash es inválido', async () => {
      const password = 'TestPassword123!'
      const invalidHash = 'invalid_hash_string'
      const isValid = await PasswordService.verifyPassword(password, invalidHash)

      expect(isValid).toBe(false)
    })
  })

  describe('generateRandomPassword', () => {
    it('debería generar una contraseña de la longitud especificada', () => {
      const password = PasswordService.generateRandomPassword(16)
      expect(password.length).toBe(16)
    })

    it('debería generar una contraseña de 12 caracteres por defecto', () => {
      const password = PasswordService.generateRandomPassword()
      expect(password.length).toBe(12)
    })

    it('debería generar contraseñas diferentes cada vez', () => {
      const password1 = PasswordService.generateRandomPassword(16)
      const password2 = PasswordService.generateRandomPassword(16)

      expect(password1).not.toBe(password2)
    })

    it('debería incluir caracteres del charset especificado', () => {
      const password = PasswordService.generateRandomPassword(100)
      const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'

      for (const char of password) {
        expect(charset).toContain(char)
      }
    })
  })

  describe('validatePasswordStrength', () => {
    it('debería aceptar una contraseña fuerte', () => {
      const result = PasswordService.validatePasswordStrength('StrongPass123!')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('debería rechazar contraseñas menores a 8 caracteres', () => {
      const result = PasswordService.validatePasswordStrength('Short1!')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('La contraseña debe tener al menos 8 caracteres')
    })

    it('debería rechazar contraseñas sin mayúsculas', () => {
      const result = PasswordService.validatePasswordStrength('password123!')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('La contraseña debe contener al menos una letra mayúscula')
    })

    it('debería rechazar contraseñas sin minúsculas', () => {
      const result = PasswordService.validatePasswordStrength('PASSWORD123!')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('La contraseña debe contener al menos una letra minúscula')
    })

    it('debería rechazar contraseñas sin números', () => {
      const result = PasswordService.validatePasswordStrength('Password!')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('La contraseña debe contener al menos un número')
    })

    it('debería rechazar contraseñas sin caracteres especiales', () => {
      const result = PasswordService.validatePasswordStrength('Password123')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('La contraseña debe contener al menos un carácter especial')
    })

    it('debería acumular múltiples errores', () => {
      const result = PasswordService.validatePasswordStrength('weak')

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })
  })
})

