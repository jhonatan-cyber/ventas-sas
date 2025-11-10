import { ArrowLeft, BarChart3, Shield } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export const metadata = {
  title: 'Política de Privacidad - Sistema de Ventas SAS',
  description: 'Política de privacidad de Sistema de Ventas SAS',
}

export default function PrivacidadPage() {
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
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/60 px-4 py-2 text-sm mb-6">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-blue-700 dark:text-blue-300">Política de Privacidad</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
                Política de Privacidad
              </h1>
              <p className="text-lg text-muted-foreground">
                Última actualización: {new Date().toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-4">1. Introducción</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Sistema de Ventas SAS ("nosotros", "nuestro" o "la Plataforma") se compromete a proteger su privacidad. Esta Política de Privacidad explica cómo recopilamos, utilizamos, divulgamos y protegemos su información personal cuando utiliza nuestro servicio.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">2. Información que Recopilamos</h2>
                <h3 className="text-xl font-semibold mb-3">2.1 Información Personal</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Recopilamos información que usted nos proporciona directamente, incluyendo:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Nombre completo y datos de contacto</li>
                  <li>Dirección de correo electrónico</li>
                  <li>Número de teléfono</li>
                  <li>Información de la empresa u organización</li>
                  <li>Datos de facturación y pago</li>
                  <li>Información de cuenta de usuario</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Información de Uso</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Recopilamos automáticamente información sobre cómo utiliza nuestro servicio, incluyendo:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Datos de registro y actividad</li>
                  <li>Información de dispositivo y navegador</li>
                  <li>Direcciones IP</li>
                  <li>Cookies y tecnologías similares</li>
                  <li>Métricas de uso y rendimiento</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">3. Cómo Utilizamos su Información</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Utilizamos la información recopilada para:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Proporcionar, mantener y mejorar nuestros servicios</li>
                  <li>Procesar transacciones y gestionar su cuenta</li>
                  <li>Enviar comunicaciones relacionadas con el servicio</li>
                  <li>Personalizar su experiencia</li>
                  <li>Detectar y prevenir fraudes y abusos</li>
                  <li>Cumplir con obligaciones legales</li>
                  <li>Análisis y mejoras de productos</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">4. Compartir Información</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  No vendemos su información personal. Podemos compartir su información solo en las siguientes circunstancias:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Con proveedores de servicios que nos ayudan a operar nuestra plataforma</li>
                  <li>Para cumplir con obligaciones legales o responder a procesos legales</li>
                  <li>Para proteger nuestros derechos, privacidad, seguridad o propiedad</li>
                  <li>En relación con una fusión, adquisición o venta de activos</li>
                  <li>Con su consentimiento explícito</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">5. Seguridad de los Datos</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Implementamos medidas de seguridad técnicas y organizativas para proteger su información personal, incluyendo:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Encriptación de datos en tránsito y en reposo</li>
                  <li>Autenticación de dos factores (2FA)</li>
                  <li>Acceso restringido basado en roles</li>
                  <li>Monitoreo y auditoría regular</li>
                  <li>Backups automáticos y redundancia</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">6. Sus Derechos</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Usted tiene derecho a:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Acceder a su información personal</li>
                  <li>Rectificar información inexacta</li>
                  <li>Solicitar la eliminación de sus datos</li>
                  <li>Oponerse al procesamiento de sus datos</li>
                  <li>Portabilidad de datos</li>
                  <li>Retirar su consentimiento en cualquier momento</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">7. Retención de Datos</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Conservamos su información personal durante el tiempo necesario para cumplir con los fines descritos en esta política, a menos que la ley requiera o permita un período de retención más largo.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">8. Cookies y Tecnologías Similares</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Utilizamos cookies y tecnologías similares para mejorar su experiencia. Para más información, consulte nuestra <Link href="/cookies" className="text-blue-600 dark:text-blue-400 hover:underline">Política de Cookies</Link>.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">9. Menores de Edad</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Nuestro servicio no está dirigido a menores de 18 años. No recopilamos intencionalmente información personal de menores.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">10. Cambios a esta Política</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Podemos actualizar esta Política de Privacidad ocasionalmente. Le notificaremos sobre cambios importantes mediante un aviso en nuestro sitio web o por correo electrónico.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">11. Contacto</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Si tiene preguntas sobre esta Política de Privacidad, puede contactarnos:
                </p>
                <div className="bg-muted/50 p-6 rounded-lg">
                  <p className="text-muted-foreground">
                    <strong>Email:</strong> privacidad@sistemaventas.com<br />
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

