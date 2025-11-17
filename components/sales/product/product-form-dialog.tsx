"use client";

import { SalesProduct, Category } from "@prisma/client";
import { BrowserMultiFormatReader } from "@zxing/library";
import { Camera, X, Upload, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Función para capitalizar cada palabra (primera letra de cada palabra en mayúscula)
const capitalizeWords = (text: string) => {
  // Preservar espacio(s) al final para no bloquear la escritura
  const trailing = /\s+$/.exec(text)?.[0] || ""
  const core = text.replace(/\s+$/, '')
  if (!core) return trailing
  const cap = core
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
  return cap + trailing
}

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: SalesProduct & { category: Category | null };
  categories: Category[];
  defaultCategoryId?: string;
  maxBranches?: number | null;
  onSave: (data: any) => void;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  categories,
  defaultCategoryId,
  maxBranches,
  onSave,
}: ProductFormDialogProps) {
  const t = useTranslations()
  const pathname = usePathname();
  const customerSlug = pathname.split('/')[1] || '';
  
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("");
  const [reorderPoint, setReorderPoint] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [isFetchingProduct, setIsFetchingProduct] = useState(false);
  const lastScannedCode = useRef<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  const stopScanning = useCallback(() => {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
    }
    setIsScanning(false);

    const videoElement = document.getElementById("scanner-video") as HTMLVideoElement | null;
    if (videoElement) {
      try {
        videoElement.pause();
      } catch (error) {
        console.warn("No se pudo pausar el video del escáner:", error);
      }
      videoElement.srcObject = null;
      videoElement.remove();
    }
  }, [videoStream]);

  useEffect(() => {
    if (!open) {
      stopScanning();
      lastScannedCode.current = null;
      setBarcode("");
      setIsFetchingProduct(false);
      return;
    }

    lastScannedCode.current = null;

    if (product) {
      setName(product.name || "");
      setCategoryId(product.categoryId || "");
      setDescription(product.description || "");
      setBrand((product as any).brand || "");
      setModel((product as any).model || "");
      setPrice(Number(product.price).toString());
      setCost(Number(product.cost).toString());
      setStock(product.stock?.toString() || "0");
      setMinStock(product.minStock?.toString() || "0");
      setReorderPoint((product as any).reorderPoint?.toString() || "");
      setSku(product.sku || "");
      setBarcode(""); // Resetear el campo al abrir incluso en modo edición
      setImagePreview(product.imageUrl || null);
      setImageFile(null);
      if ((product as any).branchId) {
        setSelectedBranchId((product as any).branchId);
      }
    } else {
      setName("");
      setCategoryId(defaultCategoryId || "");
      setDescription("");
      setBrand("");
      setModel("");
      setPrice("");
      setCost("");
      setStock("0");
      setMinStock("0");
      setSku("");
      setBarcode("");
      setImagePreview(null);
      setImageFile(null);
      setSelectedBranchId("");
      setIsScanning(false);
      setIsFetchingProduct(false);
    }
  }, [product, open, defaultCategoryId, stopScanning]);

  useEffect(() => {
    if (!open) {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [open, stopScanning]);

  useEffect(() => {
    if (open && !product && defaultCategoryId && !categoryId) {
      setCategoryId(defaultCategoryId);
    }
  }, [open, product, defaultCategoryId, categoryId]);

  // Obtener información del usuario y sucursales al abrir el modal
  useEffect(() => {
    if (!open) return;

    const fetchUserAndBranches = async () => {
      try {
        // Obtener usuario actual
        const userResponse = await fetch(`/api/${customerSlug}/auth/me`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const userRoleName = userData.rol?.nombre?.toLowerCase() || "";
          const isUserAdmin = userRoleName.includes("administrador") || userRoleName === "admin";
          
          setIsAdmin(isUserAdmin);
          
          // Si es administrador, obtener sucursales
          if (isUserAdmin) {
            const branchesResponse = await fetch(`/api/${customerSlug}/sucursales?status=active&page=1&pageSize=1000`);
            if (branchesResponse.ok) {
              const branchesData = await branchesResponse.json();
              const branchesList = branchesData.branches?.map((b: any) => ({ id: b.id, name: b.name })) || [];
              setBranches(branchesList);
              
              // Si el plan solo permite una sucursal y solo hay una disponible, seleccionarla automáticamente
              if (maxBranches === 1 && branchesList.length === 1 && !product) {
                setSelectedBranchId(branchesList[0].id);
              } else if (!product && userData.sucursalId) {
                // Solo establecer sucursal por defecto si no hay producto (modo creación)
                // Si hay producto, el branchId ya fue establecido en el useEffect anterior
                setSelectedBranchId(userData.sucursalId);
              }
            }
          } else {
            // Si no es administrador, usar automáticamente la sucursal del usuario
            // Solo si no hay producto (modo creación)
            if (!product && userData.sucursalId) {
              setSelectedBranchId(userData.sucursalId);
            }
          }
        }
      } catch (error) {
        console.error("Error al obtener información del usuario:", error);
      }
    };

    fetchUserAndBranches();
  }, [open, customerSlug, product, maxBranches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !price || !cost) {
      toast.error(t('form.required'));
      return;
    }

    // Validar que haya categoría seleccionada
    if (!categoryId) {
      toast.error(t('products.form.categoryRequired'));
      return;
    }

    // Validar que haya sucursal (para administradores)
    if (isAdmin && !selectedBranchId) {
      toast.error(t('products.form.branchRequired'));
      return;
    }

    setIsLoading(true);
    try {
      let finalImageUrl = imagePreview || undefined;

      // Si hay un archivo nuevo para subir, subirlo primero
      if (imageFile && imagePreview && imagePreview.startsWith('data:')) {
        try {
          const formData = new FormData();
          formData.append('image', imageFile);

          const uploadResponse = await fetch(`/api/${customerSlug}/productos/upload-image`, {
            method: 'POST',
            body: formData,
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            finalImageUrl = uploadData.imageUrl;
          } else {
            const error = await uploadResponse.json();
            toast.error(error.error || t('products.form.errorUploadingImage'));
            return;
          }
        } catch (error) {
          console.error('Error al subir imagen:', error);
          toast.error(t('products.form.errorUploadingImage'));
          return;
        }
      }
      // Si la imagen es una URL remota (de búsqueda de código de barras), descargarla y guardarla
      else if (imagePreview && (imagePreview.startsWith('http://') || imagePreview.startsWith('https://'))) {
        try {
          const uploadResponse = await fetch(`/api/${customerSlug}/productos/upload-image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageUrl: imagePreview }),
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            finalImageUrl = uploadData.imageUrl;
          } else {
            const error = await uploadResponse.json();
            console.error('Error al guardar imagen remota:', error);
            // Continuar con la URL remota si falla la descarga
            finalImageUrl = imagePreview;
          }
        } catch (error) {
          console.error('Error al guardar imagen remota:', error);
          // Continuar con la URL remota si falla la descarga
          finalImageUrl = imagePreview;
        }
      }

      const dataToSave: any = {
        categoryId: categoryId,
        name: name.trim(),
        price: Number(price),
        cost: Number(cost),
        stock: stock ? Number(stock) : 0,
        minStock: minStock ? Number(minStock) : 0,
        reorderPoint: reorderPoint ? Number(reorderPoint) : undefined,
      };

      // Agregar campos opcionales solo si tienen valor
      if (description && description.trim()) {
        dataToSave.description = description.trim();
      }
      if (brand && brand.trim()) {
        dataToSave.brand = brand.trim();
      }
      if (model && model.trim()) {
        dataToSave.model = model.trim();
      }
      if (sku && sku.trim()) {
        dataToSave.sku = sku.trim();
      }
      if (barcode && barcode.trim()) {
        dataToSave.barcode = barcode.trim();
      }
      if (finalImageUrl) {
        dataToSave.imageUrl = finalImageUrl;
      }

      // Solo enviar branchId si es administrador y tiene una sucursal seleccionada
      // Si no es admin, el backend usará automáticamente la sucursal del usuario
      if (isAdmin && selectedBranchId) {
        dataToSave.branchId = selectedBranchId;
      }

      console.log('Datos a enviar:', dataToSave);
      
      // Detener la cámara antes de guardar
      stopScanning();
      
      await onSave(dataToSave);
    } finally {
      setIsLoading(false);
    }
  };

  const startScanning = async () => {
    try {
      // Limpiar todo el formulario antes de escanear
      setName("");
      setCategoryId(defaultCategoryId || "");
      setDescription("");
      setPrice("");
      setCost("");
      setStock("0");
      setMinStock("0");
      setReorderPoint("");
      setSku("");
      setBarcode("");
      setBrand("");
      setModel("");
      setImagePreview(null);
      setImageFile(null);
      lastScannedCode.current = null;
      setIsFetchingProduct(false);
      
      const codeReader = new BrowserMultiFormatReader();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      
      setVideoStream(stream);
      setIsScanning(true);
      
      // Crear video element temporal para el scanning
      const video = document.createElement("video");
      video.id = "scanner-video";
      video.srcObject = stream;
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.style.width = "100%";
      video.style.height = "100%";
      video.style.position = "fixed";
      video.style.top = "50%";
      video.style.left = "50%";
      video.style.transform = "translate(-50%, -50%)";
      video.style.zIndex = "9999";
      video.style.maxWidth = "300px";
      video.style.maxHeight = "300px";
      document.body.appendChild(video);
      
      try {
        await video.play();
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
          console.debug("Reproducción del video del escáner interrumpida (AbortError).");
        } else {
          console.error("No se pudo iniciar el video del escáner:", error);
        }
      }
      
      codeReader.decodeFromVideoDevice(null, video, async (result, err) => {
        if (result) {
          const scannedCode = result.getText();
          
          // Evitar procesar el mismo código múltiples veces
          if (lastScannedCode.current === scannedCode) {
            return;
          }
          
          lastScannedCode.current = scannedCode;
          setBarcode(scannedCode);
          stopScanning();
          
          // Buscar información del producto (esto mostrará su propio toast)
          await fetchProductInfo(scannedCode);
        }
        if (err && !(err as any).closed) {
          // Silenciar errores de detección continua (NotFoundException, ChecksumException, etc.)
          if (!err.message || !err.message.toLowerCase().includes("no multiformat readers")) {
            console.error(err);
          }
        }
      });
    } catch (error) {
      console.error("Error al acceder a la cámara:", error);
      toast.error(t('products.form.cameraAccessError'));
    }
  };

  const fetchProductInfo = async (barcodeValue: string) => {
    // Evitar múltiples llamadas simultáneas
    if (isFetchingProduct || !barcodeValue) {
      return;
    }
    
    let loadingToastId: string | number | undefined;
    
    try {
      setIsFetchingProduct(true);
      setIsLoading(true);
      
      // Mostrar toast de carga
      loadingToastId = toast.loading(t('products.form.searchingProductInfo'));
      
      // Usar la ruta API de Next.js como proxy para evitar CORS
      const response = await fetch('/api/barcode-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ barcode: barcodeValue })
      });

      const result = await response.json();

      // Cerrar el toast de carga
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }

      if (result.success && result.data) {
        const data = result.data;
        
        // Llenar los campos con la información encontrada
        if (!name && data.name) setName(data.name);
        if (!brand && data.brand) setBrand(data.brand);
        if (!model && data.model) setModel(data.model);
        if (!description && data.description) {
          setDescription(data.description);
        }
        
        // Si hay imagen, cargarla
        if (data.imageUrl && !imagePreview) {
          setImagePreview(data.imageUrl);
        }
        
        toast.success(t('products.form.productInfoLoaded'));
      } else {
        toast.info(t('products.form.productInfoNotFound'));
      }
    } catch (error) {
      console.error("Error al buscar información del producto:", error);
      // Cerrar el toast de carga si hay error
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      toast.error(t('products.form.errorSearchingProductInfo'));
    } finally {
      setIsLoading(false);
      setIsFetchingProduct(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!name.trim()) {
      toast.error(t('products.form.nameRequired'));
      return;
    }

    setIsGeneratingDescription(true);
    const loadingToastId = toast.loading(t('products.form.generatingDescriptionAI'));

    try {
      const categoryName = categories.find(cat => cat.id === categoryId)?.name || null;

      const response = await fetch(`/api/${customerSlug}/productos/generate-description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          brand: brand.trim() || null,
          model: model.trim() || null,
          existingDescription: description.trim() || null,
          category: categoryName,
        }),
      });

      const result = await response.json();

      toast.dismiss(loadingToastId);

      if (result.success && result.description) {
        setDescription(result.description);
        
        // Llenar marca si se encontró y el campo está vacío
        if (result.brand && !brand.trim()) {
          setBrand(result.brand);
        }
        
        // Llenar modelo si se encontró y el campo está vacío
        if (result.model && !model.trim()) {
          setModel(result.model);
        }
        
        // Si también se encontró una imagen, cargarla
        if (result.imageUrl && !imagePreview) {
          setImagePreview(result.imageUrl);
        }
        
        // Mensaje de éxito según lo que se encontró
        const foundItems = [];
        if (result.description) foundItems.push("descripción");
        if (result.brand && !brand.trim()) foundItems.push("marca");
        if (result.model && !model.trim()) foundItems.push("modelo");
        if (result.imageUrl && !imagePreview) foundItems.push("imagen");
        
        if (foundItems.length > 1) {
          toast.success(t('products.form.infoGenerated') + ': ' + foundItems.join(", "));
        } else if (foundItems.length === 1) {
          toast.success(foundItems[0].charAt(0).toUpperCase() + foundItems[0].slice(1) + ' ' + t('products.form.generatedSuccessfully'));
        } else {
          toast.success(t('products.form.descriptionGeneratedSuccessfully'));
        }
      } else {
        toast.error(result.error || t('products.form.couldNotGenerateDescription'));
      }
    } catch (error) {
      console.error("Error al generar descripción:", error);
      toast.dismiss(loadingToastId);
      toast.error(t('products.form.errorGeneratingDescription'));
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden p-0 rounded-lg">
        {/* Header estático */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky top-0 z-10">
          <DialogHeader className="px-0 py-0 space-y-2">
            <DialogTitle>
              {product ? t('products.edit') : t('products.new')}
            </DialogTitle>
            <DialogDescription>
              {product
                ? t('products.editDescription')
                : t('products.newDescription')}
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Contenido con scroll */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 bg-gray-50/60 dark:bg-[#0c0c0c]">
            {/* Primera fila: Código de barras y Foto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="barcode">{t('products.form.barcode')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="barcode"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder={t('products.form.barcode')}
                      disabled={isLoading}
                      className="rounded-full flex-1"
                    />
                    {!isScanning ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={startScanning}
                        disabled={isLoading}
                        className="rounded-full px-3"
                        title={t('products.form.scanBarcode')}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={stopScanning}
                        className="rounded-full px-3"
                        title={t('products.form.stopScan')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {t('form.name')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(capitalizeWords(e.target.value))}
                    placeholder={t('products.form.name')}
                    required
                    disabled={isLoading}
                    className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="space-y-2 flex flex-col items-center md:items-start">
                <Label className="block w-full">{t('products.form.image')}</Label>
                <div className="relative group">
                  <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#2a2a2a] flex items-center justify-center overflow-hidden transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Vista previa"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                        <span className="text-xs text-gray-400 dark:text-gray-500">{t('products.form.noImage')}</span>
                      </div>
                    )}
                    {/* Overlay para el botón cuando hay imagen */}
                    {imagePreview && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <input
                          id="product-image-input"
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setImageFile(file);
                            const reader = new FileReader();
                            reader.onload = () =>
                              setImagePreview(reader.result as string);
                            reader.readAsDataURL(file);
                          }}
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-full h-9 w-9 p-0 bg-white/90 hover:bg-white border-white/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            document.getElementById("product-image-input")?.click();
                          }}
                          disabled={isLoading}
                          title={t('products.form.changePhoto')}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {/* Botón cuando no hay imagen */}
                  {!imagePreview && (
                    <div className="absolute -bottom-2 -right-2">
                      <input
                        id="product-image-input"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setImageFile(file);
                          const reader = new FileReader();
                          reader.onload = () =>
                            setImagePreview(reader.result as string);
                          reader.readAsDataURL(file);
                        }}
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full h-9 w-9 p-0 shadow-md hover:shadow-lg transition-shadow"
                        onClick={() =>
                          document.getElementById("product-image-input")?.click()
                        }
                        disabled={isLoading}
                        title={t('products.form.selectPhoto')}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Marca y Modelo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">{t('products.form.brand')}</Label>
                <Input
                  id="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder={t('products.form.brand')}
                  disabled={isLoading}
                  className="rounded-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">{t('products.form.model')}</Label>
                <Input
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={t('products.form.model')}
                  disabled={isLoading}
                  className="rounded-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">{t('products.form.description')}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateDescription}
                  disabled={isLoading || isGeneratingDescription || !name.trim()}
                  className="rounded-full text-xs h-7 px-3 gap-1.5"
                  title={t('products.form.improveDescriptionAI')}
                >
                  <Sparkles className={`h-3 w-3 ${isGeneratingDescription ? 'animate-spin' : ''}`} />
                  {isGeneratingDescription ? t('products.form.generating') : t('products.form.improveWithAI')}
                </Button>
              </div>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('products.form.description') + '...'}
                rows={3}
                disabled={isLoading || isGeneratingDescription}
                className="rounded-lg"
              />
            </div>

            {/* Select de Sucursal (solo para administradores y si el plan permite más de una sucursal) */}
            {isAdmin && branches.length > 0 && !(maxBranches === 1 && branches.length === 1) && (
              <div className="space-y-2 w-full">
                <Label htmlFor="branch">
                  {t('form.branch')} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedBranchId}
                  onValueChange={setSelectedBranchId}
                  required
                  disabled={isLoading}
                >
                  <SelectTrigger id="branch" className="w-full rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
                    <SelectValue placeholder={t('products.form.selectBranch')} />
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
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">
                  {t('products.form.cost')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder={t('common.placeholders.amount')}
                  required
                  disabled={isLoading}
                  className="rounded-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">
                  {t('products.form.priceSale')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={t('common.placeholders.amount')}
                  required
                  disabled={isLoading}
                  className="rounded-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">{t('products.form.initialStock')}</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                  disabled={isLoading}
                  className="rounded-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">{t('products.form.minStock')}</Label>
                <Input
                  id="minStock"
                  type="number"
                  min="0"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  placeholder="0"
                  disabled={isLoading}
                  className="rounded-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reorderPoint">{t('products.form.reorderPoint') || 'Punto de Reorden'}</Label>
                <Input
                  id="reorderPoint"
                  type="number"
                  min="0"
                  value={reorderPoint}
                  onChange={(e) => setReorderPoint(e.target.value)}
                  placeholder={t('products.form.reorderPointPlaceholder') || 'Opcional: stock para reordenar'}
                  disabled={isLoading}
                  className="rounded-full"
                />
              </div>
            </div>

          </div>
          
          {/* Footer estático */}
          <DialogFooter className="flex w-full flex-col sm:flex-row sm:justify-center items-center gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-4 sm:px-6 py-4 bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky bottom-0 z-10">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="w-full sm:w-auto rounded-full"
            >
              {t('action.cancel')}
            </Button>
            <Button
              type="submit"
              variant="new"
              disabled={isLoading || !name.trim() || !price || !cost}
              className="w-full sm:w-auto rounded-full"
            >
              {isLoading ? t('message.saving') : product ? t('action.update') : t('action.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
