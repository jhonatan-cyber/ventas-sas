# 👨‍💼 GUÍA DE ADMINISTRADOR - SISTEMA SAS

**Versión:** 1.0  
**Última actualización:** Enero 2025

---

## 📖 ÍNDICE

1. [Introducción](#introducción)
2. [Acceso al Panel](#acceso-al-panel)
3. [Gestión de Clientes (Organizaciones)](#gestión-de-clientes)
4. [Gestión de Usuarios](#gestión-de-usuarios)
5. [Gestión de Planes](#gestión-de-planes)
6. [Gestión de Suscripciones](#gestión-de-suscripciones)
7. [Gestión de Roles](#gestión-de-roles)
8. [Analytics del Sistema](#analytics-del-sistema)
9. [Configuración del Sistema](#configuración-del-sistema)

---

## 🎯 INTRODUCCIÓN

El **Panel de Administración** te permite gestionar todas las organizaciones, usuarios, planes y configuración del sistema SaaS.

### **Permisos Requeridos:**
- ✅ Debes ser **Super Administrador**
- ✅ Tu sesión debe estar activa
- ✅ Autenticación 2FA recomendada

---

## 🔐 ACCESO AL PANEL

### **Login de Administrador**

1. Navega a `/administracion/login`
2. Ingresa tus credenciales:
   - **Email** de super administrador
   - **Contraseña**
3. Si tienes 2FA activado, ingresa el código
4. Serás redirigido al dashboard de administración

### **Seguridad**

- ✅ Las sesiones expiran después de 30 minutos de inactividad
- ✅ 2FA altamente recomendado
- ✅ Logs de seguridad para todas las acciones críticas

---

## 🏢 GESTIÓN DE CLIENTES

### **Ver Lista de Clientes**

1. Ve a **Clientes** en el menú
2. Verás todas las organizaciones registradas
3. Información mostrada:
   - Nombre de la organización
   - Slug (URL única)
   - Estado (Activo/Suspendido)
   - Fecha de creación

### **Crear Nuevo Cliente**

1. Click en **"Nuevo Cliente"**
2. Completa:
   - **Nombre**: Razón social
   - **Slug**: URL única (se genera automáticamente)
   - **Estado**: Activo o Inactivo
   - **Información adicional**: Dirección, contacto, etc.
3. Click en **"Guardar"**

### **Suspender/Activar Cliente**

1. En la lista de clientes, encuentra el cliente
2. Click en el botón de estado
3. Confirma la acción
4. **Suspender**: Bloquea el acceso pero mantiene los datos
5. **Activar**: Restaura el acceso

---

## 👥 GESTIÓN DE USUARIOS

### **Ver Usuarios**

1. Ve a **Usuarios** en el menú
2. Verás todos los usuarios del sistema
3. Puedes filtrar por:
   - Estado (Activo/Inactivo)
   - Rol
   - Organización

### **Crear Usuario**

1. Click en **"Nuevo Usuario"**
2. Completa:
   - **Nombre completo**
   - **Email**
   - **Contraseña temporal** (el usuario deberá cambiarla)
   - **Rol**: Asigna un rol del sistema
   - **Organización**: Asigna a qué organización pertenece
   - **Super Administrador**: Check solo para admins del sistema
3. Click en **"Guardar"**

### **Editar Usuario**

1. Click en **"Editar"** en la fila del usuario
2. Modifica la información necesaria
3. Puedes:
   - Cambiar rol
   - Activar/desactivar
   - Reasignar a otra organización
   - Resetear contraseña

---

## 💳 GESTIÓN DE PLANES

### **Ver Planes**

1. Ve a **Planes** en el menú
2. Verás todos los planes de suscripción disponibles

### **Crear Plan**

1. Click en **"Nuevo Plan"**
2. Completa:
   - **Nombre**: Ej. "Básico", "Premium", "Enterprise"
   - **Precio**: Monto mensual
   - **Descripción**: Características del plan
   - **Estado**: Activo o Inactivo
3. Click en **"Guardar"**

### **Editar Plan**

- Puedes modificar precio y descripción
- **No cambies el nombre** si hay suscripciones activas

---

## 📋 GESTIÓN DE SUSCRIPCIONES

### **Ver Suscripciones**

1. Ve a **Suscripciones** en el menú
2. Verás:
   - Cliente (organización)
   - Plan asignado
   - Estado (Activa/Suspendida/Cancelada)
   - Fechas de inicio y fin
   - Próximo pago

### **Asignar Suscripción**

1. Click en **"Nueva Suscripción"**
2. Selecciona:
   - **Cliente**: Organización
   - **Plan**: Plan de suscripción
   - **Fecha de inicio**
   - **Estado**: Activa
3. Click en **"Guardar"**

### **Suspender/Cancelar Suscripción**

1. En la lista, encuentra la suscripción
2. Click en **"Suspender"** o **"Cancelar"**
3. Confirma la acción
4. El cliente perderá acceso según el estado

---

## 🛡️ GESTIÓN DE ROLES

### **Ver Roles**

1. Ve a **Roles** en el menú
2. Verás todos los roles del sistema

### **Crear Rol**

1. Click en **"Nuevo Rol"**
2. Completa:
   - **Nombre**: Ej. "Vendedor Senior"
   - **Descripción**
   - **Permisos**: Selecciona permisos específicos
3. Click en **"Guardar"**

### **Permisos Disponibles**

- Gestión de ventas
- Gestión de productos
- Gestión de clientes
- Gestión de cajas
- Gestión de reportes
- Administración de usuarios
- Configuración del sistema

---

## 📊 ANALYTICS DEL SISTEMA

### **Dashboard de Administración**

El dashboard muestra:
- **Total de Organizaciones**: Activas, suspendidas, en prueba
- **Total de Usuarios**: Activos, inactivos, super admins
- **Ingresos**: Totales, mensuales, anuales
- **Gráfico de Crecimiento**: Evolución de organizaciones en el tiempo
- **Ingresos por Plan**: Distribución de ingresos

### **Métricas Disponibles**

- Crecimiento de organizaciones
- Usuarios activos vs nuevos
- Ingresos por plan de suscripción
- Tendencias mensuales

---

## ⚙️ CONFIGURACIÓN DEL SISTEMA

### **Configuración General**

En **Configuración** puedes:
- Modificar configuraciones globales
- Gestionar secretos JWT
- Configurar rotación de secrets
- Ver logs del sistema
- Gestionar backups

### **Seguridad**

- **Rotación de Secrets JWT**: Automática cada 90 días
- **Logs de Seguridad**: Todas las acciones críticas se registran
- **Sesiones**: Timeout automático de 30 minutos

---

## 🔍 AUDITORÍA Y LOGS

### **Logs de Seguridad**

Todas estas acciones se registran:
- ✅ Creación/edición/eliminación de usuarios
- ✅ Cambios en roles y permisos
- ✅ Suspensión/activación de clientes
- ✅ Cambios en suscripciones
- ✅ Accesos al sistema
- ✅ Cambios en configuración

### **Ver Logs**

1. Ve a **Logs** (si está disponible)
2. Filtra por:
   - Tipo de acción
   - Usuario
   - Fecha
   - Organización

---

## 💡 MEJORES PRÁCTICAS

### **Gestión de Clientes:**
- Revisa regularmente organizaciones inactivas
- Comunica cambios importantes a los clientes
- Mantén información de contacto actualizada

### **Gestión de Usuarios:**
- Asigna roles apropiados (principio de menor privilegio)
- Desactiva usuarios que ya no trabajan
- Fuerza cambio de contraseña después de reset

### **Planes y Suscripciones:**
- Monitorea suscripciones próximas a vencer
- Comunica cambios de plan con anticipación
- Mantén precios competitivos

### **Seguridad:**
- Revisa logs de seguridad regularmente
- Activa 2FA en todas las cuentas de admin
- Rota secrets periódicamente
- Haz backups regulares

---

## 🆘 SOPORTE TÉCNICO

### **Problemas Comunes**

1. **Cliente no puede acceder:**
   - Verifica que la organización esté activa
   - Verifica que la suscripción esté activa
   - Revisa logs de acceso

2. **Usuario olvidó contraseña:**
   - Resetea desde gestión de usuarios
   - El usuario deberá cambiar la contraseña temporal

3. **Problemas de facturación:**
   - Revisa estado de suscripción
   - Verifica plan asignado
   - Contacta al cliente directamente

---

**Última actualización:** Enero 2025

