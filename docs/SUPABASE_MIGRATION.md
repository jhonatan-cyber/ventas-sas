# Guía de Migración a Supabase

Esta guía te ayudará a migrar tu base de datos de PostgreSQL local/Neon a Supabase.

## ¿Por qué Supabase?

- ✅ **Hosting gratuito** con límites generosos
- ✅ **Connection pooling** integrado (PgBouncer)
- ✅ **Backups automáticos**
- ✅ **Dashboard web** para administración
- ✅ **Escalabilidad** fácil

## Paso 1: Crear un Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Guarda la contraseña de la base de datos (la necesitarás después)

## Paso 2: Obtener las Credenciales

1. En el dashboard de Supabase, ve a **Settings** → **Database**
2. Busca la sección **Connection string**
3. Copia las dos URLs:
   - **Connection pooling** (puerto 6543) → Esta será tu `DATABASE_URL`
   - **Direct connection** (puerto 5432) → Esta será tu `DIRECT_URL`

Las URLs se verán así:

```bash
# Connection pooling (para queries normales)
DATABASE_URL="postgresql://postgres.bcixvjmnxviawfbmsffg:[YOUR-PASSWORD]@aws-1-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (para migraciones)
DIRECT_URL="postgresql://postgres.bcixvjmnxviawfbmsffg:[YOUR-PASSWORD]@aws-1-us-west-1.pooler.supabase.com:5432/postgres"
```

## Paso 3: Configurar Variables de Entorno

### Desarrollo Local

Actualiza tu archivo `.env`:

```bash
# Reemplaza [YOUR-PASSWORD] con tu contraseña real
DATABASE_URL="postgresql://postgres.bcixvjmnxviawfbmsffg:[YOUR-PASSWORD]@aws-1-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.bcixvjmnxviawfbmsffg:[YOUR-PASSWORD]@aws-1-us-west-1.pooler.supabase.com:5432/postgres"
```

### Producción (Vercel)

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega las dos variables:
   - `DATABASE_URL` → URL con pooling (puerto 6543)
   - `DIRECT_URL` → URL directa (puerto 5432)
4. Aplica a todos los entornos (Production, Preview, Development)

## Paso 4: Ejecutar Migraciones

Una vez configuradas las variables de entorno:

```bash
# Generar el cliente de Prisma
pnpm db:generate

# Aplicar migraciones
pnpm db:migrate:deploy

# Ejecutar seed (opcional)
pnpm db:seed
```

## Paso 5: Verificar la Conexión

```bash
# Ejecutar el proyecto
pnpm dev

# Debería conectarse sin problemas a Supabase
```

## Diferencias Importantes

### Connection Pooling vs Direct Connection

| Aspecto | DATABASE_URL (Pooling) | DIRECT_URL (Direct) |
|---------|------------------------|---------------------|
| **Puerto** | 6543 | 5432 |
| **Uso** | Queries normales | Migraciones |
| **Parámetro** | `?pgbouncer=true` | Sin parámetros |
| **Conexiones** | Limitadas por pool | Directas |

### ¿Por qué dos URLs?

Supabase usa **PgBouncer** para gestionar conexiones eficientemente. Sin embargo, PgBouncer no soporta todas las operaciones que Prisma necesita para migraciones (como transacciones preparadas). Por eso:

- **DATABASE_URL**: Usa el pool para queries normales (más eficiente)
- **DIRECT_URL**: Usa conexión directa solo para migraciones

## Troubleshooting

### Error: "prepared statement already exists"

**Causa**: Estás usando la URL de pooling para migraciones.

**Solución**: Asegúrate de que `DIRECT_URL` esté configurada correctamente.

### Error: "too many connections"

**Causa**: Has excedido el límite de conexiones del plan gratuito.

**Solución**: 
1. Verifica que estés usando `DATABASE_URL` (pooling) para queries
2. Reduce `connection_limit` en la URL si es necesario
3. Considera actualizar a un plan de pago

### Error: "SSL connection required"

**Causa**: Supabase requiere SSL.

**Solución**: Agrega `?sslmode=require` al final de tus URLs (ya debería estar incluido por defecto).

## Migrar Datos Existentes

Si ya tienes datos en tu base de datos local:

### Opción 1: Dump y Restore (Recomendado)

```bash
# 1. Hacer dump de tu base de datos local
pg_dump -h localhost -U postgres -d ventas-sas -f backup.sql

# 2. Restaurar en Supabase
psql "postgresql://postgres.bcixvjmnxviawfbmsffg:[YOUR-PASSWORD]@aws-1-us-west-1.pooler.supabase.com:5432/postgres" -f backup.sql
```

### Opción 2: Usar Supabase Dashboard

1. Ve a **Database** → **Backups** en el dashboard
2. Sube tu archivo SQL
3. Ejecuta el restore

## Monitoreo

Supabase ofrece herramientas de monitoreo integradas:

1. **Database** → **Query Performance**: Ver queries lentas
2. **Database** → **Logs**: Ver logs de la base de datos
3. **Database** → **Backups**: Gestionar backups automáticos

## Límites del Plan Gratuito

- **500 MB** de almacenamiento
- **2 GB** de transferencia mensual
- **Backups** por 7 días
- **Connection pooling** ilimitado

Para proyectos en producción con tráfico alto, considera el plan Pro ($25/mes).

## Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Prisma con Supabase](https://www.prisma.io/docs/guides/database/supabase)
- [Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
