import { NextRequest, NextResponse } from 'next/server'

import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'
import { getCurrentSasUser } from '@/lib/utils/get-current-user'
import { ConfigurationSasService } from '@/lib/services/sales/configuration-sas-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'

export const runtime = 'nodejs'

// GET - Obtener configuración de la organización
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Verificar autenticación
    const currentUser = await getCurrentSasUser(request, slug)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener organizationId
    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 })
    }

    // Obtener o crear configuración
    const config = await ConfigurationSasService.getConfiguration(organizationId)

    return NextResponse.json({
      success: true,
      configuration: {
        id: config.id,
        organizationId: config.organizationId,
        currency: config.currency,
        dateFormat: config.dateFormat,
        themeColor: config.themeColor,
        timezone: config.timezone,
        language: config.language,
        decimalPlaces: config.decimalPlaces,
        numberFormat: config.numberFormat,
        notificationsEnabled: config.notificationsEnabled,
        autoSave: config.autoSave,
        defaultBranchId: config.defaultBranchId,
        invoicePrefix: config.invoicePrefix,
        invoiceNumberFormat: config.invoiceNumberFormat,
        taxRate: config.taxRate ? Number(config.taxRate) : null,
        receiptFooter: config.receiptFooter,
        whatsappNumber: config.whatsappNumber,
        whatsappCountryCode: config.whatsappCountryCode,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
        defaultBranch: config.defaultBranchId,
      },
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_CONFIGURATION' }))
  }
}

// PUT - Actualizar configuración de la organización
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Verificar autenticación
    const currentUser = await getCurrentSasUser(request, slug)
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener organizationId
    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 })
    }

    // Parsear body
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    // Validar y preparar datos
    const updateData: any = {}
    
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.dateFormat !== undefined) updateData.dateFormat = body.dateFormat
    if (body.themeColor !== undefined) updateData.themeColor = body.themeColor
    if (body.timezone !== undefined) updateData.timezone = body.timezone
    if (body.language !== undefined) updateData.language = body.language
    if (body.decimalPlaces !== undefined) updateData.decimalPlaces = parseInt(body.decimalPlaces, 10)
    if (body.numberFormat !== undefined) updateData.numberFormat = body.numberFormat
    if (body.notificationsEnabled !== undefined) updateData.notificationsEnabled = Boolean(body.notificationsEnabled)
    if (body.autoSave !== undefined) updateData.autoSave = Boolean(body.autoSave)
    if (body.defaultBranchId !== undefined) updateData.defaultBranchId = body.defaultBranchId || null
    if (body.invoicePrefix !== undefined) updateData.invoicePrefix = body.invoicePrefix || null
    if (body.invoiceNumberFormat !== undefined) updateData.invoiceNumberFormat = body.invoiceNumberFormat
    if (body.taxRate !== undefined) updateData.taxRate = parseFloat(body.taxRate) || 0
    if (body.receiptFooter !== undefined) updateData.receiptFooter = body.receiptFooter || null
    if (body.whatsappNumber !== undefined) updateData.whatsappNumber = body.whatsappNumber || null
    if (body.whatsappCountryCode !== undefined) updateData.whatsappCountryCode = body.whatsappCountryCode

    // Actualizar configuración
    const updated = await ConfigurationSasService.updateConfiguration(organizationId, updateData)

    return NextResponse.json({
      success: true,
      configuration: {
        id: updated.id,
        organizationId: updated.organizationId,
        currency: updated.currency,
        dateFormat: updated.dateFormat,
        themeColor: updated.themeColor,
        timezone: updated.timezone,
        language: updated.language,
        decimalPlaces: updated.decimalPlaces,
        numberFormat: updated.numberFormat,
        notificationsEnabled: updated.notificationsEnabled,
        autoSave: updated.autoSave,
        defaultBranchId: updated.defaultBranchId,
        invoicePrefix: updated.invoicePrefix,
        invoiceNumberFormat: updated.invoiceNumberFormat,
        taxRate: updated.taxRate ? Number(updated.taxRate) : null,
        receiptFooter: updated.receiptFooter,
        whatsappNumber: updated.whatsappNumber,
        whatsappCountryCode: updated.whatsappCountryCode,
        updatedAt: updated.updatedAt,
      },
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'UPDATE_CONFIGURATION' }))
  }
}

