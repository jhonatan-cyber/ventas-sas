import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BarChart3, FileText } from "lucide-react"

export const metadata = {
  title: 'Términos y Condiciones - Sistema de Ventas SAS',
  description: 'Términos y condiciones de uso de Sistema de Ventas SAS',
}

export default function TerminosPage() {
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
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 dark:border-violet-800 bg-violet-50/80 dark:bg-violet-950/60 px-4 py-2 text-sm mb-6">
                <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                <span className="font-semibold text-violet-700 dark:text-violet-300">Términos y Condiciones</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
                Términos y Condiciones de Uso
              </h1>
              <p className="text-lg text-muted-foreground">
                Última actualización: {new Date().toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-4">1. Aceptación de los Términos</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Al acceder y utilizar Sistema de Ventas SAS ("el Servicio"), usted acepta estar sujeto a estos Términos y Condiciones de Uso. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar el Servicio.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">2. Descripción del Servicio</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Sistema de Ventas SAS es una plataforma multi-tenant de software como servicio (SaaS) que proporciona herramientas para la gestión de ventas, inventario, clientes, cotizaciones y otros aspectos operativos de su negocio.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">3. Registro y Cuenta de Usuario</h2>
                <h3 className="text-xl font-semibold mb-3">3.1 Creación de Cuenta</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Para utilizar el Servicio, debe crear una cuenta proporcionando información precisa, completa y actualizada. Usted es responsable de mantener la confidencialidad de sus credenciales de acceso.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">3.2 Responsabilidades del Usuario</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Usted es responsable de:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Mantener la seguridad de su cuenta y contraseña</li>
                  <li>Toda la actividad que ocurra bajo su cuenta</li>
                  <li>Notificar inmediatamente cualquier uso no autorizado</li>
                  <li>Proporcionar información precisa y actualizada</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">4. Uso Aceptable</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Usted se compromete a utilizar el Servicio únicamente para fines legales y de acuerdo con estos términos. Está prohibido:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Violar cualquier ley o regulación aplicable</li>
                  <li>Infringir derechos de propiedad intelectual</li>
                  <li>Transmitir virus, malware o código malicioso</li>
                  <li>Intentar acceder no autorizado al Servicio o sistemas relacionados</li>
                  <li>Interferir con el funcionamiento del Servicio</li>
                  <li>Usar el Servicio para actividades fraudulentas o ilegales</li>
                  <li>Compartir su cuenta con terceros no autorizados</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">5. Suscripciones y Pagos</h2>
                <h3 className="text-xl font-semibold mb-3">5.1 Planes de Suscripción</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Ofrecemos diferentes planes de suscripción con características y precios variados. Los detalles de cada plan están disponibles en nuestro sitio web.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">5.2 Facturación</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Las suscripciones se facturan por adelantado según el período seleccionado (mensual o anual). Los precios están en BOB (Bolivianos) y no incluyen impuestos aplicables.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">5.3 Renovación Automática</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Las suscripciones se renuevan automáticamente al final de cada período a menos que cancele antes de la fecha de renovación.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">5.4 Reembolsos</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Los reembolsos se evalúan caso por caso. Generalmente no ofrecemos reembolsos para períodos parciales utilizados, excepto según lo requiera la ley aplicable.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">6. Propiedad Intelectual</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  El Servicio y todo su contenido, características y funcionalidad son propiedad de Sistema de Ventas SAS y están protegidos por leyes de propiedad intelectual. Usted no puede copiar, modificar, distribuir o crear obras derivadas del Servicio sin nuestro consentimiento escrito.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">7. Sus Datos</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Usted conserva todos los derechos sobre sus datos. Al utilizar el Servicio, nos otorga una licencia para usar, almacenar y procesar sus datos únicamente para proporcionar y mejorar el Servicio. Para más información, consulte nuestra <Link href="/privacidad" className="text-blue-600 dark:text-blue-400 hover:underline">Política de Privacidad</Link>.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">8. Disponibilidad del Servicio</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Nos esforzamos por mantener el Servicio disponible 24/7, pero no garantizamos disponibilidad ininterrumpida. Podemos realizar mantenimiento programado o no programado que puede resultar en interrupciones temporales.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">9. Limitación de Responsabilidad</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  En la medida máxima permitida por la ley, Sistema de Ventas SAS no será responsable por daños indirectos, incidentales, especiales, consecuentes o punitivos, incluyendo pérdida de beneficios, datos o uso, incluso si se nos ha advertido de la posibilidad de tales daños.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">10. Terminación</h2>
                <h3 className="text-xl font-semibold mb-3">10.1 Terminación por el Usuario</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Puede cancelar su cuenta en cualquier momento a través de la configuración de su cuenta o contactándonos directamente.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">10.2 Terminación por Nosotros</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Podemos suspender o terminar su acceso al Servicio inmediatamente, sin previo aviso, si viola estos términos o si su cuenta permanece inactiva por un período prolongado.
                </p>

                <h3 className="text-xl font-semibold mb-3 mt-6">10.3 Efectos de la Terminación</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Al terminar, su derecho a usar el Servicio cesará inmediatamente. Puede solicitar una copia de sus datos antes de la terminación según nuestra política de retención de datos.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">11. Modificaciones</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Nos reservamos el derecho de modificar estos términos en cualquier momento. Le notificaremos sobre cambios importantes mediante un aviso en el Servicio o por correo electrónico. Su uso continuado del Servicio después de dichos cambios constituye su aceptación de los nuevos términos.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">12. Ley Aplicable</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Estos términos se rigen por las leyes de Bolivia. Cualquier disputa relacionada con estos términos será resuelta en los tribunales competentes de Bolivia.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">13. Contacto</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Si tiene preguntas sobre estos Términos y Condiciones, puede contactarnos:
                </p>
                <div className="bg-muted/50 p-6 rounded-lg">
                  <p className="text-muted-foreground">
                    <strong>Email:</strong> legal@sistemaventas.com<br />
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

