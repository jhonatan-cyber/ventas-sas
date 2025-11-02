# 🌱 SEED INICIAL ACTUALIZADO

**Fecha:** Enero 2025  
**Estado:** ✅ ACTUALIZADO

---

## ✅ CAMBIOS REALIZADOS

### **Antes:**
- ❌ Creaba múltiples usuarios demo (Admin y SAS)
- ❌ Creaba organización demo
- ❌ Creaba cliente, sucursal, roles y usuarios SAS demo
- ❌ Credenciales complejas

### **Ahora:**
- ✅ **Solo crea el Super Administrador**
- ✅ Credenciales simples y fáciles de recordar
- ✅ Email: `admin@gmail.com`
- ✅ Contraseña: `admin`

---

## 📝 CREDENCIALES POR DEFECTO

### **Super Administrador:**
- **Email:** `admin@gmail.com`
- **Contraseña:** `admin`
- **Rol:** Super Administrador
- **Acceso:** Panel de Administración (`/administracion/login`)

---

## 🚀 CÓMO USAR

### **1. Clonar el Repositorio:**
```bash
git clone <repo-url>
cd ventas-sas
```

### **2. Instalar Dependencias:**
```bash
pnpm install
```

### **3. Configurar Base de Datos:**
```bash
# Generar Prisma Client
pnpm db:generate

# Aplicar schema a la base de datos
pnpm db:push

# Ejecutar seed (crea el super admin)
pnpm db:seed
```

### **4. Iniciar el Proyecto:**
```bash
pnpm dev
```

### **5. Acceder al Sistema:**
1. Abre: `http://localhost:3000/administracion/login`
2. Ingresa:
   - **Email:** `admin@gmail.com`
   - **Contraseña:** `admin`
3. ¡Listo! Ya puedes acceder al panel de administración

---

## 📋 COMANDOS ÚTILES

### **Comandos de Seed:**
```bash
# Ejecutar seed
pnpm db:seed

# Setup completo (generate + push + seed)
pnpm setup:db

# Reset completo (elimina todo y vuelve a crear)
pnpm db:reset
```

---

## ⚠️ IMPORTANTE

### **Seguridad:**
- 🔒 **Cambia la contraseña inmediatamente** en producción
- 🔒 Estas credenciales son **solo para desarrollo inicial**
- 🔒 **NO uses estas credenciales** en producción

### **Recomendaciones:**
1. Después del primer login, ve a tu perfil
2. Cambia la contraseña por una segura
3. Activa 2FA para mayor seguridad
4. Crea usuarios adicionales según necesites

---

## 🎯 PRÓXIMOS PASOS

Después de iniciar sesión:
1. ✅ Configura tu perfil
2. ✅ Crea organizaciones (clientes)
3. ✅ Crea planes de suscripción
4. ✅ Asigna suscripciones a organizaciones
5. ✅ Crea usuarios adicionales si es necesario

---

## 📝 ARCHIVO MODIFICADO

- ✅ `scripts/seed-simple.js` - Simplificado para solo crear super admin

---

**Última actualización:** Enero 2025

