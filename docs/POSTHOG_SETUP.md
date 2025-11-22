# Configuración de PostHog

PostHog está integrado en el sistema SAS para rastrear eventos importantes.

## Variables de Entorno

Agrega las siguientes variables a tu archivo `.env.local`:

```env
# PostHog Configuration
NEXT_PUBLIC_POSTHOG_KEY=phc_tu_api_key_aqui
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### Obtener tu API Key

1. Crea una cuenta en [PostHog](https://posthog.com) (gratis hasta 1M eventos/mes)
2. Ve a tu proyecto → Settings → Project API Key
3. Copia la API Key y pégala en `NEXT_PUBLIC_POSTHOG_KEY`

### Host Personalizado

Si estás usando PostHog self-hosted, cambia `NEXT_PUBLIC_POSTHOG_HOST` a tu URL personalizada.

## Eventos Rastreados

### 1. Login del Sistema SAS
- **Evento**: `sas_login_success`
- **Propiedades**:
  - `userId`: ID del usuario
  - `email`: Email del usuario
  - `organizationSlug`: Slug de la organización
  - `organizationName`: Nombre de la organización
  - `loginMethod`: "email" o "ci"

### 2. Creación de Ventas
- **Evento**: `sas_sale_created`
- **Propiedades**:
  - `saleId`: ID de la venta
  - `organizationId`: ID de la organización
  - `organizationSlug`: Slug de la organización
  - `total`: Monto total
  - `subtotal`: Subtotal
  - `discount`: Descuento aplicado
  - `paymentMethod`: Método de pago
  - `status`: Estado de la venta
  - `itemsCount`: Cantidad de items
  - `hasCustomer`: Si tiene cliente asociado

### 3. Creación de Cotizaciones
- **Evento**: `sas_quotation_created`
- **Propiedades**:
  - `quotationId`: ID de la cotización
  - `organizationId`: ID de la organización
  - `organizationSlug`: Slug de la organización
  - `total`: Monto total
  - `subtotal`: Subtotal
  - `discount`: Descuento aplicado
  - `status`: Estado de la cotización
  - `itemsCount`: Cantidad de items
  - `hasCustomer`: Si tiene cliente asociado
  - `hasExpiration`: Si tiene fecha de expiración
  - `branchId`: ID de la sucursal (si aplica)

### 4. Creación de Gastos
- **Evento**: `sas_expense_created`
- **Propiedades**:
  - `expenseId`: ID del gasto
  - `organizationId`: ID de la organización
  - `organizationSlug`: Slug de la organización
  - `amount`: Monto del gasto
  - `category`: Categoría del gasto
  - `hasDescription`: Si tiene descripción
  - `branchId`: ID de la sucursal (si aplica)

## Verificación

Para verificar que PostHog está funcionando:

1. Abre la consola del navegador (F12)
2. Busca mensajes como "PostHog initialized"
3. Realiza una acción (login, crear venta, etc.)
4. Ve a tu dashboard de PostHog y verifica que los eventos aparezcan

## Notas

- PostHog solo se inicializa si `NEXT_PUBLIC_POSTHOG_KEY` está configurado
- Los eventos del servidor se envían de forma asíncrona y no bloquean las respuestas
- En desarrollo, los eventos se registran en la consola para debugging

