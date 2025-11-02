# 📚 GUÍA COMPLETA DE USUARIO - SISTEMA DE VENTAS SAS

**Versión:** 1.0  
**Última actualización:** Enero 2025

---

## 📖 ÍNDICE

1. [Introducción](#introducción)
2. [Inicio de Sesión](#inicio-de-sesión)
3. [Dashboard](#dashboard)
4. [Gestión de Ventas](#gestión-de-ventas)
5. [Gestión de Cotizaciones](#gestión-de-cotizaciones)
6. [Gestión de Productos](#gestión-de-productos)
7. [Gestión de Clientes](#gestión-de-clientes)
8. [Gestión de Cajas](#gestión-de-cajas)
9. [Gestión de Gastos](#gestión-de-gastos)
10. [Usuarios y Permisos](#usuarios-y-permisos)
11. [Reportes](#reportes)
12. [Configuración](#configuración)

---

## 🎯 INTRODUCCIÓN

El **Sistema de Ventas SAS** es una plataforma SaaS completa para gestionar ventas, inventario, clientes y reportes de tu negocio.

### **Características Principales:**
- ✅ Gestión completa de ventas
- ✅ Control de inventario y stock
- ✅ Sistema de cotizaciones
- ✅ Gestión de clientes
- ✅ Control de cajas registradoras
- ✅ Reportes y analytics avanzados
- ✅ Multi-sucursal
- ✅ Sistema de permisos y roles
- ✅ Autenticación de dos factores (2FA)

---

## 🔐 INICIO DE SESIÓN

### **Acceso al Sistema**

1. Navega a la URL de tu empresa: `https://tudominio.com/tu-slug`
2. Verás la página de login
3. Ingresa tus credenciales:
   - **CI** o **Correo Electrónico**
   - **Contraseña**

### **Autenticación de Dos Factores (2FA)**

Si tienes 2FA activado:
1. Después de ingresar tus credenciales, aparecerá un campo para el código 2FA
2. Abre tu app autenticadora (Google Authenticator, Authy, etc.)
3. Ingresa el código de 6 dígitos
4. ¡Listo! Serás redirigido al dashboard

### **Recuperar Contraseña**

Si olvidaste tu contraseña:
1. Contacta a tu administrador
2. El administrador puede resetear tu contraseña desde el panel de usuarios

---

## 📊 DASHBOARD

El dashboard te muestra una vista general de tu negocio.

### **Estadísticas Principales:**
- **Ventas del Mes**: Total de ventas realizadas este mes
- **Clientes**: Número de clientes activos
- **Productos**: Total de productos en tu catálogo
- **Ingresos del Mes**: Ingresos totales del mes actual

### **Analytics y Métricas:**
- **Gráfico de Ventas**: Tendencias diarias, semanales o mensuales
- **Productos Más Vendidos**: Top 10 productos con mayor venta
- **Ingresos vs Gastos**: Análisis de ganancias
- **Análisis de Cotizaciones**: Cotizaciones creadas, convertidas y expiradas

### **Filtros:**
- Cambia entre vista diaria, semanal o mensual
- Selecciona rango de días (7, 30, 60, 90 días)
- Comparación con período anterior

---

## 💰 GESTIÓN DE VENTAS

### **Crear una Nueva Venta**

1. Navega a **Ventas** en el menú lateral
2. Click en el botón **"Nueva Venta"**
3. Completa el formulario:
   - **Cliente**: Selecciona un cliente existente o ingresa nombre
   - **Productos**: Agrega productos con cantidad
   - **Método de Pago**: Efectivo, Tarjeta, Transferencia, QR
   - **Descuento**: Opcional
   - **Notas**: Comentarios adicionales
4. Click en **"Guardar"** o **"Completar Venta"**

### **Buscar y Filtrar Ventas**

- Usa el campo de búsqueda para encontrar por número de venta
- Filtra por estado: Completada, Pendiente, Cancelada
- Ordena por fecha, monto o cliente

### **Ver Detalles de una Venta**

1. Click en el botón **"Ver"** (icono de ojo) en la tabla
2. Verás:
   - Información del cliente
   - Lista completa de productos
   - Método de pago
   - Desglose de precios
   - Códigos de seguimiento (si aplica)

### **Cancelar una Venta**

1. En la tabla de ventas, click en **"Cancelar"**
2. Confirma la acción
3. El stock de los productos se restaurará automáticamente

---

## 📋 GESTIÓN DE COTIZACIONES

### **Crear una Cotización**

1. Ve a **Cotizaciones** en el menú
2. Click en **"Nueva Cotización"**
3. Completa:
   - **Cliente**: Selecciona o ingresa nombre
   - **Teléfono**: Opcional
   - **Productos**: Agrega productos con cantidades y precios
   - **Fecha de Vencimiento**: Cuándo expira la cotización
   - **Descuento**: Opcional
4. Click en **"Guardar"**

### **Estados de Cotización**

- **Activa**: Cotización válida
- **Pendiente**: Esperando aprobación
- **Aprobada**: Cliente aceptó
- **Convertida**: Se convirtió en venta
- **Expirada**: Pasó la fecha de vencimiento
- **Rechazada**: Cliente rechazó

### **Convertir Cotización en Venta**

1. Abre la cotización desde la tabla
2. Click en **"Convertir a Venta"**
3. La cotización se marcará como "Convertida"
4. Se creará una nueva venta automáticamente

---

## 📦 GESTIÓN DE PRODUCTOS

### **Crear un Producto**

1. Ve a **Productos** → **Nuevo Producto**
2. Completa la información:
   - **Nombre**: Nombre del producto
   - **Categoría**: Selecciona una categoría
   - **Marca y Modelo**: Opcional
   - **Descripción**: Detalles del producto
   - **Precio de Venta**: Precio al público
   - **Precio de Compra**: Costo del producto
   - **Stock Inicial**: Cantidad disponible
   - **Stock Mínimo**: Alerta cuando llegue a este nivel
   - **SKU y Código de Barras**: Opcional
   - **Imagen**: Sube una imagen (opcional)
3. Click en **"Guardar"**

### **Gestión de Stock**

- **Ver Stock Actual**: Se muestra en la tabla de productos
- **Actualizar Stock**: Click en "Editar" producto y modifica el stock
- **Alertas de Stock Bajo**: Recibirás notificaciones cuando el stock llegue al mínimo
- **Control Automático**: El stock se decrementa automáticamente al hacer una venta

### **Categorías**

- Organiza tus productos en categorías
- Crea categorías desde **Categorías** en el menú
- Asigna productos a categorías para mejor organización

---

## 👥 GESTIÓN DE CLIENTES

### **Agregar un Cliente**

1. Ve a **Clientes** → **Nuevo Cliente**
2. Completa:
   - **Nombre y Apellido**
   - **Correo y Teléfono**
   - **Dirección**
   - **CI/NIT**: Para facturación
3. Click en **"Guardar"**

### **Buscar Clientes**

- Usa el campo de búsqueda para encontrar por nombre, CI, correo o teléfono
- Los clientes se muestran en una tabla con toda su información

---

## 💵 GESTIÓN DE CAJAS

### **Abrir una Caja**

1. Ve a **Cajas** en el menú
2. Click en **"Abrir Caja"** en una caja cerrada
3. Ingresa el **Monto de Apertura**
4. Click en **"Abrir"**

### **Cerrar una Caja**

1. En la lista de cajas, encuentra la caja abierta
2. Click en **"Cerrar Caja"**
3. Ingresa el **Monto Final**
4. El sistema calculará la diferencia
5. Click en **"Cerrar"**

### **Ver Movimientos de Caja**

1. Click en **"Ver Detalle"** de una caja
2. Verás:
   - Ventas registradas
   - Balance actual
   - Historial de aperturas y cierres

---

## 💸 GESTIÓN DE GASTOS

### **Registrar un Gasto**

1. Ve a **Gastos** → **Nuevo Gasto**
2. Completa:
   - **Fecha**
   - **Concepto**: Nombre del gasto
   - **Categoría**: Tipo de gasto
   - **Monto**
   - **Sucursal**: Opcional
   - **Descripción**: Detalles adicionales
3. Click en **"Guardar"**

### **Categorías de Gastos**

Algunas categorías comunes:
- Combustible
- Servicios
- Mantenimiento
- Alquiler
- Salarios
- Otros

---

## 👤 USUARIOS Y PERMISOS

### **Gestión de Usuarios**

Solo usuarios con permisos de administración pueden:
1. Ver lista de usuarios en **Usuarios**
2. Crear nuevos usuarios
3. Editar información de usuarios
4. Activar/desactivar usuarios
5. Asignar roles

### **Roles y Permisos**

- **Administrador**: Acceso completo
- **Vendedor**: Puede crear ventas y cotizaciones
- **Cajero**: Puede abrir/cerrar cajas
- **Consulta**: Solo lectura

### **Activar 2FA**

1. Ve a tu **Perfil**
2. En la sección de seguridad, activa **Autenticación de Dos Factores**
3. Escanea el código QR con tu app autenticadora
4. Guarda los códigos de respaldo en un lugar seguro

---

## 📈 REPORTES

### **Acceder a Reportes**

1. Ve a **Reportes** en el menú
2. Selecciona el tipo de reporte:
   - Reporte General
   - Reporte de Ventas
   - Reporte de Productos
   - Reporte de Clientes
   - Reporte de Gastos
   - Reporte de Cajas

### **Filtrar Reportes**

- Selecciona rango de fechas
- Filtra por sucursal (si aplica)
- Filtra por estado
- Exporta a PDF o Excel (según disponibilidad)

---

## ⚙️ CONFIGURACIÓN

### **Configuración de la Cuenta**

En **Configuración** puedes:
- Cambiar información personal
- Actualizar contraseña
- Activar/desactivar 2FA
- Configurar preferencias

### **Sucursales**

Si tu empresa tiene múltiples sucursales:
1. Ve a **Sucursales**
2. Crea y gestiona tus sucursales
3. Asigna usuarios a sucursales específicas

---

## 💡 CONSEJOS Y MEJORES PRÁCTICAS

### **Gestión de Stock:**
- Define stock mínimo apropiado para cada producto
- Revisa regularmente las alertas de stock bajo
- Actualiza precios cuando sea necesario

### **Ventas:**
- Siempre selecciona el cliente correcto
- Verifica el método de pago antes de completar
- Usa las notas para información adicional importante

### **Cotizaciones:**
- Establece fechas de vencimiento realistas
- Sigue up con clientes antes de que expiren
- Convierte cotizaciones aprobadas en ventas rápidamente

### **Seguridad:**
- Activa 2FA en tu cuenta
- No compartas tus credenciales
- Cierra sesión al terminar de trabajar

---

## 🆘 SOPORTE

Si necesitas ayuda:
1. Revisa esta guía
2. Consulta el FAQ
3. Contacta a tu administrador del sistema
4. Revisa la documentación técnica (si eres desarrollador)

---

**Última actualización:** Enero 2025

