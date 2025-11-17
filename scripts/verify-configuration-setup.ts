/**
 * Script de verificación para el sistema de configuraciones
 * 
 * Verifica que:
 * - La tabla existe en la base de datos
 * - El servicio funciona correctamente
 * - La API puede crear y leer configuraciones
 * 
 * Uso:
 *   npx tsx scripts/verify-configuration-setup.ts [organizationSlug]
 */

import { prisma } from '../lib/prisma'
import { ConfigurationSasService } from '../lib/services/sales/configuration-sas-service'

interface VerificationResult {
  step: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
}

const results: VerificationResult[] = []

function addResult(step: string, status: 'success' | 'error' | 'warning', message: string, details?: any) {
  results.push({ step, status, message, details })
  const icon = status === 'success' ? '✅' : status === 'error' ? '❌' : '⚠️'
  console.log(`${icon} ${step}: ${message}`)
  if (details) {
    console.log(`   Detalles:`, details)
  }
}

/**
 * Verifica que la tabla existe en la base de datos
 */
async function verifyTableExists(): Promise<boolean> {
  try {
    // Intentar hacer una consulta simple
    const count = await prisma.configurationSas.count()
    addResult(
      'Tabla existe',
      'success',
      `La tabla sales_configuration_sas existe y es accesible (${count} registros)`
    )
    return true
  } catch (error: any) {
    addResult(
      'Tabla existe',
      'error',
      'La tabla sales_configuration_sas no existe o no es accesible',
      error.message
    )
    return false
  }
}

/**
 * Verifica que el servicio puede crear una configuración
 */
async function verifyServiceCreate(organizationId: string): Promise<boolean> {
  try {
    // Intentar obtener o crear configuración
    const config = await ConfigurationSasService.getConfiguration(organizationId)
    
    if (config) {
      addResult(
        'Servicio - Crear/Obtener',
        'success',
        'El servicio puede crear y obtener configuraciones',
        {
          id: config.id,
          currency: config.currency,
          dateFormat: config.dateFormat,
          themeColor: config.themeColor,
        }
      )
      return true
    } else {
      addResult(
        'Servicio - Crear/Obtener',
        'error',
        'El servicio no pudo crear/obtener configuración'
      )
      return false
    }
  } catch (error: any) {
    addResult(
      'Servicio - Crear/Obtener',
      'error',
      'Error al crear/obtener configuración',
      error.message
    )
    return false
  }
}

/**
 * Verifica que el servicio puede actualizar una configuración
 */
async function verifyServiceUpdate(organizationId: string): Promise<boolean> {
  try {
    const testCurrency = 'USD'
    const updated = await ConfigurationSasService.updateConfiguration(organizationId, {
      currency: testCurrency,
    })

    if (updated && updated.currency === testCurrency) {
      addResult(
        'Servicio - Actualizar',
        'success',
        'El servicio puede actualizar configuraciones',
        { currency: updated.currency }
      )
      return true
    } else {
      addResult(
        'Servicio - Actualizar',
        'error',
        'El servicio no actualizó correctamente'
      )
      return false
    }
  } catch (error: any) {
    addResult(
      'Servicio - Actualizar',
      'error',
      'Error al actualizar configuración',
      error.message
    )
    return false
  }
}

/**
 * Verifica que las relaciones funcionan
 */
async function verifyRelationships(organizationId: string): Promise<boolean> {
  try {
    const config = await prisma.configurationSas.findUnique({
      where: { organizationId },
      include: {
        organization: {
          select: { id: true, name: true, slug: true }
        },
        defaultBranch: {
          select: { id: true, name: true }
        }
      }
    })

    if (config && config.organization) {
      addResult(
        'Relaciones',
        'success',
        'Las relaciones con Organization funcionan correctamente',
        { organizationName: config.organization.name }
      )
      return true
    } else {
      addResult(
        'Relaciones',
        'error',
        'No se pudo verificar las relaciones'
      )
      return false
    }
  } catch (error: any) {
    addResult(
      'Relaciones',
      'error',
      'Error al verificar relaciones',
      error.message
    )
    return false
  }
}

/**
 * Verifica que los valores por defecto se aplican correctamente
 */
async function verifyDefaultValues(organizationId: string): Promise<boolean> {
  try {
    // Eliminar configuración existente para probar valores por defecto
    await prisma.configurationSas.deleteMany({
      where: { organizationId }
    })

    // Crear nueva configuración (debería usar valores por defecto)
    const config = await ConfigurationSasService.getConfiguration(organizationId)

    const defaults = {
      currency: 'BOB',
      dateFormat: 'dd/MM/yyyy',
      themeColor: 'green',
      timezone: 'America/La_Paz',
      language: 'es',
      decimalPlaces: 2,
    }

    const allDefaultsMatch = 
      config.currency === defaults.currency &&
      config.dateFormat === defaults.dateFormat &&
      config.themeColor === defaults.themeColor &&
      config.timezone === defaults.timezone &&
      config.language === defaults.language &&
      config.decimalPlaces === defaults.decimalPlaces

    if (allDefaultsMatch) {
      addResult(
        'Valores por defecto',
        'success',
        'Los valores por defecto se aplican correctamente',
        defaults
      )
      return true
    } else {
      addResult(
        'Valores por defecto',
        'warning',
        'Algunos valores por defecto no coinciden',
        {
          expected: defaults,
          actual: {
            currency: config.currency,
            dateFormat: config.dateFormat,
            themeColor: config.themeColor,
            timezone: config.timezone,
            language: config.language,
            decimalPlaces: config.decimalPlaces,
          }
        }
      )
      return false
    }
  } catch (error: any) {
    addResult(
      'Valores por defecto',
      'error',
      'Error al verificar valores por defecto',
      error.message
    )
    return false
  }
}

/**
 * Verifica estadísticas generales
 */
async function verifyStatistics(): Promise<void> {
  try {
    const totalConfigs = await prisma.configurationSas.count()
    const totalOrgs = await prisma.organization.count({
      where: { subscriptionStatus: 'active' }
    })
    const configsWithDefaults = await prisma.configurationSas.count({
      where: {
        currency: 'BOB',
        dateFormat: 'dd/MM/yyyy',
        themeColor: 'green'
      }
    })

    addResult(
      'Estadísticas',
      'success',
      'Estadísticas del sistema',
      {
        totalConfiguraciones: totalConfigs,
        totalOrganizacionesActivas: totalOrgs,
        configuracionesConDefaults: configsWithDefaults,
        porcentajeConfigurado: totalOrgs > 0 
          ? ((totalConfigs / totalOrgs) * 100).toFixed(1) + '%'
          : '0%'
      }
    )
  } catch (error: any) {
    addResult(
      'Estadísticas',
      'error',
      'Error al obtener estadísticas',
      error.message
    )
  }
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2)
  const organizationSlug = args[0]

  console.log('🔍 Iniciando verificación del sistema de configuraciones\n')

  try {
    // Verificar tabla
    const tableExists = await verifyTableExists()
    if (!tableExists) {
      console.log('\n❌ La tabla no existe. Ejecuta primero: npx prisma db push')
      process.exit(1)
    }

    // Verificar estadísticas
    await verifyStatistics()
    console.log('')

    if (organizationSlug) {
      // Verificar para una organización específica
      const organization = await prisma.organization.findUnique({
        where: { slug: organizationSlug },
        select: { id: true, name: true }
      })

      if (!organization) {
        console.log(`❌ Organización no encontrada: ${organizationSlug}`)
        process.exit(1)
      }

      console.log(`\n📋 Verificando para: ${organization.name} (${organizationSlug})\n`)

      await verifyServiceCreate(organization.id)
      await verifyServiceUpdate(organization.id)
      await verifyRelationships(organization.id)
      await verifyDefaultValues(organization.id)
    } else {
      // Verificar con una organización de prueba
      const testOrg = await prisma.organization.findFirst({
        where: { subscriptionStatus: 'active' },
        select: { id: true, name: true, slug: true }
      })

      if (testOrg) {
        console.log(`\n📋 Usando organización de prueba: ${testOrg.name} (${testOrg.slug})\n`)
        await verifyServiceCreate(testOrg.id)
        await verifyServiceUpdate(testOrg.id)
        await verifyRelationships(testOrg.id)
      } else {
        addResult(
          'Organización de prueba',
          'warning',
          'No se encontró organización activa para pruebas'
        )
      }
    }

    // Resumen
    console.log('\n' + '='.repeat(60))
    console.log('📊 RESUMEN DE VERIFICACIÓN')
    console.log('='.repeat(60))

    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length
    const warningCount = results.filter(r => r.status === 'warning').length

    console.log(`✅ Exitosos: ${successCount}`)
    console.log(`⚠️  Advertencias: ${warningCount}`)
    console.log(`❌ Errores: ${errorCount}`)
    console.log(`📦 Total: ${results.length}`)

    if (errorCount === 0) {
      console.log('\n✨ ¡Todas las verificaciones pasaron exitosamente!')
      process.exit(0)
    } else {
      console.log('\n⚠️  Se encontraron algunos errores. Revisa los detalles arriba.')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
const isMainModule = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))
if (isMainModule || process.argv[1]?.includes('verify-configuration-setup')) {
  main()
}

export { verifyTableExists, verifyServiceCreate, verifyServiceUpdate }

