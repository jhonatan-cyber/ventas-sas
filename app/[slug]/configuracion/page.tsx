import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import ClientPersistence from "./client-persistence"
import { RenewalDialogClient } from "./renewal-dialog-client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { prisma } from "@/lib/prisma"
import { getCustomerBySlug } from "@/lib/utils/organization"

export const dynamic = 'force-dynamic'

async function getActiveSubscriptionForOrganization(organizationId?: string | null) {
  if (!organizationId) return null

  const subscription = await prisma.subscription.findFirst({
    where: {
      organizationId,
      status: { in: ['active', 'trial'] },
      OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
    },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  })

  return subscription
}

async function getBranches(organizationId?: string | null) {
  if (!organizationId) return []
  try {
    return await prisma.branch.findMany({
      where: { organizationId },
      select: { id: true, name: true },
      orderBy: { createdAt: 'desc' }
    })
  } catch {
    return []
  }
}

export default async function ConfiguracionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const cookieStore = await cookies()
  const session = cookieStore.get('sas-session')
  if (!session) redirect(`/${slug}/login`)

  const customer = await getCustomerBySlug(slug)
  if (!customer) redirect('/')

  const organizationId = customer.primaryOrganization?.id
  const branches = await getBranches(organizationId)
  const activeSubscription = await getActiveSubscriptionForOrganization(organizationId)

  // Calcular precio del plan según período
  const planPrice = activeSubscription?.plan 
    ? (activeSubscription.billingPeriod === 'yearly' 
        ? activeSubscription.plan.priceYearly 
        : activeSubscription.plan.priceMonthly)
    : null

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configuración</h1>
        <p className="text-gray-600 dark:text-gray-400">Preferencias personales y del entorno de trabajo.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Plan de suscripción</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeSubscription ? (
              <div className="text-sm text-gray-800 dark:text-gray-200 space-y-1">
                <p><span className="font-semibold">Plan:</span> {activeSubscription.plan?.name ?? '—'}</p>
                <p><span className="font-semibold">Estado:</span> {activeSubscription.status}</p>
                <p>
                  <span className="font-semibold">Vence:</span>{' '}
                  {activeSubscription.endDate ? new Date(activeSubscription.endDate).toLocaleDateString() : 'Sin fecha (renovación)'}
                </p>
                <p><span className="font-semibold">Período:</span> {activeSubscription.billingPeriod === 'yearly' ? 'Anual' : 'Mensual'}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">No hay un plan activo. Contacta a administración.</p>
            )}
          </CardContent>
          <div className="px-6 pb-6">
            <RenewalDialogClient customerSlug={slug} initialAmount={planPrice ? Number(planPrice).toFixed(2) : ""} />
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Preferencias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4">
              <div className="space-y-2">
                <Label>Moneda</Label>
                <input
                  name="currency"
                  className="w-full border rounded px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a]"
                  placeholder="Ej: BOB, USD"
                />
              </div>
              <div className="space-y-2 mt-4">
                <Label>Formato de fecha</Label>
                <Input name="dateFormat" placeholder="Ej: dd/MM/yyyy" />
              </div>
              <div className="space-y-2 mt-4">
                <Label>Color del sistema</Label>
                <select name="themeColor" className="w-full border rounded px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a] hidden">
                  <option value="green">Verde</option>
                  <option value="blue">Azul</option>
                  <option value="purple">Púrpura</option>
                  <option value="orange">Naranja</option>
                </select>
                <div className="grid grid-cols-4 gap-2">
                  <button type="button" data-color="green" className="color-swatch h-8 rounded-lg border border-gray-200 dark:border-[#2a2a2a]" style={{ background: 'oklch(0.69 0.16 148)' } as React.CSSProperties} title="Verde" />
                  <button type="button" data-color="blue" className="color-swatch h-8 rounded-lg border border-gray-200 dark:border-[#2a2a2a]" style={{ background: 'oklch(0.69 0.13 264)' } as React.CSSProperties} title="Azul" />
                  <button type="button" data-color="purple" className="color-swatch h-8 rounded-lg border border-gray-200 dark:border-[#2a2a2a]" style={{ background: 'oklch(0.67 0.14 313)' } as React.CSSProperties} title="Púrpura" />
                  <button type="button" data-color="orange" className="color-swatch h-8 rounded-lg border border-gray-200 dark:border-[#2a2a2a]" style={{ background: 'oklch(0.77 0.16 70)' } as React.CSSProperties} title="Naranja" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Personaliza el color principal de la interfaz.</p>
                <div className="mt-2 space-y-1">
                  <Label>Vista previa</Label>
                  <div
                    id="themeColorPreview"
                    className="h-8 rounded-lg border border-gray-200 dark:border-[#2a2a2a]"
                    style={{ background: 'var(--primary)' } as React.CSSProperties}
                  />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label>Nombre de la empresa</Label>
                <Input
                  name="companyName"
                  placeholder="Razón social o nombre comercial"
                  defaultValue={customer.primaryOrganization?.razonSocial || customer.primaryOrganization?.name || ""}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nombre del contacto</Label>
                  <Input 
                    name="companyContactName" 
                    placeholder="Ej: Ing. Edgar Martínez" 
                    defaultValue={customer.nombre && customer.apellido ? `${customer.nombre} ${customer.apellido}`.trim() : customer.nombre || ""} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono de contacto</Label>
                  <Input name="companyPhone" placeholder="Ej: +59170000000" defaultValue={customer.phone || ""} />
                </div>
                <div className="space-y-2">
                  <Label>Correo de contacto</Label>
                  <Input name="companyEmail" type="email" placeholder="contacto@empresa.com" defaultValue={customer.email || ""} />
                </div>
                <div className="space-y-2">
                  <Label>Sitio web (opcional)</Label>
                  <Input name="companyWebsite" placeholder="https://empresa.com" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input name="companyAddress" placeholder="Calle, ciudad, país" defaultValue={customer.address || ""} />
              </div>

              <div className="space-y-2">
                <Label>Logo de la empresa</Label>
                <input
                  type="file"
                  name="companyLogo"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="w-full border border-dashed rounded-lg px-3 py-4 text-sm cursor-pointer bg-white dark:bg-[#1a1a1a]"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Formatos admitidos: PNG, JPG o WEBP. Tamaño recomendado: 400x400.</p>
                <div className="flex items-center gap-4 p-3 border border-gray-200 dark:border-[#2a2a2a] rounded-lg bg-gray-50 dark:bg-[#151515]">
                  <div id="companyLogoPreview" className="w-16 h-16 rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] flex items-center justify-center overflow-hidden">
                    <span className="text-xs text-gray-400">Sin logo</span>
                  </div>
                  <div className="flex-1 text-xs text-gray-500 dark:text-gray-400">
                    El logo se utilizará en documentos como cotizaciones y reportes.
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label>Número de WhatsApp</Label>
                <Input
                  name="whatsappNumber"
                  placeholder="Ej: 59170000000"
                  inputMode="tel"
                  pattern="[0-9+ ]*"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Usa código de país sin espacios para enviar cotizaciones por WhatsApp.
                </p>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Se guardará en tu navegador.</p>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sucursal por defecto</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label>Selecciona sucursal</Label>
                <select name="branchId" className="w-full border rounded px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a]">
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Se guardará en tu navegador.</p>
            </form>
          </CardContent>
        </Card>
      </div>

      <ClientPersistence slug={slug} />
    </div>
  )
}

