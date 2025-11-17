/**
 * Script para migrar preferencias de cookies a la base de datos
 * 
 * Este script lee las preferencias guardadas en cookies y las migra
 * a la tabla sales_configuration_sas en la base de datos.
 * 
 * Uso:
 *   npx tsx scripts/migrate-preferences-to-db.ts [organizationSlug]
 * 
 * Si no se proporciona el slug, intentará migrar todas las organizaciones
 * que tengan configuraciones en cookies (requiere acceso a logs o cookies del servidor)
 */

import { prisma } from '../lib/prisma'
import { ConfigurationSasService } from '../lib/services/sales/configuration-sas-service'

interface CookiePreferences {
  currency?: string
  dateFormat?: string
  themeColor?: string
  whatsappNumber?: string
  companyName?: string
  companyNIT?: string
  companyPhone?: string
  companyAddress?: string
  companyWebsite?: string
  companyLogo?: string
  companyWhatsappNumber?: string
  whatsappCountryCode?: string
}

/**
 * Simula la lectura de cookies (en producción, esto vendría del servidor o logs)
 * En un entorno real, necesitarías acceso a las cookies del usuario o logs del servidor
 */
function readPreferencesFromCookies(organizationSlug: string): CookiePreferences | null {
  // NOTA: En un entorno real, esto leería de:
  // 1. Cookies del servidor (si tienes acceso)
  // 2. Logs de la aplicación
  // 3. Base de datos de sesiones
  // 4. Archivos de backup de cookies
  
  // Por ahora, retornamos null para indicar que no hay cookies disponibles
  // En producción, implementarías la lógica real aquí
  console.warn(`⚠️  No se pueden leer cookies para ${organizationSlug} desde este script.`)
  console.warn('   En producción, necesitarías acceso a cookies del servidor o logs.')
  return null
}

/**
 * Migra preferencias de cookies a la base de datos para una organización
 */
async function migrateOrganizationPreferences(organizationSlug: string): Promise<boolean> {
  try {
    // Obtener la organización
    const organization = await prisma.organization.findUnique({
      where: { slug: organizationSlug },
      select: { id: true, name: true }
    })

    if (!organization) {
      console.error(`❌ Organización no encontrada: ${organizationSlug}`)
      return false
    }

    console.log(`📋 Migrando preferencias para: ${organization.name} (${organizationSlug})`)

    // Verificar si ya existe configuración
    const existingConfig = await prisma.configurationSas.findUnique({
      where: { organizationId: organization.id }
    })

    if (existingConfig) {
      console.log(`   ⚠️  Ya existe configuración en BD. Saltando...`)
      console.log(`   💡 Para sobrescribir, elimina primero la configuración existente.`)
      return false
    }

    // Leer preferencias de cookies (simulado)
    const cookiePrefs = readPreferencesFromCookies(organizationSlug)

    if (!cookiePrefs) {
      // Si no hay cookies, crear configuración con valores por defecto
      console.log(`   ℹ️  No se encontraron cookies. Creando configuración con valores por defecto...`)
      await ConfigurationSasService.upsertConfiguration(organization.id, {})
      console.log(`   ✅ Configuración creada con valores por defecto`)
      return true
    }

    // Migrar preferencias de cookies a BD
    const configData: any = {}

    if (cookiePrefs.currency) configData.currency = cookiePrefs.currency
    if (cookiePrefs.dateFormat) configData.dateFormat = cookiePrefs.dateFormat
    if (cookiePrefs.themeColor) configData.themeColor = cookiePrefs.themeColor
    if (cookiePrefs.whatsappNumber) configData.whatsappNumber = cookiePrefs.whatsappNumber
    if (cookiePrefs.whatsappCountryCode) configData.whatsappCountryCode = cookiePrefs.whatsappCountryCode

    await ConfigurationSasService.upsertConfiguration(organization.id, configData)

    console.log(`   ✅ Preferencias migradas exitosamente`)
    console.log(`   📊 Datos migrados:`)
    if (configData.currency) console.log(`      - Moneda: ${configData.currency}`)
    if (configData.dateFormat) console.log(`      - Formato fecha: ${configData.dateFormat}`)
    if (configData.themeColor) console.log(`      - Color tema: ${configData.themeColor}`)
    if (configData.whatsappNumber) console.log(`      - WhatsApp: ${configData.whatsappNumber}`)

    return true
  } catch (error) {
    console.error(`❌ Error migrando preferencias para ${organizationSlug}:`, error)
    return false
  }
}

/**
 * Migra preferencias para todas las organizaciones activas
 */
async function migrateAllOrganizations(): Promise<void> {
  try {
    const organizations = await prisma.organization.findMany({
      where: {
        subscriptionStatus: 'active'
      },
      select: {
        id: true,
        slug: true,
        name: true
      }
    })

    console.log(`\n🔄 Migrando preferencias para ${organizations.length} organizaciones...\n`)

    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    for (const org of organizations) {
      const result = await migrateOrganizationPreferences(org.slug)
      if (result === true) {
        successCount++
      } else if (result === false) {
        // Verificar si fue porque ya existe
        const existing = await prisma.configurationSas.findUnique({
          where: { organizationId: org.id }
        })
        if (existing) {
          skipCount++
        } else {
          errorCount++
        }
      }
      console.log('') // Línea en blanco entre organizaciones
    }

    console.log('\n📊 Resumen de migración:')
    console.log(`   ✅ Migradas: ${successCount}`)
    console.log(`   ⏭️  Omitidas (ya existían): ${skipCount}`)
    console.log(`   ❌ Errores: ${errorCount}`)
    console.log(`   📦 Total: ${organizations.length}`)
  } catch (error) {
    console.error('❌ Error en migración masiva:', error)
  }
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2)
  const organizationSlug = args[0]

  console.log('🚀 Iniciando migración de preferencias de cookies a base de datos\n')

  try {
    if (organizationSlug) {
      // Migrar una organización específica
      await migrateOrganizationPreferences(organizationSlug)
    } else {
      // Migrar todas las organizaciones
      await migrateAllOrganizations()
    }

    console.log('\n✨ Migración completada')
  } catch (error) {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main()
}

export { migrateOrganizationPreferences, migrateAllOrganizations }

