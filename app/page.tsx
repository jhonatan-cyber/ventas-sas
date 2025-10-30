import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BarChart3, Package, Users, TrendingUp } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            <span className="text-xl font-bold">SalesHub</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Iniciar Sesión</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Comenzar Gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container px-4 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-balance">
              Sistema de Ventas Profesional para tu Negocio
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground text-pretty">
              Gestiona tus productos, clientes y órdenes en un solo lugar. Aumenta tus ventas con análisis en tiempo
              real y reportes detallados.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/auth/sign-up">
                <Button size="lg">Comenzar Ahora</Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline">
                  Ver Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/50 py-24">
          <div className="container px-4">
            <div className="mx-auto max-w-5xl">
              <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl mb-12">
                Todo lo que necesitas para vender más
              </h2>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Gestión de Productos</h3>
                  <p className="text-muted-foreground">
                    Administra tu inventario con facilidad. Control de stock, precios y categorías.
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Base de Clientes</h3>
                  <p className="text-muted-foreground">
                    Mantén un registro completo de tus clientes y su historial de compras.
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Análisis y Reportes</h3>
                  <p className="text-muted-foreground">
                    Visualiza tus ventas con gráficos y reportes detallados en tiempo real.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          © 2025 SalesHub. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  )
}
