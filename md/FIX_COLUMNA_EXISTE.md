# 🔧 FIX: Error Columna "existe" No Existe

**Fecha:** Enero 2025  
**Problema:** Runtime error - La columna `existe` no existe en la base de datos

---

## ❌ ERROR

```
Invalid `prisma.customer.findFirst()` invocation:
The column `existe` does not exist in the current database.
```

**Ubicación:** `app/[slug]/layout.tsx:16` → `getCustomerBySlug()`

---

## 🔍 CAUSA

La base de datos tiene una estructura diferente al schema de Prisma. Probablemente:
1. Hay una columna `existe` en la tabla `customers` que no está en el schema
2. O Prisma está generando una query incorrecta
3. La base de datos no está sincronizada con el schema

---

## ✅ SOLUCIÓN IMPLEMENTADA

### 1. **Actualizado `getCustomerBySlug()`**

**Archivo:** `lib/utils/organization.ts`

**Cambios:**
- ✅ Agregado filtro `deletedAt: null` para respetar soft deletes
- ✅ Comentario actualizado para mencionar soft deletes

**Antes:**
```typescript
export async function getCustomerBySlug(slug: string) {
  const razonNormalized = slug.replace(/-/g, ' ')
  return prisma.customer.findFirst({
    where: {
      isActive: true,
      OR: [
        { slug },
        { razonSocial: { equals: razonNormalized, mode: 'insensitive' } },
      ],
    },
    // ...
  })
}
```

**Después:**
```typescript
export async function getCustomerBySlug(slug: string) {
  const razonNormalized = slug.replace(/-/g, ' ')
  return prisma.customer.findFirst({
    where: {
      isActive: true,
      deletedAt: null, // Excluir soft deleted
      OR: [
        { slug },
        { razonSocial: { equals: razonNormalized, mode: 'insensitive' } },
      ],
    },
    // ...
  })
}
```

---

## 🔧 PASOS PARA RESOLVER COMPLETAMENTE

### Opción 1: Sincronizar Base de Datos con Schema

```bash
# Sincronizar schema con base de datos (desarrollo)
pnpm db:push

# O aplicar migraciones
pnpm db:migrate dev
```

### Opción 2: Eliminar Columna "existe" Manualmente

Si la columna `existe` existe en la base de datos, ejecutar:

```sql
-- Ejecutar en PostgreSQL
ALTER TABLE customers DROP COLUMN IF EXISTS existe;
```

O usar el script proporcionado:

```bash
# Conectar a PostgreSQL y ejecutar
psql -d ventas-sas -f scripts/fix-customer-table.sql
```

### Opción 3: Verificar Estructura de la Base de Datos

```sql
-- Verificar columnas de la tabla customers
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;

-- Verificar si existe la columna "existe"
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_name = 'customers' 
  AND column_name = 'existe'
);
```

---

## 📋 VERIFICACIÓN

1. ✅ `getCustomerBySlug()` actualizado con filtro `deletedAt: null`
2. ⏳ Sincronizar base de datos con schema (pendiente)
3. ⏳ Verificar/eliminar columna `existe` si existe (pendiente)

---

## 🚀 PRÓXIMOS PASOS

1. **Sincronizar Base de Datos:**
   ```bash
   pnpm db:push
   ```

2. **O aplicar migraciones:**
   ```bash
   pnpm db:migrate dev
   ```

3. **Verificar que el error desaparezca:**
   - Reiniciar servidor de desarrollo
   - Probar acceder a `/[slug]/dashboard`

---

## 📝 NOTAS

- El filtro `deletedAt: null` es importante para respetar soft deletes
- Si el error persiste después de sincronizar, puede ser necesario:
  - Verificar que Prisma Client esté regenerado (`pnpm db:generate`)
  - Reiniciar el servidor de desarrollo
  - Limpiar caché de Next.js

---

**Última actualización:** Enero 2025

