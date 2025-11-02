/**
 * Tests de Integración: CRUD Cotizaciones
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { GET, POST } from '@/app/api/[slug]/cotizaciones/route'
import { GET as GET_BY_ID, PUT, DELETE } from '@/app/api/[slug]/cotizaciones/[id]/route'
import { testApiRoute, parseJsonResponse } from '../helpers/test-client'
import { seedTestData, cleanupTestDatabase, ensureTestEnvironment } from '../helpers/test-db'
import { AuthSasService } from '@/lib/services/sales/auth-sas-service'

describe('API Integration: Quotations CRUD', () => {
  let testData: Awaited<ReturnType<typeof seedTestData>>
  let authToken: string
  let createdQuotationId: string
  let testProductId: string

  beforeAll(async () => {
    ensureTestEnvironment()
    await cleanupTestDatabase()
    testData = await seedTestData()

    // Crear producto de prueba
    const { prisma } = await import('@/lib/prisma')
    const product = await prisma.salesProduct.create({
      data: {
        customerId: testData.customer.id,
        name: 'Test Product for Quotation',
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

  describe('GET /api/[slug]/cotizaciones', () => {
    it('debería obtener lista de cotizaciones vacía inicialmente', async () => {
      const response = await testApiRoute(
        GET,
        '/api/test-customer/cotizaciones',
        {
          method: 'GET',
          params: { slug: 'test-customer' },
        }
      )

      expect(response.status).toBe(200)
      const data = await parseJsonResponse(response)
      expect(data.quotations).toBeDefined()
      expect(Array.isArray(data.quotations)).toBe(true)
      expect(data.total).toBe(0)
    })

    it('debería soportar paginación', async () => {
      const response = await testApiRoute(
        GET,
        '/api/test-customer/cotizaciones',
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
    })
  })

  describe('POST /api/[slug]/cotizaciones', () => {
    it('debería crear una cotización con datos válidos', async () => {
      const quotationData = {
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
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
      }

      const response = await testApiRoute(
        POST,
        '/api/test-customer/cotizaciones',
        {
          method: 'POST',
          params: { slug: 'test-customer' },
          cookies: {
            'sas-auth-token': authToken,
          },
          body: quotationData,
        }
      )

      expect(response.status).toBe(201)
      const data = await parseJsonResponse(response)
      expect(data.id).toBeDefined()
      expect(data.quotationNumber).toBeDefined()
      expect(data.total).toBe(quotationData.total)
      expect(data.items).toBeDefined()
      
      createdQuotationId = data.id
    })

    it('debería validar que haya items', async () => {
      const response = await testApiRoute(
        POST,
        '/api/test-customer/cotizaciones',
        {
          method: 'POST',
          params: { slug: 'test-customer' },
          cookies: {
            'sas-auth-token': authToken,
          },
          body: {
            items: [],
            subtotal: 0,
            total: 0,
          },
        }
      )

      expect(response.status).toBe(400)
      const data = await parseJsonResponse(response)
      expect(data.error).toBeDefined()
    })

    it('debería crear cotización con cliente manual', async () => {
      const quotationData = {
        customerName: 'Cliente Manual',
        items: [
          {
            productName: 'Producto Manual',
            quantity: 1,
            unitPrice: 50,
            subtotal: 50,
          },
        ],
        subtotal: 50,
        total: 50,
      }

      const response = await testApiRoute(
        POST,
        '/api/test-customer/cotizaciones',
        {
          method: 'POST',
          params: { slug: 'test-customer' },
          cookies: {
            'sas-auth-token': authToken,
          },
          body: quotationData,
        }
      )

      expect(response.status).toBe(201)
      const data = await parseJsonResponse(response)
      expect(data.id).toBeDefined()
    })
  })

  describe('GET /api/[slug]/cotizaciones/[id]', () => {
    it('debería obtener una cotización por ID', async () => {
      if (!createdQuotationId) {
        const createResponse = await testApiRoute(
          POST,
          '/api/test-customer/cotizaciones',
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
        createdQuotationId = createData.id
      }

      const response = await testApiRoute(
        GET_BY_ID,
        `/api/test-customer/cotizaciones/${createdQuotationId}`,
        {
          method: 'GET',
          params: { slug: 'test-customer', id: createdQuotationId },
        }
      )

      expect(response.status).toBe(200)
      const data = await parseJsonResponse(response)
      expect(data.id).toBe(createdQuotationId)
      expect(data.items).toBeDefined()
    })
  })

  describe('PUT /api/[slug]/cotizaciones/[id]', () => {
    it('debería actualizar el status de una cotización', async () => {
      if (!createdQuotationId) {
        const createResponse = await testApiRoute(
          POST,
          '/api/test-customer/cotizaciones',
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
        createdQuotationId = createData.id
      }

      const response = await testApiRoute(
        PUT,
        `/api/test-customer/cotizaciones/${createdQuotationId}`,
        {
          method: 'PUT',
          params: { slug: 'test-customer', id: createdQuotationId },
          body: {
            status: 'accepted',
          },
        }
      )

      expect(response.status).toBe(200)
      const data = await parseJsonResponse(response)
      expect(data.status).toBe('accepted')
    })
  })

  describe('DELETE /api/[slug]/cotizaciones/[id]', () => {
    it('debería eliminar una cotización existente', async () => {
      // Crear cotización para eliminar
      const createResponse = await testApiRoute(
        POST,
        '/api/test-customer/cotizaciones',
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
      const quotationToDeleteId = createData.id

      const response = await testApiRoute(
        DELETE,
        `/api/test-customer/cotizaciones/${quotationToDeleteId}`,
        {
          method: 'DELETE',
          params: { slug: 'test-customer', id: quotationToDeleteId },
        }
      )

      expect(response.status).toBe(200)
    })
  })
})

