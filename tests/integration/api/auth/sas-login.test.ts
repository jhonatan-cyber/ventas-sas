/**
 * Tests de Integración: Login SAS
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { POST } from '@/app/api/[slug]/login/route'
import { testApiRoute, parseJsonResponse } from '../helpers/test-client'
import { seedTestData, cleanupTestDatabase, ensureTestEnvironment } from '../helpers/test-db'

describe('API Integration: SAS Login', () => {
  let testData: Awaited<ReturnType<typeof seedTestData>>

  beforeAll(async () => {
    ensureTestEnvironment()
    await cleanupTestDatabase()
    testData = await seedTestData()
  })

  afterAll(async () => {
    await cleanupTestDatabase()
  })

  describe('POST /api/[slug]/login', () => {
    it('debería hacer login exitoso con CI y contraseña', async () => {
      const response = await testApiRoute(
        POST,
        '/api/test-customer/login',
        {
          method: 'POST',
          params: { slug: 'test-customer' },
          body: {
            ci: '87654321',
            contraseña: 'Test123!',
          },
        }
      )

      expect(response.status).toBe(200)
      const data = await parseJsonResponse(response)
      expect(data.success).toBe(true)
      expect(data.user).toBeDefined()
      expect(data.token).toBeDefined()
    })

    it('debería hacer login exitoso con correo y contraseña', async () => {
      const response = await testApiRoute(
        POST,
        '/api/test-customer/login',
        {
          method: 'POST',
          params: { slug: 'test-customer' },
          body: {
            correo: 'test-usuario@example.com',
            contraseña: 'Test123!',
          },
        }
      )

      expect(response.status).toBe(200)
      const data = await parseJsonResponse(response)
      expect(data.success).toBe(true)
    })

    it('debería rechazar login con contraseña incorrecta', async () => {
      const response = await testApiRoute(
        POST,
        '/api/test-customer/login',
        {
          method: 'POST',
          params: { slug: 'test-customer' },
          body: {
            ci: '87654321',
            contraseña: 'WrongPassword123!',
          },
        }
      )

      expect(response.status).toBe(401)
      const data = await parseJsonResponse(response)
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })

    it('debería rechazar login con CI inexistente', async () => {
      const response = await testApiRoute(
        POST,
        '/api/test-customer/login',
        {
          method: 'POST',
          params: { slug: 'test-customer' },
          body: {
            ci: '99999999',
            contraseña: 'Test123!',
          },
        }
      )

      expect(response.status).toBe(401)
      const data = await parseJsonResponse(response)
      expect(data.success).toBe(false)
    })

    it('debería rechazar login con slug de cliente inexistente', async () => {
      const response = await testApiRoute(
        POST,
        '/api/nonexistent-customer/login',
        {
          method: 'POST',
          params: { slug: 'nonexistent-customer' },
          body: {
            ci: '87654321',
            contraseña: 'Test123!',
          },
        }
      )

      expect(response.status).toBe(404)
      const data = await parseJsonResponse(response)
      expect(data.error).toBeDefined()
    })

    it('debería validar datos requeridos', async () => {
      const response = await testApiRoute(
        POST,
        '/api/test-customer/login',
        {
          method: 'POST',
          params: { slug: 'test-customer' },
          body: {
            // ci y contraseña faltantes
          },
        }
      )

      expect(response.status).toBe(400)
      const data = await parseJsonResponse(response)
      expect(data.error).toBeDefined()
    })

    it('debería incluir token y sesión en cookies', async () => {
      const response = await testApiRoute(
        POST,
        '/api/test-customer/login',
        {
          method: 'POST',
          params: { slug: 'test-customer' },
          body: {
            ci: '87654321',
            contraseña: 'Test123!',
          },
        }
      )

      expect(response.status).toBe(200)
      const setCookie = response.headers.get('set-cookie')
      expect(setCookie).toContain('sas-auth-token')
      expect(setCookie).toContain('sas-session')
    })

    it('debería rechazar usuario inactivo', async () => {
      const { prisma } = await import('@/lib/prisma')
      await prisma.usuarioSas.update({
        where: { ci: '87654321' },
        data: { isActive: false },
      })

      const response = await testApiRoute(
        POST,
        '/api/test-customer/login',
        {
          method: 'POST',
          params: { slug: 'test-customer' },
          body: {
            ci: '87654321',
            contraseña: 'Test123!',
          },
        }
      )

      expect(response.status).toBe(401)
      const data = await parseJsonResponse(response)
      expect(data.success).toBe(false)

      // Reactivar
      await prisma.usuarioSas.update({
        where: { ci: '87654321' },
        data: { isActive: true },
      })
    })
  })
})

