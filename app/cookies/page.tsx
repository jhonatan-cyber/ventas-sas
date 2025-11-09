import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart3, Cookie } from "lucide-react"

export const metadata = {
  title: 'Política de Cookies - Sistema de Ventas SAS',
  description: 'Política de cookies de Sistema de Ventas SAS',
}

export default function CookiesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
        <div className="container flex h-20 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg shadow-blue-500/20">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-violet-600 to-blue-600 bg-clip-text text-transparent">
              Sistema de Ventas SAS
            </span>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="hover:bg-blue-50 dark:hover:bg-blue-950/30">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20">
          <div className="container px-4 max-w-4xl mx-auto">
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/60 px-4 py-2 text-sm mb-6">
                <Cookie className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="font-semibold text-amber-700 dark:text-amber-300">Política de Cookies</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
                Política de Cookies
              </h1>
              <p className="text-lg text-muted-foreground">
                Última actualización: {new Date().toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-4">1. ¿Qué son las Cookies?</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Las cookies son pequeños archivos de texto que se almacenan en su dispositivo (computadora, tablet o móvil) cuando visita un sitio web. Estas cookies permiten que el sitio web recuerde sus acciones y preferencias durante un período de tiempo, por lo que no tiene que volver a configurarlas cada vez que regresa al sitio o navega de una página a otra.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">2. ¿Cómo Utilizamos las Cookies?</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Sistema de Ventas SAS utiliza cookies para mejorar su experiencia de usuario, analizar el uso del sitio y personalizar contenido. Utilizamos tanto cookies propias como cookies de terceros.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">3. Tipos de Cookies que Utilizamos</h2>
                
                <h3 className="text-xl font-semibold mb-3">3.1 Cookies Esenciales</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Estas cookies son necesarias para que el sitio web funcione correctamente. Permiten funciones básicas como la navegación segura y el acceso a áreas seguras del sitio web.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-6">
                  <li><strong>Cookies de sesión:</strong> Mantienen su sesión activa mientras navega</li>
                  <li><strong>Cookies de autenticación:</strong> Verifican su identidad cuando inicia sesión</li>
                  <li><strong>Cookies de seguridad:</strong> Protegen contra ataques y fraudes</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">3.2 Cookies de Rendimiento</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Estas cookies recopilan información sobre cómo utiliza nuestro sitio web, como las páginas que visita con más frecuencia, para ayudarnos a mejorar el rendimiento y la funcionalidad del sitio.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-6">
                  <li><strong>Cookies analíticas:</strong> Miden y analizan el tráfico del sitio</li>
                  <li><strong>Cookies de rendimiento:</strong> Identifican problemas técnicos</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">3.3 Cookies de Funcionalidad</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Estas cookies permiten que el sitio web recuerde las elecciones que hace (como su idioma preferido o región) y proporcionan características mejoradas y más personales.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-6">
                  <li><strong>Cookies de preferencias:</strong> Recuerdan sus configuraciones</li>
                  <li><strong>Cookies de personalización:</strong> Personalizan su experiencia</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">3.4 Cookies de Marketing</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Estas cookies se utilizan para rastrear a los visitantes en diferentes sitios web con la intención de mostrar anuncios relevantes y atractivos para el usuario individual.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Cookies de publicidad:</strong> Muestran anuncios relevantes</li>
                  <li><strong>Cookies de seguimiento:</strong> Rastrean la efectividad de campañas</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">4. Cookies de Terceros</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Algunos servicios de terceros que utilizamos también pueden colocar cookies en su dispositivo. Estos incluyen:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Servicios de análisis:</strong> Para entender cómo los usuarios interactúan con nuestro sitio</li>
                  <li><strong>Servicios de chat en vivo:</strong> Para proporcionar soporte al cliente</li>
                  <li><strong>Servicios de CDN:</strong> Para mejorar la velocidad de carga</li>
                  <li><strong>Proveedores de autenticación:</strong> Para servicios de inicio de sesión seguro</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">5. Duración de las Cookies</h2>
                <h3 className="text-xl font-semibold mb-3">5.1 Cookies de Sesión</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Estas cookies son temporales y se eliminan cuando cierra su navegador. Se utilizan para mantener su sesión activa durante su visita.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">5.2 Cookies Persistentes</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Estas cookies permanecen en su dispositivo durante un período determinado o hasta que las elimine manualmente. Se utilizan para recordar sus preferencias y mejorar su experiencia.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">6. Gestión de Cookies</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Puede controlar y/o eliminar las cookies como desee. Puede eliminar todas las cookies que ya están en su dispositivo y puede configurar la mayoría de los navegadores para prevenir que se coloquen. Sin embargo, si hace esto, es posible que tenga que ajustar manualmente algunas preferencias cada vez que visite un sitio y algunos servicios y funcionalidades pueden no funcionar.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">6.1 Configuración del Navegador</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  La mayoría de los navegadores le permiten:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-6">
                  <li>Ver qué cookies tiene almacenadas y eliminarlas individualmente</li>
                  <li>Bloquear cookies de terceros</li>
                  <li>Bloquear todas las cookies de sitios específicos</li>
                  <li>Bloquear todas las cookies</li>
                  <li>Eliminar todas las cookies cuando cierre el navegador</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">6.2 Enlaces de Ayuda del Navegador</h3>
                <div className="bg-muted/50 p-6 rounded-lg">
                  <ul className="space-y-2 text-muted-foreground">
                    <li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
                    <li><strong>Firefox:</strong> Opciones → Privacidad y seguridad → Cookies y datos del sitio</li>
                    <li><strong>Safari:</strong> Preferencias → Privacidad → Cookies y datos de sitios web</li>
                    <li><strong>Edge:</strong> Configuración → Cookies y permisos de sitio</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">7. Cookies Específicas que Utilizamos</h2>
                <div className="bg-muted/50 p-6 rounded-lg mb-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-semibold">Nombre</th>
                        <th className="text-left py-2 font-semibold">Propósito</th>
                        <th className="text-left py-2 font-semibold">Duración</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b">
                        <td className="py-2">session_id</td>
                        <td className="py-2">Mantener la sesión del usuario</td>
                        <td className="py-2">Sesión</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">auth_token</td>
                        <td className="py-2">Autenticación segura</td>
                        <td className="py-2">7 días</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">preferences</td>
                        <td className="py-2">Preferencias del usuario</td>
                        <td className="py-2">1 año</td>
                      </tr>
                      <tr>
                        <td className="py-2">analytics</td>
                        <td className="py-2">Análisis de uso</td>
                        <td className="py-2">2 años</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">8. Actualizaciones de esta Política</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Podemos actualizar esta Política de Cookies ocasionalmente para reflejar cambios en las cookies que utilizamos o por otras razones operativas, legales o regulatorias. Le recomendamos revisar esta política periódicamente.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">9. Más Información</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Para obtener más información sobre cómo manejamos su información personal, consulte nuestra <Link href="/privacidad" className="text-blue-600 dark:text-blue-400 hover:underline">Política de Privacidad</Link>.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">10. Contacto</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Si tiene preguntas sobre nuestra Política de Cookies, puede contactarnos:
                </p>
                <div className="bg-muted/50 p-6 rounded-lg">
                  <p className="text-muted-foreground">
                    <strong>Email:</strong> cookies@sistemaventas.com<br />
                    <strong>Teléfono:</strong> +591 XXX XXX XXX<br />
                    <strong>Dirección:</strong> [Dirección de la empresa]
                  </p>
                </div>
              </section>
            </div>

            <div className="mt-12 pt-8 border-t">
              <Link href="/">
                <Button variant="outline" className="w-full sm:w-auto">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al inicio
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Simple */}
      <footer className="border-t bg-muted/50 py-8">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div>© {new Date().getFullYear()} Sistema de Ventas SAS. Todos los derechos reservados.</div>
            <div className="flex gap-6">
              <Link href="/privacidad" className="hover:text-foreground transition-colors">Privacidad</Link>
              <Link href="/terminos" className="hover:text-foreground transition-colors">Términos</Link>
              <Link href="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

