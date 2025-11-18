/**
 * API endpoint para transferencias entre sucursales
 */

import { NextRequest, NextResponse } from 'next/server'

import { AppError } from '@/lib/errors/app-error'
import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/lib/services/notification-service'
import { InventoryTransferService } from '@/lib/services/sales/inventory-transfer-service'
import { handleApiError, createErrorContext } from '@/lib/utils/error-handler'
import { getCurrentSasUser } from '@/lib/utils/get-current-user'
import { getOrganizationIdByCustomerSlug } from '@/lib/utils/organization'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada')
    }

    // Verificar permisos del usuario
    const currentUser = await getCurrentSasUser(request, slug)
    if (!currentUser) {
      throw AppError.unauthorized('Usuario no autenticado')
    }

    const branchId = searchParams.get('branchId') || undefined
    const productId = searchParams.get('productId') || undefined
    const status = searchParams.get('status') as any
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const skip = (page - 1) * pageSize

    const result = await InventoryTransferService.getTransfers(organizationId, {
      branchId,
      productId,
      status,
      startDate,
      endDate,
      limit: pageSize,
      skip,
    })

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    return handleApiError(error, createErrorContext(request, { action: 'GET_INVENTORY_TRANSFERS' }))
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()

    const organizationId = await getOrganizationIdByCustomerSlug(slug)
    if (!organizationId) {
      throw AppError.notFound('Organización no encontrada')
    }

    // Verificar permisos del usuario
    const currentUser = await getCurrentSasUser(request, slug)
    if (!currentUser) {
      throw AppError.unauthorized('Usuario no autenticado')
    }

    const { productId, fromBranchId, toBranchId, quantity, notes } = body

    if (!productId || !fromBranchId || !toBranchId || !quantity) {
      throw AppError.validation('Faltan campos requeridos')
    }

    if (fromBranchId === toBranchId) {
      throw AppError.validation('La sucursal origen y destino no pueden ser la misma')
    }

    if (quantity <= 0) {
      throw AppError.validation('La cantidad debe ser mayor a 0')
    }

    const transfer = await InventoryTransferService.createTransfer({
      organizationId,
      productId,
      fromBranchId,
      toBranchId,
      quantity,
      notes,
      requestedById: currentUser.id,
    })

    // Verificar si el usuario es administrador
    const userRoleName = (currentUser.rol?.nombre || '').toLowerCase()
    const isUserAdmin = userRoleName.includes('administrador') || userRoleName === 'admin'

    // Si el usuario ES administrador, aprobar la transferencia automáticamente
    if (isUserAdmin) {
      try {
        await InventoryTransferService.approveTransfer(
          transfer.id,
          currentUser.id,
          notes || 'Aprobación automática por administrador'
        )
        // Recargar la transferencia para obtener el estado actualizado
        const updatedTransfer = await prisma.inventoryTransfer.findUnique({
          where: { id: transfer.id },
          include: {
            product: true,
            fromBranch: true,
            toBranch: true,
            requestedBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
            approvedBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        })
        
        return NextResponse.json({
          success: true,
          transfer: updatedTransfer,
          autoApproved: true,
        })
      } catch (approveError) {
        // Si falla la aprobación, devolver la transferencia creada pero no aprobada
        console.error('Error al aprobar automáticamente la transferencia:', approveError)
        return NextResponse.json({
          success: true,
          transfer,
          autoApproved: false,
          error: 'La transferencia se creó pero no se pudo aprobar automáticamente',
        })
      }
    }

    // Si el usuario NO es administrador, enviar notificación a los administradores
    if (!isUserAdmin) {
      try {
        // Obtener información del producto y sucursales para la notificación
        const [product, fromBranch, toBranch] = await Promise.all([
          prisma.salesProduct.findUnique({
            where: { id: productId },
            select: { name: true },
          }),
          prisma.branch.findUnique({
            where: { id: fromBranchId },
            select: { name: true },
          }),
          prisma.branch.findUnique({
            where: { id: toBranchId },
            select: { name: true },
          }),
        ])

        // Obtener usuarios administradores de la organización
        const adminUsers = await prisma.usuarioSas.findMany({
          where: {
            organizationId,
            isActive: true,
            deletedAt: null,
            rol: {
              nombre: {
                contains: 'administrador',
                mode: 'insensitive',
              },
            },
          },
          select: {
            id: true,
          },
        })

        // Crear notificaciones para cada administrador
        if (adminUsers.length > 0) {
          const productName = product?.name || 'Producto desconocido'
          const fromBranchName = fromBranch?.name || 'Sucursal origen'
          const toBranchName = toBranch?.name || 'Sucursal destino'
          const requesterName = currentUser.fullName || currentUser.email || 'Usuario'

          const notifications = adminUsers.map((admin) => ({
            type: 'transfer_request' as const,
            title: 'Nueva Solicitud de Transferencia',
            message: `${requesterName} ha solicitado transferir ${quantity} unidades de "${productName}" de ${fromBranchName} a ${toBranchName}`,
            organizationId,
            usuarioSasId: admin.id,
            data: {
              transferId: transfer.id,
              productId,
              productName,
              fromBranchId,
              fromBranchName,
              toBranchId,
              toBranchName,
              quantity,
              requestedById: currentUser.id,
              requestedByName: requesterName,
            },
          }))

          await NotificationService.createNotifications(notifications)
        }
      } catch (notificationError) {
        // No fallar la creación de la transferencia si hay error en las notificaciones
        console.error('Error al crear notificaciones de transferencia:', notificationError)
      }
    }

    return NextResponse.json({
      success: true,
      transfer,
    })
  } catch (error) {
    // Mapeo de errores a 4xx/409 con mensajes claros
    const message = (error as any)?.message || ''
    const code = (error as any)?.code

    // Validaciones de negocio y de integridad
    if (
      message.includes('Sucursal origen inválida') ||
      message.includes('Sucursal destino inválida') ||
      message.includes('Usuario solicitante inválido') ||
      message.includes('El producto no está disponible en la sucursal origen seleccionada') ||
      message.includes('La sucursal de origen y destino no pueden ser la misma')
    ) {
      return NextResponse.json({ success: false, error: message }, { status: 400 })
    }

    if (message.includes('Producto no encontrado')) {
      return NextResponse.json({ success: false, error: message }, { status: 404 })
    }

    if (
      message.includes('Stock insuficiente') ||
      message.includes('Stock insuficiente en la sucursal origen')
    ) {
      return NextResponse.json({ success: false, error: message }, { status: 409 })
    }

    // Prisma FK
    if (code === 'P2003' || message.includes('Foreign key constraint')) {
      return NextResponse.json(
        { success: false, error: 'Datos relacionados inválidos (revisa producto, sucursales o usuario)' },
        { status: 400 }
      )
    }

    return handleApiError(error, createErrorContext(request, { action: 'CREATE_INVENTORY_TRANSFER' }))
  }
}

