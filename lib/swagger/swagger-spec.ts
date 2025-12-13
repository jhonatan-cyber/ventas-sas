/**
 * OpenAPI 3.0 Specification
 * Documentación completa de la API Ventas SAS
 */

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'SmartPOS API',
    version: '1.0.0',
    description: 'API REST para SmartPOS - Sistema POS inteligente multi-tenant con IA',
    contact: {
      name: 'Soporte API',
      email: 'support@ventas-sas.com',
    },
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      description: 'Servidor de desarrollo',
    },
    {
      url: 'https://api.ventas-sas.com',
      description: 'Servidor de producción',
    },
  ],
  tags: [
    { name: 'Autenticación', description: 'Endpoints de autenticación y autorización' },
    { name: 'Productos', description: 'Gestión de productos' },
    { name: 'Categorías', description: 'Gestión de categorías' },
    { name: 'Clientes', description: 'Gestión de clientes de ventas' },
    { name: 'Usuarios', description: 'Gestión de usuarios del sistema' },
    { name: 'Cotizaciones', description: 'Gestión de cotizaciones' },
    { name: 'Gastos', description: 'Gestión de gastos' },
    { name: 'Sucursales', description: 'Gestión de sucursales' },
    { name: 'Roles', description: 'Gestión de roles y permisos' },
    { name: 'Administración', description: 'Endpoints de administración del sistema' },
    { name: 'Health', description: 'Endpoints de salud y monitoreo' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT para autenticación',
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'sas-auth-token',
        description: 'Token de autenticación en cookie (SAS)',
      },
      adminCookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'admin-auth-token',
        description: 'Token de autenticación en cookie (Admin)',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Mensaje de error',
          },
          code: {
            type: 'string',
            description: 'Código de error',
            enum: ['VALIDATION_ERROR', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'CONFLICT', 'TOO_MANY_REQUESTS', 'INTERNAL_ERROR'],
          },
          details: {
            type: 'object',
            description: 'Detalles adicionales del error',
          },
        },
        required: ['error'],
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            description: 'Página actual',
            minimum: 1,
          },
          pageSize: {
            type: 'integer',
            description: 'Tamaño de página',
            minimum: 1,
            maximum: 100,
          },
          total: {
            type: 'integer',
            description: 'Total de registros',
            minimum: 0,
          },
          totalPages: {
            type: 'integer',
            description: 'Total de páginas',
            minimum: 0,
          },
        },
        required: ['page', 'pageSize', 'total', 'totalPages'],
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          customerId: { type: 'string' },
          categoryId: { type: 'string', nullable: true },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          brand: { type: 'string', nullable: true },
          model: { type: 'string', nullable: true },
          price: { type: 'number', format: 'double' },
          cost: { type: 'number', format: 'double' },
          stock: { type: 'integer', minimum: 0 },
          minStock: { type: 'integer', minimum: 0 },
          sku: { type: 'string', nullable: true },
          barcode: { type: 'string', nullable: true },
          imageUrl: { type: 'string', nullable: true },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'customerId', 'name', 'price', 'cost', 'stock', 'isActive'],
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          customerId: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          _count: {
            type: 'object',
            properties: {
              products: { type: 'integer' },
            },
          },
        },
        required: ['id', 'customerId', 'name', 'isActive'],
      },
      LoginRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password', minLength: 6 },
          ci: { type: 'string', description: 'Cédula de identidad (alternativa a email)' },
          correo: { type: 'string', format: 'email', description: 'Email (alternativa a email)' },
          contraseña: { type: 'string', format: 'password', minLength: 6 },
        },
        required: ['password'],
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              fullName: { type: 'string' },
            },
          },
          token: { type: 'string', description: 'JWT token' },
        },
        required: ['success'],
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'No autenticado o token inválido',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: 'No autorizado',
              code: 'UNAUTHORIZED',
            },
          },
        },
      },
      ForbiddenError: {
        description: 'No tiene permisos para esta acción',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: 'Acceso denegado',
              code: 'FORBIDDEN',
            },
          },
        },
      },
      NotFoundError: {
        description: 'Recurso no encontrado',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: 'Recurso no encontrado',
              code: 'NOT_FOUND',
            },
          },
        },
      },
      ValidationError: {
        description: 'Error de validación',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: 'Error de validación',
              code: 'VALIDATION_ERROR',
              details: {
                field: 'email',
                message: 'Email inválido',
              },
            },
          },
        },
      },
      TooManyRequestsError: {
        description: 'Demasiadas solicitudes',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: 'Demasiadas solicitudes. Por favor, intenta más tarde.',
              code: 'TOO_MANY_REQUESTS',
            },
          },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check general',
        description: 'Verifica el estado general de la aplicación',
        responses: {
          '200': {
            description: 'Aplicación saludable',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    database: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', enum: ['healthy', 'unhealthy'] },
                        message: { type: 'string' },
                      },
                    },
                    memory: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', enum: ['healthy', 'unhealthy'] },
                        message: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '503': {
            description: 'Aplicación no saludable',
          },
        },
      },
    },
    '/api/health/ready': {
      get: {
        tags: ['Health'],
        summary: 'Readiness probe',
        description: 'Verifica si la aplicación está lista para recibir tráfico',
        responses: {
          '200': {
            description: 'Aplicación lista',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['ready'] },
                  },
                },
              },
            },
          },
          '503': {
            description: 'Aplicación no lista',
          },
        },
      },
    },
    '/api/health/live': {
      get: {
        tags: ['Health'],
        summary: 'Liveness probe',
        description: 'Verifica si la aplicación está viva',
        responses: {
          '200': {
            description: 'Aplicación viva',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['live'] },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/{slug}/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Iniciar sesión (SAS)',
        description: 'Autentica un usuario en el sistema SAS usando email/CI y contraseña',
        parameters: [
          {
            name: 'slug',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Slug único del cliente',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LoginRequest',
              },
              examples: {
                email: {
                  value: {
                    email: 'usuario@example.com',
                    password: 'contraseña123',
                  },
                },
                ci: {
                  value: {
                    ci: '12345678',
                    contraseña: 'contraseña123',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login exitoso',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LoginResponse',
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/UnauthorizedError',
          },
          '429': {
            $ref: '#/components/responses/TooManyRequestsError',
          },
        },
      },
    },
    '/api/{slug}/productos': {
      get: {
        tags: ['Productos'],
        summary: 'Listar productos',
        description: 'Obtiene una lista paginada de productos del cliente',
        parameters: [
          {
            name: 'slug',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Slug único del cliente',
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
            description: 'Número de página',
          },
          {
            name: 'pageSize',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
            description: 'Tamaño de página',
          },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
            description: 'Búsqueda por nombre, SKU o código de barras',
          },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['active', 'inactive', 'all'] },
            description: 'Filtrar por estado',
          },
          {
            name: 'categoryId',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filtrar por categoría',
          },
        ],
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de productos',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/PaginatedResponse' },
                    {
                      type: 'object',
                      properties: {
                        products: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Product' },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/UnauthorizedError',
          },
          '404': {
            $ref: '#/components/responses/NotFoundError',
          },
        },
      },
      post: {
        tags: ['Productos'],
        summary: 'Crear producto',
        description: 'Crea un nuevo producto',
        parameters: [
          {
            name: 'slug',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'price', 'cost', 'stock'],
                properties: {
                  categoryId: { type: 'string', nullable: true },
                  name: { type: 'string', minLength: 1 },
                  description: { type: 'string', nullable: true },
                  brand: { type: 'string', nullable: true },
                  model: { type: 'string', nullable: true },
                  price: { type: 'number', minimum: 0 },
                  cost: { type: 'number', minimum: 0 },
                  stock: { type: 'integer', minimum: 0 },
                  minStock: { type: 'integer', minimum: 0 },
                  sku: { type: 'string', nullable: true },
                  barcode: { type: 'string', nullable: true },
                  imageUrl: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Producto creado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Product' },
              },
            },
          },
          '400': {
            $ref: '#/components/responses/ValidationError',
          },
          '401': {
            $ref: '#/components/responses/UnauthorizedError',
          },
        },
      },
    },
    '/api/{slug}/productos/{id}': {
      get: {
        tags: ['Productos'],
        summary: 'Obtener producto por ID',
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Producto encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Product' },
              },
            },
          },
          '404': {
            $ref: '#/components/responses/NotFoundError',
          },
        },
      },
      put: {
        tags: ['Productos'],
        summary: 'Actualizar producto',
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  price: { type: 'number' },
                  stock: { type: 'integer' },
                  // ... más campos
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Producto actualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Product' },
              },
            },
          },
          '404': {
            $ref: '#/components/responses/NotFoundError',
          },
        },
      },
      delete: {
        tags: ['Productos'],
        summary: 'Eliminar producto',
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Producto eliminado',
          },
          '404': {
            $ref: '#/components/responses/NotFoundError',
          },
        },
      },
    },
    '/api/{slug}/categorias': {
      get: {
        tags: ['Categorías'],
        summary: 'Listar categorías',
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'inactive'] } },
        ],
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de categorías',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/PaginatedResponse' },
                    {
                      type: 'object',
                      properties: {
                        categories: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Category' },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Categorías'],
        summary: 'Crear categoría',
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
        ],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', minLength: 1 },
                  description: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Categoría creada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Category' },
              },
            },
          },
        },
      },
    },
  },
}

