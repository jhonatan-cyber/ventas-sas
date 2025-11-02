/**
 * Tests de Integración: Login Admin
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { POST } from '@/app/api/administracion/login/route'
import { testApiRoute, parseJsonResponse, createTestRequest } from '../helpers/test-client'
import { seedTestData, cleanupTestDatabase, ensureTestEnvironment } from '../helpers/test-db'

describe('API Integration: Admin Login', () => {
  let testData: Awaited<ReturnType<typeof seedTestData>>

  beforeAll(async () => {
    ensureTestEnvironment()
    await cleanupTestDatabase()
    testData = await seedTestData()
  })

  afterAll(async () => {
    await cleanupTestDatabase()
  })

  describe('POST /api/administracion/login', () => {
    it('debería hacer login exitoso con credenciales válidas', async () => {
      const response = await testApiRoute(
        POST,
        '/api/administracion/login',
        {
          method: 'POST',
          body: {
            email: 'test-admin@example.com',
            password: 'Test123!',
          },
        }
      )

      expect(response.status).toBe(200)
      const data = await parseJsonResponse(response)
      expect(data.success).toBe(true)
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe('test-admin@example.com')
      expect(data.token).toBeDefined()
    })

    it('debería rechazar login con contraseña incorrecta', async () => {
      const response = await testApiRoute(
        POST,
        '/api/administracion/login',
        {
          method: 'POST',
          body: {
            email: 'test-admin@example.com',
            password: 'WrongPassword123!',
          },
        }
      )

      expect(response.status).toBe(401)
      const data = await parseJsonResponse(response)
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })

    it('debería rechazar login con email inexistente', async () => {
      const response = await testApiRoute(
        POST,
        '/api/administracion/login',
        {
          method: 'POST',
          body: {
            email: 'nonexistent@example.com',
            password: 'Test123!',
          },
        }
      )

      expect(response.status).toBe(401)
      const data = await parseJsonResponse(response)
      expect(data.success).toBe(false)
    })

    it('debería validar datos requeridos', async () => {
      const response = await testApiRoute(
        POST,
        '/api/administracion/login',
        {
          method: 'POST',
          body: {
            email: 'test-admin@example.com',
            // password faltante
          },
        }
      )

      expect(response.status).toBe(400)
      const data = await parseJsonResponse(response)
      expect(data.error).toBeDefined()
    })

    it('debería validar formato de email', async () => {
      const response = await testApiRoute(
        POST,
        '/api/administracion/login',
        {
          method: 'POST',
          body: {
            email: 'invalid-email',
            password: 'Test123!',
          },
        }
      )

      expect(response.status).toBe(400)
      const data = await parseJsonResponse(response)
      expect(data.error).toBeDefined()
    })

    it('debería rechazar login con usuario inactivo', async () => {
      // Desactivar usuario
      const { prisma } = await import('@/lib/prisma')
      await prisma.profile.update({
        where: { email: 'test-admin@example.com' },
        data: { isActive: false },
      })

      const response = await testApiRoute(
        POST,
        '/api/administracion/login',
        {
          method: 'POST',
          body: {
            email: 'test-admin@example.com',
            password: 'Test123!',
          },
        }
      )

      expect(response.status).toBe(401)
      const data = await parseJsonResponse(response)
      expect(data.success).toBe(false)

      // Reactivar para otros tests
      await prisma.profile.update({
        where: { email: 'test-admin@example.com' },
        data: { isActive: true },
      })
    })

    it('debería incluir token en cookie', async () => {
      const response = await testApiRoute(
        POST,
        '/api/administracion/login',
        {
          method: 'POST',
          body: {
            email: 'test-admin@example.com',
            password: 'Test123!',
          },
        }
      )

      expect(response.status).toBe(200)
      const setCookie = response.headers.get('set-cookie')
      expect(setCookie).toContain('admin-auth-token')
    })
  })
})

