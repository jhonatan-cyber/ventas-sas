import { NextRequest } from 'next/server'
import { describe, it, expect, beforeEach } from 'vitest'

import { checkRateLimit, getRateLimitKey, rateLimitConfigs, rateLimiter } from '@/lib/utils/rate-limit'

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Limpiar el rate limiter antes de cada test
    rateLimiter.reset('test-key-1')
    rateLimiter.reset('test-key-2')
  })

  describe('getRateLimitKey', () => {
    it('debería generar una clave única basada en IP y identificador', () => {
      const mockRequest = {
        ip: '192.168.1.1',
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return '192.168.1.1'
            return null
          },
        },
      } as unknown as NextRequest

      const key1 = getRateLimitKey(mockRequest, 'login_user123')
      const key2 = getRateLimitKey(mockRequest, 'login_user456')

      // El formato real es 'rate_limit:identifier:ip'
      expect(key1).toContain('rate_limit')
      expect(key1).toContain('login_user123')
      expect(key1).toContain('192.168.1.1')
      expect(key2).toContain('rate_limit')
      expect(key2).toContain('login_user456')
      expect(key1).not.toBe(key2)
    })

    it('debería usar x-forwarded-for si está disponible', () => {
      const mockRequest = {
        ip: undefined, // No hay IP directa, debe usar x-forwarded-for
        headers: {
          get: (name: string) => {
            if (name === 'x-forwarded-for') return '10.0.0.1, 192.168.1.1'
            return null
          },
        },
      } as unknown as NextRequest

      const key = getRateLimitKey(mockRequest, 'login')
      // Verificar que contiene la primera IP de x-forwarded-for
      expect(key).toContain('10.0.0.1')
      expect(key).toContain('login')
    })

    it('debería usar IP desconocida si no hay IP disponible', () => {
      const mockRequest = {
        ip: undefined,
        headers: {
          get: () => null,
        },
      } as unknown as NextRequest

      const key = getRateLimitKey(mockRequest, 'login')
      expect(key).toContain('unknown')
      expect(key).toContain('login')
    })
  })

  describe('checkRateLimit', () => {
    it('debería permitir requests dentro del límite', async () => {
      const key = 'test-key-1'
      const limit = 5
      const windowMs = 60000 // 1 minuto

      // Realizar 3 requests (dentro del límite de 5)
      for (let i = 0; i < 3; i++) {
        const result = await checkRateLimit(key, limit, windowMs)
        expect(result.allowed).toBe(true)
      }
    })

    it('debería bloquear requests cuando se excede el límite', async () => {
      const key = 'test-key-2'
      const limit = 3
      const windowMs = 60000

      // Realizar requests hasta el límite
      for (let i = 0; i < limit; i++) {
        const result = await checkRateLimit(key, limit, windowMs)
        expect(result.allowed).toBe(true)
      }

      // El siguiente request debería ser bloqueado
      const blockedResult = await checkRateLimit(key, limit, windowMs)
      expect(blockedResult.allowed).toBe(false)
      expect(blockedResult.remaining).toBe(0)
    })

    it('debería retornar remaining attempts correctamente', async () => {
      const key = 'test-key-1'
      const limit = 5
      const windowMs = 60000

      const result1 = await checkRateLimit(key, limit, windowMs)
      expect(result1.remaining).toBe(4)

      const result2 = await checkRateLimit(key, limit, windowMs)
      expect(result2.remaining).toBe(3)
    })

    it('debería incluir resetTime cuando está bloqueado', async () => {
      const key = 'test-key-2'
      const limit = 2
      const windowMs = 60000

      // Exceder el límite
      await checkRateLimit(key, limit, windowMs)
      await checkRateLimit(key, limit, windowMs)
      const blocked = await checkRateLimit(key, limit, windowMs)

      expect(blocked.allowed).toBe(false)
      expect(blocked.resetTime).toBeDefined()
      expect(blocked.resetTime).toBeGreaterThan(Date.now())
    })
  })

  describe('rateLimitConfigs', () => {
    it('debería tener configuración para login', () => {
      const loginConfig = rateLimitConfigs.login

      expect(loginConfig).toBeDefined()
      expect(loginConfig.limit).toBeGreaterThan(0)
      expect(loginConfig.windowMs).toBeGreaterThan(0)
      expect(loginConfig.message).toBeDefined()
    })
  })

  describe('rateLimiter', () => {
    it('debería resetear el contador correctamente', async () => {
      const key = 'test-reset-key'
      const limit = 3
      const windowMs = 60000

      // Exceder el límite
      await checkRateLimit(key, limit, windowMs)
      await checkRateLimit(key, limit, windowMs)
      await checkRateLimit(key, limit, windowMs)

      const blocked = await checkRateLimit(key, limit, windowMs)
      expect(blocked.allowed).toBe(false)

      // Resetear
      rateLimiter.reset(key)

      // Ahora debería permitir de nuevo
      const allowed = await checkRateLimit(key, limit, windowMs)
      expect(allowed.allowed).toBe(true)
    })
  })
})

