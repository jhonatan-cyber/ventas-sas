# 🗄️ SOFT DELETES - IMPLEMENTACIÓN COMPLETA

**Fecha:** Enero 2025  
**Prioridad:** 🟡 MEDIA  
**Estado:** ✅ COMPLETADO

---

## 📋 RESUMEN

Se ha implementado un sistema completo de soft deletes para los modelos principales del sistema. Esto permite mantener auditoría de eliminaciones y la capacidad de restaurar datos eliminados.

---

## ✅ MODELOS ACTUALIZADOS

### 1. **SalesProduct** (Productos)
- ✅ Campo `deletedAt` agregado
- ✅ Índice en `deletedAt`
- ✅ Servicio actualizado para soft delete

### 2. **SalesCustomer** (Clientes de Ventas)
- ✅ Campo `deletedAt` agregado
- ✅ Índice en `deletedAt`
- ✅ Servicio actualizado para soft delete

### 3. **Category** (Categorías)
- ✅ Campo `deletedAt` agregado
- ✅ Índice en `deletedAt`
- ✅ Servicio actualizado para soft delete

### 4. **Customer** (Clientes)
- ✅ Campo `deletedAt` agregado
- ✅ Índice en `deletedAt`

---

## 🔧 IMPLEMENTACIÓN

### Utilidades (`lib/utils/soft-delete.ts`)

Funciones helper creadas:
- `excludeDeleted()`: Filtrar elementos no eliminados
- `includeDeleted()`: Incluir solo elementos eliminados
- `includeAll()`: Incluir todos (eliminados y no eliminados)
- `createSoftDeleteData()`: Crear datos para soft delete
- `createRestoreData()`: Crear datos para restaurar
- `isSoftDeleted()`: Verificar si está eliminado

### Servicios Actualizados

#### `SalesProductService`
- ✅ `getAllProducts()`: Filtra soft deleted por defecto
- ✅ `getProductById()`: Respeta `includeDeleted` parameter
- ✅ `deleteProduct()`: Ahora hace soft delete
- ✅ `restoreProduct()`: **NUEVO** - Restaurar producto
- ✅ `getActiveProducts()`: Excluye soft deleted

#### `SalesCustomerService`
- ✅ `getAllCustomers()`: Filtra soft deleted por defecto
- ✅ `deleteCustomer()`: Ahora hace soft delete
- ✅ `restoreCustomer()`: **NUEVO** - Restaurar cliente
- ✅ `getCustomersByOrganization()`: Excluye soft deleted

#### `CategoryService`
- ✅ `getAllCategories()`: Filtra soft deleted por defecto
- ✅ `getActiveCategories()`: Excluye soft deleted

---

## 📝 CAMBIOS EN SCHEMA

### Campos Agregados:
```prisma
deletedAt DateTime? @map("deleted_at") // Soft delete
```

### Índices Agregados:
```prisma
@@index([deletedAt])
```

---

## 🚀 USO

### Eliminar (Soft Delete):
```typescript
// Antes (eliminación física)
await prisma.salesProduct.delete({ where: { id } })

// Ahora (soft delete)
await SalesProductService.deleteProduct(id)
```

### Restaurar:
```typescript
// Restaurar producto eliminado
await SalesProductService.restoreProduct(id)

// Restaurar cliente eliminado
await SalesCustomerService.restoreCustomer(id)
```

### Consultar (excluir eliminados por defecto):
```typescript
// Solo productos no eliminados (por defecto)
const products = await SalesProductService.getAllProducts(customerId)

// Incluir también productos eliminados
const allProducts = await SalesProductService.getAllProducts(
  customerId,
  0,
  10,
  undefined,
  undefined,
  undefined,
  true // includeDeleted = true
)
```

### Consultar solo eliminados:
```typescript
// En servicios, agregar parámetro includeDeleted
const deletedProducts = await prisma.salesProduct.findMany({
  where: {
    customerId,
    deletedAt: { not: null } // Solo eliminados
  }
})
```

---

## 🔄 MIGRACIÓN

### Crear Migración:
```bash
pnpm db:migrate dev --name add_soft_deletes
```

### Aplicar Migración:
```bash
pnpm db:migrate deploy
```

### Revertir Migración:
```bash
pnpm db:migrate reset
```

---

## 📊 BENEFICIOS

1. ✅ **Auditoría Completa** - Se mantiene historial de eliminaciones
2. ✅ **Recuperación de Datos** - Posibilidad de restaurar eliminados
3. ✅ **Integridad Referencial** - Las relaciones se mantienen
4. ✅ **Compliance** - Cumple con requisitos de retención de datos
5. ✅ **Seguridad** - Evita pérdida accidental de datos

---

## 🔄 PRÓXIMOS PASOS SUGERIDOS

1. **Agregar más modelos:**
   - UsuarioSas
   - RoleSas
   - Branch
   - Sale (opcional, puede ser histórico)

2. **Script de limpieza:**
   - Limpiar datos eliminados después de X días
   - Archivar datos antiguos

3. **UI para administración:**
   - Ver elementos eliminados
   - Restaurar elementos
   - Eliminación permanente

---

## 📚 REFERENCIAS

- [Prisma Soft Deletes](https://www.prisma.io/docs/guides/migrate/production-troubleshooting#soft-deletes)
- [Best Practices Soft Deletes](https://www.prisma.io/docs/guides/database/soft-deletes)

---

**Última actualización:** Enero 2025

