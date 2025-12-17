# Sistema de Permisos en Tiempo Real

## Descripción General

El sistema de permisos en tiempo real permite que los cambios realizados por administradores se reflejen inmediatamente en las sesiones activas de todos los usuarios, sin necesidad de recargar la página o cerrar sesión.

## Arquitectura

### 1. Server-Sent Events (SSE)
- **Endpoint**: `/api/[slug]/permissions/events`
- **Protocolo**: Server-Sent Events para comunicación unidireccional del servidor al cliente
- **Gestión de conexiones**: Mapa de conexiones activas por organización
- **Autenticación**: Verificación de sesión SAS y pertenencia a la organización

### 2. Servicio de Notificaciones
- **Archivo**: `lib/services/sales/permission-notification-service.ts`
- **Función**: Enviar notificaciones a todas las conexiones activas de una organización
- **Tipos de eventos**:
  - `role_updated`: Cuando se actualiza un rol
  - `permissions_changed`: Cuando se cambian permisos específicos

### 3. Hook de Permisos
- **Archivo**: `hooks/sales/use-sas-permissions.ts`
- **Función**: Gestionar permisos del usuario y escuchar actualizaciones en tiempo real
- **Características**:
  - Caché en sessionStorage con expiración (5 minutos)
  - Conexión automática a SSE
  - Reconexión automática en caso de error
  - Actualización automática de permisos al recibir eventos

## Flujo de Funcionamiento

### 1. Conexión Inicial
```typescript
// El usuario se conecta al sistema
const { permissions, hasPermission } = useSasPermissions()

// Se establece conexión SSE automáticamente
EventSource(`/api/${slug}/permissions/events`)
```

### 2. Cambio de Permisos
```typescript
// Administrador actualiza permisos de un rol
await handleSavePermissions(newPermissions)

// Se notifica a todas las conexiones activas
PermissionNotificationService.notifyRolePermissionsUpdated(
  organizationId,
  roleId,
  roleName
)
```

### 3. Actualización Automática
```typescript
// Los clientes conectados reciben el evento
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  if (data.type === 'role_updated') {
    // Se actualizan los permisos automáticamente
    forceRefresh()
  }
}
```

## Eventos Soportados

### `role_updated`
Se dispara cuando:
- Se crean nuevos roles
- Se actualizan roles existentes
- Se eliminan roles
- Se activan/desactivan roles
- Se modifican permisos de un rol

```typescript
{
  type: 'role_updated',
  roleId: 'uuid',
  roleName: 'Vendedor',
  message: 'Los permisos del rol "Vendedor" han sido actualizados',
  timestamp: '2024-12-16T...'
}
```

### `permissions_changed`
Se dispara para cambios generales:
- Actualizaciones masivas de permisos
- Cambios en la configuración del sistema

```typescript
{
  type: 'permissions_changed',
  message: 'Permisos del sistema actualizados',
  userId?: 'uuid', // opcional
  timestamp: '2024-12-16T...'
}
```

### `connected` y `ping`
Eventos de control de conexión:
- `connected`: Confirmación de conexión establecida
- `ping`: Mantener conexión viva (cada 30 segundos)

## Integración en Componentes

### Verificación de Permisos
```typescript
import { useSasPermissions } from '@/hooks/sales/use-sas-permissions'

function MyComponent() {
  const { hasPermission, permissions } = useSasPermissions()
  
  // Los permisos se actualizan automáticamente
  if (hasPermission('usuarios_crear')) {
    return <CreateUserButton />
  }
  
  return null
}
```

### Notificación de Cambios
```typescript
import { PermissionNotificationService } from '@/lib/services/sales/permission-notification-service'

async function updateRolePermissions(roleId: string, permissions: string[]) {
  // Actualizar en base de datos
  await updateRole(roleId, { permissions })
  
  // Notificar cambios en tiempo real
  const organizationId = await getOrganizationId()
  PermissionNotificationService.notifyRolePermissionsUpdated(
    organizationId,
    roleId,
    roleName
  )
}
```

## Casos de Uso

### 1. Administrador Actualiza Permisos
1. Admin abre "Gestión de Roles" → "Gestionar Permisos"
2. Modifica permisos de un rol y guarda
3. Todos los usuarios con ese rol ven cambios inmediatamente
4. Botones y funcionalidades se muestran/ocultan automáticamente

### 2. Activación/Desactivación de Roles
1. Admin activa o desactiva un rol
2. Usuarios con ese rol pierden/ganan acceso inmediatamente
3. Sidebar se actualiza automáticamente

### 3. Creación de Nuevos Roles
1. Admin crea un nuevo rol con permisos específicos
2. Al asignar usuarios a ese rol, obtienen permisos inmediatamente
3. No necesitan cerrar sesión ni recargar

## Ventajas

### Para Administradores
- **Control inmediato**: Los cambios se aplican instantáneamente
- **Seguridad**: Pueden revocar accesos de forma inmediata
- **Flexibilidad**: Pueden ajustar permisos sin interrumpir el trabajo

### Para Usuarios
- **Experiencia fluida**: No necesitan recargar ni cerrar sesión
- **Acceso inmediato**: Nuevos permisos disponibles al instante
- **Transparencia**: Ven cambios en tiempo real

### Para el Sistema
- **Eficiencia**: Solo se actualizan los permisos cuando es necesario
- **Escalabilidad**: SSE es más eficiente que polling
- **Confiabilidad**: Reconexión automática y gestión de errores

## Consideraciones Técnicas

### Rendimiento
- Conexiones SSE son ligeras y eficientes
- Caché local reduce llamadas a la API
- Reconexión automática en caso de pérdida de conexión

### Seguridad
- Verificación de sesión en cada conexión SSE
- Validación de pertenencia a la organización
- Eventos solo se envían a usuarios autorizados

### Compatibilidad
- SSE es compatible con todos los navegadores modernos
- Fallback automático en caso de errores
- Funciona con múltiples pestañas abiertas

## Monitoreo y Debug

### Herramientas de Desarrollador
1. Abrir DevTools (F12)
2. Ir a pestaña "Network"
3. Buscar conexión a `/permissions/events`
4. Ver eventos en tiempo real

### Logs del Servidor
```typescript
// Los eventos se registran en consola
console.log('Conectado a eventos de permisos en tiempo real')
console.log('Permisos actualizados en tiempo real:', data.message)
```

### Script de Prueba
```bash
# Ejecutar script de prueba
pnpm tsx scripts/test-realtime-permissions.ts
```

## Mantenimiento

### Limpieza de Conexiones
- Las conexiones se limpian automáticamente al cerrar pestañas
- Timeout automático para conexiones inactivas
- Gestión de memoria optimizada

### Actualizaciones
- El sistema es compatible con futuras extensiones
- Fácil agregar nuevos tipos de eventos
- Arquitectura modular y extensible