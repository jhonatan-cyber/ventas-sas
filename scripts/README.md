# Scripts de Seed

Este directorio contiene los scripts para inicializar la base de datos con datos básicos y de demostración.

## Scripts Disponibles

### 1. `seed.js` - Seed Básico
Crea únicamente el usuario administrador del sistema.

```bash
node scripts/seed.js
```

**Datos creados:**
- Usuario administrador del sistema
- Email: `jhonatanancasi@gmail.com`
- Contraseña: `10571705`
- Acceso: `http://localhost:3000/administracion/login`

### 2. `seed-complete.js` - Seed Completo
Crea el usuario administrador + organización de demostración con datos de ejemplo.

```bash
node scripts/seed-complete.js
```

**Datos creados:**
- Usuario administrador del sistema
- Plan de suscripción básico
- Organización de demostración "Empresa Demo"
- Usuario SAS dueño de la organización
- Sucursal principal
- Configuración SAS básica

**Credenciales:**

**Administrador del Sistema:**
- URL: `http://localhost:3000/administracion/login`
- Email: `jhonatanancasi@gmail.com`
- Contraseña: `10571705`

**Usuario de la Organización Demo:**
- URL: `http://localhost:3000/demo-empresa/login`
- Email: `admin@demo-empresa.com`
- CI: `12345678`
- Contraseña: `12345678`

## Uso Recomendado

### Para Desarrollo
Usa el seed completo para tener datos de prueba:
```bash
node scripts/seed-complete.js
```

### Para Producción
Usa solo el seed básico:
```bash
node scripts/seed.js
```

## Notas Importantes

- ⚠️ **Cambia las contraseñas después del primer login**
- Los scripts verifican si los datos ya existen antes de crearlos
- Es seguro ejecutar los scripts múltiples veces
- El seed completo incluye el seed básico

## Migración Consolidada

La base de datos usa una migración consolidada que incluye todas las tablas y relaciones necesarias:
- `prisma/migrations/20251213135937_init_consolidated/`

Para resetear completamente la base de datos:
```bash
pnpm prisma migrate reset --force
node scripts/seed-complete.js
```