import { redirect } from "next/navigation";

import { LoginSasForm } from "@/components/sales/auth/login-sas-form";
import { LoginWelcomeSection } from "@/components/sales/auth/login-welcome-section";
import { ThemeProvider } from "@/components/theme-provider";
import { prisma } from "@/lib/prisma";
import { I18nProvider } from "@/lib/utils/i18n-provider";
import { getCustomerBySlug } from "@/lib/utils/organization";

export default async function LoginPage({
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
        },
      },
    },
  });

  // Si la organización NO existe, redirigir a la raíz
  if (!organization) {
    redirect("/");
  }

  // Validar que tenga al menos una relación activa con un cliente activo
  const activeCustomerOrgs = organization.customerOrganizations.filter(
    (co) =>
      co.isActive &&
      co.customer &&
      co.customer.isActive &&
      !co.customer.deletedAt
  );

  if (activeCustomerOrgs.length === 0) {
    redirect("/");
  }

  // Obtener el cliente principal asociado al slug
  const customer = await getCustomerBySlug(slug);

  if (!customer) {
    redirect("/");
  }

  // Nota: La validación de suscripción se hará en el proceso de login
  // Permitimos mostrar la página de login para que el usuario pueda ver el mensaje de error

  const organizationName =
    organization.razonSocial ||
    organization.name ||
    customer.primaryOrganization?.razonSocial ||
    `${customer.nombre ?? ""} ${customer.apellido ?? ""}`.trim();

  // Obtener el logo de la organización (de whiteLabelBranding o settings como fallback)
  const logoUrl =
    (organization.whiteLabelBranding?.logoUrl as string | null) ||
    ((organization.settings as Record<string, any>)?.logoUrl as string | null) ||
    null;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="sas-theme"
    >
      <I18nProvider>
        <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 dark:from-[#0a0a0a] dark:via-[#111111] dark:to-[#1a1a1a] relative overflow-hidden">
          {/* Elementos decorativos de fondo animados */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Círculos animados de fondo con movimiento */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-400/10 dark:bg-teal-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-400/5 dark:bg-cyan-500/3 rounded-full blur-3xl animate-pulse delay-500"></div>
            
            {/* Partículas flotantes */}
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-emerald-400/30 dark:bg-emerald-500/20 rounded-full animate-float"></div>
            <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-teal-400/30 dark:bg-teal-500/20 rounded-full animate-float delay-700"></div>
            <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-cyan-400/30 dark:bg-cyan-500/20 rounded-full animate-float delay-1000"></div>

            {/* Grid pattern sutil con animación */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] dark:opacity-10"></div>
          </div>

          {/* Sección izquierda - Bienvenida e imagen */}
          <LoginWelcomeSection organizationName={organizationName} />

          {/* Sección derecha - Formulario de login mejorado */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 relative z-10">
            <div className="w-full max-w-md">
              <LoginSasForm
                customerSlug={slug}
                organizationName={organizationName}
                logoUrl={logoUrl}
              />
            </div>
          </div>
        </div>
      </I18nProvider>
    </ThemeProvider>
  );
}
