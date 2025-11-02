/**
 * Tests de Integración: CRUD Ventas
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { GET, POST } from '@/app/api/[slug]/ventas/route'
import { GET as GET_BY_ID, PUT, DELETE } from '@/app/api/[slug]/ventas/[id]/route'
import { testApiRoute, parseJsonResponse } from '../helpers/test-client'
import { seedTestData, cleanupTestDatabase, ensureTestEnvironment } from '../helpers/test-db'
import { AuthSasService } from '@/lib/services/sales/auth-sas-service'

describe('API Integration: Sales CRUD', () => {
  let testData: Awaited<ReturnType<typeof seedTestData>>
  let authToken: string
  let createdSaleId: string
  let testProductId: string

  beforeAll(async () => {
    ensureTestEnvironment()
    await cleanupTestDatabase()
    testData = await seedTestData()
    
    // Crear producto de prueba para las ventas
    const { prisma } = await import('@/lib/prisma')
    const product = await prisma.salesProduct.create({
      data: {
        customerId: testData.customer.id,
        name: 'Test Product for Sale',
        price: 100,
        cost: 50,
        stock: 1000,
        minStock: 10,
      },
    })
    testProductId = product.id

    // Crear token de autenticación SAS usando SasJWTService
    const { SasJWTService } = await import('@/lib/auth/sas-jwt')
    authToken = SasJWTService.generateTokenSync({
      userId: testData.usuarioSas.id,
      customerId: testData.customer.id,
    })
  })

  afterAll(async () => {
    await cleanupTestDatabase()
  })

  describe('GET /api/[slug]/ventas', () => {
    it('debería obtener lista de ventas vacía inicialmente', async () => {
      const response = await testApiRoute(
        GET,
        '/api/test-customer/ventas',
        {
          method: 'GET',
          params: { slug: 'test-customer' },
          cookies: {
            'sas-auth-token': authToken,
          },
        }
      )

      expect(response.status).toBe(200)
      const data = await parseJsonResponse(response)
      expect(data.sales).toBeDefined()
      expect(Array.isArray(data.sales)).toBe(true)
      expect(data.total).toBe(0)
    })

    it('debería soportar paginación', async () => {
      const response = await testApiRoute(
        GET,
        '/api/test-customer/ventas',
        {
          method: 'GET',
          params: { slug: 'test-customer' },
          searchParams: {
            page: '1',
            pageSize: '10',
          },
          cookies: {
            'sas-auth-token': authToken,
          },
        }
      )

      expect(response.status).toBe(200)
      const data = await parseJsonResponse(response)
      expect(data.page).toBe(1)
      expect(data.pageSize).toBe(10)
      expect(data.totalPages).toBeDefined()
    })
  })

  describe('POST /api/[slug]/ventas', () => {
    it('debería crear una venta con datos válidos', async () => {
      const saleData = {
        items: [
          {
            productId: testProductId,
            quantity: 2,
            unitPrice: 100,
            subtotal: 200,
          },
        ],
        subtotal: 200,
        discount: 0,
        total: 200,
        paymentMethod: 'cash',
        status: 'completed',
      }

      const response = await testApiRoute(
        POST,
        '/api/test-customer/ventas',
        {
          method: 'POST',
          params: { slug: 'test-customer' },
          cookies: {
            'sas-auth-token': authToken,
          },
          body: saleData,
        }
      )

      expect(response.status).toBe(201)
      const data = await parseJsonResponse(response)
      expect(data.id).toBeDefined()
      expect(data.saleNumber).toBeDefined()
      expect(data.total).toBe(saleData.total)
      expect(data.items).toBeDefined()
      expect(data.items.length).toBe(1)
      
      createdSaleId = data.id
    })

    it('debería validar que haya items', async () => {
      const response = await testApiRoute(
        POST,
        '/api/test-customer/ventas',
        {
          method: 'POST',
          params: { slug: 'test-customer' },
          cookies: {
            'sas-auth-token': authToken,
          },
          body: {
            items: [], // Sin items
            subtotal: 0,
            total: 0,
          },
        }
      )

      expect(response.status).toBe(400)
      const data = await parseJsonResponse(response)
      expect(data.error).toBeDefined()
    })

    it('debería calcular totales correctamente', async () => {
      const saleData = {
        items: [
          {
            productId: testProductId,
            quantity: 3,
            unitPrice: 50,
            subtotal: 150,
          },
        ],
        subtotal: 150,
        discount: 10,
        total: 140, // 150 - 10
        paymentMethod: 'cash',
      }

      const response = await testApiRoute(
        POST,
        '/api/test-customer/ventas',
        {
          method: 'POST',
          params: { slug: 'test-customer' },
          cookies: {
            'sas-auth-token': authToken,
          },
          body: saleData,
        }
      )

      expect(response.status).toBe(201)
      const data = await parseJsonResponse(response)
      expect(Number(data.total)).toBe(saleData.total)
    })

    it('debería requerir autenticación', async () => {
      const response = await testApiRoute(
        POST,
        '/api/test-customer/ventas',
        {
          method: 'POST',
          params: { slug: 'test-customer' },
          // Sin token
          body: {
            items: [
              {
                productId: testProductId,
                quantity: 1,
                unitPrice: 100,
                subtotal: 100,
              },
            ],
            subtotal: 100,
            total: 100,
          },
        }
      )

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/[slug]/ventas/[id]', () => {
    it('debería obtener una venta por ID', async () => {
      if (!createdSaleId) {
        // Crear venta si no existe
        const createResponse = await testApiRoute(
          POST,
          '/api/test-customer/ventas',
          {
            method: 'POST',
            params: { slug: 'test-customer' },
            cookies: {
              'sas-auth-token': authToken,
            },
            body: {
              items: [
                {
                  productId: testProductId,
                  quantity: 1,
                  unitPrice: 100,
                  subtotal: 100,
                },
              ],
              subtotal: 100,
              total: 100,
            },
          }
        )
        const createData = await parseJsonResponse(createResponse)
        createdSaleId = createData.id
      }

      const response = await testApiRoute(
        GET_BY_ID,
        `/api/test-customer/ventas/${createdSaleId}`,
        {
          method: 'GET',
          params: { slug: 'test-customer', id: createdSaleId },
        }
      )

      expect(response.status).toBe(200)
      const data = await parseJsonResponse(response)
      expect(data.id).toBe(createdSaleId)
      expect(data.items).toBeDefined()
    })

    it('debería rechazar ID inexistente', async () => {
      const response = await testApiRoute(
        GET_BY_ID,
        '/api/test-customer/ventas/nonexistent-id',
        {
          method: 'GET',
          params: { slug: 'test-customer', id: 'nonexistent-id' },
        }
      )

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/[slug]/ventas/[id]', () => {
    it('debería actualizar una venta existente', async () => {
      if (!createdSaleId) {
        const createResponse = await testApiRoute(
          POST,
          '/api/test-customer/ventas',
          {
            method: 'POST',
            params: { slug: 'test-customer' },
            cookies: {
              'sas-auth-token': authToken,
            },
            body: {
              items: [
                {
                  productId: testProductId,
                  quantity: 1,
                  unitPrice: 100,
                  subtotal: 100,
                },
              ],
              subtotal: 100,
              total: 100,
            },
          }
        )
        const createData = await parseJsonResponse(createResponse)
        createdSaleId = createData.id
      }

      const updateData = {
        status: 'cancelled',
        notes: 'Venta cancelada por prueba',
      }

      const response = await testApiRoute(
        PUT,
        `/api/test-customer/ventas/${createdSaleId}`,
        {
          method: 'PUT',
          params: { slug: 'test-customer', id: createdSaleId },
          cookies: {
            'sas-auth-token': authToken,
          },
          body: updateData,
        }
      )

      expect(response.status).toBe(200)
      const data = await parseJsonResponse(response)
      expect(data.status).toBe(updateData.status)
    })
  })

  describe('DELETE /api/[slug]/ventas/[id]', () => {
    it('debería eliminar una venta existente', async () => {
      // Crear venta para eliminar
      const createResponse = await testApiRoute(
        POST,
        '/api/test-customer/ventas',
        {
          method: 'POST',
          params: { slug: 'test-customer' },
          cookies: {
            'sas-auth-token': authToken,
          },
          body: {
            items: [
              {
                productId: testProductId,
                quantity: 1,
                unitPrice: 100,
                subtotal: 100,
              },
            ],
            subtotal: 100,
            total: 100,
          },
        }
      )
      const createData = await parseJsonResponse(createResponse)
      const saleToDeleteId = createData.id

      const response = await testApiRoute(
        DELETE,
        `/api/test-customer/ventas/${saleToDeleteId}`,
        {
          method: 'DELETE',
          params: { slug: 'test-customer', id: saleToDeleteId },
          cookies: {
            'sas-auth-token': authToken,
          },
        }
      )

      expect(response.status).toBe(200)
      
      // Verificar que la venta fue eliminada
      const getResponse = await testApiRoute(
        GET_BY_ID,
        `/api/test-customer/ventas/${saleToDeleteId}`,
        {
          method: 'GET',
          params: { slug: 'test-customer', id: saleToDeleteId },
        }
      )
      expect(getResponse.status).toBe(404)
    })
  })
})

