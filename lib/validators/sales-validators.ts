import { z } from 'zod'

/**
 * Validadores para el sistema de ventas
 */

// Schema para items de venta
const saleItemSchema = z.object({
  productId: z
    .string()
    .uuid('El ID del producto no es válido'),
  quantity: z
    .number()
    .int('La cantidad debe ser un número entero')
    .positive('La cantidad debe ser mayor a 0')
    .max(10000, 'La cantidad máxima es 10,000'),
  unitPrice: z
    .number()
    .nonnegative('El precio unitario no puede ser negativo')
    .max(999999.99, 'El precio máximo es 999,999.99'),
  subtotal: z
    .number()
    .nonnegative('El subtotal no puede ser negativo')
    .max(99999999.99, 'El subtotal máximo es 99,999,999.99'),
  trackingCodes: z
    .array(z.string())
    .optional()
})

// Crear venta
const saleBaseSchema = z.object({
  userId: z
    .string()
    .uuid('El ID del usuario no es válido')
    .optional(), // El userId se obtiene del usuario autenticado en el servidor
  customerId: z
    .string()
    .uuid('El ID del cliente no es válido')
    .optional()
    .nullable(),
  customerName: z
    .string()
    .min(1, 'El nombre del cliente es requerido')
    .max(200, 'El nombre del cliente es demasiado largo')
    .optional()
    .nullable(),
  status: z
    .enum(['completed', 'pending', 'cancelled'], {
      errorMap: () => ({ message: 'El estado debe ser: completed, pending o cancelled' })
    })
    .default('completed'),
  paymentMethod: z
    .enum(['cash', 'card', 'transfer', 'qr'], {
      errorMap: () => ({ message: 'El método de pago debe ser: cash, card, transfer o qr' })
    })
    .default('cash'),
  subtotal: z
    .number()
    .nonnegative('El subtotal no puede ser negativo')
    .max(99999999.99, 'El subtotal máximo es 99,999,999.99'),
  discount: z
    .number()
    .nonnegative('El descuento no puede ser negativo')
    .max(99999999.99, 'El descuento máximo es 99,999,999.99')
    .default(0),
  total: z
    .number()
    .nonnegative('El total no puede ser negativo')
    .max(99999999.99, 'El total máximo es 99,999,999.99'),
  notes: z
    .string()
    .max(1000, 'Las notas son demasiado largas')
    .optional()
    .nullable(),
  items: z
    .array(saleItemSchema)
    .min(1, 'Debe haber al menos un item en la venta')
    .max(100, 'El máximo de items es 100')
})

export const createSaleSchema = saleBaseSchema
  .refine(
    (data) => {
      // Al menos uno de customerId o customerName debe estar presente
      const hasCustomerId = data.customerId !== null && data.customerId !== undefined && typeof data.customerId === 'string' && data.customerId.length > 0
      const hasCustomerName = data.customerName !== null && data.customerName !== undefined && typeof data.customerName === 'string' && data.customerName.trim().length > 0
      return hasCustomerId || hasCustomerName
    },
    {
      message: 'Debe proporcionar un cliente (ID) o un nombre de cliente',
      path: ['customerId']
    }
  )
  .refine(
    (data) => {
      // Validar que el total sea consistente
      const calculatedTotal = data.subtotal - data.discount
      return Math.abs(calculatedTotal - data.total) < 0.01 // Permitir pequeñas diferencias por redondeo
    },
    {
      message: 'El total no coincide con (subtotal - descuento)',
      path: ['total']
    }
  )

export type CreateSaleInput = z.infer<typeof createSaleSchema>

// Actualizar venta
export const updateSaleSchema = saleBaseSchema.partial().extend({
  userId: z.string().uuid().optional(), // Opcional en actualización
})

export type UpdateSaleInput = z.infer<typeof updateSaleSchema>

// Producto
export const createProductSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre del producto es requerido')
    .max(200, 'El nombre es demasiado largo')
    .trim(),
  description: z
    .string()
    .max(1000, 'La descripción es demasiado larga')
    .optional()
    .nullable(),
  brand: z
    .string()
    .max(100, 'La marca es demasiado larga')
    .optional()
    .nullable(),
  model: z
    .string()
    .max(100, 'El modelo es demasiado largo')
    .optional()
    .nullable(),
  price: z
    .number()
    .nonnegative('El precio no puede ser negativo')
    .max(999999.99, 'El precio máximo es 999,999.99'),
  cost: z
    .number()
    .nonnegative('El costo no puede ser negativo')
    .max(999999.99, 'El costo máximo es 999,999.99')
    .default(0),
  stock: z
    .number()
    .int('El stock debe ser un número entero')
    .nonnegative('El stock no puede ser negativo')
    .default(0),
  minStock: z
    .number()
    .int('El stock mínimo debe ser un número entero')
    .nonnegative('El stock mínimo no puede ser negativo')
    .default(0),
  sku: z
    .string()
    .max(50, 'El SKU es demasiado largo')
    .optional()
    .nullable(),
  barcode: z
    .string()
    .max(50, 'El código de barras es demasiado largo')
    .optional()
    .nullable(),
  categoryId: z
    .string()
    .uuid('El ID de categoría no es válido')
    .optional()
    .nullable(),
  imageUrl: z
    .string()
    .url('La URL de imagen no es válida')
    .optional()
    .nullable(),
  isActive: z
    .boolean()
    .default(true)
})

export type CreateProductInput = z.infer<typeof createProductSchema>

export const updateProductSchema = createProductSchema.partial()

export type UpdateProductInput = z.infer<typeof updateProductSchema>

// Cliente de ventas
export const createSalesCustomerSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(200, 'El nombre es demasiado largo')
    .trim(),
  lastName: z
    .string()
    .max(200, 'El apellido es demasiado largo')
    .optional()
    .nullable(),
  email: z
    .string()
    .email('El email no es válido')
    .toLowerCase()
    .optional()
    .nullable(),
  phone: z
    .string()
    .max(20, 'El teléfono es demasiado largo')
    .regex(/^[\d\s\-\+\(\)]+$/, 'El teléfono contiene caracteres inválidos')
    .optional()
    .nullable(),
  address: z
    .string()
    .max(500, 'La dirección es demasiado larga')
    .optional()
    .nullable(),
  city: z
    .string()
    .max(100, 'La ciudad es demasiado larga')
    .optional()
    .nullable(),
  country: z
    .string()
    .max(100, 'El país es demasiado largo')
    .optional()
    .nullable(),
  ruc: z
    .string()
    .max(20, 'El RUC es demasiado largo')
    .optional()
    .nullable()
})

export type CreateSalesCustomerInput = z.infer<typeof createSalesCustomerSchema>

export const updateSalesCustomerSchema = createSalesCustomerSchema.partial()

export type UpdateSalesCustomerInput = z.infer<typeof updateSalesCustomerSchema>

// Cotización
const quotationItemSchema = z.object({
  productId: z
    .string()
    .uuid('El ID del producto no es válido')
    .optional()
    .nullable(),
  productName: z
    .string()
    .min(1, 'El nombre del producto es requerido')
    .max(200, 'El nombre es demasiado largo')
    .optional()
    .nullable(),
  quantity: z
    .number()
    .int('La cantidad debe ser un número entero')
    .positive('La cantidad debe ser mayor a 0')
    .max(10000, 'La cantidad máxima es 10,000'),
  unitPrice: z
    .number()
    .nonnegative('El precio unitario no puede ser negativo')
    .max(999999.99, 'El precio máximo es 999,999.99'),
  subtotal: z
    .number()
    .nonnegative('El subtotal no puede ser negativo')
    .max(99999999.99, 'El subtotal máximo es 99,999,999.99')
})

const quotationBaseSchema = z.object({
  customerId: z
    .string()
    .uuid('El ID del cliente no es válido')
    .optional()
    .nullable(),
  customerName: z
    .string()
    .min(1, 'El nombre del cliente es requerido')
    .max(200, 'El nombre es demasiado largo')
    .optional()
    .nullable(),
  customerPhone: z
    .string()
    .max(20, 'El teléfono es demasiado largo')
    .optional()
    .nullable(),
  branchId: z
    .string()
    .uuid('El ID de sucursal no es válido')
    .optional()
    .nullable(),
  status: z
    .enum(['active', 'converted', 'expired'], {
      errorMap: () => ({ message: 'El estado debe ser: active, converted o expired' })
    })
    .default('active'),
  subtotal: z
    .number()
    .nonnegative('El subtotal no puede ser negativo')
    .max(99999999.99, 'El subtotal máximo es 99,999,999.99'),
  discount: z
    .number()
    .nonnegative('El descuento no puede ser negativo')
    .max(99999999.99, 'El descuento máximo es 99,999,999.99')
    .default(0),
  total: z
    .number()
    .nonnegative('El total no puede ser negativo')
    .max(99999999.99, 'El total máximo es 99,999,999.99'),
  expiresAt: z
    .string()
    .datetime('La fecha de expiración no es válida')
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(1000, 'Las notas son demasiado largas')
    .optional()
    .nullable(),
  items: z
    .array(quotationItemSchema)
    .min(1, 'Debe haber al menos un item en la cotización')
    .max(100, 'El máximo de items es 100')
})

export const createQuotationSchema = quotationBaseSchema
  .refine(
    (data) => {
      // Al menos uno de customerId o customerName debe estar presente
      const hasCustomerId = data.customerId !== null && data.customerId !== undefined && typeof data.customerId === 'string' && data.customerId.length > 0
      const hasCustomerName = data.customerName !== null && data.customerName !== undefined && typeof data.customerName === 'string' && data.customerName.trim().length > 0
      return hasCustomerId || hasCustomerName
    },
    {
      message: 'Debe proporcionar un cliente (ID) o un nombre de cliente',
      path: ['customerId']
    }
  )
  .refine(
    (data) => {
      const calculatedTotal = data.subtotal - data.discount
      return Math.abs(calculatedTotal - data.total) < 0.01
    },
    {
      message: 'El total no coincide con (subtotal - descuento)',
      path: ['total']
    }
  )

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>

export const updateQuotationSchema = quotationBaseSchema.partial()

export type UpdateQuotationInput = z.infer<typeof updateQuotationSchema>

// Gasto
export const createExpenseSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre del gasto es requerido')
    .max(200, 'El nombre es demasiado largo')
    .trim(),
  category: z
    .string()
    .max(100, 'La categoría es demasiado larga')
    .optional()
    .nullable(),
  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(1000, 'La descripción es demasiado larga')
    .trim(),
  amount: z
    .number()
    .positive('El monto debe ser mayor a 0')
    .max(99999999.99, 'El monto máximo es 99,999,999.99'),
  date: z
    .string()
    .datetime('La fecha no es válida')
    .or(z.date()),
  branchId: z
    .string()
    .uuid('El ID de sucursal no es válido')
    .optional()
    .nullable()
})

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>

export const updateExpenseSchema = createExpenseSchema.partial()

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>

// Usuario SAS
export const createUsuarioSasSchema = z.object({
  ci: z
    .string()
    .min(1, 'El CI es requerido')
    .max(20, 'El CI es demasiado largo')
    .regex(/^\d+$/, 'El CI solo puede contener números')
    .optional()
    .nullable(),
  nombre: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre es demasiado largo')
    .trim(),
  apellido: z
    .string()
    .min(1, 'El apellido es requerido')
    .max(100, 'El apellido es demasiado largo')
    .trim(),
  direccion: z
    .string()
    .max(500, 'La dirección es demasiado larga')
    .optional()
    .nullable(),
  telefono: z
    .string()
    .max(20, 'El teléfono es demasiado largo')
    .regex(/^[\d\s\-\+\(\)]+$/, 'El teléfono contiene caracteres inválidos')
    .optional()
    .nullable(),
  correo: z
    .string()
    .email('El correo electrónico no es válido')
    .toLowerCase()
    .optional()
    .nullable(),
  contraseña: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña es demasiado larga')
    .optional()
    .nullable(),
  rolId: z
    .string()
    .uuid('El ID del rol no es válido')
    .optional()
    .nullable(),
  sucursalId: z
    .string()
    .uuid('El ID de sucursal no es válido')
    .optional()
    .nullable(),
  foto: z
    .string()
    .url('La URL de foto no es válida')
    .optional()
    .nullable()
})

export type CreateUsuarioSasInput = z.infer<typeof createUsuarioSasSchema>

export const updateUsuarioSasSchema = createUsuarioSasSchema.partial().extend({
  contraseña: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña es demasiado larga')
    .optional()
    .nullable()
})

export type UpdateUsuarioSasInput = z.infer<typeof updateUsuarioSasSchema>

// Categoría
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre de la categoría es requerido')
    .max(100, 'El nombre es demasiado largo')
    .trim(),
  description: z
    .string()
    .max(500, 'La descripción es demasiado larga')
    .optional()
    .nullable()
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>

export const updateCategorySchema = createCategorySchema.partial()

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>

// Sucursal
export const createBranchSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre de la sucursal es requerido')
    .max(200, 'El nombre es demasiado largo')
    .trim(),
  address: z
    .string()
    .max(500, 'La dirección es demasiado larga')
    .optional()
    .nullable(),
  phone: z
    .string()
    .max(20, 'El teléfono es demasiado largo')
    .regex(/^[\d\s\-\+\(\)]+$/, 'El teléfono contiene caracteres inválidos')
    .optional()
    .nullable(),
  email: z
    .string()
    .email('El email no es válido')
    .toLowerCase()
    .optional()
    .nullable()
})

export type CreateBranchInput = z.infer<typeof createBranchSchema>

export const updateBranchSchema = createBranchSchema.partial()

export type UpdateBranchInput = z.infer<typeof updateBranchSchema>

// Caja Registradora
export const createCashRegisterSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre de la caja es requerido')
    .max(200, 'El nombre es demasiado largo')
    .trim(),
  branchId: z
    .string()
    .uuid('El ID de sucursal no es válido')
    .optional()
    .nullable(),
  openingBalance: z
    .number()
    .nonnegative('El balance inicial no puede ser negativo')
    .max(99999999.99, 'El balance inicial máximo es 99,999,999.99')
    .default(0)
})

export type CreateCashRegisterInput = z.infer<typeof createCashRegisterSchema>

export const updateCashRegisterSchema = createCashRegisterSchema.partial()

export type UpdateCashRegisterInput = z.infer<typeof updateCashRegisterSchema>

