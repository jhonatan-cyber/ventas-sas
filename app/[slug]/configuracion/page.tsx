import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import ClientPersistence from "./client-persistence"

async function getCustomerBySlug(slug: string) {
  return prisma.customer.findFirst({ where: { slug, isActive: true }, select: { id: true, razonSocial: true } })
}

async function getBranches(customerId: string) {
  try {
    return await prisma.branch.findMany({
      where: { customerId },
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

  const branches = await getBranches(customer.id)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configuración</h1>
        <p className="text-gray-600 dark:text-gray-400">Preferencias personales y del entorno de trabajo.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
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

