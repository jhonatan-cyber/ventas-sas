/**
 * Utilidades para optimizar queries y prevenir problemas N+1
 * 
 * Este módulo proporciona helpers para:
 * - Incluir relaciones de forma consistente
 * - Optimizar selects
 * - Batch loading de datos relacionados
 */

/**
 * Configuraciones de include comunes para evitar queries N+1
 */
export const CommonIncludes = {
  /**
   * Include básico para ventas
   */
  sale: {
    customer: {
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        phone: true,
      },
    },
    user: {
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    },
    items: {
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
          },
        },
      },
    },
  },

  /**
   * Include básico para cotizaciones
   */
  quotation: {
    customer: {
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        phone: true,
        ruc: true,
      },
    },
    branch: {
      select: {
        id: true,
        name: true,
        address: true,
      },
    },
    items: {
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    },
  },

  /**
   * Include básico para gastos
   */
  expense: {
    user: {
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    },
    branch: {
      select: {
        id: true,
        name: true,
      },
    },
  },

  /**
   * Include básico para órdenes
   */
  order: {
    customer: {
      select: {
        id: true,
        name: true,
        apellido: true,
        email: true,
        phone: true,
      },
    },
    orderItems: {
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
          },
        },
      },
    },
  },

  /**
   * Include básico para usuarios SAS
   */
  usuarioSas: {
    rol: {
      select: {
        id: true,
        nombre: true,
      },
    },
    sucursal: {
      select: {
        id: true,
        name: true,
      },
    },
    customer: {
      select: {
        id: true,
        razonSocial: true,
        nombre: true,
        apellido: true,
      },
    },
  },

  /**
   * Include básico para cajas (cash registers)
   */
  cashRegister: {
    branch: {
      select: {
        id: true,
        name: true,
        address: true,
      },
    },
    organization: {
      select: {
        id: true,
        name: true,
      },
    },
    openedBy: {
      select: {
        id: true,
        nombre: true,
        apellido: true,
      },
    },
    closedBy: {
      select: {
        id: true,
        nombre: true,
        apellido: true,
      },
    },
  },

  /**
   * Include básico para productos
   */
  product: {
    category: {
      select: {
        id: true,
        name: true,
      },
    },
  },
} as const

/**
 * Batch load de relaciones para múltiples registros
 * Útil cuando necesitas cargar la misma relación para múltiples items
 */
export async function batchLoadRelations<T extends Record<string, any>>(
  items: T[],
  relationKey: string,
  ids: string[],
  loader: (ids: string[]) => Promise<any[]>
): Promise<Map<string, any>> {
  // Remover duplicados
  const uniqueIds = [...new Set(ids)]
  
  // Cargar todas las relaciones de una vez
  const relations = await loader(uniqueIds)
  
  // Crear mapa para lookup rápido
  const relationMap = new Map<string, any>()
  relations.forEach((relation) => {
    relationMap.set(relation.id, relation)
  })
  
  return relationMap
}

/**
 * Helper para verificar si un include es necesario
 * Previene over-fetching de datos
 */
export function shouldInclude(
  requestedFields: string[] | undefined,
  field: string
): boolean {
  if (!requestedFields) {
    return true // Por defecto incluir todo
  }
  return requestedFields.includes(field) || requestedFields.includes('*')
}

/**
 * Construye un include optimizado basado en campos solicitados
 */
export function buildOptimizedInclude(
  requestedFields: string[] | undefined,
  availableIncludes: Record<string, any>
): Record<string, any> | undefined {
  if (!requestedFields || requestedFields.includes('*')) {
    return availableIncludes
  }

  const optimized: Record<string, any> = {}

  for (const [key, value] of Object.entries(availableIncludes)) {
    if (shouldInclude(requestedFields, key)) {
      optimized[key] = value
    }
  }

  return Object.keys(optimized).length > 0 ? optimized : undefined
}

