# 🔍 DOCUMENTACIÓN DE FEATURES - SISTEMA SAS

**Versión:** 1.0  
**Última actualización:** Enero 2025

---

## 📋 ÍNDICE DE FEATURES

1. [Autenticación y Seguridad](#autenticación-y-seguridad)
2. [Gestión de Ventas](#gestión-de-ventas)
3. [Sistema de Cotizaciones](#sistema-de-cotizaciones)
4. [Control de Inventario](#control-de-inventario)
5. [Gestión de Clientes](#gestión-de-clientes)
6. [Sistema de Cajas](#sistema-de-cajas)
7. [Gestión de Gastos](#gestión-de-gastos)
8. [Multi-Sucursal](#multi-sucursal)
9. [Reportes y Analytics](#reportes-y-analytics)
10. [Notificaciones en Tiempo Real](#notificaciones-en-tiempo-real)
11. [Sistema de Permisos](#sistema-de-permisos)
12. [2FA (Autenticación de Dos Factores)](#2fa)

---

## 🔐 AUTENTICACIÓN Y SEGURIDAD

### **Características:**
- ✅ Login con CI o correo electrónico
- ✅ Autenticación de dos factores (2FA) con TOTP
- ✅ Sesiones seguras con timeout automático (30 min)
- ✅ Rotación automática de secrets JWT (cada 90 días)
- ✅ Invalidación de sesiones al cambiar contraseña
- ✅ Tracking de IP, user agent y dispositivo
- ✅ Rate limiting en endpoints de login

### **Cómo Funciona:**
- Las credenciales se validan contra la base de datos
- Si 2FA está activado, se requiere código TOTP
- Las sesiones se guardan en la base de datos
- Se generan tokens JWT con expiración configurable

---

## 💰 GESTIÓN DE VENTAS

### **Características:**
- ✅ Crear ventas con múltiples productos
- ✅ Selección de cliente (existente o nuevo)
- ✅ Múltiples métodos de pago
- ✅ Descuentos aplicables
- ✅ Códigos de seguimiento por producto
- ✅ Cancelación de ventas (restaura stock)
- ✅ Numeración automática de ventas
- ✅ Historial completo de ventas

### **Flujo de Venta:**
1. Seleccionar/crear cliente
2. Agregar productos con cantidades
3. Aplicar descuentos (opcional)
4. Seleccionar método de pago
5. Agregar códigos de seguimiento (opcional)
6. Completar venta
7. Stock se decrementa automáticamente
8. Balance de caja se actualiza

---

## 📋 SISTEMA DE COTIZACIONES

### **Características:**
- ✅ Crear cotizaciones con múltiples productos
- ✅ Cliente con nombre y teléfono
- ✅ Fecha de vencimiento configurable
- ✅ Estados: Activa, Pendiente, Aprobada, Convertida, Expirada, Rechazada
- ✅ Conversión automática a venta
- ✅ Numeración única automática
- ✅ Expiración automática basada en fecha

### **Flujo de Cotización:**
1. Crear cotización con productos
2. Establecer fecha de vencimiento
3. Enviar al cliente
4. Cliente aprueba/rechaza
5. Convertir a venta cuando sea aprobada
6. Sistema marca como "Convertida"

---

## 📦 CONTROL DE INVENTARIO

### **Características:**
- ✅ Gestión completa de productos
- ✅ Control de stock en tiempo real
- ✅ Alertas de stock bajo (notificaciones)
- ✅ Categorización de productos
- ✅ SKU y código de barras
- ✅ Precios de venta y compra
- ✅ Imágenes de productos
- ✅ Soft delete (recuperación de productos eliminados)

### **Gestión de Stock:**
- Decremento automático al vender
- Incremento manual al recibir mercancía
- Alertas cuando stock <= stock mínimo
- Historial de movimientos (futuro)

---

## 👥 GESTIÓN DE CLIENTES

### **Características:**
- ✅ CRUD completo de clientes
- ✅ Información de contacto (correo, teléfono)
- ✅ Dirección completa
- ✅ CI/NIT para facturación
- ✅ Historial de ventas del cliente
- ✅ Búsqueda avanzada
- ✅ Soft delete

### **Información Almacenada:**
- Nombre y apellido
- Correo electrónico
- Teléfono
- Dirección
- CI/NIT
- Estado (Activo/Inactivo)

---

## 💵 SISTEMA DE CAJAS

### **Características:**
- ✅ Múltiples cajas por organización
- ✅ Apertura y cierre de cajas
- ✅ Balance de apertura y actual
- ✅ Tracking de quien abrió/cerró
- ✅ Actualización automática con ventas
- ✅ Vista de cards para mejor UX
- ✅ Historial de movimientos

### **Flujo de Caja:**
1. Abrir caja con monto inicial
2. Realizar ventas (balance se actualiza automáticamente)
3. Cerrar caja con monto final
4. Sistema calcula diferencia
5. Historial queda registrado

---

## 💸 GESTIÓN DE GASTOS

### **Características:**
- ✅ Registro de gastos
- ✅ Categorización
- ✅ Asignación a sucursal
- ✅ Filtros por fecha, categoría, sucursal
- ✅ Registro de quién creó el gasto
- ✅ Análisis en reportes

### **Tipos de Gastos:**
- Combustible
- Servicios
- Mantenimiento
- Alquiler
- Salarios
- Otros

---

## 🏢 MULTI-SUCURSAL

### **Características:**
- ✅ Múltiples sucursales por organización
- ✅ Asignación de usuarios a sucursales
- ✅ Filtrado de datos por sucursal
- ✅ Cajas por sucursal
- ✅ Gastos por sucursal
- ✅ Reportes por sucursal

### **Gestión:**
- Crear, editar, eliminar sucursales
- Asignar usuarios
- Filtrar operaciones
- Reportes consolidados o por sucursal

---

## 📊 REPORTES Y ANALYTICS

### **Reportes Disponibles:**
- ✅ Reporte General (resumen completo)
- ✅ Reporte de Ventas (detallado)
- ✅ Reporte de Productos (inventario)
- ✅ Reporte de Clientes
- ✅ Reporte de Gastos
- ✅ Reporte de Cajas

### **Analytics:**
- ✅ Gráficos de ventas en el tiempo
- ✅ Productos más vendidos (top 10)
- ✅ Ingresos vs gastos
- ✅ Análisis de cotizaciones
- ✅ Comparación con período anterior
- ✅ Filtros de período (diario/semanal/mensual)

---

## 🔔 NOTIFICACIONES EN TIEMPO REAL

### **Características:**
- ✅ Server-Sent Events (SSE) para tiempo real
- ✅ Notificaciones automáticas de eventos críticos
- ✅ Badge con contador de no leídas
- ✅ Toast automático para nuevas notificaciones
- ✅ Marcar como leída individual o todas
- ✅ Expiración automática (7-30 días según tipo)

### **Tipos de Notificaciones:**
- **stock_low**: Stock bajo en productos
- **new_sale**: Nueva venta creada
- **new_quotation**: Nueva cotización creada
- **system**: Mensajes del sistema

### **Cómo Funciona:**
- El sistema crea notificaciones cuando ocurren eventos
- Las notificaciones se envían via SSE a usuarios conectados
- Los usuarios ven un badge con el número de no leídas
- Click en la notificación para marcarla como leída

---

## 🛡️ SISTEMA DE PERMISOS

### **Características:**
- ✅ Roles personalizables
- ✅ Permisos granulares
- ✅ Asignación de roles a usuarios
- ✅ Multi-tenant (cada organización tiene sus propios roles)
- ✅ Roles del sistema (Admin) y roles de organización

### **Roles Predefinidos:**
- **Administrador**: Acceso completo
- **Vendedor**: Crear ventas y cotizaciones
- **Cajero**: Abrir/cerrar cajas
- **Consulta**: Solo lectura

---

## 🔐 2FA (AUTENTICACIÓN DE DOS FACTORES)

### **Características:**
- ✅ TOTP (Time-based One-Time Password)
- ✅ QR code para configuración
- ✅ Códigos de respaldo
- ✅ Activar/desactivar desde perfil
- ✅ Validación en tiempo real

### **Apps Compatibles:**
- Google Authenticator
- Authy
- Microsoft Authenticator
- Cualquier app compatible con TOTP

### **Cómo Funciona:**
1. Usuario activa 2FA desde perfil
2. Sistema genera secret y muestra QR
3. Usuario escanea QR con app autenticadora
4. Sistema guarda secret encriptado
5. En cada login, se requiere código TOTP
6. Código se valida contra el secret almacenado

---

## 📱 RESPONSIVE Y MÓVIL

### **Características:**
- ✅ Diseño responsive completo
- ✅ Tablas con scroll horizontal en móvil
- ✅ Cards adaptativas
- ✅ Navegación móvil optimizada
- ✅ Touch-friendly

---

## 🎨 UX/UI MEJORADO

### **Características:**
- ✅ Skeleton loaders en todas las tablas
- ✅ Animaciones suaves
- ✅ Loading states mejorados
- ✅ Feedback visual con toasts
- ✅ Dark mode completo
- ✅ Scrollbar styling personalizado

---

## 🔒 SEGURIDAD ADICIONAL

### **Características:**
- ✅ Rate limiting en login
- ✅ Security headers (CSP, XSS protection, etc.)
- ✅ CSRF protection
- ✅ Validación con Zod en todos los endpoints
- ✅ Manejo centralizado de errores
- ✅ Logging de seguridad
- ✅ Sesiones con timeout e invalidación

---

## 📈 PERFORMANCE

### **Características:**
- ✅ Caché de datos (NodeCache)
- ✅ Optimización de queries (N+1 resuelto)
- ✅ Paginación cursor-based
- ✅ Lazy loading de componentes
- ✅ Índices de base de datos optimizados
- ✅ Connection pooling

---

## 🧪 TESTING

### **Cobertura:**
- ✅ Tests unitarios (Vitest)
- ✅ Tests de integración (56+ tests)
- ✅ Tests E2E (Playwright)
- ✅ CI/CD con GitHub Actions

---

## 🚀 DEPLOYMENT

### **Características:**
- ✅ Health checks (/api/health)
- ✅ Backups automatizados
- ✅ Migraciones de base de datos (Prisma Migrate)
- ✅ Soft deletes para recuperación
- ✅ Logging estructurado (Pino)

---

## 📚 DOCUMENTACIÓN API

### **Características:**
- ✅ Swagger/OpenAPI integrado
- ✅ Endpoints documentados
- ✅ Ejemplos de requests/responses
- ✅ Acceso desde `/api/docs`

---

**Última actualización:** Enero 2025

