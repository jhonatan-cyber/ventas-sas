/**
 * Utilidades de i18n para el servidor (Next.js Server Components)
 * Obtiene el idioma desde las preferencias de la base de datos
 */

import { defaultLocale, type Locale } from '@/i18n'
import { prisma } from '@/lib/prisma'

/**
 * Obtiene el idioma de una organización desde la base de datos
 * @param slug - El slug de la organización
 * @returns El código de idioma (por defecto 'es')
 */
export async function getOrganizationLocale(slug: string): Promise<Locale> {
  try {
    // Obtener la organización
    const organization = await prisma.organization.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!organization) {
      return defaultLocale
    }

    // Obtener la configuración de preferencias
    const configuration = await prisma.configurationSas.findUnique({
      where: { organizationId: organization.id },
      select: { language: true }
    })

    // Validar que el idioma sea uno de los soportados
    const language = configuration?.language
    if (language && ['es', 'en', 'pt'].includes(language)) {
      return language as Locale
    }

    return defaultLocale
  } catch (error) {
    console.error('Error obteniendo idioma de organización:', error)
    return defaultLocale
  }
}

