# 🔐 PLAN DE IMPLEMENTACIÓN: AUTENTICACIÓN DE DOS FACTORES (2FA)

## 📋 RESUMEN

Implementación de 2FA usando **TOTP (Time-based One-Time Password)** con:
- ✅ Códigos de 6 dígitos (compatibles con Google Authenticator, Authy, etc.)
- ✅ QR Code para configuración inicial
- ✅ Backup codes para recuperación
- ✅ Opcional por usuario (no obligatorio)
- ✅ Soporte para Admin y SAS

---

## 🏗️ ARQUITECTURA

### 1. Base de Datos

**Campos a agregar:**

#### `Profile` (Sistema Admin):
```prisma
model Profile {
  // ... campos existentes
  twoFactorEnabled Boolean @default(false) @map("two_factor_enabled")
  twoFactorSecret  String?  @map("two_factor_secret") // Secret encriptado
  twoFactorBackupCodes Json? @map("two_factor_backup_codes") // Array de códigos hasheados
  twoFactorEnabledAt DateTime? @map("two_factor_enabled_at")
}
```

#### `UsuarioSas` (Sistema SAS):
```prisma
model UsuarioSas {
  // ... campos existentes
  twoFactorEnabled Boolean @default(false) @map("two_factor_enabled")
  twoFactorSecret  String?  @map("two_factor_secret")
  twoFactorBackupCodes Json? @map("two_factor_backup_codes")
  twoFactorEnabledAt DateTime? @map("two_factor_enabled_at")
}
```

### 2. Flujo de Login con 2FA

```
1. Usuario ingresa email/password
   ↓
2. Verificar contraseña ✓
   ↓
3. ¿Tiene 2FA habilitado?
   ├─ NO → Login exitoso (retornar token)
   └─ SÍ → Retornar "requires2FA: true"
   ↓
4. Usuario ingresa código TOTP
   ↓
5. Verificar código
   ├─ Válido → Login exitoso (retornar token)
   └─ Inválido → Error, permitir usar backup code
```

### 3. Componentes a Crear

#### Backend:
1. `lib/auth/two-factor-service.ts` - Servicio principal de 2FA
   - Generar secret
   - Generar QR Code
   - Validar código TOTP
   - Generar backup codes
   - Validar backup code

2. `app/api/administracion/2fa/setup/route.ts` - Habilitar 2FA
3. `app/api/administracion/2fa/verify/route.ts` - Verificar código durante setup
4. `app/api/administracion/2fa/disable/route.ts` - Deshabilitar 2FA
5. `app/api/administracion/login/route.ts` - Modificar para requerir 2FA
6. Similar para sistema SAS

#### Frontend:
1. Componente de configuración 2FA
2. Componente de entrada de código 2FA en login
3. Página de configuración de seguridad

---

## 🔧 IMPLEMENTACIÓN PASO A PASO

### Paso 1: Dependencias
```bash
pnpm add otplib qrcode
pnpm add -D @types/qrcode
```

### Paso 2: Schema de BD
- Agregar campos `twoFactorEnabled`, `twoFactorSecret`, etc.
- Aplicar migración

### Paso 3: Servicio 2FA
- Crear `TwoFactorService` con métodos:
  - `generateSecret()` - Genera secret único
  - `generateQRCode()` - Genera QR para app authenticator
  - `verifyToken()` - Valida código TOTP
  - `generateBackupCodes()` - Genera códigos de respaldo
  - `verifyBackupCode()` - Valida backup code

### Paso 4: Endpoints de Setup
- POST `/api/administracion/2fa/setup` - Iniciar setup (retorna QR)
- POST `/api/administracion/2fa/verify-setup` - Verificar código y habilitar
- POST `/api/administracion/2fa/disable` - Deshabilitar (requiere password)

### Paso 5: Modificar Login
- En `AdminAuthService.login()`:
  - Si tiene 2FA habilitado, no generar token todavía
  - Retornar `{ requires2FA: true, tempToken: '...' }`
- Nuevo endpoint: POST `/api/administracion/login/verify-2fa`
  - Recibe `tempToken` y `code`
  - Valida código 2FA
  - Si es válido, genera token JWT final

### Paso 6: Frontend
- Modificar página de login para mostrar input de 2FA si `requires2FA: true`
- Crear página de configuración de seguridad
- Componente de QR code viewer

---

## 🔒 SEGURIDAD

### Consideraciones:
1. **Secret encriptado**: No almacenar secret en texto plano
2. **Backup codes hasheados**: Hashear backup codes con bcrypt
3. **Temp token**: Token temporal con expiración corta (5 minutos)
4. **Rate limiting**: Limitar intentos de códigos 2FA
5. **Logging**: Registrar todos los eventos de 2FA

---

## 📱 APPS COMPATIBLES

- Google Authenticator
- Microsoft Authenticator
- Authy
- 1Password
- LastPass Authenticator

---

## ✅ BENEFICIOS

1. **Seguridad mejorada**: Protección adicional para cuentas críticas
2. **Estándar de la industria**: TOTP es ampliamente adoptado
3. **Opcional**: No obligatorio para todos los usuarios
4. **Recuperación**: Backup codes permiten acceso si se pierde dispositivo

---

## ⏱️ ESTIMACIÓN

- **Backend**: 4-5 horas
- **Frontend**: 2-3 horas
- **Testing**: 1 hora
- **Total**: 6-8 horas

