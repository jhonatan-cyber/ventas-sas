# 📊 LOGGING ESTRUCTURADO MEJORADO - IMPLEMENTACIÓN

**Fecha:** Enero 2025  
**Prioridad:** 🟡 MEDIA  
**Estado:** ✅ COMPLETADO

---

## 📋 RESUMEN

Se ha mejorado significativamente el sistema de logging estructurado agregando correlation IDs, contexto enriquecido, y helpers adicionales para diferentes tipos de operaciones.

---

## ✅ MEJORAS IMPLEMENTADAS

### 1. **Correlation IDs**

**Nuevo archivo:** `lib/utils/request-context.ts`

**Funciones:**
- `getCorrelationId()`: Obtiene o genera correlation ID para requests
- `getRequestContext()`: Extrae información completa del request
- `createRequestLogContext()`: Crea contexto enriquecido para logging

**Beneficios:**
- ✅ Rastrear requests a través de múltiples servicios
- ✅ Agrupar logs relacionados
- ✅ Debug más fácil en producción

---

### 2. **Helpers de Logging Mejorados**

#### `logRequest()` - Mejorado
- ✅ Detecta operaciones lentas (> 1 segundo)
- ✅ Log adicional para requests lentos
- ✅ Contexto enriquecido con correlation ID

#### `logDatabase()` - Mejorado
- ✅ Detecta operaciones lentas (> 500ms)
- ✅ Warnings para queries lentas
- ✅ Parámetro `additionalData` para contexto extra

#### Nuevos Helpers:
- ✅ `logBusinessOperation()`: Logging de operaciones de negocio
- ✅ `logStateChange()`: Logging de cambios de estado

---

### 3. **Error Handler Mejorado**

**Archivo:** `lib/utils/error-handler.ts`

**Mejoras:**
- ✅ Incluye correlation ID en logs de error
- ✅ Contexto del request extraído automáticamente
- ✅ Más información en logs de errores

---

### 4. **Request Logger Middleware**

**Nuevo archivo:** `lib/middleware/request-logger.ts`

**Función:**
- ✅ `withRequestLogging()`: Wrapper para logging automático
- ✅ Agrega correlation ID a headers de respuesta
- ✅ Mide tiempo de respuesta
- ✅ Log estructurado con contexto completo

---

## 🚀 USO

### Correlation IDs:

```typescript
import { getRequestContext, createRequestLogContext } from '@/lib/utils/request-context'

// En API route
export async function GET(request: NextRequest) {
  const context = getRequestContext(request)
  // context.correlationId disponible
  
  logger.info('Operación iniciada', {
    correlationId: context.correlationId,
    // ... otros datos
  })
}
```

### Logging de Operaciones de Negocio:

```typescript
import { logBusinessOperation } from '@/lib/utils/logger'

// Crear producto
await SalesProductService.createProduct(...)
logBusinessOperation('CREATE', 'Product', productId, userId, {
  customerId,
  productName: product.name,
})
```

### Logging de Cambios de Estado:

```typescript
import { logStateChange } from '@/lib/utils/logger'

// Cambiar estado de venta
await SaleService.updateSale(id, { status: 'completed' })
logStateChange('Sale', id, 'pending', 'completed', userId)
```

### Request Logger Middleware:

```typescript
import { withRequestLogging } from '@/lib/middleware/request-logger'

export async function GET(request: NextRequest) {
  return withRequestLogging(request, async (req) => {
    // Tu handler aquí
    return NextResponse.json({ data: '...' })
  })
}
```

---

## 📊 ESTRUCTURA DE LOGS

### Log de Request:
```json
{
  "level": "info",
  "type": "http",
  "method": "GET",
  "path": "/api/products",
  "statusCode": 200,
  "duration": 45,
  "correlationId": "1704123456789-1-abc123",
  "ip": "127.0.0.1",
  "userAgent": "Mozilla/5.0...",
  "isSlow": false
}
```

### Log de Error:
```json
{
  "level": "error",
  "correlationId": "1704123456789-1-abc123",
  "error": {
    "name": "AppError",
    "message": "Producto no encontrado"
  },
  "endpoint": "/api/products/123",
  "userId": "user-123",
  "action": "GET_PRODUCT"
}
```

### Log de Operación de Negocio:
```json
{
  "level": "info",
  "type": "business",
  "operation": "CREATE",
  "entity": "Product",
  "entityId": "prod-123",
  "userId": "user-123",
  "correlationId": "1704123456789-1-abc123"
}
```

---

## 🔧 CONFIGURACIÓN

### Variables de Entorno:

```env
# Nivel de logging
LOG_LEVEL=info  # debug, info, warn, error

# Performance logging
LOG_PERFORMANCE=true  # Log operaciones de performance

# Ambiente
NODE_ENV=production  # development, production
```

---

## ✅ BENEFICIOS LOGRADOS

1. ✅ **Trazabilidad Completa** - Correlation IDs permiten rastrear requests
2. ✅ **Debug Mejorado** - Más contexto en logs facilita debugging
3. ✅ **Detección de Problemas** - Logs de operaciones lentas automáticos
4. ✅ **Auditoría** - Logs estructurados para auditoría
5. ✅ **Monitoreo** - Fácil integración con herramientas de monitoreo

---

## 🔄 PRÓXIMOS PASOS SUGERIDOS

1. **Integración con APM** - Enviar logs a Datadog, New Relic, etc.
2. **Alertas Automáticas** - Alertas para errores críticos
3. **Dashboards** - Visualizar métricas de logs
4. **Log Aggregation** - Centralizar logs con ELK Stack o similar

---

## 📚 REFERENCIAS

- [Pino Documentation](https://getpino.io/)
- [Structured Logging Best Practices](https://www.datadoghq.com/blog/log-correlation/)

---

**Última actualización:** Enero 2025

