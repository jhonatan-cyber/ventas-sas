import { ConfigurationSas } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { logDatabase } from '@/lib/utils/logger'

export interface CreateConfigurationSasData {
  currency?: string
  dateFormat?: string
  themeColor?: string
  timezone?: string
  language?: string
  decimalPlaces?: number
  numberFormat?: string
  notificationsEnabled?: boolean
  autoSave?: boolean
  defaultBranchId?: string
  invoicePrefix?: string
  invoiceNumberFormat?: string
  taxRate?: number
  receiptFooter?: string
  whatsappNumber?: string
  whatsappCountryCode?: string
}

export interface UpdateConfigurationSasData {
  currency?: string
  dateFormat?: string
  themeColor?: string
  timezone?: string
  language?: string
  decimalPlaces?: number
  numberFormat?: string
  notificationsEnabled?: boolean
  autoSave?: boolean
  defaultBranchId?: string
  invoicePrefix?: string
  invoiceNumberFormat?: string
  taxRate?: number
  receiptFooter?: string
  whatsappNumber?: string
  whatsappCountryCode?: string
}

export class ConfigurationSasService {
  // Obtener configuración por organizationId (o crear una por defecto si no existe)
  static async getConfiguration(organizationId: string): Promise<ConfigurationSas> {
    const startTime = Date.now()
    
    let config = await prisma.configurationSas.findUnique({
      where: { organizationId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        defaultBranch: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Si no existe, crear una configuración por defecto
    if (!config) {
      config = await prisma.configurationSas.create({
        data: {
          organizationId,
          currency: 'BOB',
          dateFormat: 'dd/MM/yyyy',
          themeColor: 'green',
          timezone: 'America/La_Paz',
          language: 'es',
          decimalPlaces: 2,
          numberFormat: 'standard',
          notificationsEnabled: true,
          autoSave: true,
          invoiceNumberFormat: 'sequential',
          taxRate: 0,
          whatsappCountryCode: '+591'
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          defaultBranch: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
    }

    const duration = Date.now() - startTime
    logDatabase('SELECT', 'configuration_sas', duration, undefined, {
      organizationId,
    })

    return config
  }

  // Crear o actualizar configuración (upsert)
  static async upsertConfiguration(
    organizationId: string,
    data: CreateConfigurationSasData | UpdateConfigurationSasData
  ): Promise<ConfigurationSas> {
    const startTime = Date.now()

    const config = await prisma.configurationSas.upsert({
      where: { organizationId },
      update: {
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.dateFormat !== undefined && { dateFormat: data.dateFormat }),
        ...(data.themeColor !== undefined && { themeColor: data.themeColor }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.language !== undefined && { language: data.language }),
        ...(data.decimalPlaces !== undefined && { decimalPlaces: data.decimalPlaces }),
        ...(data.numberFormat !== undefined && { numberFormat: data.numberFormat }),
        ...(data.notificationsEnabled !== undefined && { notificationsEnabled: data.notificationsEnabled }),
        ...(data.autoSave !== undefined && { autoSave: data.autoSave }),
        ...(data.defaultBranchId !== undefined && { defaultBranchId: data.defaultBranchId }),
        ...(data.invoicePrefix !== undefined && { invoicePrefix: data.invoicePrefix }),
        ...(data.invoiceNumberFormat !== undefined && { invoiceNumberFormat: data.invoiceNumberFormat }),
        ...(data.taxRate !== undefined && { taxRate: data.taxRate }),
        ...(data.receiptFooter !== undefined && { receiptFooter: data.receiptFooter }),
        ...(data.whatsappNumber !== undefined && { whatsappNumber: data.whatsappNumber }),
        ...(data.whatsappCountryCode !== undefined && { whatsappCountryCode: data.whatsappCountryCode }),
      },
      create: {
        organizationId,
        currency: data.currency || 'BOB',
        dateFormat: data.dateFormat || 'dd/MM/yyyy',
        themeColor: data.themeColor || 'green',
        timezone: data.timezone || 'America/La_Paz',
        language: data.language || 'es',
        decimalPlaces: data.decimalPlaces ?? 2,
        numberFormat: data.numberFormat || 'standard',
        notificationsEnabled: data.notificationsEnabled ?? true,
        autoSave: data.autoSave ?? true,
        defaultBranchId: data.defaultBranchId,
        invoicePrefix: data.invoicePrefix,
        invoiceNumberFormat: data.invoiceNumberFormat || 'sequential',
        taxRate: data.taxRate ?? 0,
        receiptFooter: data.receiptFooter,
        whatsappNumber: data.whatsappNumber,
        whatsappCountryCode: data.whatsappCountryCode || '+591',
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        defaultBranch: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    const duration = Date.now() - startTime
    logDatabase('UPSERT', 'configuration_sas', duration, undefined, {
      organizationId,
    })

    return config
  }

  // Actualizar configuración parcial
  static async updateConfiguration(
    organizationId: string,
    data: UpdateConfigurationSasData
  ): Promise<ConfigurationSas> {
    const startTime = Date.now()

    const updateData: any = {}
    
    if (data.currency !== undefined) updateData.currency = data.currency
    if (data.dateFormat !== undefined) updateData.dateFormat = data.dateFormat
    if (data.themeColor !== undefined) updateData.themeColor = data.themeColor
    if (data.timezone !== undefined) updateData.timezone = data.timezone
    if (data.language !== undefined) updateData.language = data.language
    if (data.decimalPlaces !== undefined) updateData.decimalPlaces = data.decimalPlaces
    if (data.numberFormat !== undefined) updateData.numberFormat = data.numberFormat
    if (data.notificationsEnabled !== undefined) updateData.notificationsEnabled = data.notificationsEnabled
    if (data.autoSave !== undefined) updateData.autoSave = data.autoSave
    if (data.defaultBranchId !== undefined) updateData.defaultBranchId = data.defaultBranchId
    if (data.invoicePrefix !== undefined) updateData.invoicePrefix = data.invoicePrefix
    if (data.invoiceNumberFormat !== undefined) updateData.invoiceNumberFormat = data.invoiceNumberFormat
    if (data.taxRate !== undefined) updateData.taxRate = data.taxRate
    if (data.receiptFooter !== undefined) updateData.receiptFooter = data.receiptFooter
    if (data.whatsappNumber !== undefined) updateData.whatsappNumber = data.whatsappNumber
    if (data.whatsappCountryCode !== undefined) updateData.whatsappCountryCode = data.whatsappCountryCode

    const config = await prisma.configurationSas.update({
      where: { organizationId },
      data: updateData,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        defaultBranch: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    const duration = Date.now() - startTime
    logDatabase('UPDATE', 'configuration_sas', duration, undefined, {
      organizationId,
    })

    return config
  }

  // Eliminar configuración (útil para reset)
  static async deleteConfiguration(organizationId: string): Promise<void> {
    const startTime = Date.now()
    await prisma.configurationSas.delete({
      where: { organizationId }
    })
    
    const duration = Date.now() - startTime
    logDatabase('DELETE', 'configuration_sas', duration, undefined, {
      organizationId,
    })
  }

  // Resetear configuración a valores por defecto
  static async resetToDefaults(organizationId: string): Promise<ConfigurationSas> {
    return this.upsertConfiguration(organizationId, {
      currency: 'BOB',
      dateFormat: 'dd/MM/yyyy',
      themeColor: 'green',
      timezone: 'America/La_Paz',
      language: 'es',
      decimalPlaces: 2,
      numberFormat: 'standard',
      notificationsEnabled: true,
      autoSave: true,
      invoiceNumberFormat: 'sequential',
      taxRate: 0,
      whatsappCountryCode: '+591'
    })
  }
}

