/**
 * Componente para gestionar transferencias entre sucursales
 */

"use client";

import { format } from "date-fns";
import { ArrowRightLeft, Check, X, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";

interface InventoryTransfer {
  id: string;
  product: {
    id: string;
    name: string;
  };
  fromBranch: {
    id: string;
    name: string;
  };
  toBranch: {
    id: string;
    name: string;
  };
  quantity: number;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "in_transit"
    | "completed"
    | "cancelled";
  notes?: string | null;
  requestedBy: {
    id: string;
    fullName: string;
  };
  approvedBy?: {
    id: string;
    fullName: string;
  } | null;
  completedBy?: {
    id: string;
    fullName: string;
  } | null;
  requestedAt: string;
  approvedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

interface InventoryTransfersProps {
  customerSlug: string;
}

export function InventoryTransfers({ customerSlug }: InventoryTransfersProps) {
  const t = useTranslations();
  const [transfers, setTransfers] = useState<InventoryTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] =
    useState<InventoryTransfer | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | "complete">(
    "approve"
  );
  const [actionNotes, setActionNotes] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [userBranchId, setUserBranchId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(20);

  // Estados para crear transferencia
  const [productId, setProductId] = useState("");
  const [fromBranchId, setFromBranchId] = useState("");
  const [toBranchId, setToBranchId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [products, setProducts] = useState<
    Array<{ id: string; name: string; stock: number }>
  >([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [selectedProductStock, setSelectedProductStock] = useState<
    number | null
  >(null);

  // Obtener información del usuario para verificar si es administrador
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userResponse = await fetch(`/api/${customerSlug}/auth/me`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const userRoleName = userData.rol?.nombre?.toLowerCase() || "";
          const isUserAdmin =
            userRoleName.includes("administrador") || userRoleName === "admin";
          setIsAdmin(isUserAdmin);
          setUserBranchId(userData.sucursalId || null);

          // Si no es admin, establecer la sucursal destino automáticamente
          if (!isUserAdmin && userData.sucursalId) {
            setToBranchId(userData.sucursalId);
          }
        }
      } catch (error) {
        console.error("Error al obtener información del usuario:", error);
      }
    };
    fetchUserInfo();
  }, [customerSlug]);

  const loadTransfers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (status !== "all") params.append("status", status);

      const response = await fetch(
        `/api/${customerSlug}/inventory/transfers?${params}`
      );
      const data = await response.json();

      if (data.success) {
        setTransfers(data.transfers || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error("Error cargando transferencias:", error);
    } finally {
      setIsLoading(false);
    }
  }, [customerSlug, page, status, pageSize]);

  const loadBranches = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/${customerSlug}/sucursales?status=active&page=1&pageSize=1000`
      );
      const data = await response.json();
      if (data.branches) {
        setBranches(
          data.branches
            .filter((b: any) => b.id && String(b.id).trim() !== "")
            .map((b: any) => ({ id: b.id, name: b.name }))
        );
      }
    } catch (error) {
      console.error("Error cargando sucursales:", error);
    }
  }, [customerSlug]);

  useEffect(() => {
    loadTransfers();
    loadBranches();
  }, [loadTransfers, loadBranches]);

  const loadProducts = async (branchId: string) => {
    try {
      const response = await fetch(
        `/api/${customerSlug}/productos?branchId=${branchId}&page=1&pageSize=1000`
      );
      const data = await response.json();
      if (data.products) {
        setProducts(
          data.products
            .filter((p: any) => p.id && String(p.id).trim() !== "")
            .map((p: any) => ({
              id: p.id,
              name: p.name,
              stock: p.stock || 0,
            }))
        );
      }
    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  };

  const handleCreateTransfer = async () => {
    if (!productId || !fromBranchId || !toBranchId || !quantity) {
      toast.error(
        t("inventory.transfers.fillAllFields") || "Completa todos los campos"
      );
      return;
    }

    if (fromBranchId === toBranchId) {
      toast.error(
        t("inventory.transfers.differentBranches") ||
          "Las sucursales deben ser diferentes"
      );
      return;
    }

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast.error(
        t("inventory.transfers.invalidQuantity") ||
          "La cantidad debe ser un número mayor a 0"
      );
      return;
    }

    // Validar que la cantidad no exceda el stock disponible
    if (selectedProductStock !== null && quantityNum > selectedProductStock) {
      toast.error(
        t("inventory.transfers.insufficientStock") ||
          `Stock insuficiente. Stock disponible: ${selectedProductStock}, solicitado: ${quantityNum}`
      );
      return;
    }

    try {
      const response = await fetch(`/api/${customerSlug}/inventory/transfers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          fromBranchId,
          toBranchId,
          quantity: quantityNum,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Si la respuesta no es OK, mostrar el error del backend
        const errorMessage =
          data.error ||
          data.message ||
          t("inventory.transfers.error") ||
          "Error al crear transferencia";
        toast.error(errorMessage);
        return;
      }

      if (data.success) {
        toast.success(
          t("inventory.transfers.created") || "Transferencia creada"
        );
        setIsCreateDialogOpen(false);
        setProductId("");
        setFromBranchId("");
        // Si no es admin, mantener la sucursal destino del usuario, si no, resetear
        if (!isAdmin && userBranchId) {
          setToBranchId(userBranchId);
        } else {
          setToBranchId("");
        }
        setQuantity("");
        setNotes("");
        setSelectedProductStock(null);
        loadTransfers();
      } else {
        toast.error(
          data.error ||
            t("inventory.transfers.error") ||
            "Error al crear transferencia"
        );
      }
    } catch (error) {
      console.error("Error creando transferencia:", error);
      toast.error(
        t("inventory.transfers.error") || "Error al crear transferencia"
      );
    }
  };

  const handleAction = async () => {
    if (!selectedTransfer) return;

    try {
      const response = await fetch(
        `/api/${customerSlug}/inventory/transfers/${selectedTransfer.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            notes: actionNotes || undefined,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(
          action === "approve"
            ? t("inventory.transfers.approved") || "Transferencia aprobada"
            : action === "reject"
            ? t("inventory.transfers.rejected") || "Transferencia rechazada"
            : t("inventory.transfers.completed") || "Transferencia completada"
        );
        setIsActionDialogOpen(false);
        setSelectedTransfer(null);
        setActionNotes("");
        loadTransfers();
      } else {
        toast.error(
          data.error ||
            t("inventory.transfers.error") ||
            "Error al procesar transferencia"
        );
      }
    } catch {
      toast.error(
        t("inventory.transfers.error") || "Error al procesar transferencia"
      );
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { variant: any; label: string }> = {
      pending: {
        variant: "secondary",
        label: t("inventory.transfers.status.pending") || "Pendiente",
      },
      approved: {
        variant: "default",
        label: t("inventory.transfers.status.approved") || "Aprobada",
      },
      rejected: {
        variant: "destructive",
        label: t("inventory.transfers.status.rejected") || "Rechazada",
      },
      in_transit: {
        variant: "outline",
        label: t("inventory.transfers.status.inTransit") || "En tránsito",
      },
      completed: {
        variant: "default",
        label: t("inventory.transfers.status.completed") || "Completada",
      },
      cancelled: {
        variant: "outline",
        label: t("inventory.transfers.status.cancelled") || "Cancelada",
      },
    };
    return badges[status] || { variant: "outline", label: status };
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                {t("inventory.transfers.title") ||
                  "Transferencias entre Sucursales"}
              </CardTitle>
              <CardDescription>
                {t("inventory.transfers.description") ||
                  "Gestiona transferencias de productos entre sucursales"}
              </CardDescription>
            </div>
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-gray-600 dark:text-gray-300">
                  {t("inventory.transfers.statusHeader") ||
                    t("inventory.transfers.status") ||
                    "Estado"}
                </Label>
                <Select
                  value={status}
                  onValueChange={(v) => {
                    setStatus(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[150px] rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("common.all") || "Todos"}
                    </SelectItem>
                    <SelectItem value="pending">
                      {t("inventory.transfers.status.pending") || "Pendientes"}
                    </SelectItem>
                    <SelectItem value="approved">
                      {t("inventory.transfers.status.approved") || "Aprobadas"}
                    </SelectItem>
                    <SelectItem value="completed">
                      {t("inventory.transfers.status.completed") ||
                        "Completadas"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                onClick={() => setIsCreateDialogOpen(true)}
                className="rounded-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("inventory.transfers.new") || "Nueva Transferencia"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : transfers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {t("inventory.transfers.noTransfers") ||
                "No hay transferencias registradas"}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {t("inventory.transfers.product") || "Producto"}
                      </TableHead>
                      <TableHead>
                        {t("inventory.transfers.from") || "Desde"}
                      </TableHead>
                      <TableHead>
                        {t("inventory.transfers.to") || "Hacia"}
                      </TableHead>
                      <TableHead>
                        {t("inventory.transfers.quantity") || "Cantidad"}
                      </TableHead>
                      <TableHead>
                        {t("inventory.transfers.statusHeader") || "Estado"}
                      </TableHead>
                      <TableHead>
                        {t("inventory.transfers.requestedBy") ||
                          "Solicitado por"}
                      </TableHead>
                      <TableHead>
                        {t("inventory.transfers.date") || "Fecha"}
                      </TableHead>
                      <TableHead>{t("action.actions") || "Acciones"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfers.map((transfer) => {
                      const statusBadge = getStatusBadge(transfer.status);
                      return (
                        <TableRow key={transfer.id}>
                          <TableCell className="font-medium">
                            {transfer.product.name}
                          </TableCell>
                          <TableCell>{transfer.fromBranch.name}</TableCell>
                          <TableCell>{transfer.toBranch.name}</TableCell>
                          <TableCell>{transfer.quantity}</TableCell>
                          <TableCell>
                            <Badge variant={statusBadge.variant}>
                              {statusBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{transfer.requestedBy.fullName}</TableCell>
                          <TableCell>
                            {format(new Date(transfer.createdAt), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {transfer.status === "pending" && isAdmin && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedTransfer(transfer);
                                      setAction("approve");
                                      setIsActionDialogOpen(true);
                                    }}
                                    className="rounded-full"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedTransfer(transfer);
                                      setAction("reject");
                                      setIsActionDialogOpen(true);
                                    }}
                                    className="rounded-full"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {(transfer.status === "approved" ||
                                transfer.status === "in_transit") &&
                                isAdmin && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedTransfer(transfer);
                                      setAction("complete");
                                      setIsActionDialogOpen(true);
                                    }}
                                    className="rounded-full"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {(() => {
                const totalPages = Math.ceil(total / pageSize);
                return (
                  totalPages > 1 && (
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
                        {t("pagination.page") || t("common.page") || "Página"}{" "}
                        {page} {t("pagination.of") || t("common.of") || "de"}{" "}
                        {totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page === totalPages}
                        className="rounded-full"
                      >
                        {t("action.next") || "Siguiente"}
                      </Button>
                    </div>
                  )
                );
              })()}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear transferencia */}
      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            // Resetear valores al cerrar
            setProductId("");
            setFromBranchId("");
            // Si no es admin, mantener la sucursal destino del usuario, si no, resetear
            if (!isAdmin && userBranchId) {
              setToBranchId(userBranchId);
            } else {
              setToBranchId("");
            }
            setQuantity("");
            setNotes("");
            setSelectedProductStock(null);
          } else {
            // Si no es admin, establecer la sucursal destino automáticamente al abrir
            if (!isAdmin && userBranchId) {
              setToBranchId(userBranchId);
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] flex flex-col overflow-hidden p-0 rounded-2xl">
          {/* Header estático */}
          <div className="px-6 py-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky top-0 z-10">
            <DialogHeader className="px-0 py-0 space-y-2">
              <DialogTitle>
                {t("inventory.transfers.new") || "Nueva Transferencia"}
              </DialogTitle>
              <DialogDescription>
                {t("inventory.transfers.createDescription") ||
                  "Crea una nueva transferencia de productos entre sucursales"}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex flex-col flex-1 min-h-0">
            {/* Contenido con scroll */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gray-50/60 dark:bg-[#0c0c0c]">
              {/* Fila 1: Sucursal Origen y Producto */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {t("inventory.transfers.fromBranch") || "Sucursal Origen"}
                  </Label>
                  <Select
                    value={fromBranchId}
                    onValueChange={(value) => {
                      setFromBranchId(value);
                      setProductId("");
                      setSelectedProductStock(null);
                      loadProducts(value);
                    }}
                  >
                    <SelectTrigger className="w-full rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
                      <SelectValue
                        placeholder={
                          t("inventory.transfers.selectFromBranch") ||
                          "Seleccionar sucursal origen"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {t("inventory.transfers.product") || "Producto"}
                  </Label>
                  <Select
                    value={productId}
                    onValueChange={(value) => {
                      setProductId(value);
                      const selectedProduct = products.find(
                        (p) => p.id === value
                      );
                      setSelectedProductStock(selectedProduct?.stock ?? null);
                    }}
                    disabled={!fromBranchId}
                  >
                    <SelectTrigger className="w-full rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
                      <SelectValue
                        placeholder={
                          t("inventory.transfers.selectProduct") ||
                          "Seleccionar producto"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedProductStock !== null && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {t("inventory.alerts.currentStock") || "Stock actual"}:{" "}
                      <strong>{selectedProductStock}</strong>
                    </p>
                  )}
                </div>
              </div>

              {/* Fila 2: Sucursal Destino y Cantidad */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {t("inventory.transfers.toBranch") || "Sucursal Destino"}
                  </Label>
                  {isAdmin ? (
                    <Select value={toBranchId} onValueChange={setToBranchId}>
                      <SelectTrigger className="w-full rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
                        <SelectValue
                          placeholder={
                            t("inventory.transfers.selectToBranch") ||
                            "Seleccionar sucursal destino"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {branches
                          .filter((b) => b.id !== fromBranchId)
                          .map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="w-full px-3 py-2 rounded-full bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300">
                      {branches.find((b) => b.id === toBranchId)?.name ||
                        t("inventory.transfers.selectToBranch") ||
                        "Seleccionar sucursal destino"}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {t("inventory.transfers.quantity") || "Cantidad"}
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max={selectedProductStock ?? undefined}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]"
                  />
                  {selectedProductStock !== null && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t("inventory.transfers.maxQuantity") ||
                        "Máximo disponible"}
                      : {selectedProductStock}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {t("common.notes") || "Notas"}
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    t("inventory.transfers.notesPlaceholder") ||
                    "Notas opcionales..."
                  }
                  className="rounded-2xl bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]"
                  rows={3}
                />
              </div>
            </div>

            {/* Footer estático */}
            <DialogFooter className="flex w-full flex-col sm:flex-row sm:justify-center items-center gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4 bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky bottom-0 z-10">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto rounded-full"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                {t("action.cancel") || "Cancelar"}
              </Button>
              <Button
                type="button"
                onClick={handleCreateTransfer}
                className="w-full sm:w-auto rounded-full"
              >
                {t("action.create") || "Crear"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para acciones */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>
              {action === "approve"
                ? t("inventory.transfers.approveTitle") ||
                  "Aprobar Transferencia"
                : action === "reject"
                ? t("inventory.transfers.rejectTitle") ||
                  "Rechazar Transferencia"
                : t("inventory.transfers.completeTitle") ||
                  "Completar Transferencia"}
            </DialogTitle>
            <DialogDescription>
              {action === "approve"
                ? t("inventory.transfers.approveDescription") ||
                  "¿Estás seguro de aprobar esta transferencia?"
                : action === "reject"
                ? t("inventory.transfers.rejectDescription") ||
                  "¿Estás seguro de rechazar esta transferencia?"
                : t("inventory.transfers.completeDescription") ||
                  "¿Estás seguro de completar esta transferencia? El stock se moverá entre sucursales."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTransfer && (
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-sm">
                  <div>
                    <strong>
                      {t("inventory.transfers.product") || "Producto"}:
                    </strong>{" "}
                    {selectedTransfer.product.name}
                  </div>
                  <div>
                    <strong>{t("inventory.transfers.from") || "Desde"}:</strong>{" "}
                    {selectedTransfer.fromBranch.name}
                  </div>
                  <div>
                    <strong>{t("inventory.transfers.to") || "Hacia"}:</strong>{" "}
                    {selectedTransfer.toBranch.name}
                  </div>
                  <div>
                    <strong>
                      {t("inventory.transfers.quantity") || "Cantidad"}:
                    </strong>{" "}
                    {selectedTransfer.quantity}
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>{t("common.notes") || "Notas"}</Label>
              <Textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder={
                  t("inventory.transfers.actionNotesPlaceholder") ||
                  "Notas opcionales..."
                }
                className="rounded-2xl"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsActionDialogOpen(false)}
              className="rounded-full"
            >
              {t("action.cancel") || "Cancelar"}
            </Button>
            <Button onClick={handleAction} className="rounded-full">
              {action === "approve"
                ? t("action.approve") || "Aprobar"
                : action === "reject"
                ? t("action.reject") || "Rechazar"
                : t("action.complete") || "Completar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
