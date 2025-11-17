/**
 * Servicio de transferencias entre sucursales
 */

import { TransferStatus, InventoryMovementType } from "@prisma/client";

import { InventoryMovementService } from "./inventory-movement-service";

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/utils/logger";

export interface CreateTransferData {
  organizationId: string;
  productId: string;
  fromBranchId: string;
  toBranchId: string;
  quantity: number;
  notes?: string;
  requestedById: string;
}

export interface UpdateTransferStatusData {
  status: TransferStatus;
  approvedById?: string;
  completedById?: string;
  notes?: string;
}

export class InventoryTransferService {
  /**
   * Asegura que exista un SalesUser asociado a un UsuarioSas
   * Devuelve el ID del SalesUser (creándolo si es necesario)
   */
  private static async getOrCreateSalesUserFromSasUser(
    organizationId: string,
    usuarioSasId: string
  ) {
    const usuarioSas = await prisma.usuarioSas.findFirst({
      where: {
        id: usuarioSasId,
        organizationId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        organizationId: true,
      },
    });

    if (!usuarioSas) {
      throw new Error("Usuario inválido para la organización");
    }

    let salesUser = await prisma.salesUser.findFirst({
      where: {
        organizationId,
        email: usuarioSas.email || undefined,
        isActive: true,
      },
      select: { id: true },
    });

    if (!salesUser) {
      const fullName = `${usuarioSas.nombre} ${usuarioSas.apellido}`.trim();

      salesUser = await prisma.salesUser.create({
        data: {
          organizationId,
          email: usuarioSas.email || `sas-user-${usuarioSas.id}@local`,
          password: "!",
          fullName: fullName || "Usuario SAS",
          isActive: true,
        },
        select: { id: true },
      });
    }

    return salesUser.id;
  }

  /**
   * Crear una solicitud de transferencia
   */
  static async createTransfer(data: CreateTransferData) {
    try {
      // Validaciones previas de integridad referencial para evitar P2003 (FK)
      if (data.fromBranchId === data.toBranchId) {
        throw new Error(
          "La sucursal de origen y destino no pueden ser la misma"
        );
      }

      const [fromBranch, toBranch, requesterSas] = await Promise.all([
        prisma.branch.findFirst({
          where: {
            id: data.fromBranchId,
            organizationId: data.organizationId,
            deletedAt: null,
          },
          select: { id: true, name: true, organizationId: true },
        }),
        prisma.branch.findFirst({
          where: {
            id: data.toBranchId,
            organizationId: data.organizationId,
            deletedAt: null,
          },
          select: { id: true, name: true, organizationId: true },
        }),
        prisma.usuarioSas.findFirst({
          where: {
            id: data.requestedById,
            organizationId: data.organizationId,
            isActive: true,
            deletedAt: null,
          },
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            organizationId: true,
          },
        }),
      ]);

      if (!fromBranch) {
        throw new Error(
          "Sucursal origen inválida o no pertenece a la organización"
        );
      }
      if (!toBranch) {
        throw new Error(
          "Sucursal destino inválida o no pertenece a la organización"
        );
      }
      if (!requesterSas) {
        throw new Error("Usuario solicitante inválido");
      }

      // Asegurar que exista un SalesUser asociado al UsuarioSas (por email y organización)
      let requester = await prisma.salesUser.findFirst({
        where: {
          organizationId: data.organizationId,
          email: requesterSas.email || undefined,
          isActive: true,
        },
        select: { id: true },
      });

      if (!requester) {
        // Crear un SalesUser "espejo" del UsuarioSas para poder registrar la referencia
        const fullName =
          `${requesterSas.nombre} ${requesterSas.apellido}`.trim();

        requester = await prisma.salesUser.create({
          data: {
            organizationId: data.organizationId,
            email: requesterSas.email || `sas-user-${requesterSas.id}@local`,
            password: "!", // no se utiliza para login directo, solo para relación interna
            fullName: fullName || "Usuario SAS",
            isActive: true,
          },
          select: { id: true },
        });
      }

      // Verificar que el producto existe y tiene stock suficiente en la sucursal origen
      // Primero buscar el producto por ID y organización
      const product = await prisma.salesProduct.findFirst({
        where: {
          id: data.productId,
          organizationId: data.organizationId,
          deletedAt: null,
        },
      });

      if (!product) {
        throw new Error("Producto no encontrado");
      }

      if (product.branchId !== data.fromBranchId) {
        throw new Error(
          "El producto no está disponible en la sucursal origen seleccionada"
        );
      }

      if (product.stock < data.quantity) {
        throw new Error(
          `Stock insuficiente. Stock disponible: ${product.stock}, solicitado: ${data.quantity}`
        );
      }

      // Crear la transferencia
      const transfer = await prisma.inventoryTransfer.create({
        data: {
          organizationId: data.organizationId,
          productId: data.productId,
          fromBranchId: data.fromBranchId,
          toBranchId: data.toBranchId,
          quantity: data.quantity,
          status: TransferStatus.pending,
          notes: data.notes,
          requestedById: requester.id,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
            },
          },
          fromBranch: {
            select: {
              id: true,
              name: true,
            },
          },
          toBranch: {
            select: {
              id: true,
              name: true,
            },
          },
          requestedBy: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });

      logger.info("Transferencia de inventario creada", {
        transferId: transfer.id,
        productId: data.productId,
        fromBranchId: data.fromBranchId,
        toBranchId: data.toBranchId,
      });

      return transfer;
    } catch (error) {
      logger.error(
        "Error creando transferencia de inventario",
        error as Error,
        { data }
      );
      throw error;
    }
  }

  /**
   * Aprobar una transferencia (mueve el stock automáticamente)
   */
  static async approveTransfer(
    transferId: string,
    approvedById: string,
    notes?: string
  ) {
    try {
      const transfer = await prisma.inventoryTransfer.findUnique({
        where: { id: transferId },
        include: {
          product: true,
          fromBranch: {
            select: {
              id: true,
              name: true,
            },
          },
          toBranch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!transfer) {
        throw new Error("Transferencia no encontrada");
      }

      if (transfer.status !== TransferStatus.pending) {
        throw new Error(`La transferencia ya está ${transfer.status}`);
      }

      // Resolver usuario aprobador (SalesUser) a partir del usuario SAS
      const approverSalesUserId = await this.getOrCreateSalesUserFromSasUser(
        transfer.organizationId,
        approvedById
      );

      // Verificar stock en sucursal origen
      const fromProduct = await prisma.salesProduct.findFirst({
        where: {
          id: transfer.productId,
          organizationId: transfer.organizationId,
          branchId: transfer.fromBranchId,
          deletedAt: null,
        },
      });

      if (!fromProduct || fromProduct.stock < transfer.quantity) {
        throw new Error("Stock insuficiente para aprobar la transferencia");
      }

      // Buscar producto en sucursal destino por SKU, barcode o nombre (no por ID, porque cada sucursal tiene su propio registro)
      let toProduct: any = null;

      // 1. Buscar por SKU (más confiable)
      if (fromProduct.sku) {
        toProduct = await prisma.salesProduct.findFirst({
          where: {
            sku: fromProduct.sku,
            organizationId: transfer.organizationId,
            branchId: transfer.toBranchId,
            deletedAt: null,
          },
        });
      }

      // 2. Si no se encontró por SKU, buscar por barcode
      if (!toProduct && fromProduct.barcode) {
        toProduct = await prisma.salesProduct.findFirst({
          where: {
            barcode: fromProduct.barcode,
            organizationId: transfer.organizationId,
            branchId: transfer.toBranchId,
            deletedAt: null,
          },
        });
      }

      // 3. Si no tiene SKU ni barcode, buscar por nombre como fallback (para evitar duplicados)
      if (!toProduct && !fromProduct.sku && !fromProduct.barcode) {
        toProduct = await prisma.salesProduct.findFirst({
          where: {
            name: fromProduct.name,
            organizationId: transfer.organizationId,
            branchId: transfer.toBranchId,
            deletedAt: null,
          },
        });
      }

      // Si no existe el producto en la sucursal destino, crear una copia
      if (!toProduct) {
        logger.info("Creando producto en sucursal destino", {
          fromBranchId: transfer.fromBranchId,
          toBranchId: transfer.toBranchId,
          productName: fromProduct.name,
          sku: fromProduct.sku || "sin SKU",
          barcode: fromProduct.barcode || "sin barcode",
        });

        toProduct = await prisma.salesProduct.create({
          data: {
            organizationId: fromProduct.organizationId,
            categoryId: fromProduct.categoryId,
            name: fromProduct.name,
            description: fromProduct.description,
            descriptionTranslations: fromProduct.descriptionTranslations as any,
            brand: fromProduct.brand,
            model: fromProduct.model,
            price: fromProduct.price,
            cost: fromProduct.cost,
            stock: 0,
            minStock: fromProduct.minStock,
            reorderPoint: fromProduct.reorderPoint,
            sku: fromProduct.sku,
            barcode: fromProduct.barcode,
            imageUrl: fromProduct.imageUrl,
            branchId: transfer.toBranchId,
            isActive: fromProduct.isActive,
          },
        });

        logger.info("Producto creado en sucursal destino", {
          productId: toProduct.id,
          branchId: transfer.toBranchId,
        });
      } else {
        logger.info("Producto encontrado en sucursal destino", {
          productId: toProduct.id,
          branchId: transfer.toBranchId,
          currentStock: toProduct.stock,
        });
      }

      // Realizar la transferencia en una transacción (aprobar y mover stock)
      const updated = await prisma.$transaction(async (tx) => {
        // Reducir stock en sucursal origen
        const previousStockFrom = fromProduct.stock;
        const newStockFrom = previousStockFrom - transfer.quantity;

        await tx.salesProduct.update({
          where: { id: fromProduct.id },
          data: { stock: newStockFrom },
        });

        // Registrar movimiento de salida
        await InventoryMovementService.createMovement({
          organizationId: transfer.organizationId,
          productId: transfer.productId,
          branchId: transfer.fromBranchId,
          movementType: InventoryMovementType.TRANSFER_OUT,
          quantity: -transfer.quantity,
          previousStock: previousStockFrom,
          newStock: newStockFrom,
          referenceType: "transfer",
          referenceId: transfer.id,
          notes: `Transferencia a ${transfer.toBranch.name}`,
          userId: approverSalesUserId,
        });

        // Aumentar stock en sucursal destino
        const previousStockTo = toProduct.stock;
        const newStockTo = previousStockTo + transfer.quantity;

        await tx.salesProduct.update({
          where: { id: toProduct.id },
          data: { stock: newStockTo },
        });

        // Registrar movimiento de entrada
        await InventoryMovementService.createMovement({
          organizationId: transfer.organizationId,
          productId: toProduct.id,
          branchId: transfer.toBranchId,
          movementType: InventoryMovementType.TRANSFER_IN,
          quantity: transfer.quantity,
          previousStock: previousStockTo,
          newStock: newStockTo,
          referenceType: "transfer",
          referenceId: transfer.id,
          notes: `Transferencia desde ${transfer.fromBranch.name}`,
          userId: approverSalesUserId,
        });

        // Actualizar estado de la transferencia (aprobada y completada)
        const updatedTransfer = await tx.inventoryTransfer.update({
          where: { id: transferId },
          data: {
            status: TransferStatus.completed,
            approvedById: approverSalesUserId,
            approvedAt: new Date(),
            completedById: approverSalesUserId,
            completedAt: new Date(),
            notes: notes || transfer.notes,
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
            fromBranch: {
              select: {
                id: true,
                name: true,
              },
            },
            toBranch: {
              select: {
                id: true,
                name: true,
              },
            },
            approvedBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
            completedBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        });

        return updatedTransfer;
      });

      logger.info("Transferencia aprobada y completada", { transferId });

      return updated;
    } catch (error) {
      logger.error("Error aprobando transferencia", error as Error, {
        transferId,
      });
      throw error;
    }
  }

  /**
   * Rechazar una transferencia
   */
  static async rejectTransfer(
    transferId: string,
    approvedById: string,
    notes?: string
  ) {
    try {
      const transfer = await prisma.inventoryTransfer.findUnique({
        where: { id: transferId },
      });

      if (!transfer) {
        throw new Error("Transferencia no encontrada");
      }

      if (transfer.status !== TransferStatus.pending) {
        throw new Error(`La transferencia ya está ${transfer.status}`);
      }

      // Resolver usuario aprobador (SalesUser) a partir del usuario SAS
      const approverSalesUserId = await this.getOrCreateSalesUserFromSasUser(
        transfer.organizationId,
        approvedById
      );

      const updated = await prisma.inventoryTransfer.update({
        where: { id: transferId },
        data: {
          status: TransferStatus.rejected,
          approvedById: approverSalesUserId,
          approvedAt: new Date(),
          notes: notes || transfer.notes,
        },
      });

      logger.info("Transferencia rechazada", { transferId });

      return updated;
    } catch (error) {
      logger.error("Error rechazando transferencia", error as Error, {
        transferId,
      });
      throw error;
    }
  }

  /**
   * Completar una transferencia (mover el stock)
   */
  static async completeTransfer(transferId: string, completedById: string) {
    try {
      const transfer = await prisma.inventoryTransfer.findUnique({
        where: { id: transferId },
        include: {
          product: true,
          fromBranch: {
            select: {
              id: true,
              name: true,
            },
          },
          toBranch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!transfer) {
        throw new Error("Transferencia no encontrada");
      }

      if (
        transfer.status !== TransferStatus.approved &&
        transfer.status !== TransferStatus.in_transit
      ) {
        throw new Error(
          `La transferencia debe estar aprobada o en tránsito para completarse. Estado actual: ${transfer.status}`
        );
      }

      // Resolver usuario que completa (SalesUser) a partir del usuario SAS
      const completedBySalesUserId = await this.getOrCreateSalesUserFromSasUser(
        transfer.organizationId,
        completedById
      );

      // Verificar stock en sucursal origen
      const fromProduct = await prisma.salesProduct.findFirst({
        where: {
          id: transfer.productId,
          organizationId: transfer.organizationId,
          branchId: transfer.fromBranchId,
          deletedAt: null,
        },
      });

      if (!fromProduct || fromProduct.stock < transfer.quantity) {
        throw new Error("Stock insuficiente en la sucursal origen");
      }

      // Buscar producto en sucursal destino por SKU, barcode o nombre (no por ID, porque cada sucursal tiene su propio registro)
      let toProduct: any = null;

      // 1. Buscar por SKU (más confiable)
      if (fromProduct.sku) {
        toProduct = await prisma.salesProduct.findFirst({
          where: {
            sku: fromProduct.sku,
            organizationId: transfer.organizationId,
            branchId: transfer.toBranchId,
            deletedAt: null,
          },
        });
      }

      // 2. Si no se encontró por SKU, buscar por barcode
      if (!toProduct && fromProduct.barcode) {
        toProduct = await prisma.salesProduct.findFirst({
          where: {
            barcode: fromProduct.barcode,
            organizationId: transfer.organizationId,
            branchId: transfer.toBranchId,
            deletedAt: null,
          },
        });
      }

      // 3. Si no tiene SKU ni barcode, buscar por nombre como fallback (para evitar duplicados)
      if (!toProduct && !fromProduct.sku && !fromProduct.barcode) {
        toProduct = await prisma.salesProduct.findFirst({
          where: {
            name: fromProduct.name,
            organizationId: transfer.organizationId,
            branchId: transfer.toBranchId,
            deletedAt: null,
          },
        });
      }

      // Si no existe el producto en la sucursal destino, crear una copia
      if (!toProduct) {
        logger.info("Creando producto en sucursal destino (completeTransfer)", {
          fromBranchId: transfer.fromBranchId,
          toBranchId: transfer.toBranchId,
          productName: fromProduct.name,
          sku: fromProduct.sku || "sin SKU",
          barcode: fromProduct.barcode || "sin barcode",
        });

        toProduct = await prisma.salesProduct.create({
          data: {
            organizationId: fromProduct.organizationId,
            categoryId: fromProduct.categoryId,
            name: fromProduct.name,
            description: fromProduct.description,
            descriptionTranslations: fromProduct.descriptionTranslations as any,
            brand: fromProduct.brand,
            model: fromProduct.model,
            price: fromProduct.price,
            cost: fromProduct.cost,
            stock: 0,
            minStock: fromProduct.minStock,
            reorderPoint: fromProduct.reorderPoint,
            sku: fromProduct.sku,
            barcode: fromProduct.barcode,
            imageUrl: fromProduct.imageUrl,
            branchId: transfer.toBranchId,
            isActive: fromProduct.isActive,
          },
        });

        logger.info("Producto creado en sucursal destino (completeTransfer)", {
          productId: toProduct.id,
          branchId: transfer.toBranchId,
        });
      } else {
        logger.info(
          "Producto encontrado en sucursal destino (completeTransfer)",
          {
            productId: toProduct.id,
            branchId: transfer.toBranchId,
            currentStock: toProduct.stock,
          }
        );
      }

      // Realizar la transferencia en una transacción
      await prisma.$transaction(async (tx) => {
        // Reducir stock en sucursal origen
        const previousStockFrom = fromProduct.stock;
        const newStockFrom = previousStockFrom - transfer.quantity;

        await tx.salesProduct.update({
          where: { id: fromProduct.id },
          data: { stock: newStockFrom },
        });

        // Registrar movimiento de salida
        await InventoryMovementService.createMovement({
          organizationId: transfer.organizationId,
          productId: transfer.productId,
          branchId: transfer.fromBranchId,
          movementType: InventoryMovementType.TRANSFER_OUT,
          quantity: -transfer.quantity,
          previousStock: previousStockFrom,
          newStock: newStockFrom,
          referenceType: "transfer",
          referenceId: transfer.id,
          notes: `Transferencia a ${transfer.toBranch.name}`,
          userId: completedBySalesUserId,
        });

        // Aumentar stock en sucursal destino
        const previousStockTo = toProduct.stock;
        const newStockTo = previousStockTo + transfer.quantity;

        await tx.salesProduct.update({
          where: { id: toProduct.id },
          data: { stock: newStockTo },
        });

        // Registrar movimiento de entrada
        await InventoryMovementService.createMovement({
          organizationId: transfer.organizationId,
          productId: toProduct.id,
          branchId: transfer.toBranchId,
          movementType: InventoryMovementType.TRANSFER_IN,
          quantity: transfer.quantity,
          previousStock: previousStockTo,
          newStock: newStockTo,
          referenceType: "transfer",
          referenceId: transfer.id,
          notes: `Transferencia desde ${transfer.fromBranch.name}`,
          userId: completedBySalesUserId,
        });

        // Actualizar estado de la transferencia
        await tx.inventoryTransfer.update({
          where: { id: transferId },
          data: {
            status: TransferStatus.completed,
            completedById: completedBySalesUserId,
            completedAt: new Date(),
          },
        });
      });

      const completed = await prisma.inventoryTransfer.findUnique({
        where: { id: transferId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
            },
          },
          fromBranch: {
            select: {
              id: true,
              name: true,
            },
          },
          toBranch: {
            select: {
              id: true,
              name: true,
            },
          },
          completedBy: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      });

      logger.info("Transferencia completada", { transferId });

      return completed;
    } catch (error) {
      logger.error("Error completando transferencia", error as Error, {
        transferId,
      });
      throw error;
    }
  }

  /**
   * Obtener transferencias de una organización
   */
  static async getTransfers(
    organizationId: string,
    options: {
      branchId?: string;
      productId?: string;
      status?: TransferStatus;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      skip?: number;
    } = {}
  ) {
    try {
      const where: any = {
        organizationId,
      };

      if (options.branchId) {
        where.OR = [
          { fromBranchId: options.branchId },
          { toBranchId: options.branchId },
        ];
      }

      if (options.productId) {
        where.productId = options.productId;
      }

      if (options.status) {
        where.status = options.status;
      }

      if (options.startDate || options.endDate) {
        where.createdAt = {};
        if (options.startDate) where.createdAt.gte = options.startDate;
        if (options.endDate) where.createdAt.lte = options.endDate;
      }

      const [transfers, total] = await Promise.all([
        prisma.inventoryTransfer.findMany({
          where,
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
            fromBranch: {
              select: {
                id: true,
                name: true,
              },
            },
            toBranch: {
              select: {
                id: true,
                name: true,
              },
            },
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
            completedBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: options.limit || 50,
          skip: options.skip || 0,
        }),
        prisma.inventoryTransfer.count({ where }),
      ]);

      return {
        transfers,
        total,
        page: Math.floor((options.skip || 0) / (options.limit || 50)) + 1,
        pageSize: options.limit || 50,
        totalPages: Math.ceil(total / (options.limit || 50)),
      };
    } catch (error) {
      logger.error("Error obteniendo transferencias", error as Error, {
        organizationId,
        options,
      });
      throw error;
    }
  }
}
