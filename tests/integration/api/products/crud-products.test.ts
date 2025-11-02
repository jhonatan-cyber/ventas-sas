/**
 * Tests de Integración: CRUD Productos
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { GET, POST, PUT, DELETE } from '@/app/api/[slug]/productos/route'
import { GET as GET_BY_ID, PUT as PUT_BY_ID, DELETE as DELETE_BY_ID } from '@/app/api/[slug]/productos/[id]/route'
import { testApiRoute, parseJsonResponse } from '../helpers/test-client'
import { seedTestData, cleanupTestDatabase, ensureTestEnvironment } from '../helpers/test-db'
import { AdminJWTService } from '@/lib/auth/admin-jwt'

describe('API Integration: Products CRUD', () => {
  let testData: Awaited<ReturnType<typeof seedTestData>>
  let authToken: string
  let createdProductId: string

  beforeAll(async () => {
    ensureTestEnvironment()
    await cleanupTestDatabase()
    testData = await seedTestData()
    
    // Crear token de autenticación admin para pruebas
    const { prisma } = await import('@/lib/prisma')
    const admin = await prisma.profile.findUnique({
      where: { email: 'test-admin@example.com' },
    })
    
    if (admin) {
      authToken = AdminJWTService.generateTokenSync({
        userId: admin.id,
        email: admin.email,
        isSuperAdmin: admin.isSuperAdmin,
      })
    }
  })

  afterAll(async () => {
    await cleanupTestDatabase()
  })

  describe('GET /api/[slug]/productos', () => {
    it('debería obtener lista de productos vacía inicialmente', async () => {
      const response = await testApiRoute(
        GET,
        '/api/test-customer/productos',
        {
          method: 'GET',
          params: { slug: 'test-customer' },
        }
      )

      expect(response.status).toBe(200)
      const data = await parseJsonResponse(response)
      expect(data.products).toBeDefined()
      expect(Array.isArray(data.products)).toBe(true)
      expect(data.total).toBe(0)
    })

    it('debería soportar paginación', async () => {
      const response = await testApiRoute(
        GET,
        '/api/test-customer/productos',
        {
          method: 'GET',
          params: { slug: 'test-customer' },
          searchParams: {
            page: '1',
            pageSize: '10',
          },
        }
      )

      expect(response.status).toBe(200)
      const data = await parseJsonResponse(response)
      expect(data.page).toBe(1)
      expect(data.pageSize).toBe(10)
      expect(data.totalPages).toBeDefined()
    })

    it('debería rechazar slug inexistente', async () => {
      const response = await testApiRoute(
        GET,
        '/api/nonexistent-customer/productos',
        {
          method: 'GET',
          params: { slug: 'nonexistent-customer' },
        }
      )

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/[slug]/productos', () => {
    it('debería crear un producto con datos válidos', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Producto de prueba',
        price: 100.50,
        cost: 50.25,
        stock: 100,
        minStock: 10,
        sku: 'TEST-001',
      }

      const response = await testApiRoute(
        POST,
        '/api/test-customer/productos',
        {
          method: 'POST',
          params: { slug: 'test-customer' },
          body: productData,
        }
      )

      expect(response.status).toBe(201)
      const data = await parseJsonResponse(response)
      expect(data.id).toBeDefined()
      expect(data.name).toBe(productData.name)
      expect(data.price).toBe(productData.price)
      expect(data.stock).toBe(productData.stock)
      
      createdProductId = data.id
    })

    it('debería validar campos requeridos', async () => {
      const response = await testApiRoute(
        POST,
        '/api/test-customer/productos',
        {
          method: 'POST',
          params: { slug: 'test-customer' },
          body: {
            // name faltante
            price: 100,
          },
        }
      )

      expect(response.status).toBe(400)
      const data = await parseJsonResponse(response)
      expect(data.error).toBeDefined()
    })

    it('debería validar tipos de datos', async () => {
      const response = await testApiRoute(
        POST,
        '/api/test-customer/productos',
        {
          method: 'POST',
          params: { slug: 'test-customer' },
          body: {
            name: 'Test Product',
            price: 'invalid-number', // Debe ser número
            stock: 100,
          },
        }
      )

      expect(response.status).toBe(400)
      const data = await parseJsonResponse(response)
      expect(data.error).toBeDefined()
    })

    it('debería validar valores mínimos', async () => {
      const response = await testApiRoute(
        POST,
        '/api/test-customer/productos',
        {
          method: 'POST',
          params: { slug: 'test-customer' },
          body: {
            name: 'Test Product',
            price: -10, // Precio negativo
            stock: 100,
          },
        }
      )

      expect(response.status).toBe(400)
      const data = await parseJsonResponse(response)
      expect(data.error).toBeDefined()
    })
  })

  describe('GET /api/[slug]/productos/[id]', () => {
    it('debería obtener un producto por ID', async () => {
      if (!createdProductId) {
        // Crear producto si no existe
        const createResponse = await testApiRoute(
          POST,
          '/api/test-customer/productos',
          {
            method: 'POST',
            params: { slug: 'test-customer' },
            body: {
              name: 'Test Product GET',
              price: 100,
              stock: 50,
            },
          }
        )
        const createData = await parseJsonResponse(createResponse)
        createdProductId = createData.id
      }

      const response = await testApiRoute(
        GET_BY_ID,
        `/api/test-customer/productos/${createdProductId}`,
        {
          method: 'GET',
          params: { slug: 'test-customer', id: createdProductId },
        }
      )

      expect(response.status).toBe(200)
      const data = await parseJsonResponse(response)
      expect(data.id).toBe(createdProductId)
      expect(data.name).toBeDefined()
    })

    it('debería rechazar ID inexistente', async () => {
      const response = await testApiRoute(
        GET_BY_ID,
        '/api/test-customer/productos/nonexistent-id',
        {
          method: 'GET',
          params: { slug: 'test-customer', id: 'nonexistent-id' },
        }
      )

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/[slug]/productos/[id]', () => {
    it('debería actualizar un producto existente', async () => {
      if (!createdProductId) {
        const createResponse = await testApiRoute(
          POST,
          '/api/test-customer/productos',
          {
            method: 'POST',
            params: { slug: 'test-customer' },
            body: {
              name: 'Test Product PUT',
              price: 100,
              stock: 50,
            },
          }
        )
        const createData = await parseJsonResponse(createResponse)
        createdProductId = createData.id
      }

      const updateData = {
        name: 'Updated Product Name',
        price: 150.75,
        stock: 75,
      }

      const response = await testApiRoute(
        PUT_BY_ID,
        `/api/test-customer/productos/${createdProductId}`,
        {
          method: 'PUT',
          params: { slug: 'test-customer', id: createdProductId },
          body: updateData,
        }
      )

      expect(response.status).toBe(200)
      const data = await parseJsonResponse(response)
      expect(data.name).toBe(updateData.name)
      expect(data.price).toBe(updateData.price)
      expect(data.stock).toBe(updateData.stock)
    })

    it('debería rechazar actualización de producto inexistente', async () => {
      const response = await testApiRoute(
        PUT_BY_ID,
        '/api/test-customer/productos/nonexistent-id',
        {
          method: 'PUT',
          params: { slug: 'test-customer', id: 'nonexistent-id' },
          body: {
            name: 'Updated Name',
            price: 100,
            stock: 50,
          },
        }
      )

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/[slug]/productos/[id]', () => {
    it('debería eliminar un producto existente', async () => {
      // Crear producto para eliminar
      const createResponse = await testApiRoute(
        POST,
        '/api/test-customer/productos',
        {
          method: 'POST',
          params: { slug: 'test-customer' },
          body: {
            name: 'Product to Delete',
            price: 100,
            stock: 50,
          },
        }
      )
      const createData = await parseJsonResponse(createResponse)
      const productToDeleteId = createData.id

      const response = await testApiRoute(
        DELETE_BY_ID,
        `/api/test-customer/productos/${productToDeleteId}`,
        {
          method: 'DELETE',
          params: { slug: 'test-customer', id: productToDeleteId },
        }
      )

      expect(response.status).toBe(200)
      
      // Verificar que el producto fue eliminado
      const getResponse = await testApiRoute(
        GET_BY_ID,
        `/api/test-customer/productos/${productToDeleteId}`,
        {
          method: 'GET',
          params: { slug: 'test-customer', id: productToDeleteId },
        }
      )
      expect(getResponse.status).toBe(404)
    })

    it('debería rechazar eliminación de producto inexistente', async () => {
      const response = await testApiRoute(
        DELETE_BY_ID,
        '/api/test-customer/productos/nonexistent-id',
        {
          method: 'DELETE',
          params: { slug: 'test-customer', id: 'nonexistent-id' },
        }
      )

      expect(response.status).toBe(404)
    })
  })
})

