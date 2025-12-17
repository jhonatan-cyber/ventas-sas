import { redirect } from "next/navigation";

import { ForgotPasswordForm } from "@/components/sales/auth/forgot-password-form";
import { LoginWelcomeSection } from "@/components/sales/auth/login-welcome-section";
import { ThemeProvider } from "@/components/theme-provider";
import { prisma } from "@/lib/prisma";
;
import { getCustomerBySlug } from "@/lib/utils/organization";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Verificar directamente en la base de datos si la organización existe (por slug)
  const organization = await prisma.organization.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      razonSocial: true,
      slug: true,
      settings: true,
      customerOrganizations: {
        where: { isActive: true },
        select: {
          id: true,
          isActive: true,
          customer: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              isActive: true,
              deletedAt: true,
            },
          },
        },
      },
      whiteLabelBranding: {
        select: {
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true,
        },
      },
    },
  });

  if (!organization) {
    redirect("/");
  }

  // Verificar que la organización tenga al menos un cliente activo
  const hasActiveCustomer = organization.customerOrganizations.some(
    (co) => co.customer && co.customer.isActive && !co.customer.deletedAt
  );

  if (!hasActiveCustomer) {
    redirect("/");
  }

  const _customer = await getCustomerBySlug(slug);

  return (
    <ThemeProvider>
        <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
          {/* Sección izquierda - Welcome (solo desktop) */}
          <div className="hidden md:flex md:w-1/2 lg:w-2/5 xl:w-2/5 items-center justify-center p-8 lg:p-12 xl:p-16 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 dark:from-emerald-600 dark:via-teal-600 dark:to-cyan-600 relative overflow-hidden">
            <LoginWelcomeSection
              organizationName={organization.razonSocial || organization.name}
            />
          </div>

          {/* Sección derecha - Formulario */}
          <div className="w-full md:w-1/2 lg:w-3/5 xl:w-3/5 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16">
            <div className="w-full max-w-md">
              <ForgotPasswordForm
                customerSlug={slug}
                organizationName={organization.razonSocial || organization.name}
                logoUrl={organization.whiteLabelBranding?.logoUrl || null}
              />
            </div>
          </div>
        </div>
      </ThemeProvider>
  );
}

