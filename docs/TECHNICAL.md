# Documentación Técnica - Sistema de Ventas SAS

## Arquitectura

### Stack Tecnológico
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT (separado para Admin y SAS)
- **UI**: shadcn/ui, Tailwind CSS
- **Testing**: Vitest, Playwright

### Estructura del Proyecto

```
/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── administracion/    # Panel de administración
│   └── [slug]/            # Sistema SAS (multi-tenant)
├── components/            # Componentes React
│   ├── admin/             # Componentes del panel admin
│   ├── sales/             # Componentes del sistema SAS
│   └── ui/                # Componentes UI reutilizables
├── lib/                   # Utilidades y servicios
│   ├── services/          # Servicios de negocio
│   ├── auth/              # Autenticación
│   └── utils/             # Utilidades
├── prisma/                # Schema de Prisma
└── tests/                 # Tests
```

## Autenticación

### Sistema Dual
El sistema tiene dos tipos de autenticación:

1. **Admin JWT** (`admin-auth-token`): Para `/administracion/**`
2. **SAS JWT** (`sas-auth-token`): Para `/[slug]/**`

### Servicios de Autenticación
- `AdminJWTService`: Manejo de tokens para administración
- `AuthService`: Servicios de autenticación generales
- `SessionManagement`: Gestión de sesiones

## Base de Datos

### Modelos Principales
- `Profile`: Usuarios del sistema de administración
- `Organization`: Organizaciones/clientes
- `Customer`: Clientes dentro de organizaciones
- `SubscriptionPlan`: Planes de suscripción
- `Subscription`: Suscripciones de organizaciones

### Migraciones
```bash
pnpm db:generate  # Generar cliente Prisma
pnpm db:push      # Sincronizar schema (desarrollo)
pnpm db:migrate   # Crear migración (producción)
```

## Componentes Reutilizables

### Paginación
```tsx
import { DataTablePagination } from '@/components/ui/data-table-pagination'

<DataTablePagination
  totalItems={100}
  pageSize={20}
  currentPage={1}
  totalPages={5}
  onPageChange={(page) => setPage(page)}
/>
```

### Loading States
```tsx
import { LoadingSpinner, LoadingOverlay, LoadingSkeleton } from '@/components/ui/loading-spinner'

<LoadingSpinner size="lg" text="Cargando..." />
<LoadingOverlay isLoading={loading}>Contenido</LoadingOverlay>
<LoadingSkeleton className="h-4 w-full" count={3} />
```

### Manejo de Errores
```tsx
import { ErrorBoundary } from '@/components/ui/error-boundary'

<ErrorBoundary>
  <Componente />
</ErrorBoundary>
```

### Confirmaciones
```tsx
import { useConfirm } from '@/components/ui/confirm-dialog'

const { confirm, Dialog } = useConfirm()

confirm(
  'Eliminar',
  '¿Estás seguro?',
  () => handleDelete(),
  'destructive'
)
```

### Shortcuts de Teclado
```tsx
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

useKeyboardShortcuts([
  {
    key: 's',
    ctrl: true,
    action: () => handleSave(),
    description: 'Guardar',
  },
])
```

## APIs

### Estructura de Respuestas
```typescript
// Éxito
{ success: true, data: {...} }

// Error
{ error: 'Mensaje de error', details?: {...} }
```

### Autenticación en APIs
```typescript
const cookieStore = await cookies()
const token = cookieStore.get('admin-auth-token')?.value
const payload = await AdminJWTService.verifyToken(token)
```

## Testing

### Unitarios
```bash
pnpm test                    # Ejecutar tests
pnpm test:ui                 # UI de tests
pnpm test:coverage          # Con coverage
```

### E2E
```bash
pnpm test:e2e               # Ejecutar E2E
pnpm test:e2e:ui            # UI de Playwright
```

## Deployment

### Variables de Entorno
- `DATABASE_URL`: URL de PostgreSQL
- `ADMIN_JWT_SECRET`: Secret para JWT de admin
- `SAS_JWT_SECRET`: Secret para JWT de SAS

### Build
```bash
pnpm build
pnpm start
```

