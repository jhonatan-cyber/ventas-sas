import { redirect } from "next/navigation"

import { LoginSasForm } from "@/components/sales/auth/login-sas-form"
import { prisma } from "@/lib/prisma"
import { getCustomerBySlug } from "@/lib/utils/organization"

export default async function LoginPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Verificar directamente en la base de datos si la organización existe (por slug)
  const organization = await prisma.organization.findUnique({
    where: { slug },
    include: {
      customerOrganizations: {
        where: { isActive: true },
        include: {
          customer: true
        }
      }
    }
  })
  
  // Si la organización NO existe, redirigir a la raíz
  if (!organization) {
    redirect('/')
  }

  // Validar que tenga al menos una relación activa con un cliente activo
  const activeCustomerOrgs = organization.customerOrganizations.filter(
    co => co.isActive && co.customer && co.customer.isActive && !co.customer.deletedAt
  )

  if (activeCustomerOrgs.length === 0) {
    redirect('/')
  }

  // Obtener el cliente principal asociado al slug
  const customer = await getCustomerBySlug(slug)

  if (!customer) {
    redirect('/')
  }

  // Nota: La validación de suscripción se hará en el proceso de login
  // Permitimos mostrar la página de login para que el usuario pueda ver el mensaje de error

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#1a1a1a] p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-white">SAS</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Sistema de Ventas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {organization.razonSocial || organization.name || customer.primaryOrganization?.razonSocial || `${customer.nombre ?? ""} ${customer.apellido ?? ""}`.trim()}
          </p>
        </div>
        <LoginSasForm customerSlug={slug} />
      </div>
    </div>
  )
}

