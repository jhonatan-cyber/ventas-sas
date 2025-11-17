/**
 * Componente para mostrar historial de movimientos de inventario
 */

"use client";

import { format } from "date-fns";
import { ArrowUp, ArrowDown, RefreshCw, Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface InventoryMovement {
  id: string;
  product: {
    id: string;
    name: string;
  };
  branch?: {
    id: string;
    name: string;
  } | null;
  movementType: "IN" | "OUT" | "ADJUSTMENT" | "TRANSFER_IN" | "TRANSFER_OUT";
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceType?: string | null;
  notes?: string | null;
  user: {
    id: string;
    fullName: string;
  };
  createdAt: string;
}

interface InventoryMovementsProps {
  customerSlug: string;
  productId?: string;
  branchId?: string;
}

export function InventoryMovements({
  customerSlug,
  productId,
  branchId,
}: InventoryMovementsProps) {
  const t = useTranslations();
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [movementType, setMovementType] = useState<string>("all");
  const [pageSize, setPageSize] = useState(5);
  // Client-side pagination support (hybrid)
  const CLIENT_THRESHOLD = 2000;
  const [useClientPaging, setUseClientPaging] = useState(false);
  const [allMovements, setAllMovements] = useState<InventoryMovement[]>([]);

  const loadMovements = useCallback(async (targetPage: number, targetPageSize: number) => {
    try {
      setIsLoading(true);
      // Si ya estamos en modo cliente, no deberíamos llegar aquí salvo cambio de filtros.
      // Para decisión inicial: usar página actual; si el total es pequeño, pasaremos a cliente.
      const params = new URLSearchParams({
        page: String(targetPage),
        pageSize: String(targetPageSize),
      });

      if (productId) params.append("productId", productId);
      if (branchId) params.append("branchId", branchId);
      if (movementType !== "all") params.append("movementType", movementType);

      const response = await fetch(
        `/api/${customerSlug}/inventory/movements?${params}`
      );
      const data = await response.json();

      if (data.success) {
        const fetched = (data.movements || []) as InventoryMovement[];
        const fetchedTotal = Number(data.total || fetched.length || 0);
        // Si el total es pequeño, activamos paginación en cliente
        if (fetchedTotal <= CLIENT_THRESHOLD) {
          // Asegurar que tenemos todos los registros en memoria
          let fullData = fetched;
          if (fetched.length < fetchedTotal) {
            const allParams = new URLSearchParams({
              page: "1",
              pageSize: String(fetchedTotal),
            });
            if (productId) allParams.append("productId", productId);
            if (branchId) allParams.append("branchId", branchId);
            if (movementType !== "all") allParams.append("movementType", movementType);
            const allRes = await fetch(`/api/${customerSlug}/inventory/movements?${allParams}`);
            const allJson = await allRes.json();
            if (allJson?.success) {
              fullData = (allJson.movements || []) as InventoryMovement[];
            }
          }
          setUseClientPaging(true);
          setAllMovements(fullData);
          setTotal(fetchedTotal);
          // Derivar página actual
          const start = (targetPage - 1) * targetPageSize;
          const end = start + targetPageSize;
          setMovements(fullData.slice(start, end));
          // Sincronizar page/pageSize visibles con los usados
          if (page !== targetPage) setPage(targetPage);
          if (pageSize !== targetPageSize) setPageSize(targetPageSize);
        } else {
          // Mantener server-side si hay demasiados registros
          setUseClientPaging(false);
          setMovements(fetched);
          setTotal(fetchedTotal);
        }
      }
    } catch (error) {
      console.error("Error cargando movimientos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [customerSlug, productId, branchId, movementType, page, pageSize]);

  // Cargar al montar y cuando cambian filtros clave
  useEffect(() => {
    // Reset paginación cuando cambian filtros
    setPage(1);
    setUseClientPaging(false);
    setAllMovements([]);
    loadMovements(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerSlug, productId, branchId, movementType, pageSize]);

  // Cuando cambia page o pageSize y estamos en client-side, derivar sin solicitar
  useEffect(() => {
    if (!useClientPaging) return;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    setMovements(allMovements.slice(start, end));
  }, [useClientPaging, allMovements, page, pageSize]);

  // Cuando cambia page o pageSize en server-side, solicitar
  useEffect(() => {
    if (useClientPaging) return;
    loadMovements(page, pageSize);
  }, [useClientPaging, page, pageSize, loadMovements]);

  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case "IN":
      case "TRANSFER_IN":
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case "OUT":
      case "TRANSFER_OUT":
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      case "ADJUSTMENT":
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      IN: t("inventory.movements.types.in") || "Entrada",
      OUT: t("inventory.movements.types.out") || "Salida",
      ADJUSTMENT: t("inventory.movements.types.adjustment") || "Ajuste",
      TRANSFER_IN:
        t("inventory.movements.types.transferIn") || "Transferencia Entrada",
      TRANSFER_OUT:
        t("inventory.movements.types.transferOut") || "Transferencia Salida",
    };
    return labels[type] || type;
  };

  const getMovementTypeBadge = (type: string) => {
    switch (type) {
      case "IN":
      case "TRANSFER_IN":
        return "default";
      case "OUT":
      case "TRANSFER_OUT":
        return "destructive";
      case "ADJUSTMENT":
        return "secondary";
      default:
        return "outline";
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {t("inventory.movements.title") || "Historial de Movimientos"}
            </CardTitle>
            <CardDescription>
              {t("inventory.movements.description") ||
                "Registro de todos los movimientos de inventario"}
            </CardDescription>
          </div>
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-600 dark:text-gray-300">
                {t("inventory.movements.type") || "Tipo"}
              </Label>
              <Select value={movementType} onValueChange={setMovementType}>
                <SelectTrigger className="w-[180px] rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("common.all") || "Todos"}
                  </SelectItem>
                  <SelectItem value="IN">
                    {t("inventory.movements.types.in") || "Entradas"}
                  </SelectItem>
                  <SelectItem value="OUT">
                    {t("inventory.movements.types.out") || "Salidas"}
                  </SelectItem>
                  <SelectItem value="ADJUSTMENT">
                    {t("inventory.movements.types.adjustment") || "Ajustes"}
                  </SelectItem>
                  <SelectItem value="TRANSFER_IN">
                    {t("inventory.movements.types.transferIn") ||
                      "Transferencias Entrada"}
                  </SelectItem>
                  <SelectItem value="TRANSFER_OUT">
                    {t("inventory.movements.types.transferOut") ||
                      "Transferencias Salida"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Select de elementos por página (junto al select de tipo) */}
            <div className="space-y-1">
              <Label className="text-xs text-gray-600 dark:text-gray-300">
                {t("common.data") || "Datos"}
              </Label>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px] rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} {t("common.perPage") || "por página"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadMovements(page, pageSize)}
              className="rounded-full"
            >
              {t("action.refresh") || "Actualizar"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border relative">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t("inventory.movements.product") || "Producto"}
                </TableHead>
                <TableHead>
                  {t("inventory.movements.type") || "Tipo"}
                </TableHead>
                <TableHead>
                  {t("inventory.movements.quantity") || "Cantidad"}
                </TableHead>
                <TableHead>
                  {t("inventory.movements.stock") || "Stock"}
                </TableHead>
                <TableHead>
                  {t("inventory.movements.user") || "Usuario"}
                </TableHead>
                <TableHead>
                  {t("inventory.movements.date") || "Fecha"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.length === 0 ? (
                isLoading ? (
                  Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        {t("inventory.movements.noMovements") ||
                          "No hay movimientos registrados"}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              ) : (
                movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {movement.product.name}
                        </div>
                        {movement.branch && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {movement.branch.name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getMovementTypeBadge(movement.movementType)}
                      >
                        <div className="flex items-center gap-1">
                          {getMovementTypeIcon(movement.movementType)}
                          {getMovementTypeLabel(movement.movementType)}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          movement.quantity > 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {movement.quantity > 0 ? "+" : ""}
                        {movement.quantity}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="text-gray-500">
                          {movement.previousStock}
                        </span>
                        <span className="mx-1">→</span>
                        <span className="font-medium">{movement.newStock}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{movement.user.fullName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(movement.createdAt), "dd/MM/yyyy HH:mm")}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-full"
            >
              {t("action.previous") || "Anterior"}
            </Button>
            <div className="text-sm text-gray-500 dark:text-gray-400 px-2">
              {t("pagination.page") || t("common.page") || "Página"} {page}{" "}
              {t("pagination.of") || t("common.of") || "de"} {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-full"
            >
              {t("action.next") || "Siguiente"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
