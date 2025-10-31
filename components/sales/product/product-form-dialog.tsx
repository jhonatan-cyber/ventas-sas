"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SalesProduct, Category } from "@prisma/client";
import { BrowserMultiFormatReader } from "@zxing/library";
import { Camera, X, Upload } from "lucide-react";
import { toast } from "sonner";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: SalesProduct & { category: Category | null };
  categories: Category[];
  defaultCategoryId?: string;
  onSave: (data: any) => void;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  categories,
  defaultCategoryId,
  onSave,
}: ProductFormDialogProps) {
  const pathname = usePathname();
  const customerSlug = pathname.split('/')[1] || '';
  
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("");
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

  useEffect(() => {
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
      setSku(product.sku || "");
      setBarcode(product.barcode || "");
      setImagePreview(product.imageUrl || null);
      setImageFile(null);
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
    }
  }, [product, open, defaultCategoryId]);

  // Limpiar el stream de video cuando se cierra el modal
  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [videoStream]);

  // Resetear el código escaneado cuando se abre el modal
  useEffect(() => {
    if (open) {
      lastScannedCode.current = null;
      setIsFetchingProduct(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !price || !cost) {
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
            toast.error(error.error || 'Error al subir la imagen');
            return;
          }
        } catch (error) {
          console.error('Error al subir imagen:', error);
          toast.error('Error al subir la imagen');
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

      await onSave({
        categoryId: categoryId || undefined,
        name: name.trim(),
        description: description.trim() || undefined,
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        price: Number(price),
        cost: Number(cost),
        stock: stock ? Number(stock) : 0,
        minStock: minStock ? Number(minStock) : 0,
        sku: sku.trim() || undefined,
        barcode: barcode.trim() || undefined,
        imageUrl: finalImageUrl,
      });
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
      
      await video.play();
      
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
      toast.error("No se pudo acceder a la cámara");
    }
  };

  const stopScanning = () => {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
    }
    setIsScanning(false);
    
    // Limpiar el video element
    const video = document.getElementById("scanner-video");
    if (video) {
      video.remove();
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
      loadingToastId = toast.loading("Buscando información del producto...");
      
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
        
        toast.success("Información del producto cargada");
      } else {
        toast.info("No se encontró información del producto. Por favor, complete los campos manualmente.");
      }
    } catch (error) {
      console.error("Error al buscar información del producto:", error);
      // Cerrar el toast de carga si hay error
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      toast.error("Error al buscar información del producto");
    } finally {
      setIsLoading(false);
      setIsFetchingProduct(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? "Editar Producto" : "Nuevo Producto"}
          </DialogTitle>
          <DialogDescription>
            {product
              ? "Modifica los datos del producto"
              : "Completa los datos para crear un nuevo producto"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Primera fila: Código de barras y Foto */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="barcode">Código de Barras</Label>
                  <div className="flex gap-2">
                    <Input
                      id="barcode"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="Código de barras"
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
                        title="Escanear código de barras"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={stopScanning}
                        className="rounded-full px-3"
                        title="Detener escaneo"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nombre <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre del producto"
                    required
                    disabled={isLoading}
                    className="rounded-full"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Foto</Label>
                <div className="flex items-center justify-center">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#2a2a2a] flex items-center justify-center overflow-hidden transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500">
                      {imagePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imagePreview}
                          alt="Vista previa"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                          <span className="text-xs text-gray-400 dark:text-gray-500">Sin imagen</span>
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
                            title="Cambiar foto"
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
                          title="Seleccionar foto"
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Marca y Modelo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Marca"
                  disabled={isLoading}
                  className="rounded-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Modelo"
                  disabled={isLoading}
                  className="rounded-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción del producto..."
                rows={3}
                disabled={isLoading}
                className="rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">
                  Precio de Compra <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0.00"
                  required
                  disabled={isLoading}
                  className="rounded-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">
                  Precio de Venta <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required
                  disabled={isLoading}
                  className="rounded-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Inicial</Label>
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
                <Label htmlFor="minStock">Stock Mínimo</Label>
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

          </div>
          <DialogFooter className="justify-center sm:justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="rounded-full"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="new"
              disabled={isLoading || !name.trim() || !price || !cost}
              className="rounded-full"
            >
              {isLoading ? "Guardando..." : product ? "Actualizar" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
