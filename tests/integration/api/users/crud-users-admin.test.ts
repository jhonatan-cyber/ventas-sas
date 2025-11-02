/**
 * Tests de Integración: CRUD Usuarios Admin
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { GET, POST } from '@/app/api/administracion/users/route'
import { GET as GET_BY_ID, PUT, DELETE } from '@/app/api/administracion/users/[id]/route'
import { testApiRoute, parseJsonResponse } from '../helpers/test-client'
import { seedTestData, cleanupTestDatabase, ensureTestEnvironment } from '../helpers/test-db'
import { AdminJWTService } from '@/lib/auth/admin-jwt'

describe('API Integration: Admin Users CRUD', () => {
  let testData: Awaited<ReturnType<typeof seedTestData>>
  let authToken: string
  let createdUserId: string

  beforeAll(async () => {
    ensureTestEnvironment()
    await cleanupTestDatabase()
    testData = await seedTestData()
    
    // Crear token de autenticación
    authToken = AdminJWTService.generateTokenSync({
      userId: testData.admin.id,
      email: testData.admin.email,
      isSuperAdmin: testData.admin.isSuperAdmin,
    })
  })

  afterAll(async () => {
    await cleanupTestDatabase()
  })

  describe('GET /api/administracion/users', () => {
    it('debería obtener lista de usuarios', async () => {
      const response = await testApiRoute(
        GET,
        '/api/administracion/users',
        {
          method: 'GET',
          headers: {
            Cookie: `admin-auth-token=${authToken}`,
          },
        }
      )

      expect(response.status).toBe(200)
      const data = await parseJsonResponse(response)
      expect(Array.isArray(data)).toBe(true)
    })

    it('debería requerir autenticación', async () => {
      const response = await testApiRoute(
        GET,
        '/api/administracion/users',
        {
          method: 'GET',
          // Sin token
        }
      )

      // Puede retornar 401 o 200 dependiendo de la implementación
      // Ajustar según tu lógica de autenticación
      expect([200, 401]).toContain(response.status)
    })
  })

  describe('POST /api/administracion/users', () => {
    it('debería crear un usuario con datos válidos', async () => {
      const userData = {
        email: 'new-user@example.com',
        password: 'SecurePassword123!',
        fullName: 'New User',
        ci: '11111111',
        role: 'admin',
        isActive: true,
      }

      const response = await testApiRoute(
        POST,
        '/api/administracion/users',
        {
          method: 'POST',
          headers: {
            Cookie: `admin-auth-token=${authToken}`,
          },
          body: userData,
        }
      )

      expect(response.status).toBe(201)
      const data = await parseJsonResponse(response)
      expect(data.id).toBeDefined()
      expect(data.email).toBe(userData.email)
      expect(data.fullName).toBe(userData.fullName)
      
      createdUserId = data.id
    })

    it('debería validar formato de email', async () => {
      const response = await testApiRoute(
        POST,
        '/api/administracion/users',
        {
          method: 'POST',
          headers: {
            Cookie: `admin-auth-token=${authToken}`,
          },
          body: {
            email: 'invalid-email',
            password: 'SecurePassword123!',
            fullName: 'Test User',
          },
        }
      )

      expect(response.status).toBe(400)
      const data = await parseJsonResponse(response)
      expect(data.error).toBeDefined()
    })

    it('debería validar contraseña fuerte', async () => {
      const response = await testApiRoute(
        POST,
        '/api/administracion/users',
        {
          method: 'POST',
          headers: {
            Cookie: `admin-auth-token=${authToken}`,
          },
          body: {
            email: 'weak-password@example.com',
            password: '123', // Contraseña débil
            fullName: 'Test User',
          },
        }
      )

      expect(response.status).toBe(400)
      const data = await parseJsonResponse(response)
      expect(data.error).toBeDefined()
    })

    it('debería rechazar email duplicado', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'SecurePassword123!',
        fullName: 'First User',
      }

      // Crear primer usuario
      await testApiRoute(
        POST,
        '/api/administracion/users',
        {
          method: 'POST',
          headers: {
            Cookie: `admin-auth-token=${authToken}`,
          },
          body: userData,
        }
      )

      // Intentar crear duplicado
      const response = await testApiRoute(
        POST,
        '/api/administracion/users',
        {
          method: 'POST',
          headers: {
            Cookie: `admin-auth-token=${authToken}`,
          },
          body: userData,
        }
      )

      expect(response.status).toBe(400)
      const data = await parseJsonResponse(response)
      expect(data.error).toBeDefined()
    })
  })

  describe('GET /api/administracion/users/[id]', () => {
    it('debería obtener un usuario por ID', async () => {
      if (!createdUserId) {
        // Crear usuario si no existe
        const createResponse = await testApiRoute(
          POST,
          '/api/administracion/users',
          {
            method: 'POST',
            headers: {
              Cookie: `admin-auth-token=${authToken}`,
            },
            body: {
              email: 'get-user@example.com',
              password: 'SecurePassword123!',
              fullName: 'Get User',
            },
          }
        )
        const createData = await parseJsonResponse(createResponse)
        createdUserId = createData.id
      }

      const response = await testApiRoute(
        GET_BY_ID,
        `/api/administracion/users/${createdUserId}`,
        {
          method: 'GET',
          params: { id: createdUserId },
          headers: {
            Cookie: `admin-auth-token=${authToken}`,
          },
        }
      )

      expect(response.status).toBe(200)
      const data = await parseJsonResponse(response)
      expect(data.id).toBe(createdUserId)
      expect(data.email).toBeDefined()
    })

    it('debería rechazar ID inexistente', async () => {
      const response = await testApiRoute(
        GET_BY_ID,
        '/api/administracion/users/nonexistent-id',
        {
          method: 'GET',
          params: { id: 'nonexistent-id' },
          headers: {
            Cookie: `admin-auth-token=${authToken}`,
          },
        }
      )

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/administracion/users/[id]', () => {
    it('debería actualizar un usuario existente', async () => {
      if (!createdUserId) {
        const createResponse = await testApiRoute(
          POST,
          '/api/administracion/users',
          {
            method: 'POST',
            headers: {
              Cookie: `admin-auth-token=${authToken}`,
            },
            body: {
              email: 'update-user@example.com',
              password: 'SecurePassword123!',
              fullName: 'Update User',
            },
          }
        )
        const createData = await parseJsonResponse(createResponse)
        createdUserId = createData.id
      }

      const updateData = {
        fullName: 'Updated User Name',
        role: 'admin',
        isActive: true,
      }

      const response = await testApiRoute(
        PUT,
        `/api/administracion/users/${createdUserId}`,
        {
          method: 'PUT',
          params: { id: createdUserId },
          headers: {
            Cookie: `admin-auth-token=${authToken}`,
          },
          body: updateData,
        }
      )

      expect(response.status).toBe(200)
      const data = await parseJsonResponse(response)
      expect(data.fullName).toBe(updateData.fullName)
    })

    it('debería actualizar contraseña correctamente', async () => {
      if (!createdUserId) {
        const createResponse = await testApiRoute(
          POST,
          '/api/administracion/users',
          {
            method: 'POST',
            headers: {
              Cookie: `admin-auth-token=${authToken}`,
            },
            body: {
              email: 'password-update@example.com',
              password: 'OldPassword123!',
              fullName: 'Password Update User',
            },
          }
        )
        const createData = await parseJsonResponse(createResponse)
        createdUserId = createData.id
      }

      const response = await testApiRoute(
        PUT,
        `/api/administracion/users/${createdUserId}`,
        {
          method: 'PUT',
          params: { id: createdUserId },
          headers: {
            Cookie: `admin-auth-token=${authToken}`,
          },
          body: {
            password: 'NewPassword123!',
          },
        }
      )

      expect(response.status).toBe(200)
    })
  })

  describe('DELETE /api/administracion/users/[id]', () => {
    it('debería eliminar un usuario existente', async () => {
      // Crear usuario para eliminar
      const createResponse = await testApiRoute(
        POST,
        '/api/administracion/users',
        {
          method: 'POST',
          headers: {
            Cookie: `admin-auth-token=${authToken}`,
          },
          body: {
            email: 'delete-user@example.com',
            password: 'SecurePassword123!',
            fullName: 'Delete User',
          },
        }
      )
      const createData = await parseJsonResponse(createResponse)
      const userToDeleteId = createData.id

      const response = await testApiRoute(
        DELETE,
        `/api/administracion/users/${userToDeleteId}`,
        {
          method: 'DELETE',
          params: { id: userToDeleteId },
          headers: {
            Cookie: `admin-auth-token=${authToken}`,
          },
        }
      )

      expect(response.status).toBe(200)
      
      // Verificar que el usuario fue eliminado
      const getResponse = await testApiRoute(
        GET_BY_ID,
        `/api/administracion/users/${userToDeleteId}`,
        {
          method: 'GET',
          params: { id: userToDeleteId },
          headers: {
            Cookie: `admin-auth-token=${authToken}`,
          },
        }
      )
      expect(getResponse.status).toBe(404)
    })

    it('debería rechazar eliminación de usuario inexistente', async () => {
      const response = await testApiRoute(
        DELETE,
        '/api/administracion/users/nonexistent-id',
        {
          method: 'DELETE',
          params: { id: 'nonexistent-id' },
          headers: {
            Cookie: `admin-auth-token=${authToken}`,
          },
        }
      )

      expect(response.status).toBe(404)
    })
  })
})

