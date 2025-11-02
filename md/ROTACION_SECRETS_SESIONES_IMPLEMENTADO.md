# ✅ ROTACIÓN DE SECRETS JWT Y GESTIÓN DE SESIONES IMPLEMENTADO

**Fecha:** Enero 2025  
**Prioridad:** ALTA  
**Estado:** ✅ COMPLETADO

---

## 📋 RESUMEN

Se ha implementado un sistema completo de:
1. **Rotación de Secrets JWT**: Permite rotar secrets automáticamente manteniendo compatibilidad con tokens anteriores
2. **Gestión de Sesiones**: Sistema robusto para tracking y gestión de sesiones activas con:
   - Timeout de inactividad (30 minutos)
   - Invalidación al cambiar contraseña
   - Tracking de dispositivo/IP
   - Soporte para sesión única (configurable)

---

## 🗄️ CAMBIOS EN BASE DE DATOS

### Nuevos Modelos

#### 1. `JwtSecret`
Almacena secrets JWT con versionado para rotación:

```prisma
model JwtSecret {
  id            String   @id @default(cuid())
  systemType    String   // 'admin' | 'sas' | 'general'
  secretKey     String   @map("secret_key")
  version       Int      @default(1)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  expiresAt     DateTime? // Fecha de expiración
  rotatedAt     DateTime? // Fecha de última rotación
}
```

#### 2. `UserSession`
Sesiones para sistema Admin:

```prisma
model UserSession {
  id            String   @id @default(cuid())
  userId        String
  sessionToken  String   @unique
  systemType    String   // 'admin'
  ipAddress     String?
  userAgent     String?
  deviceInfo    Json?
  lastActivityAt DateTime @default(now())
  expiresAt     DateTime
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  user          Profile  @relation(...)
}
```

#### 3. `SasSession`
Sesiones para sistema SAS:

```prisma
model SasSession {
  id            String     @id @default(cuid())
  userId        String
  customerId    String
  sessionToken  String     @unique
  ipAddress     String?
  userAgent     String?
  deviceInfo    Json?
  lastActivityAt DateTime  @default(now())
  expiresAt     DateTime
  isActive      Boolean    @default(true)
  createdAt     DateTime   @default(now())
  user          UsuarioSas @relation(...)
}
```

#### 4. `PasswordChange`
Tracking de cambios de contraseña:

```prisma
model PasswordChange {
  id                String   @id @default(cuid())
  userId            String
  systemType        String   // 'admin' | 'sas'
  changedAt         DateTime @default(now())
  invalidatedSessions Int    @default(0)
  user              Profile  @relation(...)
}
```

### Campos Agregados

- `Profile.passwordChangedAt`: Para invalidar sesiones al cambiar contraseña
- `UsuarioSas.passwordChangedAt`: Similar para usuarios SAS

---

## 🔧 ARCHIVOS CREADOS

### 1. `lib/auth/jwt-secret-rotation.ts`
Servicio para rotación de secrets JWT:

- `getActiveSecret()`: Obtiene el secret activo
- `getValidSecrets()`: Obtiene todos los secrets válidos (actual + anterior)
- `rotateSecret()`: Rota el secret y mantiene el anterior válido por 7 días
- `shouldRotate()`: Verifica si necesita rotación
- `initializeSecretIfNeeded()`: Inicializa secret si no existe

### 2. `lib/auth/session-management.ts`
Servicio para gestión de sesiones:

- `createSession()`: Crea nueva sesión
- `validateSession()`: Valida sesión activa
- `updateActivity()`: Actualiza última actividad
- `invalidateSession()`: Invalida sesión específica
- `invalidateUserSessions()`: Invalida todas las sesiones de un usuario
- `invalidateSessionsOnPasswordChange()`: Invalida sesiones al cambiar contraseña
- `cleanupExpiredSessions()`: Limpia sesiones expiradas

### 3. `lib/middleware/session-validator.ts`
Validadores de sesión para middleware:

- `validateAdminSession()`: Valida sesión Admin
- `validateSasSession()`: Valida sesión SAS

### 4. `scripts/cleanup-sessions.ts`
Script para limpieza periódica de sesiones expiradas.

---

## 🔄 CAMBIOS EN SERVICIOS EXISTENTES

### `lib/auth/admin-jwt.ts`
- ✅ Actualizado para usar `JwtSecretRotation`
- ✅ Métodos asíncronos `generateToken()` y `verifyToken()`
- ✅ Métodos síncronos mantenidos para backward compatibility

### `lib/auth/sas-jwt.ts`
- ✅ Actualizado para usar `JwtSecretRotation`
- ✅ Métodos asíncronos `generateToken()` y `verifyToken()`
- ✅ Métodos síncronos mantenidos para backward compatibility

### `lib/auth/admin-auth-service.ts`
- ✅ Crea sesión en BD al hacer login
- ✅ Incluye `sessionId` en el token JWT

### `lib/services/sales/auth-sas-service.ts`
- ✅ Crea sesión en BD al hacer login
- ✅ Incluye `sessionId` en el token JWT

### `lib/services/admin/user-admin-service.ts`
- ✅ `changeUserPassword()` invalida sesiones al cambiar contraseña
- ✅ Actualiza `passwordChangedAt`

### `lib/services/sales/usuario-sas-service.ts`
- ✅ `updateUsuario()` invalida sesiones si se cambia contraseña
- ✅ Actualiza `passwordChangedAt`

---

## ⚙️ CONFIGURACIÓN

### Variables de Entorno

No se requieren nuevas variables. El sistema usa los secrets existentes como fallback:
- `ADMIN_JWT_SECRET`
- `SAS_JWT_SECRET`
- `JWT_SECRET`

### Rotación Automática

Para habilitar rotación automática, ejecutar periódicamente:

```typescript
import { JwtSecretRotation } from '@/lib/auth/jwt-secret-rotation'

// Verificar si necesita rotación
const needsRotation = await JwtSecretRotation.shouldRotate('admin', 7)

if (needsRotation) {
  // Generar nuevo secret (en producción, usar generador seguro)
  const newSecret = generateSecureSecret()
  
  await JwtSecretRotation.rotateSecret({
    systemType: 'admin',
    secret: newSecret,
    expiresInDays: 90,
  })
}
```

### Limpieza de Sesiones

Ejecutar periódicamente (cron job):

```bash
# Cada hora
tsx scripts/cleanup-sessions.ts
```

O agregar al `package.json`:

```json
{
  "scripts": {
    "cleanup:sessions": "tsx scripts/cleanup-sessions.ts"
  }
}
```

---

## 🔐 CARACTERÍSTICAS DE SEGURIDAD

### Rotación de Secrets

1. **Período de Gracia**: 7 días después de rotar, el secret anterior sigue siendo válido
2. **Versionado**: Cada secret tiene una versión para tracking
3. **Expiración**: Secrets pueden tener fecha de expiración
4. **Fallback**: Si no hay secret en BD, usa variable de entorno

### Gestión de Sesiones

1. **Timeout de Inactividad**: 30 minutos sin actividad
2. **Expiración**: Sesiones Admin (7 días), SAS (1 día)
3. **Invalidación al Cambiar Contraseña**: Automática
4. **Tracking de Dispositivo**: IP, User Agent, Device Info
5. **Sesión Única**: Opcional (configurable)

---

## 📝 PRÓXIMOS PASOS

### Para Aplicar Cambios

1. **Generar Prisma Client**:
   ```bash
   pnpm db:generate
   ```

2. **Aplicar Migración**:
   ```bash
   pnpm db:push
   ```

3. **Inicializar Secrets** (opcional, si quieres usar rotación desde el inicio):
   ```typescript
   await JwtSecretRotation.initializeSecretIfNeeded('admin', process.env.ADMIN_JWT_SECRET!)
   await JwtSecretRotation.initializeSecretIfNeeded('sas', process.env.SAS_JWT_SECRET!)
   ```

4. **Configurar Cron Job** para limpieza de sesiones

### Integración en Endpoints

Los endpoints de login ya están actualizados. Los endpoints protegidos deberían usar `validateAdminSession()` o `validateSasSession()` en lugar de solo verificar el token.

### Monitoreo

- Monitorear tabla `user_sessions` y `sas_sessions` para sesiones activas
- Monitorear tabla `jwt_secrets` para rotación
- Alertar si un secret está próximo a expirar

---

## 🐛 NOTAS IMPORTANTES

1. **Backward Compatibility**: Los métodos síncronos siguen funcionando para no romper código existente
2. **Error Handling**: Si falla la rotación, usa fallback a variable de entorno
3. **Performance**: Validación de sesión agrega 1 query a BD, pero mejora seguridad
4. **Prisma Generate**: Puede fallar si hay procesos usando el cliente (cerrar servidor dev primero)

---

## ✅ BENEFICIOS

1. **Seguridad Mejorada**: Rotación automática de secrets reduce riesgo si se compromete
2. **Sesiones Rastreables**: Tracking completo de sesiones activas
3. **Invalidación Inteligente**: Sesiones se invalidan automáticamente al cambiar contraseña
4. **Compliance**: Mejor auditoría y cumplimiento de seguridad
5. **Control de Acceso**: Timeout de inactividad previene acceso no autorizado

---

**Última actualización:** Enero 2025

