"use client"

import { BrowserMultiFormatReader } from "@zxing/library"
import { Check, ChevronsUpDown, Plus, Trash2, ScanLine, X, ChevronDown } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { SalesSaleWithRelations, SaleCustomerSummary, SaleProductSummary } from "./types"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { generateSalePdfAndPrint } from "@/lib/utils/pdf-sale-print"

const capitalizeWords = (value: string) =>
  value
    .toLowerCase()
    .replace(/\b\p{L}/gu, (char) => char.toUpperCase())

const DEFAULT_PHONE_PREFIX = "+591"
const DEFAULT_PHONE_PREFIX_DIGITS = DEFAULT_PHONE_PREFIX.replace(/\D/g, '')

const normalizePhoneForState = (value?: string | null) => {
  if (!value) return DEFAULT_PHONE_PREFIX
  const trimmed = value.trim()
  if (!trimmed) return DEFAULT_PHONE_PREFIX
  const digitsOnly = trimmed.replace(/\D/g, '')
  const localDigits = digitsOnly.startsWith(DEFAULT_PHONE_PREFIX_DIGITS)
    ? digitsOnly.slice(DEFAULT_PHONE_PREFIX_DIGITS.length)
    : digitsOnly
  if (!localDigits) return DEFAULT_PHONE_PREFIX
  return `${DEFAULT_PHONE_PREFIX}${localDigits}`
}

interface SaleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sale?: SalesSaleWithRelations
  customerSlug: string
  currentUser?: {
    id: string
    sucursalId?: string | null
  } | null
  onSave: (data: any) => Promise<any>
}

interface SaleItemForm {
  id: string
  productId: string
  product?: SaleProductSummary | null
  quantity: number
  unitPrice: number
  subtotal: number
  codes: string[]
}

const generateTempId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

const statusOptions = [
  { value: 'completed', label: 'Completada' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'cancelled', label: 'Cancelada' },
]

const paymentOptions = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'qr', label: 'QR / Billetera' },
]

const createEmptyItem = (): SaleItemForm => ({
  id: generateTempId(),
  productId: '',
  product: undefined,
  quantity: 1,
  unitPrice: 0,
  subtotal: 0,
  codes: [],
})

export function SaleFormDialog({ open, onOpenChange, sale, customerSlug, onSave }: SaleFormDialogProps) {
  const [customers, setCustomers] = useState<SaleCustomerSummary[]>([])
  const [products, setProducts] = useState<SaleProductSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)

  const [customerId, setCustomerId] = useState<string>('')
  const [customerInputValue, setCustomerInputValue] = useState<string>('')
  const [customerPhoneInput, setCustomerPhoneInput] = useState<string>(DEFAULT_PHONE_PREFIX)
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false)
  const [highlightedCustomerIndex, setHighlightedCustomerIndex] = useState(0)
  const customerContainerRef = useRef<HTMLDivElement>(null)
  const customerInputRef = useRef<HTMLInputElement>(null)
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
  const [items, setItems] = useState<SaleItemForm[]>([createEmptyItem()])
  const [discount, setDiscount] = useState<string>('0')
  const [notes, setNotes] = useState<string>('')
  const [codeInputs, setCodeInputs] = useState<Record<string, string>>({})
  const [isScanning, setIsScanning] = useState(false)
  const [scanningItemId, setScanningItemId] = useState<string | null>(null)
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const scannerVideoRef = useRef<HTMLVideoElement | null>(null)
  const lastScannedCode = useRef<string | null>(null)

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetch(`/api/${customerSlug}/clientes?page=1&pageSize=1000`)
      if (!response.ok) return
      const data = await response.json()
      const mapped: SaleCustomerSummary[] = (data.customers || []).map((customer: any) => ({
        id: customer.id,
        name: customer.name ?? null,
        lastName: customer.lastName ?? null,
        email: customer.email ?? null,
        phone: customer.phone ?? null,
      }))
      setCustomers(mapped)
    } catch (error) {
      console.error('Error al cargar clientes:', error)
    }
  }, [customerSlug])

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(`/api/${customerSlug}/productos?page=1&pageSize=1000`)
      if (!response.ok) return
      const data = await response.json()
      const mapped: SaleProductSummary[] = (data.products || []).map((product: any) => ({
        id: product.id,
        name: product.name,
        price: Number(product.price ?? 0),
        imageUrl: product.imageUrl ?? null,
      }))
      setProducts(mapped)
    } catch (error) {
      console.error('Error al cargar productos:', error)
    }
  }, [customerSlug])

  // Filtrar clientes basados en el input
  const filteredCustomers = useMemo(() => {
    if (!customerInputValue.trim()) return customers
    const search = customerInputValue.trim().toLowerCase()
    return customers.filter((customer) => {
      const combined = `${customer.name ?? ''} ${customer.lastName ?? ''}`.trim().toLowerCase()
      return combined.includes(search)
    })
  }, [customers, customerInputValue])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerContainerRef.current && !customerContainerRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!open) return
    setIsLoadingData(true)
    Promise.all([fetchCustomers(), fetchProducts()]).finally(() => setIsLoadingData(false))
  }, [open, fetchCustomers, fetchProducts])

  useEffect(() => {
    if (!open) return

    if (sale) {
      setCustomerId(sale.customerId ?? '')
      const combinedName = `${sale.customer?.name ?? ''} ${sale.customer?.lastName ?? ''}`.trim()
      setCustomerInputValue(combinedName || (sale as any).customerName || '')
      setCustomerPhoneInput(normalizePhoneForState(sale.customer?.phone))
      setPaymentMethod(sale.paymentMethod ?? 'cash')
      setDiscount(Number(sale.discount ?? 0).toString())
      setNotes(sale.notes ?? '')
      const mappedItems =
        sale.items.map((item) => ({
          id: generateTempId(),
          productId: item.productId,
          product: item.product ?? undefined,
          quantity: Number(item.quantity ?? 0) || 1,
          unitPrice: Number(item.unitPrice ?? 0),
          subtotal: Number(item.subtotal ?? 0),
          codes: Array.isArray(item.trackingCodes)
            ? item.trackingCodes.filter((code) => typeof code === 'string').map((code) => code.trim())
            : [],
        })) || [createEmptyItem()]
      setItems(mappedItems)
      const inputs: Record<string, string> = {}
      mappedItems.forEach((item) => {
        inputs[item.id] = ''
      })
      setCodeInputs(inputs)
    } else {
      const empty = createEmptyItem()
      setCustomerId('')
      setCustomerInputValue('')
      setCustomerPhoneInput(DEFAULT_PHONE_PREFIX)
      setPaymentMethod('cash')
      setDiscount('0')
      setNotes('')
      setItems([empty])
      setCodeInputs({ [empty.id]: '' })
    }
  }, [sale, open])

  const stopScanning = useCallback(() => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
      codeReaderRef.current = null
    }
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop())
    }
    setVideoStream(null)
    setIsScanning(false)
    setScanningItemId(null)
    lastScannedCode.current = null
  }, [videoStream])

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [stopScanning])

  useEffect(() => {
    if (!open) {
      stopScanning()
      setCodeInputs({})
    }
  }, [open, stopScanning])

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  }, [items])

  const total = useMemo(() => {
    const numericDiscount = parseFloat(discount || '0')
    return subtotal - (Number.isNaN(numericDiscount) ? 0 : numericDiscount)
  }, [subtotal, discount])

  const handleCustomerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isCustomerDropdownOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsCustomerDropdownOpen(true)
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedCustomerIndex((prev) =>
          prev < filteredCustomers.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedCustomerIndex((prev) => (prev > 0 ? prev - 1 : prev))
        break
      case 'Enter':
        e.preventDefault()
        const trimmed = customerInputValue.trim()
        if (isCustomerDropdownOpen && filteredCustomers[highlightedCustomerIndex]) {
          selectCustomer(filteredCustomers[highlightedCustomerIndex])
        } else if (trimmed.length > 0) {
          handleManualCustomer(trimmed)
        } else {
          setIsCustomerDropdownOpen(false)
        }
        break
      case 'Escape':
        setIsCustomerDropdownOpen(false)
        break
    }
  }

  const selectCustomer = (customer: SaleCustomerSummary) => {
    setCustomerId(customer.id)
    const fullName = `${customer.name ?? ''} ${customer.lastName ?? ''}`.trim()
    setCustomerInputValue(capitalizeWords(fullName))
    setIsCustomerDropdownOpen(false)
    setHighlightedCustomerIndex(0)
    setCustomerPhoneInput(normalizePhoneForState(customer.phone))
  }

  const clearCustomer = () => {
    setCustomerId('')
    setCustomerInputValue('')
    customerInputRef.current?.focus()
    setHighlightedCustomerIndex(0)
    setCustomerPhoneInput(DEFAULT_PHONE_PREFIX)
  }

  const handleManualCustomer = (value: string) => {
    const trimmed = value.trim()
    if (trimmed.length === 0) return
    setCustomerId('')
    const formatted = capitalizeWords(trimmed)
    setCustomerInputValue(formatted)
    setIsCustomerDropdownOpen(false)
    setHighlightedCustomerIndex(0)
    setCustomerPhoneInput(DEFAULT_PHONE_PREFIX)
  }

  const handleAddItem = () => {
    const newItem = createEmptyItem()
    setItems((prev) => [...prev, newItem])
    setCodeInputs((prev) => ({ ...prev, [newItem.id]: '' }))
  }

  const handleRemoveItem = (id: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev))
    setCodeInputs((prev) => {
      if (prev[id] === undefined) return prev
      const updated = { ...prev }
      delete updated[id]
      return updated
    })
    if (scanningItemId === id) {
      stopScanning()
    }
  }

  const handleProductSelect = (rowId: string, productId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item
        const product = products.find((prod) => prod.id === productId)
        const unitPrice = product ? product.price : 0
        return {
          ...item,
          productId,
          product: product ?? undefined,
          unitPrice,
          subtotal: unitPrice * item.quantity,
        }
      }),
    )
  }

  const handleQuantityChange = (rowId: string, value: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === rowId
          ? {
              ...item,
              quantity: value,
              subtotal: value * item.unitPrice,
              codes: item.codes.slice(0, value),
            }
          : item,
      ),
    )
  }

  const handleUnitPriceChange = (rowId: string, value: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === rowId
          ? {
              ...item,
              unitPrice: value,
              subtotal: value * item.quantity,
            }
          : item,
      ),
    )
  }

  const addCodeToItem = (rowId: string, code: string, fromScanner = false) => {
    const trimmed = code.trim()
    if (!trimmed) {
      toast.error('Ingresa un código válido')
      return
    }

    let added = false
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item
        if (item.codes.includes(trimmed)) {
          toast.info('Este código ya se agregó al producto')
          return item
        }
        if (item.codes.length >= item.quantity) {
          toast.error('La cantidad de códigos no puede superar las unidades vendidas')
          return item
        }
        added = true
        return {
          ...item,
          codes: [...item.codes, trimmed],
        }
      }),
    )

    if (added) {
      setCodeInputs((prev) => ({ ...prev, [rowId]: '' }))
      if (fromScanner) {
        toast.success('Código escaneado y agregado')
        stopScanning()
      }
    }
  }

  const removeCodeFromItem = (rowId: string, code: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === rowId
          ? {
              ...item,
              codes: item.codes.filter((existing) => existing !== code),
            }
          : item,
      ),
    )
  }

  const handleManualCodeAdd = (rowId: string) => {
    const value = codeInputs[rowId] ?? ''
    addCodeToItem(rowId, value, false)
  }

  const startScanningForItem = async (rowId: string) => {
    try {
      stopScanning()
      setIsScanning(true)
      setScanningItemId(rowId)
      
      const reader = new BrowserMultiFormatReader()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      codeReaderRef.current = reader
      setVideoStream(stream)
      lastScannedCode.current = null

      // Esperar un momento para que el DOM se actualice y el video esté disponible
      await new Promise((resolve) => setTimeout(resolve, 100))

      if (scannerVideoRef.current) {
        scannerVideoRef.current.srcObject = stream
        scannerVideoRef.current.setAttribute('playsinline', 'true')
        scannerVideoRef.current.setAttribute('muted', 'true')
        await scannerVideoRef.current.play()
      }

      reader.decodeFromVideoDevice(null, scannerVideoRef.current as HTMLVideoElement, (result, err) => {
        if (result) {
          const scannedCode = result.getText()
          if (lastScannedCode.current === scannedCode) {
            return
          }
          lastScannedCode.current = scannedCode
          addCodeToItem(rowId, scannedCode, true)
        }
        if (err && !(err as any).closed) {
          if (!err.message || !err.message.toLowerCase().includes('no multiformat readers')) {
            // Silenciar errores esperados de escaneo
          }
        }
      })
    } catch (error) {
      console.error('Error al acceder a la cámara:', error)
      toast.error('No se pudo acceder a la cámara')
      stopScanning()
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (items.some((item) => !item.productId)) {
      toast.error('Selecciona un producto para cada ítem')
      return
    }

    if (items.some((item) => item.quantity <= 0 || Number.isNaN(item.quantity))) {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }

    if (items.some((item) => item.unitPrice <= 0 || Number.isNaN(item.unitPrice))) {
      toast.error('El precio debe ser mayor a 0')
      return
    }

    if (items.some((item) => item.codes.length > 0 && item.codes.length !== item.quantity)) {
      toast.error('La cantidad de códigos únicos debe coincidir con la cantidad vendida en cada producto')
      return
    }

    stopScanning()

    setIsLoading(true)
    try {
      const savedSale = await onSave({
        customerId: customerId || null,
        customerName: !customerId && customerInputValue.trim() ? customerInputValue.trim() : null,
        status: 'completed',
        paymentMethod,
        subtotal,
        discount: Number(discount || 0),
        total,
        notes: notes.trim() || null,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.quantity * item.unitPrice,
          trackingCodes: item.codes,
        })),
      })

      // Solo imprimir si es una nueva venta (no edición)
      if (!sale && savedSale && typeof window !== 'undefined') {
        setTimeout(async () => {
          await generateSalePdfAndPrint(savedSale, customerSlug)
        }, 500)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[92vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-[#111111]/95 backdrop-blur">
          <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-white">
            {sale ? 'Editar Venta' : 'Registrar Venta'}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Completa la información de la venta y agrega los productos vendidos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-gray-50/60 dark:bg-[#0c0c0c]">
            <section className="space-y-3" ref={customerContainerRef}>
              <div className="space-y-2">
                <Label>Cliente</Label>
                <div className="relative">
                  <input
                    ref={customerInputRef}
                    type="text"
                    value={customerInputValue}
                    onChange={(e) => {
                      const formatted = e.target.value.length === 0 ? '' : capitalizeWords(e.target.value)
                      setCustomerInputValue(formatted)
                      setIsCustomerDropdownOpen(true)
                      setHighlightedCustomerIndex(0)
                      setCustomerId('')
                    }}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    onKeyDown={handleCustomerKeyDown}
                    placeholder="Selecciona o escribe el nombre del cliente..."
                    disabled={isLoadingData}
                    className="w-full px-5 py-3 pr-20 border border-gray-200 dark:border-[#2a2a2a] rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklch,var(--primary)_50%,white)] bg-white dark:bg-[#161616] text-gray-900 dark:text-white shadow-sm"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                    {customerInputValue && (
                      <button
                        onClick={clearCustomer}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                        type="button"
                        disabled={isLoadingData}
                      >
                        <X size={16} className="text-gray-500" />
                      </button>
                    )}
                    <button
                      onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                      type="button"
                      disabled={isLoadingData}
                    >
                      <ChevronDown
                        size={16}
                        className={`text-gray-500 transition-transform ${isCustomerDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </div>

                  {isCustomerDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-2 z-20 bg-white dark:bg-[#161616] border border-gray-200 dark:border-[#2a2a2a] rounded-2xl shadow-xl overflow-hidden">
                      <div className="max-h-64 overflow-y-auto">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map((customer, index) => (
                            <button
                              key={customer.id}
                              type="button"
                              onClick={() => selectCustomer(customer)}
                              onMouseEnter={() => setHighlightedCustomerIndex(index)}
                              className={`w-full text-left px-5 py-3 transition-colors ${
                                index === highlightedCustomerIndex
                                  ? 'bg-[color-mix(in_oklch,var(--primary)_18%,white)] text-gray-900 dark:text-white'
                                  : 'hover:bg-gray-100 dark:hover:bg-[#1f1f1f] text-gray-700 dark:text-gray-200'
                              }`}
                            >
                              <div className="font-semibold">{capitalizeWords(`${customer.name ?? ''} ${customer.lastName ?? ''}`.trim())}</div>
                              {customer.email && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{customer.email}</div>}
                            </button>
                          ))
                        ) : (
                          <div className="px-5 py-6 text-center text-gray-500 dark:text-gray-400">
                            {customerInputValue.trim()
                              ? `Presiona Enter para usar "${capitalizeWords(customerInputValue.trim())}"`
                              : 'No se encontraron clientes'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Productos vendidos
                </h3>
                <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={handleAddItem}>
                  <Plus className="h-4 w-4" />
                  Agregar producto
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item) => {
                  const selectedProduct = products.find((product) => product.id === item.productId)
                  return (
                    <div
                      key={item.id}
                      className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111]/60 p-4 space-y-3"
                    >
                      <div className="grid gap-3 grid-cols-3">
                        <div className="space-y-2">
                          <Label>Producto</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between rounded-full"
                              >
                                {selectedProduct ? selectedProduct.name : 'Seleccionar producto'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[320px] p-0">
                              <Command>
                                <CommandInput placeholder="Buscar producto" />
                                <CommandList>
                                  <CommandEmpty>No se encontraron productos</CommandEmpty>
                                  <CommandGroup>
                                    {products.map((product) => (
                                      <CommandItem
                                        key={product.id}
                                        value={product.name}
                                        onSelect={() => handleProductSelect(item.id, product.id)}
                                      >
                                        <Check
                                          className={cn(
                                            'mr-2 h-4 w-4',
                                            product.id === item.productId ? 'opacity-100' : 'opacity-0',
                                          )}
                                        />
                                        <div className="flex flex-col">
                                          <span>{product.name}</span>
                                          <span className="text-xs text-gray-500">
                                            BOB {Number(product.price || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                          </span>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label>Cantidad</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, Number(e.target.value) || 0)}
                            className="rounded-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Precio unitario</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleUnitPriceChange(item.id, Number(e.target.value) || 0)}
                            className="rounded-full"
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 grid-cols-3">
                        <div className="space-y-2">
                          <Label>Subtotal</Label>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            BOB {(item.quantity * item.unitPrice).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Códigos únicos</Label>
                          <Input
                            placeholder="Código o escaneo"
                            value={codeInputs[item.id] ?? ''}
                            onChange={(e) =>
                              setCodeInputs((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            className="rounded-full"
                          />
                        </div>

                        <div className="flex items-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => handleManualCodeAdd(item.id)}
                            disabled={item.codes.length >= item.quantity}
                          >
                            Agregar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => startScanningForItem(item.id)}
                            disabled={isLoadingData || item.codes.length >= item.quantity}
                          >
                            <ScanLine className="h-4 w-4" />
                            Escanear
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="rounded-full text-rose-600 hover:text-rose-700"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={items.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {item.codes.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {item.codes.map((code) => (
                            <span
                              key={`${item.id}-${code}`}
                              className="inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/10 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200"
                            >
                              #{code}
                              <button
                                type="button"
                                onClick={() => removeCodeFromItem(item.id, code)}
                                className="ml-1 text-gray-500 hover:text-rose-500 dark:text-gray-400 dark:hover:text-rose-400"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      {item.codes.length === 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">Sin códigos registrados.</p>
                      )}
                      {item.codes.length > 0 && item.codes.length < item.quantity && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          Faltan {item.quantity - item.codes.length} códigos para coincidir con la cantidad vendida.
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="grid gap-4 grid-cols-4">
              <div className="space-y-2">
                <Label>Subtotal</Label>
                <Input value={`BOB ${subtotal.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`} readOnly className="rounded-full" />
              </div>
              <div className="space-y-2">
                <Label>Descuento</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onFocus={() => {
                    if (discount === '0' || discount === '0.00') {
                      setDiscount('')
                    }
                  }}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="rounded-full"
                />
              </div>
              <div className="space-y-2">
                <Label>Total</Label>
                <Input value={`BOB ${total.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`} readOnly className="rounded-full" />
              </div>
              <div className="space-y-2">
                <Label>Método de pago</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="rounded-full w-full">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {paymentOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            <section className="grid gap-4">
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Comentarios adicionales, condiciones, etc."
                  className="min-h-[110px] rounded-3xl resize-none"
                />
              </div>
            </section>
          </div>

          <DialogFooter className="flex w-full justify-center sm:justify-center items-center gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4 bg-white/95 dark:bg-[#111111]/95 backdrop-blur">
            <Button type="button" variant="outline" className="rounded-full" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="new"
              className="rounded-full"
              disabled={
                isLoading ||
                items.some((item) => !item.productId) ||
                subtotal <= 0 ||
                total < 0 ||
                items.some((item) => item.codes.length > 0 && item.codes.length !== item.quantity) ||
                isLoadingData
              }
            >
              {isLoading ? 'Guardando...' : sale ? 'Actualizar venta' : 'Registrar venta'}
            </Button>
          </DialogFooter>
        </form>

        {isScanning && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70" onClick={stopScanning} />
            <div className="relative z-[121] flex flex-col items-center gap-4">
              <video
                ref={scannerVideoRef}
                className="w-72 h-72 rounded-3xl border-4 border-white object-cover shadow-2xl"
                autoPlay
                muted
                playsInline
              />
              <Button type="button" variant="secondary" className="rounded-full" onClick={stopScanning}>
                Detener escaneo
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
