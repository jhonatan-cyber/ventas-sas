/**
 * Serializadores centralizados para evitar código duplicado
 * 
 * Convierte objetos de Prisma a formatos seguros para JSON (serialización)
 */

/**
 * Serializa una venta (Sale) con todas sus relaciones
 */
export function serializeSale(sale: any) {
  return {
    ...sale,
    customerId: sale.customerId ?? null,
    customerName: sale.customerName ?? null,
    subtotal: Number(sale.subtotal ?? 0),
    discount: Number(sale.discount ?? 0),
    total: Number(sale.total ?? 0),
    createdAt: sale.createdAt ? sale.createdAt.toISOString() : null,
    updatedAt: sale.updatedAt ? sale.updatedAt.toISOString() : null,
    customer: sale.customer
      ? {
          id: sale.customer.id,
          name: sale.customer.name,
          lastName: sale.customer.lastName,
          email: sale.customer.email,
          phone: sale.customer.phone,
        }
      : null,
    user: sale.user
      ? {
          id: sale.user.id,
          fullName: sale.user.fullName,
          email: sale.user.email,
        }
      : null,
    items: sale.items?.map((item: any) => ({
      ...item,
      unitPrice: Number(item.unitPrice ?? 0),
      subtotal: Number(item.subtotal ?? 0),
      trackingCodes: Array.isArray(item.trackingCodes)
        ? item.trackingCodes.filter((code: any) => typeof code === 'string').map((code: string) => code.trim())
        : [],
      product: item.product
        ? {
            id: item.product.id,
            name: item.product.name,
            price: Number(item.product.price ?? 0),
            branchId: item.product.branchId || null,
            imageUrl: item.product.imageUrl,
          }
        : null,
    })) || [],
  }
}

/**
 * Serializa un gasto (Expense) con todas sus relaciones
 */
export function serializeExpense(expense: any) {
  return {
    ...expense,
    amount: Number(expense.amount ?? 0),
    date: expense.date ? expense.date.toISOString() : null,
    createdAt: expense.createdAt ? expense.createdAt.toISOString() : null,
    updatedAt: expense.updatedAt ? expense.updatedAt.toISOString() : null,
    user: expense.user
      ? {
          id: expense.user.id,
          fullName: expense.user.fullName,
          email: expense.user.email,
        }
      : null,
    branch: expense.branch
      ? {
          id: expense.branch.id,
          name: expense.branch.name,
        }
      : null,
  }
}

/**
 * Serializa una cotización (Quotation) con todas sus relaciones
 */
export function serializeQuotation(quotation: any) {
  return {
    ...quotation,
    subtotal: Number(quotation.subtotal ?? 0),
    discount: Number(quotation.discount ?? 0),
    total: Number(quotation.total ?? 0),
    expiresAt: quotation.expiresAt ? quotation.expiresAt.toISOString() : null,
    createdAt: quotation.createdAt ? quotation.createdAt.toISOString() : null,
    updatedAt: quotation.updatedAt ? quotation.updatedAt.toISOString() : null,
    customer: quotation.customer
      ? {
          id: quotation.customer.id,
          name: quotation.customer.name,
          lastName: quotation.customer.lastName,
          email: quotation.customer.email,
          phone: quotation.customer.phone,
          ruc: quotation.customer.ruc,
        }
      : null,
    branch: quotation.branch
      ? {
          id: quotation.branch.id,
          name: quotation.branch.name,
          address: quotation.branch.address,
        }
      : null,
    items: quotation.items?.map((item: any) => ({
      ...item,
      unitPrice: Number(item.unitPrice ?? 0),
      subtotal: Number(item.subtotal ?? 0),
      product: item.product
        ? {
            id: item.product.id,
            name: item.product.name,
            price: Number(item.product.price ?? 0),
            branchId: item.product.branchId || null,
          }
        : null,
    })) || [],
  }
}

/**
 * Serializa un producto de ventas (SalesProduct)
 */
export function serializeSalesProduct(product: any) {
  return {
    ...product,
    price: Number(product.price ?? 0),
    cost: Number(product.cost ?? 0),
    stock: Number(product.stock ?? 0),
    minStock: Number(product.minStock ?? 0),
    createdAt: product.createdAt ? product.createdAt.toISOString() : null,
    updatedAt: product.updatedAt ? product.updatedAt.toISOString() : null,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
        }
      : null,
  }
}

/**
 * Serializa un cliente de ventas (SalesCustomer)
 */
export function serializeSalesCustomer(customer: any) {
  return {
    ...customer,
    createdAt: customer.createdAt ? customer.createdAt.toISOString() : null,
    updatedAt: customer.updatedAt ? customer.updatedAt.toISOString() : null,
  }
}

/**
 * Serializa un usuario SAS (UsuarioSas)
 */
export function serializeUsuarioSas(usuario: any) {
  return {
    ...usuario,
    createdAt: usuario.createdAt ? usuario.createdAt.toISOString() : null,
    updatedAt: usuario.updatedAt ? usuario.updatedAt.toISOString() : null,
    passwordChangedAt: usuario.passwordChangedAt ? usuario.passwordChangedAt.toISOString() : null,
    rol: usuario.rol
      ? {
          id: usuario.rol.id,
          nombre: usuario.rol.nombre,
        }
      : null,
    sucursal: usuario.sucursal
      ? {
          id: usuario.sucursal.id,
          name: usuario.sucursal.name,
        }
      : null,
    customer: usuario.customer
      ? {
          id: usuario.customer.id,
          razonSocial: usuario.customer.razonSocial ?? usuario.organization?.razonSocial ?? null,
          slug: usuario.customer.slug ?? usuario.organization?.slug ?? null,
          organizationId: usuario.customer.organizationId ?? usuario.organizationId ?? null,
        }
      : null,
    // Nunca serializar contraseña
    password: undefined,
  }
}

/**
 * Serializa una orden (Order) con todas sus relaciones
 */
export function serializeOrder(order: any) {
  return {
    ...order,
    total: Number(order.total ?? 0),
    createdAt: order.createdAt ? order.createdAt.toISOString() : null,
    updatedAt: order.updatedAt ? order.updatedAt.toISOString() : null,
    customer: order.customer
      ? {
          id: order.customer.id,
          name: order.customer.name,
          apellido: order.customer.apellido,
          email: order.customer.email,
          phone: order.customer.phone,
        }
      : null,
    orderItems: order.orderItems?.map((item: any) => ({
      ...item,
      unitPrice: Number(item.unitPrice ?? 0),
      subtotal: Number(item.subtotal ?? 0),
      product: item.product
        ? {
            id: item.product.id,
            name: item.product.name,
            price: Number(item.product.price ?? 0),
            imageUrl: item.product.imageUrl,
          }
        : null,
    })) || [],
  }
}

/**
 * Serializa una caja registradora (CashRegister)
 */
export function serializeCashRegister(register: any) {
  if (!register) return null
  
  return {
    ...register,
    openingBalance: Number(register.openingBalance ?? 0),
    currentBalance: Number(register.currentBalance ?? 0),
    lastOpenAt: register.lastOpenAt ? register.lastOpenAt.toISOString() : null,
    lastCloseAt: register.lastCloseAt ? register.lastCloseAt.toISOString() : null,
    createdAt: register.createdAt ? register.createdAt.toISOString() : null,
    updatedAt: register.updatedAt ? register.updatedAt.toISOString() : null,
    branch: register.branch || null,
    openedBy: register.openedBy
      ? {
          id: register.openedBy.id,
          nombre: register.openedBy.nombre,
          apellido: register.openedBy.apellido,
        }
      : null,
    closedBy: register.closedBy
      ? {
          id: register.closedBy.id,
          nombre: register.closedBy.nombre,
          apellido: register.closedBy.apellido,
        }
      : null,
  }
}

/**
 * Serializa un objeto genérico de Prisma (fechas a ISO string)
 */
export function serializePrismaObject<T extends Record<string, any>>(
  obj: T,
  excludeFields: string[] = []
): T {
  const serialized = { ...obj }
  
  for (const [key, value] of Object.entries(serialized)) {
    if (excludeFields.includes(key)) {
      delete serialized[key]
      continue
    }
    
    // Convertir fechas a ISO string
    if (value instanceof Date) {
      (serialized as Record<string, any>)[key] = value.toISOString()
    }
    
    // Convertir Decimal a Number
    if (value && typeof value === 'object' && 'toNumber' in value) {
      (serialized as Record<string, any>)[key] = (value as any).toNumber()
    }
  }
  
  return serialized
}

