"use client"

import { Quotation, SalesCustomer, SalesProduct } from "@prisma/client"
import { Check, ChevronsUpDown, ChevronDown, Package2, Plus, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const capitalizeWords = (value: string) =>
  value
    .toLowerCase()
    .replace(/\b\p{L}/gu, (char) => char.toUpperCase())

interface BranchOption {
  id: string
  name: string | null
}

interface QuotationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotation?: Quotation & {
    items?: any[]
    customer?: any
    customerName?: string | null
    branchId?: string | null
    branch?: { id?: string | null } | null
  }
  organizationId: string
  customerSlug: string
  onSave: (data: any) => void
  isBusy?: boolean
  branches?: BranchOption[]
  isAdmin?: boolean
  currentUserBranchId?: string | null
}

interface QuotationItemRow {
  id: string
  productId: string
  productName: string
  productInput: string
  quantity: number
  unitPrice: number
  subtotal: number
}

const createEmptyItem = (): QuotationItemRow => ({
  id: `${Date.now()}-${Math.random()}`,
  productId: "none",
  productName: "",
  productInput: "",
  quantity: 1,
  unitPrice: 0,
  subtotal: 0,
})

const formatDateForInput = (value: string | Date): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const tzOffset = date.getTimezoneOffset() * 60000
  const localISO = new Date(date.getTime() - tzOffset).toISOString()
  return localISO.split("T")[0]
}

const getTodayInputValue = () => formatDateForInput(new Date())

const toEndOfDayISO = (dateString: string): string => {
  const [year, month, day] = dateString.split("-").map(Number)
  const date = new Date(year, (month ?? 1) - 1, day ?? 1, 23, 59, 59, 999)
  return date.toISOString()
}

export function QuotationFormDialog({
  open,
  onOpenChange,
  quotation,
  organizationId: _organizationId,
  customerSlug,
  onSave,
  isBusy = false,
  branches = [],
  isAdmin = false,
  currentUserBranchId = null,
}: QuotationFormDialogProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [customerInputValue, setCustomerInputValue] = useState("")
  const [customerPhoneInput, setCustomerPhoneInput] = useState("")
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false)
  const [highlightedCustomerIndex, setHighlightedCustomerIndex] = useState(0)
  const customerContainerRef = useRef<HTMLDivElement>(null)
  const customerInputRef = useRef<HTMLInputElement>(null)
  const PLACEHOLDER_BRANCH_VALUE = "__placeholder__"
  const [selectedBranchId, setSelectedBranchId] = useState<string>(PLACEHOLDER_BRANCH_VALUE)
  
  const [customers, setCustomers] = useState<(SalesCustomer & { lastName?: string | null })[]>([])
  const [products, setProducts] = useState<SalesProduct[]>([])
  const [items, setItems] = useState<QuotationItemRow[]>([])
  const [openProductPopoverId, setOpenProductPopoverId] = useState<string | null>(null)
  const quantityInputRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const [discount, setDiscount] = useState(0)
  const [expiresAt, setExpiresAt] = useState("")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const todayInputValue = useMemo(() => getTodayInputValue(), [])
  const branchOptions = useMemo<BranchOption[]>(() => {
    return (branches ?? []).map((branch) => ({
      id: branch.id,
      name: branch.name ?? "Sin sucursal",
    }))
  }, [branches])
  const normalizedSelectedBranchId =
    selectedBranchId === PLACEHOLDER_BRANCH_VALUE ? "" : selectedBranchId
  const renderCustomerInput = (wrapperClassName: string) => (
    <div className={cn("w-full", wrapperClassName)}>
      <Label htmlFor="customer" className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Cliente</Label>
      <div className="relative mt-2">
        <input
          ref={customerInputRef}
          type="text"
          value={customerInputValue}
          onChange={(e) => {
            const formatted = e.target.value.length === 0 ? "" : capitalizeWords(e.target.value)
            setCustomerInputValue(formatted)
            setIsCustomerDropdownOpen(true)
            setHighlightedCustomerIndex(0)
            setSelectedCustomerId(null)
          }}
          onFocus={() => setIsCustomerDropdownOpen(true)}
          onKeyDown={handleCustomerKeyDown}
          onBlur={() => {
            // No cerrar inmediatamente para permitir clics en el dropdown
            setTimeout(() => setIsCustomerDropdownOpen(false), 200)
          }}
          placeholder="Escribe el nombre del cliente (puede no estar registrado)..."
          disabled={isFormLocked}
          className="w-full px-5 py-3 pr-20 border border-gray-200 dark:border-[#2a2a2a] rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklch,var(--primary)_50%,white)] bg-white dark:bg-[#161616] text-gray-900 dark:text-white shadow-sm"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
          {customerInputValue && (
            <button
              onClick={clearCustomer}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
              type="button"
              disabled={isFormLocked}
            >
              <X size={16} className="text-gray-500" />
            </button>
          )}

          <button
            onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            type="button"
            disabled={isFormLocked}
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
                        ? 'bg-[color-mix(in_oklch,var(--primary)_18%,white)] text-gray-900 dark:bg-white/10 dark:text-white'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <div className="font-semibold">{capitalizeWords(`${customer.name ?? ""} ${customer.lastName ?? ""}`.trim())}</div>
                    {customer.email && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{customer.email}</div>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-5 py-6 text-center">
                  {customerInputValue.trim() ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Usar cliente: <span className="font-semibold">"{capitalizeWords(customerInputValue.trim())}"</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Presiona Enter o haz clic aquí para usar este cliente sin registrarlo
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 rounded-full"
                        onClick={() => handleManualCustomer(customerInputValue.trim())}
                      >
                        Usar este cliente
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">No se encontraron clientes registrados</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Nombre del cliente para crearlo automáticamente en la cotización
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderPhoneInput = (wrapperClassName: string) => (
    <div className={cn("w-full", wrapperClassName)}>
      <Label htmlFor="customerPhone" className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Teléfono</Label>
      <div className="mt-2 relative">
        <Input
          id="customerPhone"
          type="tel"
          value={customerPhoneInput}
          onChange={(e) => setCustomerPhoneInput(e.target.value)}
          placeholder="Teléfono del cliente"
          disabled={isFormLocked}
          className="rounded-2xl"
        />
      </div>
    </div>
  )

  // Filtrar clientes basados en el input
  const filteredCustomers = useMemo(() => {
    if (!customerInputValue.trim()) return customers
    const search = customerInputValue.trim().toLowerCase()
    return customers.filter(customer => {
      const combined = `${customer.name ?? ""} ${customer.lastName ?? ""}`.trim().toLowerCase()
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

  // Cargar clientes y productos
  useEffect(() => {
    if (open) {
      loadCustomers()
      const initialBranchId = isAdmin
        ? selectedBranchId
        : currentUserBranchId
      loadProducts(initialBranchId)
    }
  }, [open, customerSlug, isAdmin, selectedBranchId, currentUserBranchId])

  useEffect(() => {
    if (!open || !isAdmin) return
    loadProducts(selectedBranchId)
  }, [open, isAdmin, selectedBranchId])

  // Cargar datos de la cotización si existe
  useEffect(() => {
    if (quotation && open) {
      const initialName = quotation.customer?.name || quotation.customerName || ""
      setSelectedCustomerId(quotation.customerId ?? null)
      const combinedName = `${quotation.customer?.name ?? ""} ${(quotation.customer as any)?.lastName ?? ""}`.trim()
      setCustomerInputValue(capitalizeWords(combinedName || initialName))
      const phoneValue = (quotation.customer?.phone as string | undefined) ?? (quotation as any)?.customerPhone ?? ""
      setCustomerPhoneInput(phoneValue ?? "")
      const branchIdFromQuotation =
        (quotation as any)?.branchId ??
        quotation.branchId ??
        quotation.branch?.id ??
        null
      setSelectedBranchId(branchIdFromQuotation ?? currentUserBranchId ?? PLACEHOLDER_BRANCH_VALUE)
      setDiscount(Number(quotation.discount) || 0)
      if (quotation.expiresAt) {
        const formatted = formatDateForInput(quotation.expiresAt)
        setExpiresAt(formatted < todayInputValue ? todayInputValue : formatted)
      } else {
        setExpiresAt("")
      }
      setNotes(quotation.notes || "")
      if (quotation.items) {
        const mapped = quotation.items.map((item: any) => {
          const baseName = item.product?.name || item.productName || ""
          const formattedName = baseName ? capitalizeWords(baseName) : ""
          return {
            id: item.id || `${item.productId ?? 'manual'}-${Math.random()}`,
            productId: item.productId ?? "none",
            productName: formattedName,
            productInput: formattedName,
            quantity: Number(item.quantity || 1),
            unitPrice: Number(item.unitPrice || 0),
            subtotal: Number(item.subtotal || 0),
          }
        })
        setItems(mapped.length > 0 ? mapped : [createEmptyItem()])
      }
    } else if (!quotation && open) {
      setSelectedCustomerId(null)
      setCustomerInputValue("")
      setCustomerPhoneInput("")
      if (isAdmin) {
        setSelectedBranchId(currentUserBranchId ?? PLACEHOLDER_BRANCH_VALUE)
      } else {
        setSelectedBranchId(currentUserBranchId ?? PLACEHOLDER_BRANCH_VALUE)
      }
      setDiscount(0)
      setExpiresAt("")
      setNotes("")
      setItems([createEmptyItem()])
    }
  }, [branchOptions, currentUserBranchId, isAdmin, open, quotation])

  const loadCustomers = async () => {
    try {
      setIsLoadingData(true)
      const response = await fetch(`/api/${customerSlug}/clientes?page=1&pageSize=1000`, {
        cache: "no-store",
      })
      if (response.ok) {
        const data = await response.json()
        const normalized = (data.customers || []).map((customer: any) => ({
          ...customer,
          lastName: customer.lastName ?? customer.apellido ?? null,
        }))
        setCustomers(normalized)
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const loadProducts = async (branchIdOverride?: string | null) => {
    try {
      setIsLoadingData(true)
      const effectiveBranchId = isAdmin
        ? branchIdOverride && branchIdOverride !== PLACEHOLDER_BRANCH_VALUE
          ? branchIdOverride
          : null
        : currentUserBranchId ?? null

      const branchQuery = effectiveBranchId ? `&branchId=${effectiveBranchId}` : ""

      const response = await fetch(`/api/${customerSlug}/productos?page=1&pageSize=1000${branchQuery}`, {
        cache: "no-store",
      })
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error al cargar productos:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleCustomerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isCustomerDropdownOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsCustomerDropdownOpen(true)
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedCustomerIndex(prev => 
          prev < filteredCustomers.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedCustomerIndex(prev => prev > 0 ? prev - 1 : prev)
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

  const selectCustomer = (customer: SalesCustomer & { lastName?: string | null }) => {
    setSelectedCustomerId(customer.id)
    const fullName = `${customer.name ?? ""} ${customer.lastName ?? ""}`.trim()
    setCustomerInputValue(capitalizeWords(fullName))
    setIsCustomerDropdownOpen(false)
    setHighlightedCustomerIndex(0)
    setCustomerPhoneInput(customer.phone ?? "")
  }

  const clearCustomer = () => {
    setSelectedCustomerId(null)
    setCustomerInputValue("")
    customerInputRef.current?.focus()
    setHighlightedCustomerIndex(0)
    setCustomerPhoneInput("")
  }

  const handleManualCustomer = (value: string) => {
    const trimmed = value.trim()
    if (trimmed.length === 0) return
    setSelectedCustomerId(null)
    const formatted = capitalizeWords(trimmed)
    setCustomerInputValue(formatted)
    setIsCustomerDropdownOpen(false)
    setHighlightedCustomerIndex(0)
    setCustomerPhoneInput("")
  }

  const addItem = () => {
    setItems((prev) => [...prev, createEmptyItem()])
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const normalizeNumber = (value: string | number, fallback = 0) => {
    if (typeof value === "number" && !Number.isNaN(value)) return value
    const parsed = parseFloat(value as string)
    return Number.isNaN(parsed) ? fallback : parsed
  }

  const updateItem = (id: string, field: keyof QuotationItemRow, rawValue: any) => {
     setItems((prev) => {
       return prev.map((item) => {
         if (item.id !== id) return item
 
         const updated: QuotationItemRow = { ...item }
 
         if (field === "productId") {
          if (rawValue === "none") {
            updated.productId = "none"
            return updated
          }
          const product = products.find((p) => p.id === rawValue)
          updated.productId = rawValue
          if (product) {
            const unitPrice = Number(product.price || 0)
            const formattedName = capitalizeWords(product.name || "")
            updated.productName = formattedName
            updated.productInput = formattedName
            updated.unitPrice = unitPrice
            updated.subtotal = unitPrice * updated.quantity
          }
        } else if (field === "quantity") {
          const quantity = Math.max(1, Math.floor(normalizeNumber(rawValue, 1)))
          updated.quantity = quantity
          updated.subtotal = quantity * updated.unitPrice
        } else if (field === "unitPrice") {
          const unitPrice = Math.max(0, normalizeNumber(rawValue, 0))
          updated.unitPrice = unitPrice
          updated.subtotal = unitPrice * updated.quantity
        }
 
         return updated
       })
     })
   }

  const handleProductPopoverChange = (id: string, open: boolean) => {
    if (open) {
      setOpenProductPopoverId(id)
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                productInput: item.productName,
              }
            : item,
        ),
      )
    } else {
      setOpenProductPopoverId((prev) => (prev === id ? null : prev))
    }
  }

  const focusQuantityInput = (itemId: string) => {
    requestAnimationFrame(() => {
      const quantityInput = quantityInputRefs.current.get(itemId)
      if (quantityInput) {
        quantityInput.focus()
        quantityInput.select()
      }
    })
  }

  const handleProductInputChange = (id: string, value: string) => {
    const formatted = value.length === 0 ? "" : capitalizeWords(value)
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              productId: "none",
              productInput: formatted,
              productName: formatted,
            }
          : item,
      ),
    )
  }

  const handleProductInputKeyDown = (itemId: string, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      const current = items.find((item) => item.id === itemId)
      const trimmed = current?.productInput.trim() ?? ""

      if (trimmed.length === 0) {
        setOpenProductPopoverId(null)
        return
      }

      const matchingProduct = products.find(
        (product) => product.name?.toLowerCase() === trimmed.toLowerCase(),
      )

      if (matchingProduct) {
        handleProductSelect(itemId, matchingProduct)
      } else {
        handleProductManualSelection(itemId, trimmed)
      }
    } else if (event.key === "Escape") {
      setOpenProductPopoverId(null)
    }
  }

  const handleProductSelect = (itemId: string, product: SalesProduct) => {
    const formattedName = capitalizeWords(product.name || "")
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              productId: product.id,
              productName: formattedName,
              productInput: formattedName,
              unitPrice: Number(product.price || 0),
              subtotal: Number(product.price || 0) * item.quantity,
            }
          : item,
      ),
    )
    setOpenProductPopoverId(null)
    focusQuantityInput(itemId)
  }

  const handleProductManualSelection = (itemId: string, value: string) => {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      setOpenProductPopoverId(null)
      return
    }
    const formatted = capitalizeWords(trimmed)
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              productId: "none",
              productName: formatted,
              productInput: formatted,
            }
          : item,
      ),
    )
    setOpenProductPopoverId(null)
    focusQuantityInput(itemId)
  }

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0)
    const total = Math.max(0, subtotal - Number(discount || 0))
    return { subtotal, total }
  }, [items, discount])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedCustomerName = customerInputValue.trim()

    if (!selectedCustomerId && trimmedCustomerName.length === 0) {
      toast.error("Debe ingresar el nombre del cliente")
      return
    }

    const branchIdForSubmit = isAdmin
      ? (normalizedSelectedBranchId || null)
      : currentUserBranchId ?? (normalizedSelectedBranchId || null)

    const preparedItems = items
      .filter((item) => (item.productId !== "none") || item.productName.trim().length > 0)
      .map(({ productId, productName, quantity, unitPrice, subtotal }) => ({
        productId: productId !== "none" ? productId : null,
        productName: productName.trim().length > 0 ? capitalizeWords(productName.trim()) : undefined,
        quantity,
        unitPrice,
        subtotal,
      }))

    if (preparedItems.length === 0) {
      toast.error("Debe agregar al menos un producto")
      return
    }

    setIsLoading(true)
    try {
      const expiresAtIso = expiresAt ? toEndOfDayISO(expiresAt) : undefined
      const normalizedCustomerPhone = customerPhoneInput.trim() || undefined

      await onSave({
        customerId: selectedCustomerId,
        customerName: selectedCustomerId ? undefined : trimmedCustomerName,
        customerPhone: normalizedCustomerPhone,
        branchId: branchIdForSubmit,
        subtotal: totals.subtotal,
        discount,
        total: totals.total,
        expiresAt: expiresAtIso,
        notes,
        items: preparedItems
      })
    } finally {
      setIsLoading(false)
    }
  }

  const hasValidItems = items.some((item) => (item.productId !== "none") || item.productName.trim().length > 0)
  const isBranchInvalid =
    isAdmin && (!normalizedSelectedBranchId || normalizedSelectedBranchId.trim().length === 0)
  const isSubmitDisabled =
    customerInputValue.trim().length === 0 ||
    !hasValidItems ||
    isBranchInvalid ||
    isLoading ||
    isLoadingData ||
    isBusy
  const isFormLocked = isLoading || isLoadingData || isBusy

  return (
     <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[92vh] flex flex-col overflow-hidden p-0">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#111111]/95 backdrop-blur">
          <DialogHeader className="px-0 py-0 space-y-2">
            <DialogTitle>
              {quotation ? "Editar Cotización" : "Nueva Cotización"}
            </DialogTitle>
            <DialogDescription>
              {quotation 
                ? "Modifica los datos de la cotización" 
                : "Completa los datos para crear una nueva cotización"}
            </DialogDescription>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 bg-gray-50/60 dark:bg-[#0c0c0c]">
            <div className="space-y-6">
              {/* Cliente con ComboBox */}
              <div className="space-y-5" ref={customerContainerRef}>
                {isAdmin ? (
                  <>
                    {renderCustomerInput("")}
                    <div className="flex flex-col md:flex-row md:items-end md:gap-4 gap-4">
                      <div className="md:flex-1">
                        <Label htmlFor="quotation-branch" className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                          Sucursal
                        </Label>
                        <Select
                          value={selectedBranchId}
                          onValueChange={(value) => {
                            setSelectedBranchId(value)
                          }}
                          disabled={isFormLocked}
                        >
                          <SelectTrigger id="quotation-branch" className="mt-2 w-full rounded-2xl">
                            <SelectValue placeholder="Selecciona una sucursal" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={PLACEHOLDER_BRANCH_VALUE}>Selecciona una sucursal</SelectItem>
                            {branchOptions.map((branch) => (
                              <SelectItem key={branch.id} value={branch.id}>
                                {branch.name ?? "Sin sucursal"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {renderPhoneInput("md:flex-1")}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col md:flex-row md:items-end md:gap-4 gap-4">
                    {renderCustomerInput("md:flex-1")}
                    {renderPhoneInput("md:w-[320px]")}
                  </div>
                )}
              </div>
              {/* Items */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Productos</Label>

                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-[#2a2a2a] rounded-3xl">
                    <Package2 className="h-10 w-10" />
                    <p className="text-sm">No hay productos agregados</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={addItem}
                      disabled={isFormLocked}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Agregar Producto
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => {
                      const productTriggerId = `quotation-product-${item.id}`
                      const quantityInputId = `quotation-quantity-${item.id}`
                      const priceInputId = `quotation-price-${item.id}`

                      return (
                        <div
                          key={item.id}
                          className="grid gap-2 lg:gap-4 lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.7fr))_auto] items-start border border-gray-200 dark:border-[#2f2f2f] rounded-2xl bg-white dark:bg-[#181818] px-4 py-4 shadow-sm"
                        >
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Producto</Label>
                            <Popover
                              open={openProductPopoverId === item.id}
                              onOpenChange={(open) => handleProductPopoverChange(item.id, open)}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  id={productTriggerId}
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between rounded-xl text-left h-[44px] border border-gray-200 dark:border-[#2f2f2f] bg-white dark:bg-[#1f1f1f]"
                                  disabled={isFormLocked}
                                  aria-haspopup="listbox"
                                  aria-expanded={openProductPopoverId === item.id}
                                >
                                  <span className="truncate text-gray-900 dark:text-white">
                                    {item.productName.trim().length > 0
                                      ? capitalizeWords(item.productName)
                                      : "Seleccionar o escribir producto"}
                                  </span>
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0" align="start" sideOffset={6}>
                                <Command>
                                  <CommandInput
                                    placeholder="Buscar o escribir producto..."
                                    value={item.productInput}
                                    onValueChange={(value) => handleProductInputChange(item.id, value)}
                                    onKeyDown={(event) => handleProductInputKeyDown(item.id, event)}
                                    autoFocus
                                  />
                                  <CommandList>
                                    <CommandEmpty>
                                      {item.productInput.trim().length > 0
                                        ? `Presiona Enter para usar "${capitalizeWords(item.productInput.trim())}"`
                                        : "No se encontraron productos"}
                                    </CommandEmpty>
                                    <CommandGroup>
                                      {products
                                        .filter((product) => {
                                          const isAlreadySelected = items.some(
                                            (otherItem) =>
                                              otherItem.id !== item.id && otherItem.productId === product.id,
                                          )

                                          if (isAlreadySelected) {
                                            return false
                                          }

                                          if (item.productInput.trim().length === 0) {
                                            return true
                                          }

                                          return product.name
                                            ?.toLowerCase()
                                            .includes(item.productInput.toLowerCase())
                                        })
                                        .map((product) => (
                                          <CommandItem
                                            key={product.id}
                                            value={product.name || ""}
                                            onSelect={() => handleProductSelect(item.id, product)}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                item.productId === product.id ? "opacity-100" : "opacity-0",
                                              )}
                                            />
                                            <span className="truncate">
                                              {product.name} · ${Number(product.price).toFixed(2)}
                                            </span>
                                          </CommandItem>
                                        ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor={quantityInputId} className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                              Cantidad
                            </Label>
                            <Input
                              id={quantityInputId}
                              type="number"
                              placeholder="Cant."
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                              ref={(element) => {
                                const map = quantityInputRefs.current
                                if (element) {
                                  map.set(item.id, element)
                                } else {
                                  map.delete(item.id)
                                }
                              }}
                              className="rounded-xl h-11"
                              min="1"
                              disabled={isFormLocked}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor={priceInputId} className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                              Precio
                            </Label>
                            <Input
                              id={priceInputId}
                              type="number"
                              placeholder="Precio"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
                              className="rounded-xl h-11"
                              step="0.01"
                              min="0"
                              disabled={isFormLocked}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                              Subtotal
                            </Label>
                            <div className="flex items-center justify-center rounded-xl bg-gray-100 dark:bg-[#242424] px-4 py-2 h-11">
                              <span className="font-semibold text-gray-900 dark:text-white">${item.subtotal.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="flex items-end justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="rounded-full h-10 w-10 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20"
                              onClick={() => removeItem(item.id)}
                              disabled={isFormLocked || items.length === 1}
                              aria-label="Eliminar producto"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                    <div className="flex justify-center pt-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={addItem}
                        disabled={isFormLocked}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Agregar Producto
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              {/* Totales y extras */}
              <div className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-2">
                   <div className="space-y-2">
                     <Label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Subtotal</Label>
                    <Input
                      type="text"
                      value={`$${totals.subtotal.toFixed(2)}`}
                      readOnly
                      className="rounded-2xl font-semibold text-right bg-[color-mix(in_oklch,var(--primary)_8%,white)] dark:bg-[color-mix(in_oklch,var(--primary)_18%,black)] text-gray-900 dark:text-white border border-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount" className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Descuento</Label>
                    <Input
                      id="discount"
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(normalizeNumber(e.target.value, 0))}
                      onFocus={(e) => {
                        if (e.target.value === "0" || e.target.value === "0.0" || e.target.value === "0.00") {
                          setDiscount(0)
                          e.target.value = ""
                        } else {
                          e.target.select()
                        }
                      }}
                      className="rounded-2xl"
                      step="0.01"
                      min="0"
                      disabled={isFormLocked}
                    />
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="expiresAt" className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Fecha de Expiración</Label>
                    <Input
                      id="expiresAt"
                      type="date"
                      value={expiresAt}
                      min={todayInputValue}
                      onChange={(e) => {
                        const value = e.target.value
                        if (!value) {
                          setExpiresAt("")
                          return
                        }
                        setExpiresAt(value < todayInputValue ? todayInputValue : value)
                      }}
                      className="rounded-2xl"
                      disabled={isFormLocked}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total" className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Total</Label>
                    <Input
                      id="total"
                      type="text"
                      value={`$${totals.total.toFixed(2)}`}
                      readOnly
                      className="rounded-2xl font-semibold text-right bg-[color-mix(in_oklch,var(--primary)_12%,white)] dark:bg-[color-mix(in_oklch,var(--primary)_24%,black)] text-gray-900 dark:text-white border border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Notas</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notas adicionales..."
                    disabled={isFormLocked}
                    rows={4}
                    className="rounded-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex w-full justify-center sm:justify-center items-center gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4 bg-white/95 dark:bg-[#111111]/95 backdrop-blur">
            <Button 
              type="button" 
              variant="outline" 
              className="rounded-full"
              onClick={() => onOpenChange(false)}
              disabled={isFormLocked}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="new"
              className="rounded-full px-6"
              disabled={isSubmitDisabled}
            >
              {isLoading ? "Guardando..." : quotation ? "Actualizar" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}