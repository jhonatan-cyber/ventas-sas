# 🔔 NOTIFICACIONES EN TIEMPO REAL - IMPLEMENTACIÓN

**Fecha:** Enero 2025  
**Estado:** ✅ IMPLEMENTADO (Fase 1 - Base Completa)

---

## 📋 RESUMEN

Se ha implementado un sistema completo de notificaciones en tiempo real utilizando Server-Sent Events (SSE) compatible con Next.js App Router.

---

## ✅ COMPONENTES IMPLEMENTADOS

### 1. **Modelo de Base de Datos** 📊

**Archivo:** `prisma/schema.prisma`

```prisma
model Notification {
  id            String    @id @default(cuid())
  type          String    // 'stock_low', 'new_sale', 'new_quotation', etc.
  title         String
  message       String
  data          Json?
  userId        String?   // Para usuarios admin
  usuarioSasId  String?   // Para usuarios SAS
  organizationId String?  // Para toda la organización
  customerId    String?   // Para un customer específico
  isRead        Boolean   @default(false)
  readAt        DateTime?
  createdAt     DateTime  @default(now())
  expiresAt     DateTime?
  // ... relaciones
}
```

**Características:**
- ✅ Soporte multi-tenant (admin, SAS, organización, customer)
- ✅ Tipos de notificaciones extensibles
- ✅ Expiración automática
- ✅ Índices optimizados para queries frecuentes

---

### 2. **Servicio de Notificaciones** 🛠️

**Archivo:** `lib/services/notification-service.ts`

**Funcionalidades principales:**
- ✅ `createNotification()` - Crear notificación individual
- ✅ `createNotifications()` - Crear múltiples notificaciones (batch)
- ✅ `getNotifications()` - Obtener con filtros y paginación
- ✅ `getUnreadNotifications()` - Obtener no leídas
- ✅ `markAsRead()` - Marcar como leída
- ✅ `markAllAsRead()` - Marcar todas como leídas
- ✅ `getUnreadCount()` - Contador de no leídas
- ✅ `cleanupExpiredNotifications()` - Limpiar expiradas

**Helpers específicos:**
- ✅ `notifyStockLow()` - Notificar stock bajo
- ✅ `notifyNewSale()` - Notificar nueva venta
- ✅ `notifyNewQuotation()` - Notificar nueva cotización

---

### 3. **Endpoints API** 🌐

#### **GET `/api/notifications/stream`** (SSE)
- ✅ Stream Server-Sent Events en tiempo real
- ✅ Soporta `system=admin` y `system=sas&slug=...`
- ✅ Polling automático cada 5 segundos
- ✅ Heartbeat cada 30 segundos
- ✅ Reconexión automática

#### **GET `/api/notifications`**
- ✅ Obtener notificaciones con paginación
- ✅ Filtros: `system`, `slug`, `isRead`, `page`, `pageSize`

#### **PATCH `/api/notifications/[id]`**
- ✅ Marcar notificación individual como leída

#### **DELETE `/api/notifications/[id]`**
- ✅ Eliminar notificación

#### **PATCH `/api/notifications/all`**
- ✅ Marcar todas como leídas

---

### 4. **Hook React** ⚛️

**Archivo:** `hooks/use-notifications.ts`

**Funcionalidades:**
- ✅ Conexión automática al stream SSE
- ✅ Estado de conexión (`isConnected`)
- ✅ Notificaciones en tiempo real
- ✅ Contador de no leídas
- ✅ Toast automático para nuevas notificaciones
- ✅ Reconexión automática en caso de error

**Uso:**
```tsx
const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications({
  system: 'admin', // o 'sas'
  slug: 'customer-slug', // solo para SAS
})
```

---

### 5. **Componente UI** 🎨

**Archivo:** `components/common/notifications-dropdown.tsx`

**Características:**
- ✅ Dropdown con badge de contador
- ✅ Indicador de conexión
- ✅ Iconos por tipo de notificación
- ✅ Colores diferenciados por tipo
- ✅ Scroll con todas las notificaciones
- ✅ Marcar como leída al hacer click
- ✅ Botón "Marcar todas como leídas"
- ✅ Formato de fecha relativo (ej: "hace 5 minutos")

---

## 🔧 INTEGRACIÓN EN EVENTOS CRÍTICOS

### **Paso 1: Importar el servicio**

```typescript
import { NotificationService } from '@/lib/services/notification-service'
```

### **Paso 2: Agregar notificaciones en servicios**

#### **Ejemplo: Stock Bajo** 📦

**Archivo:** `lib/services/sales/sales-product-service.ts`

```typescript
// En createProduct o updateProduct, después de actualizar stock:
if (stock <= minStock) {
  await NotificationService.notifyStockLow(
    customerId,
    product.id,
    product.name,
    stock,
    minStock
  )
}
```

#### **Ejemplo: Nueva Venta** 💰

**Archivo:** `lib/services/sales/sale-service.ts`

```typescript
// En createSale, después de crear la venta:
await NotificationService.notifyNewSale(
  sale.organizationId,
  sale.id,
  sale.saleNumber,
  Number(sale.total),
  sale.customerName || undefined
)
```

#### **Ejemplo: Nueva Cotización** 📋

**Archivo:** `lib/services/sales/quotation-service.ts`

```typescript
// En createQuotation, después de crear la cotización:
await NotificationService.notifyNewQuotation(
  quotation.organizationId,
  quotation.id,
  quotation.quotationNumber,
  Number(quotation.total),
  quotation.customerName || undefined
)
```

---

## 📝 INTEGRAR COMPONENTE EN LAYOUTS

### **Admin Layout**

**Archivo:** `components/layout/admin-header.tsx`

```tsx
import { NotificationsDropdown } from '@/components/common/notifications-dropdown'

// En el header:
<NotificationsDropdown system="admin" />
```

### **SAS Layout**

**Archivo:** `components/layout/sales-header.tsx`

```tsx
import { NotificationsDropdown } from '@/components/common/notifications-dropdown'

// En el header, con el slug del customer:
<NotificationsDropdown system="sas" slug={customerSlug} />
```

---

## 🚀 PASOS PARA COMPLETAR LA IMPLEMENTACIÓN

### **1. Aplicar migración de base de datos**

```bash
# Detener el servidor de desarrollo primero
pnpm db:generate
pnpm db:push
```

### **2. Integrar en servicios** (Opcional - puede hacerse gradualmente)

- [ ] Agregar notificación de stock bajo en `sales-product-service.ts`
- [ ] Agregar notificación de nueva venta en `sale-service.ts`
- [ ] Agregar notificación de nueva cotización en `quotation-service.ts`
- [ ] Agregar notificaciones en otros eventos importantes

### **3. Agregar componente a layouts**

- [ ] Agregar `NotificationsDropdown` al header de admin
- [ ] Agregar `NotificationsDropdown` al header de SAS

### **4. Testing**

- [ ] Probar conexión SSE
- [ ] Probar creación de notificaciones
- [ ] Probar marcado como leída
- [ ] Probar notificaciones en tiempo real

---

## 📊 TIPOS DE NOTIFICACIONES DISPONIBLES

```typescript
type NotificationType = 
  | 'stock_low'           // Stock bajo
  | 'new_sale'            // Nueva venta
  | 'new_quotation'       // Nueva cotización
  | 'quotation_expired'    // Cotización expirada
  | 'system'              // Mensaje del sistema
  | 'expense_created'     // Gasto creado
  | 'cash_register_opened' // Caja abierta
  | 'cash_register_closed' // Caja cerrada
  | 'user_created'       // Usuario creado
  | 'product_created'    // Producto creado
```

---

## 🔍 MONITOREO Y MANTENIMIENTO

### **Limpieza de Notificaciones Expiradas**

Crear un cron job o tarea programada para ejecutar periódicamente:

```typescript
// scripts/cleanup-notifications.ts
import { NotificationService } from '@/lib/services/notification-service'

async function cleanup() {
  const result = await NotificationService.cleanupExpiredNotifications()
  console.log(`Deleted ${result.count} expired notifications`)
}

cleanup()
```

---

## ✅ BENEFICIOS LOGRADOS

1. ✅ **Experiencia de usuario mejorada** - Alertas inmediatas
2. ✅ **Reducción de refrescos** - Los usuarios no necesitan refrescar la página
3. ✅ **Comunicación efectiva** - Notificaciones de eventos importantes
4. ✅ **Escalable** - Base para features futuras
5. ✅ **Compatible con Next.js** - SSE funciona bien con App Router
6. ✅ **Multi-tenant** - Soporta admin y SAS

---

## 🎯 PRÓXIMOS PASOS SUGERIDOS (Opcional)

1. **Notificaciones push del navegador** - Usar Web Push API
2. **Notificaciones por email** - Enviar emails para notificaciones importantes
3. **Filtros avanzados** - Permitir filtrar por tipo en el UI
4. **Sonidos** - Agregar sonidos para notificaciones críticas
5. **Notificaciones agrupadas** - Agrupar notificaciones similares

---

## 📝 ARCHIVOS CREADOS/MODIFICADOS

1. ✅ `prisma/schema.prisma` - Modelo Notification
2. ✅ `lib/services/notification-service.ts` - Servicio completo
3. ✅ `app/api/notifications/stream/route.ts` - Endpoint SSE
4. ✅ `app/api/notifications/route.ts` - Endpoint REST GET
5. ✅ `app/api/notifications/[id]/route.ts` - Endpoint PATCH/DELETE individual
6. ✅ `app/api/notifications/all/route.ts` - Endpoint PATCH para todas
7. ✅ `hooks/use-notifications.ts` - Hook React
8. ✅ `components/common/notifications-dropdown.tsx` - Componente UI

---

## ⚠️ IMPORTANTE

**Antes de usar en producción:**

1. ✅ Ejecutar `pnpm db:generate` y `pnpm db:push` para aplicar el modelo
2. ✅ Integrar notificaciones en los servicios que necesites
3. ✅ Agregar el componente a los layouts
4. ✅ Configurar tarea programada para limpiar notificaciones expiradas

---

**Última actualización:** Enero 2025

