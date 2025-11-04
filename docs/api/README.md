# 📚 API REST - Sistema de Administración

**Versión:** 1.0  
**Base URL:** `/api/administracion`

---

## 🔐 Autenticación

Todas las rutas requieren autenticación mediante cookie `admin-auth-token`.

```
Cookie: admin-auth-token=<token>
```

---

## 📊 Endpoints Disponibles

### **Exportación de Datos**

#### `POST /api/administracion/export`

Exportar datos masivamente en formato CSV, Excel o JSON.

**Body:**
```json
{
  "type": "organizations" | "users" | "subscriptions" | "tickets" | "billing",
  "format": "csv" | "excel" | "json",
  "filters": {
    "dateFrom": "2025-01-01T00:00:00Z",
    "dateTo": "2025-01-31T23:59:59Z",
    "status": "active",
    "organizationId": "uuid"
  }
}
```

**Response:**
- Archivo para descarga con Content-Type apropiado

---

### **Búsqueda Global**

#### `GET /api/administracion/search?q=query&limit=10`

Búsqueda global en usuarios, organizaciones, suscripciones, tickets y logs.

**Query Parameters:**
- `q` (string, required): Término de búsqueda (mínimo 2 caracteres)
- `limit` (number, optional): Límite de resultados (default: 10)

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "id": "uuid",
      "type": "user" | "organization" | "subscription" | "ticket" | "log",
      "title": "Título del resultado",
      "description": "Descripción",
      "url": "/administracion/path",
      "metadata": {}
    }
  ]
}
```

---

### **Monitoreo de Salud**

#### `GET /api/administracion/health/metrics`

Obtener métricas de salud del sistema.

**Response:**
```json
{
  "success": true,
  "metrics": {
    "server": {
      "uptime": 86400,
      "uptimeFormatted": "1d 0h 0m",
      "cpuUsage": 45,
      "memoryUsage": 65.5,
      "memoryTotal": 16,
      "memoryUsed": 10.48,
      "memoryFree": 5.52
    },
    "database": {
      "connected": true,
      "latency": 12,
      "queryTime": 15,
      "slowQueries": 0,
      "connectionPool": {
        "active": 0,
        "idle": 0
      }
    },
    "disk": {
      "total": 500,
      "used": 250,
      "free": 250,
      "usage": 50
    },
    "errors": {
      "last24h": 5,
      "last7d": 23,
      "byEndpoint": [
        { "endpoint": "/api/xxx", "count": 3 }
      ]
    },
    "performance": {
      "avgResponseTime": 125,
      "p95ResponseTime": 200,
      "p99ResponseTime": 250,
      "requestsPerMinute": 45
    }
  }
}
```

---

### **Gestión de Caché**

#### `GET /api/administracion/cache/stats`

Obtener estadísticas del caché.

**Response:**
```json
{
  "success": true,
  "stats": {
    "hits": 1250,
    "misses": 350,
    "keys": 45,
    "hitRate": 78.12,
    "size": 2.5
  }
}
```

#### `POST /api/administracion/cache/purge`

Purgar caché por patrón o completo.

**Body:**
```json
{
  "pattern": "admin:organizations:*",  // Opcional
  "all": true                          // Opcional
}
```

**Response:**
```json
{
  "success": true,
  "deleted": 10,
  "message": "10 clave(s) eliminada(s)"
}
```

---

## 🚀 Ejemplos de Uso

### Exportar organizaciones a CSV

```bash
curl -X POST http://localhost:3000/api/administracion/export \
  -H "Cookie: admin-auth-token=xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "organizations",
    "format": "csv"
  }' \
  --output organizations.csv
```

### Búsqueda global

```bash
curl "http://localhost:3000/api/administracion/search?q=acme&limit=5" \
  -H "Cookie: admin-auth-token=xxx"
```

### Obtener métricas de salud

```bash
curl "http://localhost:3000/api/administracion/health/metrics" \
  -H "Cookie: admin-auth-token=xxx"
```

---

## 📝 Notas

- Todos los endpoints requieren autenticación de super admin
- Los formatos de fecha deben ser ISO 8601
- Las respuestas exitosas incluyen `"success": true`
- Los errores siguen el formato estándar de la aplicación

---

**Última actualización:** Enero 2025
