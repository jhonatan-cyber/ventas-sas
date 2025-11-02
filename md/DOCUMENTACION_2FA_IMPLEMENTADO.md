# ✅ AUTENTICACIÓN DE DOS FACTORES (2FA) IMPLEMENTADO

**Fecha:** Enero 2025  
**Prioridad:** ALTA  
**Estado:** ✅ COMPLETADO

---

## 📋 RESUMEN

Se ha implementado un sistema completo de **Autenticación de Dos Factores (2FA)** usando **TOTP (Time-based One-Time Password)** compatible con Google Authenticator, Microsoft Authenticator, Authy y otras apps similares.

### Características:
- ✅ **Opcional por usuario** (no obligatorio)
- ✅ **Códigos de 6 dígitos** (estándar TOTP)
- ✅ **QR Code para configuración** fácil
- ✅ **Backup codes** (10 códigos de respaldo)
- ✅ **Soporte para Admin y SAS**
- ✅ **Secrets encriptados** en base de datos
- ✅ **Logging de seguridad** completo

---

## 🔧 IMPLEMENTACIÓN

### 1. Base de Datos

#### Campos agregados a `Profile` (Sistema Admin):
```prisma
twoFactorEnabled    Boolean   @default(false)
twoFactorSecret     String?   // Secret encriptado
twoFactorBackupCodes Json?   // Array de códigos hasheados
twoFactorEnabledAt   DateTime?
```

#### Campos agregados a `UsuarioSas` (Sistema SAS):
```prisma
twoFactorEnabled    Boolean   @default(false)
twoFactorSecret     String?
twoFactorBackupCodes Json?
twoFactorEnabledAt   DateTime?
```

### 2. Servicio 2FA

**Archivo:** `lib/auth/two-factor-service.ts`

#### Funcionalidades:
- ✅ `generateSecret()` - Genera secret único
- ✅ `generateQRCode()` - Genera QR para authenticator apps
- ✅ `verifyToken()` - Valida código TOTP
- ✅ `generateBackupCodes()` - Genera códigos de respaldo
- ✅ `hashBackupCodes()` / `verifyBackupCode()` - Gestión segura de backup codes
- ✅ `encryptSecret()` / `decryptSecret()` - Encriptación de secrets
- ✅ `setupTwoFactor()` - Setup completo (QR + backup codes)
- ✅ `verifyTwoFactor()` - Verificación durante login

### 3. Endpoints de API

#### Sistema Admin:

**POST `/api/administracion/2fa/setup`**
- Inicia configuración de 2FA
- Retorna QR code y backup codes
- No habilita 2FA todavía (espera verificación)

**POST `/api/administracion/2fa/verify-setup`**
- Verifica código durante setup
- Habilita 2FA si código es válido

**POST `/api/administracion/2fa/disable`**
- Deshabilita 2FA (requiere contraseña)

**POST `/api/administracion/login/verify-2fa`**
- Verifica código 2FA durante login
- Retorna token JWT final

#### Sistema SAS (similar):
- `POST /api/[slug]/2fa/setup`
- `POST /api/[slug]/2fa/verify-setup`
- `POST /api/[slug]/2fa/disable`
- `POST /api/[slug]/login/verify-2fa`

### 4. Flujo de Login Modificado

#### Sin 2FA (comportamiento normal):
```
Login → Verificar password → Token JWT ✓
```

#### Con 2FA habilitado:
```
Login → Verificar password → ¿2FA habilitado?
  ↓ SÍ:
  Retornar { requires2FA: true, tempToken: "..." }
  ↓
  Usuario ingresa código 2FA
  ↓
  POST /login/verify-2fa
  ↓
  Verificar código → Token JWT final ✓
```

### 5. Validadores Zod

**Archivo:** `lib/validators/two-factor-validators.ts`

- `totpCodeSchema` - Código de 6 dígitos
- `backupCodeSchema` - Código de 8 dígitos
- `twoFactorCodeSchema` - Código flexible (6-8 dígitos)
- `verifySetupSchema` - Validación durante setup
- `verifyTwoFactorSchema` - Validación durante login
- `disableTwoFactorSchema` - Validación para deshabilitar

---

## 🔒 SEGURIDAD

### 1. Encriptación de Secrets
- Secrets almacenados encriptados usando AES-256-CBC
- Clave de encriptación desde `ENCRYPTION_KEY` (32 caracteres)
- IV aleatorio por cada secret

### 2. Backup Codes
- Generados aleatoriamente (8 dígitos)
- Hasheados con bcrypt antes de almacenar
- 10 códigos por usuario
- Pueden usarse como alternativa al TOTP

### 3. Token Temporal
- Token JWT temporal válido por **5 minutos**
- Solo para verificar 2FA durante login
- No permite acceso sin código 2FA

### 4. Rate Limiting
- Aplicado automáticamente a endpoints de login
- Previene ataques de fuerza bruta en códigos 2FA

### 5. Logging de Seguridad
Todos los eventos 2FA se registran:
- `TWO_FACTOR_SETUP_INITIATED`
- `TWO_FACTOR_ENABLED`
- `TWO_FACTOR_VERIFY_FAILED`
- `TWO_FACTOR_BACKUP_CODE_USED`
- `TWO_FACTOR_DISABLED`
- `TWO_FACTOR_DISABLE_FAILED`

---

## 📱 APPS COMPATIBLES

El sistema 2FA es compatible con:
- ✅ Google Authenticator
- ✅ Microsoft Authenticator
- ✅ Authy
- ✅ 1Password
- ✅ LastPass Authenticator
- ✅ Cualquier app TOTP estándar

---

## ⚙️ CONFIGURACIÓN

### Variables de Entorno

```env
# Clave de encriptación para secrets 2FA (32 caracteres)
# Generar con: openssl rand -hex 16
ENCRYPTION_KEY=your-32-char-encryption-key-here-change-in-production
```

### Generar Clave de Encriptación

```bash
# Linux/Mac
openssl rand -hex 16

# O usar Node.js
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

## 📖 USO

### 1. Habilitar 2FA (Admin)

```typescript
// Paso 1: Iniciar setup
POST /api/administracion/2fa/setup
// Retorna: { qrCode, secret, backupCodes }

// Paso 2: Escanear QR con app authenticator

// Paso 3: Verificar código
POST /api/administracion/2fa/verify-setup
Body: { code: "123456" }
```

### 2. Login con 2FA

```typescript
// Paso 1: Login normal
POST /api/administracion/login
Body: { email, password }
// Si tiene 2FA: { requires2FA: true, tempToken: "..." }

// Paso 2: Verificar código 2FA
POST /api/administracion/login/verify-2fa
Body: { code: "123456", tempToken: "..." }
// Retorna: Token JWT final
```

### 3. Deshabilitar 2FA

```typescript
POST /api/administracion/2fa/disable
Body: { password: "..." }
// Requiere contraseña para seguridad
```

---

## 🔐 FLUJO COMPLETO DE SEGURIDAD

### Setup Inicial:
1. Usuario solicita setup 2FA
2. Sistema genera secret único
3. Sistema genera QR code con URI `otpauth://totp/...`
4. Sistema genera 10 backup codes
5. Usuario escanea QR con app authenticator
6. Usuario ingresa código de la app
7. Sistema verifica código → Habilita 2FA

### Login con 2FA:
1. Usuario ingresa email/password
2. Sistema verifica password ✓
3. Sistema detecta 2FA habilitado
4. Sistema retorna token temporal (5 min)
5. Usuario ingresa código de app authenticator
6. Sistema verifica código TOTP o backup code
7. Sistema genera token JWT final ✓

---

## 📝 PRÓXIMOS PASOS

### Para Aplicar Cambios:

1. **Aplicar migración de BD**:
   ```bash
   pnpm db:push
   ```

2. **Configurar variable de entorno**:
   ```env
   ENCRYPTION_KEY=<generar-clave-de-32-caracteres>
   ```

3. **Probar setup**:
   - Llamar `/api/administracion/2fa/setup`
   - Escanear QR con app authenticator
   - Verificar con código

### Frontend Pendiente:

- [ ] Componente para mostrar QR code
- [ ] Input para código 2FA en login
- [ ] Página de configuración de seguridad
- [ ] Gestión de backup codes
- [ ] Indicador de estado 2FA en perfil

---

## 🎯 BENEFICIOS

1. **Seguridad mejorada**: Protección adicional para cuentas críticas
2. **Estándar de industria**: TOTP ampliamente adoptado
3. **Opcional**: No obligatorio, cada usuario decide
4. **Recuperación**: Backup codes permiten acceso si se pierde dispositivo
5. **Auditoría completa**: Todos los eventos registrados
6. **Fácil de usar**: QR code simplifica configuración

---

## 🐛 NOTAS IMPORTANTES

1. **Encriptación**: La clave `ENCRYPTION_KEY` es crítica. Debe ser única y segura
2. **Backup codes**: Mostrar solo una vez durante setup
3. **Token temporal**: Expira en 5 minutos (suficiente para ingresar código)
4. **Tolerancia de tiempo**: Códigos válidos ±30 segundos (estándar TOTP)
5. **Validación**: Verifica tanto TOTP como backup codes automáticamente

---

## ✅ ARCHIVOS CREADOS

- `lib/auth/two-factor-service.ts` - Servicio principal
- `lib/validators/two-factor-validators.ts` - Validadores Zod
- `app/api/administracion/2fa/setup/route.ts`
- `app/api/administracion/2fa/verify-setup/route.ts`
- `app/api/administracion/2fa/disable/route.ts`
- `app/api/administracion/login/verify-2fa/route.ts`
- `app/api/[slug]/2fa/setup/route.ts`
- `app/api/[slug]/2fa/verify-setup/route.ts`
- `app/api/[slug]/2fa/disable/route.ts`
- `app/api/[slug]/login/verify-2fa/route.ts`

---

## ✅ ARCHIVOS MODIFICADOS

- `prisma/schema.prisma` - Campos 2FA en Profile y UsuarioSas
- `lib/auth/admin-auth-service.ts` - Soporte 2FA en login
- `lib/services/sales/auth-sas-service.ts` - Soporte 2FA en login
- `app/api/administracion/login/route.ts` - Manejo de requires2FA
- `app/api/[slug]/login/route.ts` - Manejo de requires2FA
- `lib/utils/get-current-user.ts` - Actualizado para métodos asíncronos
- `config.example.env` - Variable ENCRYPTION_KEY

---

**Última actualización:** Enero 2025

