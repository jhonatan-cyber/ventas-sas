"use client";

import {
  Edit,
  Trash2,
  Power,
  PowerOff,
  Package,
  Building2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

// Función para truncar texto por palabras
function truncateByWords(text: string, maxWords: number = 6): string {
  if (!text) return "";

  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return text;
  }

  return words.slice(0, maxWords).join(" ") + "...";
}

interface ProductWithRelations {
  id: string;
  name: string;
  brand?: string | null;
  model?: string | null;
  description?: string | null;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  sku?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  category: { name: string } | null;
  branch: { name: string } | null;
}

interface ProductsTableProps {
  products: ProductWithRelations[];
  isLoading?: boolean;
  showBranchColumn?: boolean;
  onEditClick?: (product: ProductWithRelations) => void;
  onDeleteClick?: (product: ProductWithRelations) => void;
  onToggleStatus?: (product: ProductWithRelations) => void;
}

export function ProductsTable({
  products,
  isLoading,
  showBranchColumn = false,
  onEditClick,
  onDeleteClick,
  onToggleStatus,
}: ProductsTableProps) {
  if (isLoading) {
    return (
      <TableSkeleton
        columns={showBranchColumn ? 11 : 10}
        rows={5}
        showActions={true}
      />
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
              {showBranchColumn && (
                <TableHead className="text-gray-700 dark:text-gray-300 font-semibold">
                  Sucursal
                </TableHead>
              )}
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
                  colSpan={showBranchColumn ? 11 : 10}
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
                  ? truncateByWords(description, 6)
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
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {product.stock}
                        </span>
                        {product.stock === 0 ? (
                          <Badge className="rounded-full bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-300 border border-red-500/40 px-2 py-1 text-[11px] uppercase tracking-wide">
                            Agotado
                          </Badge>
                        ) : isLowStock ? (
                          <Badge className="rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/40 px-2 py-1 text-[11px] uppercase tracking-wide">
                            Unidades
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    {showBranchColumn && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {product.branch?.name || "-"}
                          </span>
                        </div>
                      </TableCell>
                    )}
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
