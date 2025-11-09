"use client";

import { BrowserMultiFormatReader } from "@zxing/library";
import { Plus, Trash2, QrCode } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { SalesQuotationWithRelations } from "./types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";

const paymentOptions = [
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "transfer", label: "Transferencia" },
  { value: "qr", label: "QR / Billetera" },
];

interface ProductOption {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface LineItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  codes: string[];
}

const generateTempId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const EMPTY_PRODUCT_VALUE = "__none__";

const formatDate = (value?: string | Date | null) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatCurrency = (value: unknown) =>
  Number(value ?? 0).toLocaleString("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

interface QuotationConvertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation?: SalesQuotationWithRelations;
  onConfirm: (payload: {
    paymentMethod: string;
    notes?: string | null;
    items: Array<{
      productId: string;
      productName?: string | null;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>;
    discount: number;
  }) => void | Promise<void>;
  isSubmitting?: boolean;
  customerSlug: string;
  isAdmin?: boolean;
  selectedBranchId?: string | null;
  userBranchId?: string | null;
}

export function QuotationConvertDialog({
  open,
  onOpenChange,
  quotation,
  onConfirm,
  isSubmitting = false,
  customerSlug,
  isAdmin = false,
  selectedBranchId,
  userBranchId,
}: QuotationConvertDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [notes, setNotes] = useState<string>("");
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [items, setItems] = useState<LineItem[]>([]);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [codeInputs, setCodeInputs] = useState<Record<string, string>>({});
  const [isScanning, setIsScanning] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastScannedCodeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPaymentMethod("cash");
    setNotes(quotation?.notes ?? "");
    setDiscountValue(Number(quotation?.discount ?? 0));

    const initialItems: LineItem[] = (quotation?.items ?? []).map((item) => {
      const quantity = Number(item.quantity ?? 1) || 1;
      const unitPrice = Number(item.unitPrice ?? item.product?.price ?? 0);
      const initialProductId = item.productId ?? EMPTY_PRODUCT_VALUE;
      const rawTrackingCodes = (item as any)?.trackingCodes;
      return {
        id: generateTempId(),
        productId: initialProductId,
        productName: item.product?.name ?? item.productName ?? "",
        quantity,
        unitPrice,
        codes:
          initialProductId === EMPTY_PRODUCT_VALUE
            ? []
            : Array.isArray(rawTrackingCodes)
                ? (rawTrackingCodes as unknown[])
                    .filter((code): code is string => typeof code === "string")
                    .map((code) => code.trim())
                    .filter((code) => code.length > 0)
                : [],
      };
    });

    setItems(initialItems);
    const inputState: Record<string, string> = {};
    initialItems.forEach((item) => {
      inputState[item.id] = "";
    });
    setCodeInputs(inputState);
  }, [open, quotation]);

  const loadProducts = useCallback(
    async (branchId?: string | null) => {
      setIsLoadingProducts(true);
      try {
        const branchQuery = branchId ? `&branchId=${branchId}` : "";
        const response = await fetch(
          `/api/${customerSlug}/productos?page=1&pageSize=1000${branchQuery}`
        );
        if (!response.ok) return;
        const data = await response.json();
        const options: ProductOption[] = (data.products || []).map(
          (product: any) => ({
            id: product.id,
            name: product.name ?? "Producto sin nombre",
            price: Number(product.price ?? 0),
            stock: Number(product.stock ?? 0),
          })
        );
        setProducts(options);
      } catch (error) {
        console.error("Error al cargar productos:", error);
      } finally {
        setIsLoadingProducts(false);
      }
    },
    [customerSlug]
  );

  useEffect(() => {
    if (!open || products.length === 0) return;
    setItems((prev) =>
      prev.map((item) => {
        if (
          item.productId === EMPTY_PRODUCT_VALUE ||
          (item.productName && item.productName.length > 0)
        ) {
          return item;
        }
        const product = products.find((prod) => prod.id === item.productId);
        if (!product) return item;
        const unitPrice = item.unitPrice > 0 ? item.unitPrice : product.price;
        return {
          ...item,
          productName: product?.name ?? "",
          unitPrice,
          codes: product ? item.codes : [],
        };
      })
    );
  }, [open, products]);

  useEffect(() => {
    if (!open) return;

    const initialBranch = isAdmin
      ? selectedBranchId ?? null
      : userBranchId ?? null;

    loadProducts(initialBranch);

  }, [open, customerSlug, isAdmin, selectedBranchId, userBranchId, loadProducts]);

  useEffect(() => {
    if (!open || !isAdmin) return;
    const branchToLoad = selectedBranchId ?? null;
    loadProducts(branchToLoad);
  }, [open, isAdmin, selectedBranchId]);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        if (item.productId === EMPTY_PRODUCT_VALUE) return sum;
        return sum + item.quantity * item.unitPrice;
      }, 0),
    [items]
  );

  const validItems = useMemo(
    () => items.filter((item) => item.productId !== EMPTY_PRODUCT_VALUE),
    [items]
  );

  const rawTotal = subtotal - discountValue;
  const total = rawTotal >= 0 ? rawTotal : 0;

  const hasMissingProducts = items.some(
    (item) => item.productId === EMPTY_PRODUCT_VALUE
  );
  const hasInvalidValues = items.some(
    (item) => item.quantity <= 0 || item.unitPrice < 0
  );
  const hasInvalidCodes = items.some(
    (item) => item.codes.length > 0 && item.codes.length !== item.quantity
  );
  const alreadyConverted = quotation?.status === "converted";
  const statusLabel = useMemo(() => {
    const raw = quotation?.status ?? "";
    if (raw === "converted") return "Vendida";
    if (raw === "active") return "Activa";
    if (raw === "expired") return "Vencida";
    return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "";
  }, [quotation?.status]);

  const statusBadgeClass = useMemo(() => {
    switch (quotation?.status) {
      case "converted":
        return "bg-purple-600 text-white dark:bg-purple-400 dark:text-black";
      case "active":
        return "bg-emerald-500 text-white dark:bg-emerald-400 dark:text-black";
      case "expired":
        return "bg-red-500 text-white dark:bg-red-400 dark:text-black";
      default:
        return "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900";
    }
  }, [quotation?.status]);

  const disableConfirm =
    isSubmitting ||
    alreadyConverted ||
    validItems.length === 0 ||
    hasMissingProducts ||
    hasInvalidValues ||
    hasInvalidCodes ||
    rawTotal < 0;

  const conversionWarning = useMemo(() => {
    if (alreadyConverted) return "Esta cotización ya fue convertida en venta.";
    if (validItems.length === 0)
      return "Agrega al menos un producto antes de convertir la cotización.";
    if (hasMissingProducts)
      return "Todos los productos deben estar asociados a un producto del catálogo para convertir la cotización.";
    if (hasInvalidValues)
      return "Verifica las cantidades y los precios de cada producto.";
    if (hasInvalidCodes)
      return "La cantidad de códigos debe coincidir con las unidades vendidas en cada producto.";
    if (rawTotal < 0)
      return "El total no puede ser negativo. Ajusta el descuento.";
    return null;
  }, [
    alreadyConverted,
    validItems.length,
    hasMissingProducts,
    hasInvalidValues,
    rawTotal,
  ]);

  const handleAddItem = useCallback(() => {
    const id = generateTempId();
    setItems((prev) => [
      ...prev,
      {
        id,
        productId: EMPTY_PRODUCT_VALUE,
        productName: "",
        quantity: 1,
        unitPrice: 0,
        codes: [],
      },
    ]);
    setCodeInputs((prev) => ({ ...prev, [id]: "" }));
  }, [products]);

  const handleRemoveItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    setCodeInputs((prev) => {
      const clone = { ...prev };
      delete clone[itemId];
      return clone;
    });
  }, []);

  const handleProductChange = useCallback(
    (itemId: string, productId: string) => {
      const product = products.find((prod) => prod.id === productId);
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                productId: product ? product.id : EMPTY_PRODUCT_VALUE,
                productName: product?.name ?? "",
                unitPrice: product?.price ?? 0,
                codes: product ? item.codes : [],
              }
            : item
        )
      );
      if (!product) {
        setCodeInputs((prev) => ({ ...prev, [itemId]: "" }));
      }
    },
    [products]
  );

  const handleQuantityChange = useCallback(
    (itemId: string, quantity: number) => {
      const normalized = Number.isFinite(quantity) ? quantity : 0;
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, quantity: Math.max(0, normalized) }
            : item
        )
      );
    },
    []
  );

  const handleUnitPriceChange = useCallback(
    (itemId: string, unitPrice: number) => {
      const normalized = Number.isFinite(unitPrice) ? unitPrice : 0;
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, unitPrice: Math.max(0, normalized) }
            : item
        )
      );
    },
    []
  );

  const stopScanning = useCallback(() => {
    readerRef.current?.reset();
    setIsScanning(false);
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
    }
    setVideoStream(null);
    lastScannedCodeRef.current = null;
  }, [readerRef, videoStream]);

  const addCodeToItem = useCallback((itemId: string, value: string) => {
    const code = value.trim();
    if (!code) return;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        if (item.codes.includes(code)) {
          toast.info("Este código ya fue agregado");
          return item;
        }
        if (item.codes.length >= item.quantity) {
          toast.error(
            "La cantidad de códigos no puede superar la cantidad vendida"
          );
          return item;
        }
        return {
          ...item,
          codes: [...item.codes, code],
        };
      })
    );
    setCodeInputs((prev) => ({ ...prev, [itemId]: "" }));
  }, []);

  const removeCodeFromItem = useCallback((itemId: string, code: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              codes: item.codes.filter((existing) => existing !== code),
            }
          : item
      )
    );
  }, []);

  const handleManualCodeAdd = useCallback(
    (itemId: string) => {
      const value = codeInputs[itemId] ?? "";
      addCodeToItem(itemId, value);
    },
    [addCodeToItem, codeInputs]
  );

  const canAddCodes = useCallback(
    (item: LineItem) =>
      item.productId !== EMPTY_PRODUCT_VALUE &&
      item.quantity > 0 &&
      item.codes.length < item.quantity,
    []
  );

  const startScanning = useCallback(
    async (itemId: string) => {
      const targetItem = items.find((item) => item.id === itemId);
      if (!targetItem || !canAddCodes(targetItem)) return;
      try {
        stopScanning();
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        readerRef.current = reader;
        setIsScanning(true);
        setVideoStream(stream);
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.setAttribute("muted", "true");
          await videoRef.current.play();
        }
        lastScannedCodeRef.current = null;
        reader.decodeFromVideoDevice(
          null,
          videoRef.current as HTMLVideoElement,
          (result, err) => {
            if (result) {
              const code = result.getText();
              if (lastScannedCodeRef.current === code) return;
              lastScannedCodeRef.current = code;
              addCodeToItem(itemId, code);
              toast.success("Código escaneado");
              stopScanning();
            }
            if (err && !(err as any).closed) {
              // Silenciar errores de lectura
            }
          }
        );
      } catch (error) {
        console.error("Error al acceder a la cámara", error);
        toast.error("No se pudo acceder a la cámara");
        stopScanning();
      }
    },
    [
      addCodeToItem,
      canAddCodes,
      items,
      lastScannedCodeRef,
      readerRef,
      stopScanning,
    ]
  );

  useEffect(() => {
    if (!open) {
      stopScanning();
    }
  }, [open, stopScanning]);

  const handleDiscountChange = (value: number) => {
    if (!Number.isFinite(value) || value < 0) {
      setDiscountValue(0);
      return;
    }
    setDiscountValue(value);
  };

  const handleConfirm = () => {
    if (disableConfirm) return;
    const saleItems = validItems.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.quantity * item.unitPrice,
      trackingCodes: item.codes,
    }));

    if (saleItems.length === 0) return;

    void onConfirm({
      paymentMethod,
      notes: notes.trim().length > 0 ? notes.trim() : null,
      items: saleItems,
      discount: discountValue,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-[#111111]/95 backdrop-blur">
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            Convertir cotización a venta
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
            Revisa los datos de la cotización y selecciona el método de pago
            para generar la venta.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-gray-50/60 dark:bg-[#0c0c0c]">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 dark:border-[#2a2a2a] p-4 bg-gray-50 dark:bg-[#111]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase text-gray-500 dark:text-gray-400">
                      Cotización
                    </p>
                    {statusLabel && (
                      <Badge
                        className={`rounded-full text-xs  ${statusBadgeClass}`}
                      >
                        {statusLabel}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                    {quotation?.quotationNumber ?? "--"}
                  </p>
                  <div className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <p>Emitida: {formatDate(quotation?.createdAt)}</p>
                    <p>Vence: {formatDate(quotation?.expiresAt)}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-[#2a2a2a] p-4 bg-gray-50 dark:bg-[#111]">
                  <p className="text-xs uppercase text-gray-500 dark:text-gray-400">
                    Cliente
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                    {(() => {
                      if (!quotation) return "--";
                      const fullName = `${quotation.customer?.name ?? ""} ${
                        quotation.customer?.lastName ?? ""
                      }`.trim();
                      return (
                        fullName ||
                        quotation.customerName ||
                        "Cliente sin registrar"
                      );
                    })()}
                  </p>
                  <div className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                    {quotation?.customerPhone && (
                      <p>Teléfono: {quotation.customerPhone}</p>
                    )}
                    {quotation?.customer?.email && (
                      <p>Correo: {quotation.customer.email}</p>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-200 dark:border-[#2a2a2a] p-4 bg-gray-50 dark:bg-[#111]">
                  <p className="text-xs uppercase text-gray-500 dark:text-gray-400">
                    Sucursal
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                    {quotation?.branch?.name ?? "Sin sucursal"}
                  </p>
                  {quotation?.branch?.address && (
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      {quotation.branch.address}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {items.length > 0 ? (
                  <div className="space-y-3">
                    {items.map((item, index) => {
                      const subtotalItem = item.quantity * item.unitPrice;
                      return (
                        <div
                          key={item.id}
                          className="rounded-3xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0d0d0d] p-4 space-y-3"
                        >
                          <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_auto]">
                            <div className="space-y-2">
                              <Label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                Producto {index + 1}
                              </Label>
                              <Select
                                value={
                                  item.productId === EMPTY_PRODUCT_VALUE
                                    ? EMPTY_PRODUCT_VALUE
                                    : item.productId
                                }
                                onValueChange={(value) =>
                                  handleProductChange(item.id, value)
                                }
                                disabled={isLoadingProducts}
                              >
                                <SelectTrigger className="rounded-2xl">
                                  <SelectValue
                                    placeholder={
                                      item.productName ||
                                      "Selecciona un producto"
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                  <SelectItem value={EMPTY_PRODUCT_VALUE}>
                                    Selecciona un producto
                                  </SelectItem>
                                  {products.map((product) => (
                                    <SelectItem
                                      key={product.id}
                                      value={product.id}
                                    >
                                      {product.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                Cantidad
                              </Label>
                              <Input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(event) =>
                                  handleQuantityChange(
                                    item.id,
                                    Number(event.target.value)
                                  )
                                }
                                className={`rounded-2xl ${(() => {
                                  const product = products.find((prod) => prod.id === item.productId)
                                  return product && item.quantity > product.stock ? 'border border-red-500 text-red-600' : ''
                                })()}`}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                Precio U.
                              </Label>
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(event) =>
                                  handleUnitPriceChange(
                                    item.id,
                                    Number(event.target.value)
                                  )
                                }
                                className="rounded-2xl"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                Subtotal
                              </Label>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="text"
                                  readOnly
                                  value={formatCurrency(subtotalItem)}
                                  className="w-24 rounded-2xl bg-gray-100 dark:bg-[#1a1a1a] text-right font-semibold"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="rounded-full text-red-500 hover:bg-red-500/10"
                                  onClick={() => handleRemoveItem(item.id)}
                                  disabled={items.length === 1}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-3 md:grid-cols-[1.5fr_auto] md:items-end">
                            <div className="space-y-2">
                              <Label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                Códigos únicos
                              </Label>
                              <Input
                                placeholder="Código de barras o serie"
                                value={codeInputs[item.id] ?? ""}
                                onChange={(event) =>
                                  setCodeInputs((prev) => ({
                                    ...prev,
                                    [item.id]: event.target.value,
                                  }))
                                }
                                className="rounded-2xl"
                                disabled={!canAddCodes(item)}
                              />
                            </div>
                            <div className="flex flex-wrap items-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                className="rounded-full"
                                onClick={() => handleManualCodeAdd(item.id)}
                                disabled={!canAddCodes(item)}
                              >
                                Agregar
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className="rounded-full"
                                onClick={() => startScanning(item.id)}
                                disabled={!canAddCodes(item)}
                              >
                                <QrCode className="h-4 w-4" />
                                Escanear
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {item.codes.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {item.codes.map((code) => (
                                  <span
                                    key={`${item.id}-${code}`}
                                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0d0d0d] px-3 py-1 text-xs text-gray-600 dark:text-gray-300"
                                  >
                                    #{code}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeCodeFromItem(item.id, code)
                                      }
                                      className="ml-1 text-gray-500 hover:text-rose-500 dark:text-gray-400 dark:hover:text-rose-400"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.codes.length === 0 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Sin códigos registrados.
                              </p>
                            )}
                            {item.codes.length > 0 &&
                              item.codes.length < item.quantity && (
                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                  Faltan {item.quantity - item.codes.length}{" "}
                                  códigos para coincidir con la cantidad
                                  vendida.
                                </p>
                              )}
                            {item.codes.length >= item.quantity &&
                              item.quantity > 0 && (
                                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                  Códigos completos para este producto.
                                </p>
                              )}
                            {(() => {
                              const product = products.find((prod) => prod.id === item.productId)
                              if (product && item.quantity > product.stock) {
                                return (
                                  <p className="text-xs text-red-500">
                                    Stock disponible: {product.stock}
                                  </p>
                                )
                              }
                              if (product) {
                                return (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Stock disponible: {product.stock}
                                  </p>
                                )
                              }
                              return null
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No hay productos registrados. Agrega al menos uno para
                    continuar.
                  </p>
                )}
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={handleAddItem}
                    disabled={isLoadingProducts || products.length === 0}
                  >
                    <Plus className="h-4 w-4" />
                    Agregar producto
                  </Button>
                </div>
              </div>

              {!!quotation?.notes && (
                <div className="space-y-2">
                  <Label>Notas de la cotización</Label>
                  <div className="rounded-2xl border border-dashed border-gray-300 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#111] px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {quotation.notes}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#111] p-5">
              <p className="text-xs uppercase text-gray-500 dark:text-gray-400">
                Resumen
              </p>
              <div className="mt-4 space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
                  <div className="space-y-2 md:flex-1">
                    <Label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Subtotal
                    </Label>
                    <Input
                      type="text"
                      readOnly
                      value={formatCurrency(subtotal)}
                      className="w-full rounded-2xl bg-gray-100 dark:bg-[#1a1a1a] text-left font-semibold"
                    />
                  </div>
                  <div className="space-y-2 md:flex-1">
                    <Label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Descuento
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={discountValue}
                      onChange={(event) =>
                        handleDiscountChange(Number(event.target.value))
                      }
                      className="w-full rounded-2xl"
                    />
                  </div>
                  <div className="space-y-2 md:flex-1">
                    <Label
                      htmlFor="quotation-payment-method"
                      className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400"
                    >
                      Método de pago
                    </Label>
                    <Select
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                      disabled={alreadyConverted}
                    >
                      <SelectTrigger
                        id="quotation-payment-method"
                        className="w-full rounded-2xl"
                      >
                        <SelectValue placeholder="Selecciona el método de pago" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-black dark:bg-white px-4 py-3 text-sm text-white dark:text-black">
                  <span>Total</span>
                  <span className="text-lg font-semibold">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quotation-convert-notes">
                Notas para la venta
              </Label>
              <Textarea
                id="quotation-convert-notes"
                placeholder="Notas adicionales para la venta (opcional)"
                className="h-28 w-full rounded-2xl"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {conversionWarning && (
              <div className="rounded-xl border border-amber-400/40 bg-amber-50/80 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                {conversionWarning}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex w-full flex-col sm:flex-row sm:items-center sm:justify-center gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4 bg-white/95 dark:bg-[#111111]/95 backdrop-blur">
          <Button
            variant="outline"
            className="w-full sm:w-auto rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:text-gray-200 dark:hover:bg-[#222]"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            variant="new"
            className="rounded-full"
            onClick={handleConfirm}
            disabled={disableConfirm}
          >
            {isSubmitting ? "Convirtiendo..." : "Convertir a venta"}
          </Button>
        </DialogFooter>

        {isScanning && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/70"
              onClick={stopScanning}
            />
            <div className="relative z-[121] flex flex-col items-center gap-4">
              <video
                ref={videoRef}
                className="w-72 h-72 rounded-3xl border-4 border-white object-cover shadow-2xl"
                autoPlay
                muted
                playsInline
              />
              <Button
                type="button"
                variant="secondary"
                className="rounded-full"
                onClick={stopScanning}
              >
                Detener escaneo
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
