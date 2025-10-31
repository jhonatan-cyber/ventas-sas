"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Edit,
  Trash2,
  Power,
  PowerOff,
  Package,
  AlertTriangle,
} from "lucide-react";
import { SalesProduct, Category } from "@prisma/client";

// Función para truncar nombre manteniendo el nombre más corto disponible
function truncateProductName(name: string, maxLength: number = 40): string {
  if (name.length <= maxLength) {
    return name;
  }

  // Intentar encontrar un punto de corte más natural (espacio o guion)
  const truncated = name.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  const lastDash = truncated.lastIndexOf("-");
  const lastBreak = Math.max(lastSpace, lastDash);

  if (lastBreak > maxLength * 0.6) {
    // Si hay un punto de corte razonable (al menos 60% del maxLength)
    return truncated.substring(0, lastBreak) + "...";
  }

  return truncated + "...";
}

function truncateText(text: string, maxLength: number = 80): string {
  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  const lastBreak = lastSpace > maxLength * 0.6 ? lastSpace : maxLength;

  return truncated.substring(0, lastBreak).trimEnd() + "...";
}

interface ProductsTableProps {
  products: (SalesProduct & { category: Category | null })[];
  isLoading?: boolean;
  onEditClick?: (product: SalesProduct & { category: Category | null }) => void;
  onDeleteClick?: (
    product: SalesProduct & { category: Category | null }
  ) => void;
  onToggleStatus?: (
    product: SalesProduct & { category: Category | null }
  ) => void;
}

export function ProductsTable({
  products,
  isLoading,
  onEditClick,
  onDeleteClick,
  onToggleStatus,
}: ProductsTableProps) {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        Cargando productos...
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-[#2a2a2a] border-b border-gray-200 dark:border-[#2a2a2a]">
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold w-[80px]">
                Imagen
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                Producto
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                Marca
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                Modelo
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                Descripción
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                Precio Venta
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                Precio Compra
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                Stock
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                Estado
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 font-semibold text-right">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center text-muted-foreground py-12"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      No hay productos registrados
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const isLowStock = product.stock <= product.minStock;
                const truncatedName = truncateProductName(product.name);
                const brand = product.brand?.trim() ?? "";
                const model = product.model?.trim() ?? "";
                const description = product.description?.trim() ?? "";
                const hasDescription = description.length > 0;
                const truncatedDescription = hasDescription
                  ? truncateText(description, 60)
                  : "";
                const shouldShowDescriptionTooltip =
                  hasDescription && truncatedDescription !== description;

                return (
                  <TableRow
                    key={product.id}
                    className="hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors border-b border-gray-100 dark:border-[#2a2a2a]"
                  >
                    <TableCell>
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center relative">
                        {product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              // Si la imagen falla al cargar, reemplazar con icono
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const fallback =
                                target.nextElementSibling as HTMLElement;
                              if (fallback) {
                                fallback.style.display = "flex";
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className="absolute inset-0 flex items-center justify-center w-full h-full"
                          style={{
                            display: product.imageUrl ? "none" : "flex",
                          }}
                        >
                          <Package className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col py-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="font-semibold text-gray-900 dark:text-white cursor-help">
                              {truncatedName}
                            </span>
                          </TooltipTrigger>
                          {product.name.length > 40 && (
                            <TooltipContent>
                              <p className="max-w-xs">{product.name}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                        {product.sku && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            SKU: {product.sku}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {brand || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {model || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {hasDescription ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm text-gray-600 dark:text-gray-400 cursor-help">
                              {truncatedDescription}
                            </span>
                          </TooltipTrigger>
                          {shouldShowDescriptionTooltip && (
                            <TooltipContent>
                              <p className="max-w-xs whitespace-pre-wrap">
                                {description}
                              </p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      ) : (
                        <span className="text-sm text-gray-400 italic">
                          Sin descripción
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        ${Number(product.price).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        ${Number(product.cost).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-semibold ${
                            isLowStock
                              ? "text-red-600 dark:text-red-400"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {product.stock}
                        </span>
                        {isLowStock && (
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              Stock mínimo: {product.minStock}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          product.isActive
                            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800"
                        }
                      >
                        {product.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {onEditClick && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditClick(product)}
                                className="hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar producto</TooltipContent>
                          </Tooltip>
                        )}
                        {onToggleStatus && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onToggleStatus(product)}
                                className={
                                  product.isActive
                                    ? "hover:bg-orange-100 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                                    : "hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                                }
                              >
                                {product.isActive ? (
                                  <PowerOff className="h-4 w-4" />
                                ) : (
                                  <Power className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {product.isActive
                                ? "Desactivar producto"
                                : "Activar producto"}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {onDeleteClick && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteClick(product)}
                                className="hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Eliminar producto</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
