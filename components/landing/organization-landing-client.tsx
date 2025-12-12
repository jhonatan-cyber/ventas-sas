"use client"

import { Organization } from "@prisma/client"

interface OrganizationLandingClientProps {
  organizationSlug: string
  organization: Organization
}

/**
 * Componente cliente para el landing de la organización
 */
export function OrganizationLandingClient({
  organizationSlug: _organizationSlug,
  organization,
}: OrganizationLandingClientProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {organization.razonSocial || organization.name}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Bienvenido a nuestra plataforma
          </p>
        </div>
      </div>
    </div>
  )
}

