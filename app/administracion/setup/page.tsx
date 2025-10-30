export default function AdminSetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-3xl font-bold text-slate-900">Configuración del Panel de Administración</h1>

          <div className="space-y-6">
            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-800">Paso 1: Registrar un Usuario</h2>
              <p className="mb-2 text-slate-600">Primero, registra un usuario en la aplicación:</p>
              <a
                href="/auth/sign-up"
                className="inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Ir a Registro
              </a>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-800">Paso 2: Ejecutar el Script SQL</h2>
              <p className="mb-2 text-slate-600">
                Ejecuta el script{" "}
                <code className="rounded bg-slate-100 px-2 py-1 text-sm">scripts/004_create_admin_user.sql</code> para
                convertir al primer usuario en super administrador.
              </p>
              <p className="text-sm text-slate-500">
                Este script se ejecuta automáticamente en v0. Si estás en producción, ejecútalo desde el panel de
                Supabase.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-800">Paso 3: Acceder al Panel de Administración</h2>
              <p className="mb-2 text-slate-600">Una vez que seas super admin, accede al panel en:</p>
              <a
                href="/admin"
                className="inline-block rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
              >
                Ir al Panel de Administración
              </a>
            </section>

            <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <h3 className="mb-2 font-semibold text-amber-900">Rutas del Sistema</h3>
              <ul className="space-y-1 text-sm text-amber-800">
                <li>
                  <strong>Panel de Administración:</strong> <code>/admin</code>
                </li>
                <li>
                  <strong>Gestión de Organizaciones:</strong> <code>/admin/organizations</code>
                </li>
                <li>
                  <strong>Gestión de Planes:</strong> <code>/admin/plans</code>
                </li>
                <li>
                  <strong>Gestión de Usuarios:</strong> <code>/admin/users</code>
                </li>
                <li>
                  <strong>Gestión de Roles:</strong> <code>/admin/roles</code>
                </li>
                <li>
                  <strong>Dashboard de Ventas:</strong> <code>/dashboard</code>
                </li>
              </ul>
            </section>

            <section className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="mb-2 font-semibold text-blue-900">Verificar Estado de Super Admin</h3>
              <p className="mb-2 text-sm text-blue-800">
                Para verificar si un usuario es super admin, ejecuta esta consulta SQL:
              </p>
              <pre className="overflow-x-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
                {`SELECT id, email, is_super_admin 
FROM public.profiles 
WHERE is_super_admin = true;`}
              </pre>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
