import { LoginSasForm } from "@/components/sales/auth/login-sas-form"
import { getCustomerBySlug } from "@/lib/utils/organization"
import { redirect } from "next/navigation"

export default async function LoginPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Verificar que el cliente existe
  const customer = await getCustomerBySlug(slug)
  
  if (!customer) {
    redirect('/')
  }

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
            {customer.razonSocial || `${customer.nombre} ${customer.apellido}`}
          </p>
        </div>
        <LoginSasForm customerSlug={slug} />
      </div>
    </div>
  )
}

