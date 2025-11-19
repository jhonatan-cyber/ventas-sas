"use client"

import { SalesCustomer, SalesProduct } from "@prisma/client"
import { Check, ChevronDown, Package2, Plus, Trash2, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { toast } from "sonner"

import { SalesQuotationWithRelations } from "./types"

import { Button } from "@/components/ui/button"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { formatCurrencyWithPreferences, formatDateWithPreferences, invalidateConfigCache } from "@/lib/utils/preferences"

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
  quotation?: SalesQuotationWithRelations | null
  organizationId: string
  customerSlug: string
  onSave: (data: any) => void
  isBusy?: boolean
  branches?: BranchOption[]
  isAdmin?: boolean
  currentUserBranchId?: string | null
  maxBranches?: number | null
}

interface QuotationItemRow {
  id: string
  productId: string
  productName: string
  productInput: string
  quantity: number | string
  unitPrice: number | string
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
  maxBranches,
}: QuotationFormDialogProps) {
  const t = useTranslations()
  const isMobile = useIsMobile()
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [customerInputValue, setCustomerInputValue] = useState("")
  const [customerPhoneInput, setCustomerPhoneInput] = useState("")
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false)
  const [highlightedCustomerIndex, setHighlightedCustomerIndex] = useState(0)
  const [isManualCustomerUsed, setIsManualCustomerUsed] = useState(false)
  const customerContainerRef = useRef<HTMLDivElement>(null)
  const customerInputRef = useRef<HTMLInputElement>(null)
  const PLACEHOLDER_BRANCH_VALUE = "__placeholder__"
  const [selectedBranchId, setSelectedBranchId] = useState<string>(PLACEHOLDER_BRANCH_VALUE)

  const [customers, setCustomers] = useState<(SalesCustomer & { lastName?: string | null })[]>([])
  const [products, setProducts] = useState<SalesProduct[]>([])
  const [items, setItems] = useState<QuotationItemRow[]>([])
  const [openProductDropdownId, setOpenProductDropdownId] = useState<string | null>(null)
  const [highlightedProductIndex, setHighlightedProductIndex] = useState<Record<string, number>>({})
  const productInputRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const productContainerRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const quantityInputRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const [discount, setDiscount] = useState(0)
  const [expiresAt, setExpiresAt] = useState("")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [formattedTotal, setFormattedTotal] = useState("")
  const [countryCode, setCountryCode] = useState<string>("+591") // Código de país por defecto
  const [currency, setCurrency] = useState<string>("BOB") // Moneda por defecto
  const todayInputValue = useMemo(() => getTodayInputValue(), [])
  const branchOptions = useMemo<BranchOption[]>(() => {
    return (branches ?? []).map((branch) => ({
      id: branch.id,
      name: branch.name ?? t('common.noBranch'),
    }))
  }, [branches, t])

  // Ocultar select de sucursal si el plan solo permite una y solo hay una disponible
  const shouldHideBranchSelect = maxBranches === 1 && branchOptions.length === 1
  const normalizedSelectedBranchId =
    selectedBranchId === PLACEHOLDER_BRANCH_VALUE ? "" : selectedBranchId
  const renderCustomerInput = (wrapperClassName: string) => (
    <div className={cn("w-full", wrapperClassName)}>
      <Label htmlFor="customer" className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
        {t('quotations.form.customer')} <span className="text-red-500">*</span>
      </Label>
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
            setIsManualCustomerUsed(false) // Reset cuando se está escribiendo
          }}
          onFocus={() => setIsCustomerDropdownOpen(true)}
          onKeyDown={handleCustomerKeyDown}
          onBlur={() => {
            // No cerrar inmediatamente para permitir clics en el dropdown
            setTimeout(() => setIsCustomerDropdownOpen(false), 200)
          }}
          placeholder={t('quotations.form.customerPlaceholder')}
          disabled={isFormLocked}
          className={`w-full px-5 py-3 ${isManualCustomerUsed ? 'pr-28' : 'pr-20'} border border-gray-200 dark:border-[#2a2a2a] rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklch,var(--primary)_50%,white)] bg-white dark:bg-[#161616] text-gray-900 dark:text-white shadow-sm`}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
          {isManualCustomerUsed && (
              <div className="p-1.5 flex items-center justify-center" title={t('quotations.form.customerNotRegistered')}>
              <Check size={16} className="text-green-600 dark:text-green-400" />
            </div>
          )}
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
                    className={`w-full text-left px-5 py-3 transition-colors ${index === highlightedCustomerIndex
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
                        {t('quotations.form.useCustomer')}: <span className="font-semibold">"{capitalizeWords(customerInputValue.trim())}"</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('quotations.form.pressEnterOrClick')}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 rounded-full"
                        onClick={() => handleManualCustomer(customerInputValue.trim())}
                      >
                        {t('quotations.form.useThisCustomer')}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('quotations.form.noCustomersFound')}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {t('quotations.form.customerNameHint')}
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

  const renderPhoneInput = (wrapperClassName: string) => {
    // Función para obtener solo el número sin el código de país para mostrar en el input
    const getPhoneNumberWithoutCode = (value: string) => {
      if (!value) return ""
      if (value.startsWith(countryCode)) {
        return value.substring(countryCode.length).trim()
      }
      if (value.startsWith('+')) {
        // Si tiene otro código de país, mantenerlo completo
        return value
      }
      return value
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      // Permitir solo números, espacios, guiones y el símbolo +
      const cleaned = inputValue.replace(/[^\d\s\-+]/g, '')
      setCustomerPhoneInput(cleaned)
    }

    const handlePhoneBlur = () => {
      // Al perder el foco, asegurar que tenga el código de país si tiene valor
      if (customerPhoneInput.trim() && !customerPhoneInput.startsWith('+')) {
        const cleaned = customerPhoneInput.replace(/\D/g, '')
        if (cleaned) {
          setCustomerPhoneInput(`${countryCode}${cleaned}`)
        }
      }
    }

    return (
      <div className={cn("w-full", wrapperClassName)}>
        <Label htmlFor="customerPhone" className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">{t('quotations.form.phone')}</Label>
        <div className="mt-2 relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm font-medium z-10 pointer-events-none">
            {countryCode}
          </div>
          <Input
            id="customerPhone"
            type="tel"
            value={getPhoneNumberWithoutCode(customerPhoneInput)}
            onChange={handlePhoneChange}
            onBlur={handlePhoneBlur}
            placeholder={t('quotations.form.phonePlaceholder')}
            disabled={isFormLocked}
            className="rounded-full pl-20"
          />
        </div>
      </div>
    )
  }

  // Filtrar clientes basados en el input
  const filteredCustomers = useMemo(() => {
    if (!customerInputValue.trim()) return customers
    const search = customerInputValue.trim().toLowerCase()
    return customers.filter(customer => {
      const combined = `${customer.name ?? ""} ${customer.lastName ?? ""}`.trim().toLowerCase()
      return combined.includes(search)
    })
  }, [customers, customerInputValue])

  // Filtrar productos basados en el input de cada item
  const getFilteredProducts = useCallback((itemId: string) => {
    const item = items.find(i => i.id === itemId)
    if (!item) return []

    const search = item.productInput.trim().toLowerCase()
    if (!search) return products.filter(p => !items.some(i => i.id !== itemId && i.productId === p.id))

    return products.filter(product => {
      const isAlreadySelected = items.some(
        (otherItem) => otherItem.id !== itemId && otherItem.productId === product.id
      )
      if (isAlreadySelected) return false
      return product.name?.toLowerCase().includes(search)
    })
  }, [products, items])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerContainerRef.current && !customerContainerRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false)
      }
      // Cerrar dropdowns de productos
      productContainerRefs.current.forEach((container, itemId) => {
        if (container && !container.contains(event.target as Node)) {
          setOpenProductDropdownId(prev => prev === itemId ? null : prev)
        }
      })
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadCustomers = useCallback(async () => {
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
  }, [customerSlug])

  const loadProducts = useCallback(async (branchIdOverride?: string | null) => {
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
  }, [customerSlug, isAdmin, currentUserBranchId])

  const loadCountryCode = useCallback(async () => {
    try {
      const response = await fetch(`/api/${customerSlug}/config/preferencias`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        if (data.configuration?.whatsappCountryCode) {
          setCountryCode(data.configuration.whatsappCountryCode)
        }
        // También cargar la moneda
        if (data.configuration?.currency) {
          setCurrency(data.configuration.currency)
          // Invalidar caché para que otras funciones usen la moneda actualizada
          invalidateConfigCache(customerSlug)
        }
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error)
    }
  }, [customerSlug])

  // Cargar clientes y productos
  useEffect(() => {
    if (open) {
      loadCustomers()
      const initialBranchId = isAdmin
        ? selectedBranchId
        : currentUserBranchId
      loadProducts(initialBranchId)
      loadCountryCode()
    }
  }, [open, customerSlug, isAdmin, selectedBranchId, currentUserBranchId, loadCustomers, loadProducts, loadCountryCode])

  useEffect(() => {
    if (!open || !isAdmin) return
    loadProducts(selectedBranchId)
  }, [open, isAdmin, selectedBranchId, loadProducts])

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
      setIsManualCustomerUsed(false) // Reset al abrir nuevo formulario
      // Si el plan solo permite una sucursal y solo hay una disponible, seleccionarla automáticamente
      const autoSelectBranchId = shouldHideBranchSelect && branchOptions.length === 1
        ? branchOptions[0].id
        : currentUserBranchId ?? PLACEHOLDER_BRANCH_VALUE
      setSelectedBranchId(autoSelectBranchId)
      setDiscount(0)
      setExpiresAt("")
      setNotes("")
      setItems([createEmptyItem()])
    }
  }, [branchOptions, currentUserBranchId, isAdmin, open, quotation, todayInputValue, shouldHideBranchSelect])

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
    setIsManualCustomerUsed(false) // Reset cuando se selecciona un cliente registrado
  }

  const clearCustomer = () => {
    setSelectedCustomerId(null)
    setCustomerInputValue("")
    if (!isMobile) {
      customerInputRef.current?.focus()
    }
    setHighlightedCustomerIndex(0)
    setCustomerPhoneInput("")
    setIsManualCustomerUsed(false) // Reset al limpiar
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
    setIsManualCustomerUsed(true) // Marcar como usado cuando se confirma el cliente manual
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
            const qty = typeof updated.quantity === 'string' ? (updated.quantity === '' ? 1 : Number(updated.quantity) || 1) : updated.quantity
            updated.subtotal = unitPrice * qty
          }
        } else if (field === "quantity") {
          // Permitir valores vacíos temporalmente
          if (rawValue === "" || rawValue === null || rawValue === undefined) {
            updated.quantity = ""
          } else {
            const numValue = typeof rawValue === 'string' ? parseFloat(rawValue) : rawValue
            if (!isNaN(numValue) && numValue >= 0) {
              updated.quantity = numValue
            } else {
              updated.quantity = ""
            }
          }
          // Calcular subtotal solo si ambos valores son números válidos
          const qty = typeof updated.quantity === 'string' ? (updated.quantity === '' ? 0 : Number(updated.quantity) || 0) : updated.quantity
          const price = typeof updated.unitPrice === 'string' ? (updated.unitPrice === '' ? 0 : Number(updated.unitPrice) || 0) : updated.unitPrice
          updated.subtotal = qty * price
        } else if (field === "unitPrice") {
          // Permitir valores vacíos temporalmente
          if (rawValue === "" || rawValue === null || rawValue === undefined) {
            updated.unitPrice = ""
          } else {
            const numValue = typeof rawValue === 'string' ? parseFloat(rawValue) : rawValue
            if (!isNaN(numValue) && numValue >= 0) {
              updated.unitPrice = numValue
            } else {
              updated.unitPrice = ""
            }
          }
          // Calcular subtotal solo si ambos valores son números válidos
          const qty = typeof updated.quantity === 'string' ? (updated.quantity === '' ? 0 : Number(updated.quantity) || 0) : updated.quantity
          const price = typeof updated.unitPrice === 'string' ? (updated.unitPrice === '' ? 0 : Number(updated.unitPrice) || 0) : updated.unitPrice
          updated.subtotal = qty * price
        }

        return updated
      })
    })
  }

  const normalizeItemField = (id: string, field: "quantity" | "unitPrice") => {
    setItems((prev) => {
      return prev.map((item) => {
        if (item.id !== id) return item

        const updated: QuotationItemRow = { ...item }

        if (field === "quantity") {
          const qty = typeof item.quantity === 'string'
            ? (item.quantity === '' ? 1 : Math.max(1, Math.floor(Number(item.quantity) || 1)))
            : Math.max(1, Math.floor(item.quantity))
          updated.quantity = qty
          const price = typeof item.unitPrice === 'string' ? (Number(item.unitPrice) || 0) : item.unitPrice
          updated.subtotal = qty * price
        } else if (field === "unitPrice") {
          const price = typeof item.unitPrice === 'string'
            ? (item.unitPrice === '' ? 0 : Math.max(0, Number(item.unitPrice) || 0))
            : Math.max(0, item.unitPrice)
          updated.unitPrice = price
          const qty = typeof item.quantity === 'string' ? (Number(item.quantity) || 1) : item.quantity
          updated.subtotal = qty * price
        }

        return updated
      })
    })
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
    setOpenProductDropdownId(id)
    setHighlightedProductIndex(prev => ({ ...prev, [id]: 0 }))
  }

  const handleProductKeyDown = (itemId: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    const filtered = getFilteredProducts(itemId)
    const currentIndex = highlightedProductIndex[itemId] ?? 0

    if (!openProductDropdownId && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpenProductDropdownId(itemId)
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedProductIndex(prev => ({
          ...prev,
          [itemId]: currentIndex < filtered.length - 1 ? currentIndex + 1 : 0
        }))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedProductIndex(prev => ({
          ...prev,
          [itemId]: currentIndex > 0 ? currentIndex - 1 : filtered.length - 1
        }))
        break
      case 'Enter':
        e.preventDefault()
        if (filtered[currentIndex]) {
          handleProductSelect(itemId, filtered[currentIndex])
        } else {
          const current = items.find((item) => item.id === itemId)
          const trimmed = current?.productInput.trim() ?? ""
          if (trimmed.length > 0) {
            handleProductManualSelection(itemId, trimmed)
          }
        }
        break
      case 'Escape':
        setOpenProductDropdownId(null)
        break
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
            subtotal: Number(product.price || 0) * (typeof item.quantity === 'string' ? (Number(item.quantity) || 1) : item.quantity),
          }
          : item,
      ),
    )
    setOpenProductDropdownId(null)
    focusQuantityInput(itemId)
  }

  const handleProductManualSelection = (itemId: string, value: string) => {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      setOpenProductDropdownId(null)
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
    setOpenProductDropdownId(null)
    focusQuantityInput(itemId)
  }

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0)
    const total = Math.max(0, subtotal - Number(discount || 0))
    return { subtotal, total }
  }, [items, discount])

  // Actualizar el total formateado cuando cambia el total o la moneda
  useEffect(() => {
    if (open && typeof window !== 'undefined') {
      // Usar la moneda cargada desde la API
      setFormattedTotal(formatCurrencyWithPreferences(totals.total, customerSlug, currency))
    }
  }, [totals.total, customerSlug, open, currency])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedCustomerName = customerInputValue.trim()

    // Validación 1: Cliente (ID o nombre manual)
    if (!selectedCustomerId && trimmedCustomerName.length === 0) {
      toast.error(t('quotations.form.customerRequired'))
      return
    }

    // Validación 2: Fecha de expiración (obligatoria)
    if (!expiresAt || expiresAt.trim().length === 0) {
      toast.error(t('quotations.form.expirationDateRequired'))
      return
    }

    // Si el select está oculto, usar automáticamente la única sucursal disponible
    let branchIdForSubmit: string | null = null
    if (shouldHideBranchSelect && branchOptions.length === 1) {
      branchIdForSubmit = branchOptions[0].id
    } else if (isAdmin) {
      branchIdForSubmit = normalizedSelectedBranchId || null
    } else {
      branchIdForSubmit = currentUserBranchId ?? (normalizedSelectedBranchId || null)
    }

    // Validación 3: Productos (al menos 1 con cantidad >= 1 y precio > 1)
    const validItems = items.filter((item) => {
      const hasProduct = (item.productId !== "none") || item.productName.trim().length > 0
      if (!hasProduct) return false
      
      const qty = Number(item.quantity) || 0
      const price = Number(item.unitPrice) || 0
      
      return qty >= 1 && price > 1
    })

    if (validItems.length === 0) {
      toast.error(t('quotations.form.itemsRequired'))
      return
    }

    const preparedItems = validItems
      .map(({ productId, productName, quantity, unitPrice, subtotal }) => ({
        productId: productId !== "none" ? productId : null,
        productName: productName.trim().length > 0 ? capitalizeWords(productName.trim()) : undefined,
        quantity,
        unitPrice,
        subtotal,
      }))

    setIsLoading(true)
    try {
      const expiresAtIso = expiresAt ? toEndOfDayISO(expiresAt) : undefined
      // Asegurar que el teléfono tenga el código de país
      let normalizedCustomerPhone = customerPhoneInput.trim() || undefined
      if (normalizedCustomerPhone && !normalizedCustomerPhone.startsWith('+')) {
        const cleaned = normalizedCustomerPhone.replace(/\D/g, '')
        if (cleaned) {
          normalizedCustomerPhone = `${countryCode}${cleaned}`
        }
      }

      const payload = {
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
      }

      await onSave(payload)
    } finally {
      setIsLoading(false)
    }
  }

  // Validar items: al menos uno con cantidad >= 1 y precio > 1
  const hasValidItems = items.some((item) => {
    const hasProduct = (item.productId !== "none") || item.productName.trim().length > 0
    if (!hasProduct) return false
    
    const qty = Number(item.quantity) || 0
    const price = Number(item.unitPrice) || 0
    
    return qty >= 1 && price > 1
  })
  
  // Si el select está oculto, no validar branchId (ya se establece automáticamente)
  const isBranchInvalid =
    !shouldHideBranchSelect &&
    isAdmin &&
    (!normalizedSelectedBranchId || normalizedSelectedBranchId.trim().length === 0)
  
  // Validar que haya cliente (ID o nombre)
  const hasValidCustomer = selectedCustomerId || customerInputValue.trim().length > 0
  
  // Validar fecha de expiración
  const hasValidExpirationDate = expiresAt && expiresAt.trim().length > 0
  
  const isSubmitDisabled =
    !hasValidCustomer ||
    !hasValidItems ||
    !hasValidExpirationDate ||
    isBranchInvalid ||
    isLoading ||
    isLoadingData ||
    isBusy
  const isFormLocked = isLoading || isLoadingData || isBusy

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[900px] lg:max-w-2xl max-h-[92vh] flex flex-col overflow-hidden p-0 rounded-lg"
        onOpenAutoFocus={(e) => {
          e.preventDefault()
        }}
      >
        <div className="px-6 sm:px-8 py-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky top-0 z-10">
          <DialogHeader className="px-0 py-0 space-y-2">
            <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-white">
              {quotation ? t('quotations.edit') : t('quotations.new')}
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              {quotation
                ? t('quotations.editDescription')
                : t('quotations.newDescription')}
            </DialogDescription>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-8 bg-gray-50/60 dark:bg-[#0c0c0c]">
            <div className="space-y-6">
              {/* Cliente con ComboBox */}
              <div className="space-y-5" ref={customerContainerRef}>
                {isAdmin ? (
                  <>
                    {renderCustomerInput("")}
                    <div className="flex flex-col md:flex-row md:items-end md:gap-4 gap-4">
                      {!shouldHideBranchSelect && (
                        <div className="md:flex-1">
                          <Label htmlFor="quotation-branch" className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                            {t('form.branch')}
                          </Label>
                          <Select
                            value={selectedBranchId}
                            onValueChange={(value) => {
                              setSelectedBranchId(value)
                            }}
                            disabled={isFormLocked}
                          >
                            <SelectTrigger id="quotation-branch" className="mt-2 w-full rounded-full">
                              <SelectValue placeholder={t('quotations.form.selectBranch')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={PLACEHOLDER_BRANCH_VALUE}>{t('quotations.form.selectBranch')}</SelectItem>
                              {branchOptions.map((branch) => (
                                <SelectItem key={branch.id} value={branch.id}>
                                  {branch.name ?? t('common.noBranch')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
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
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                  {t('quotations.form.items')} <span className="text-red-500">*</span>
                </Label>

                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-[#2a2a2a] rounded-full">
                    <Package2 className="h-10 w-10" />
                    <p className="text-sm">{t('quotations.form.noProducts')}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={addItem}
                      disabled={isFormLocked}
                    >
                      <Plus className="h-4 w-4 mr-1" /> {t('quotations.form.addProduct')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => {
                      const quantityInputId = `quotation-quantity-${item.id}`
                      const priceInputId = `quotation-price-${item.id}`

                      return (
                        <div
                          key={item.id}
                          className="space-y-3 border border-gray-200 dark:border-[#2f2f2f] rounded-2xl bg-white dark:bg-[#181818] px-4 py-4 shadow-sm lg:grid lg:gap-4 lg:grid-cols-[2fr_0.9fr_0.4fr_auto] lg:space-y-0 items-start"
                        >
                          {/* Desktop: Producto y Cantidad en una fila (3/4 y 1/4) */}
                          <div className="hidden lg:grid lg:grid-cols-[3fr_1fr] lg:gap-3 lg:space-y-0">
                            <div className="space-y-1">
                              <Label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{t('quotations.form.product')}</Label>
                              <div
                                ref={(el) => {
                                  if (el) productContainerRefs.current.set(item.id, el)
                                  else productContainerRefs.current.delete(item.id)
                                }}
                                className="relative"
                              >
                                <input
                                  ref={(el) => {
                                    if (el) productInputRefs.current.set(item.id, el)
                                    else productInputRefs.current.delete(item.id)
                                  }}
                                  type="text"
                                  value={item.productInput}
                                  onChange={(e) => handleProductInputChange(item.id, e.target.value)}
                                  onFocus={() => setOpenProductDropdownId(item.id)}
                                  onKeyDown={(e) => handleProductKeyDown(item.id, e)}
                                  onBlur={() => {
                                    setTimeout(() => setOpenProductDropdownId(null), 200)
                                  }}
                                  placeholder={t('quotations.form.customerPlaceholder').replace('cliente', 'producto')}
                                  disabled={isLoading || isBusy}
                                  className="w-full px-4 py-3 pr-20 border border-gray-200 dark:border-[#2a2a2a] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklch,var(--primary)_50%,white)] bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-white shadow-sm h-[44px]"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                                  {item.productInput && (
                                    <button
                                      onClick={() => {
                                        setItems((prev) =>
                                          prev.map((i) =>
                                            i.id === item.id
                                              ? {
                                                ...i,
                                                productId: "none",
                                                productInput: "",
                                                productName: "",
                                                unitPrice: 0,
                                                subtotal: 0,
                                              }
                                              : i,
                                          ),
                                        )
                                        setOpenProductDropdownId(null)
                                      }}
                                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                                      type="button"
                                      disabled={isLoading || isBusy}
                                    >
                                      <X size={16} className="text-gray-500" />
                                    </button>
                                  )}

                                  <button
                                    onClick={() => setOpenProductDropdownId(openProductDropdownId === item.id ? null : item.id)}
                                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                                    type="button"
                                    disabled={isLoading || isBusy}
                                  >
                                    <ChevronDown
                                      size={16}
                                      className={`text-gray-500 transition-transform ${openProductDropdownId === item.id ? 'rotate-180' : ''}`}
                                    />
                                  </button>
                                </div>

                                {openProductDropdownId === item.id && (
                                  <div className="absolute left-0 right-0 mt-2 z-20 bg-white dark:bg-[#161616] border border-gray-200 dark:border-[#2a2a2a] rounded-2xl shadow-xl overflow-hidden">
                                    <div className="max-h-64 overflow-y-auto">
                                      {getFilteredProducts(item.id).length > 0 ? (
                                        getFilteredProducts(item.id).map((product, index) => (
                                          <button
                                            key={product.id}
                                            type="button"
                                            onClick={() => handleProductSelect(item.id, product)}
                                            onMouseEnter={() => setHighlightedProductIndex(prev => ({ ...prev, [item.id]: index }))}
                                            className={`w-full text-left px-5 py-3 transition-colors ${(highlightedProductIndex[item.id] ?? 0) === index
                                              ? 'bg-[color-mix(in_oklch,var(--primary)_18%,white)] text-gray-900 dark:bg-white/10 dark:text-white'
                                              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10'
                                              }`}
                                          >
                                            <div className="font-semibold">{product.name}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                              ${Number(product.price).toFixed(2)}
                                            </div>
                                          </button>
                                        ))
                                      ) : (
                                        <div className="px-5 py-6 text-center">
                                          {item.productInput.trim() ? (
                                            <div className="space-y-2">
                                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {t('quotations.form.useProduct')}: <span className="font-semibold">"{capitalizeWords(item.productInput.trim())}"</span>
                                              </p>
                                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {t('quotations.form.pressEnterOrClickProduct')}
                                              </p>
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="mt-2 rounded-full"
                                                onClick={() => handleProductManualSelection(item.id, item.productInput.trim())}
                                              >
                                                {t('quotations.form.useThisProduct')}
                                              </Button>
                                            </div>
                                          ) : (
                                            <div className="space-y-2">
                                              <p className="text-sm text-gray-500 dark:text-gray-400">{t('quotations.form.noProductsFound')}</p>
                                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                                {t('quotations.form.productNameHint')}
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

                            <div className="space-y-1">
                              <Label htmlFor={quantityInputId} className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                                {t('form.quantity')}
                              </Label>
                              <Input
                                id={quantityInputId}
                                type="number"
                                placeholder={t('quotations.form.quantityShort')}
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                                onBlur={() => normalizeItemField(item.id, "quantity")}
                                ref={(element) => {
                                  const map = quantityInputRefs.current
                                  if (element) {
                                    map.set(item.id, element)
                                  } else {
                                    map.delete(item.id)
                                  }
                                }}
                                className="rounded-full h-11"
                                min="1"
                                disabled={isFormLocked}
                              />
                            </div>
                          </div>

                          {/* Móvil: Producto solo */}
                          <div className="space-y-1 lg:hidden">
                            <Label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Producto</Label>
                            <div
                              ref={(el) => {
                                if (el) productContainerRefs.current.set(item.id, el)
                                else productContainerRefs.current.delete(item.id)
                              }}
                              className="relative"
                            >
                              <input
                                ref={(el) => {
                                  if (el) productInputRefs.current.set(item.id, el)
                                  else productInputRefs.current.delete(item.id)
                                }}
                                type="text"
                                value={item.productInput}
                                onChange={(e) => handleProductInputChange(item.id, e.target.value)}
                                onFocus={() => setOpenProductDropdownId(item.id)}
                                onKeyDown={(e) => handleProductKeyDown(item.id, e)}
                                onBlur={() => {
                                  setTimeout(() => setOpenProductDropdownId(null), 200)
                                }}
                                placeholder={t('common.placeholders.productName')}
                                disabled={isLoading || isBusy}
                                className="w-full px-4 py-3 pr-20 border border-gray-200 dark:border-[#2a2a2a] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklch,var(--primary)_50%,white)] bg-white dark:bg-[#1f1f1f] text-gray-900 dark:text-white shadow-sm h-[44px]"
                              />
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                                {item.productInput && (
                                  <button
                                    onClick={() => {
                                      setItems((prev) =>
                                        prev.map((i) =>
                                          i.id === item.id
                                            ? {
                                              ...i,
                                              productId: "none",
                                              productInput: "",
                                              productName: "",
                                              unitPrice: 0,
                                              subtotal: 0,
                                            }
                                            : i,
                                        ),
                                      )
                                      setOpenProductDropdownId(null)
                                    }}
                                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                                    type="button"
                                    disabled={isLoading || isBusy}
                                  >
                                    <X size={16} className="text-gray-500" />
                                  </button>
                                )}

                                <button
                                  onClick={() => setOpenProductDropdownId(openProductDropdownId === item.id ? null : item.id)}
                                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                                  type="button"
                                  disabled={isLoading || isBusy}
                                >
                                  <ChevronDown
                                    size={16}
                                    className={`text-gray-500 transition-transform ${openProductDropdownId === item.id ? 'rotate-180' : ''}`}
                                  />
                                </button>
                              </div>

                              {openProductDropdownId === item.id && (
                                <div className="absolute left-0 right-0 mt-2 z-20 bg-white dark:bg-[#161616] border border-gray-200 dark:border-[#2a2a2a] rounded-2xl shadow-xl overflow-hidden">
                                  <div className="max-h-64 overflow-y-auto">
                                    {getFilteredProducts(item.id).length > 0 ? (
                                      getFilteredProducts(item.id).map((product, index) => (
                                        <button
                                          key={product.id}
                                          type="button"
                                          onClick={() => handleProductSelect(item.id, product)}
                                          onMouseEnter={() => setHighlightedProductIndex(prev => ({ ...prev, [item.id]: index }))}
                                          className={`w-full text-left px-5 py-3 transition-colors ${(highlightedProductIndex[item.id] ?? 0) === index
                                            ? 'bg-[color-mix(in_oklch,var(--primary)_18%,white)] text-gray-900 dark:bg-white/10 dark:text-white'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10'
                                            }`}
                                        >
                                          <div className="font-semibold">{product.name}</div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            ${Number(product.price).toFixed(2)}
                                          </div>
                                        </button>
                                      ))
                                    ) : (
                                      <div className="px-5 py-6 text-center">
                                        {item.productInput.trim() ? (
                                          <div className="space-y-2">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                              Usar producto: <span className="font-semibold">"{capitalizeWords(item.productInput.trim())}"</span>
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                              Presiona Enter o haz clic aquí para usar este producto sin registrarlo
                                            </p>
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              className="mt-2 rounded-full"
                                              onClick={() => handleProductManualSelection(item.id, item.productInput.trim())}
                                            >
                                              Usar este producto
                                            </Button>
                                          </div>
                                        ) : (
                                          <div className="space-y-2">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">No se encontraron productos registrados</p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                              Nombre del producto para crearlo automáticamente en la cotización
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

                          <div className="space-y-1 hidden lg:block">
                            <Label htmlFor={priceInputId} className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                              {t('quotations.form.price')}
                            </Label>
                            <Input
                              id={priceInputId}
                              type="number"
                              placeholder={t('quotations.form.price')}
                              value={item.unitPrice}
                              onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
                              onBlur={() => normalizeItemField(item.id, "unitPrice")}
                              className="rounded-full h-11"
                              step="0.01"
                              min="0"
                              disabled={isFormLocked}
                            />
                          </div>

                          {/* Móvil: Cantidad y Precio en grid de 2 columnas */}
                          <div className="grid grid-cols-2 gap-2 lg:hidden">
                            <div className="space-y-1">
                              <Label htmlFor={`${quantityInputId}-mobile`} className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                                {t('form.quantity')}
                              </Label>
                              <Input
                                id={`${quantityInputId}-mobile`}
                                type="number"
                                placeholder={t('quotations.form.quantityShort')}
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                                onBlur={() => normalizeItemField(item.id, "quantity")}
                                className="rounded-full h-11"
                                min="1"
                                disabled={isFormLocked}
                              />
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor={`${priceInputId}-mobile`} className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                                {t('quotations.form.price')}
                              </Label>
                              <Input
                                id={`${priceInputId}-mobile`}
                                type="number"
                                placeholder={t('quotations.form.price')}
                                value={item.unitPrice}
                                onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
                                onBlur={() => normalizeItemField(item.id, "unitPrice")}
                                className="rounded-full h-11"
                                step="0.01"
                                min="0"
                                disabled={isFormLocked}
                              />
                            </div>
                          </div>

                          <div className="space-y-1 hidden lg:block">
                            <Label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                              {t('quotations.form.subtotal')}
                            </Label>
                            <div className="flex items-center justify-center rounded-xl bg-gray-100 dark:bg-[#242424] px-2 py-2 h-11">
                              <span className="font-semibold text-sm text-gray-900 dark:text-white">{item.subtotal.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="flex items-end justify-end hidden lg:flex">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="rounded-full h-11 w-10 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20"
                              onClick={() => removeItem(item.id)}
                              disabled={isFormLocked || items.length === 1}
                              aria-label="Eliminar producto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Móvil: Subtotal y botón eliminar en grid de 2 columnas */}
                          <div className="grid grid-cols-[3fr_1fr] gap-2 lg:hidden">
                            <div className="space-y-1">
                              <Label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                                {t('quotations.form.subtotal')}
                              </Label>
                              <div className="flex items-center justify-center rounded-xl bg-gray-100 dark:bg-[#242424] px-4 py-2 h-11">
                                <span className="font-semibold text-gray-900 dark:text-white">{item.subtotal.toFixed(2)}</span>
                              </div>
                            </div>

                            <div className="flex items-end justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="rounded-full h-11 w-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20"
                                onClick={() => removeItem(item.id)}
                                disabled={isFormLocked || items.length === 1}
                                aria-label="Eliminar producto"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{t('quotations.form.subtotal')}</Label>
                    <Input
                      type="text"
                      value={totals.subtotal.toFixed(2)}
                      readOnly
                      className="rounded-full font-semibold text-right bg-[color-mix(in_oklch,var(--primary)_8%,white)] dark:bg-[color-mix(in_oklch,var(--primary)_18%,black)] text-gray-900 dark:text-white border border-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount" className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{t('quotations.form.discount')}</Label>
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
                      className="rounded-full"
                      step="0.01"
                      min="0"
                      disabled={isFormLocked}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiresAt" className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                      {t('quotations.form.validUntil')} <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="expiresAt"
                        type="date"
                        value={expiresAt}
                        min={todayInputValue}
                        required
                        onChange={(e) => {
                          const value = e.target.value
                          if (!value) {
                            setExpiresAt("")
                            return
                          }
                          setExpiresAt(value < todayInputValue ? todayInputValue : value)
                        }}
                        className={cn(
                          "w-full rounded-full",
                          // En móviles: ocultar el indicador y los campos de fecha nativos
                          isMobile && "[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-datetime-edit]:opacity-0 [&::-webkit-datetime-edit-text]:opacity-0 [&::-webkit-datetime-edit-month-field]:opacity-0 [&::-webkit-datetime-edit-day-field]:opacity-0 [&::-webkit-datetime-edit-year-field]:opacity-0 [&::-webkit-inner-spin-button]:opacity-0 [&::-webkit-outer-spin-button]:opacity-0",
                          // En PC: mostrar todo normalmente
                          !isMobile && "[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-10"
                        )}
                        disabled={isFormLocked}
                        style={expiresAt && isMobile ? { color: 'transparent', caretColor: 'transparent' } : undefined}
                      />
                      {!expiresAt && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2 sm:hidden">
                          <span className="text-sm text-gray-400">dd/mm/aaa</span>
                        </div>
                      )}
                      {expiresAt && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2 sm:hidden">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {(() => {
                              const [year, month, day] = expiresAt.split('-').map(Number)
                              const localDate = new Date(year, month - 1, day)
                              return formatDateWithPreferences(localDate, customerSlug)
                            })()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total" className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{t('quotations.form.total')}</Label>
                    <Input
                      id="total"
                      type="text"
                      value={formattedTotal || totals.total.toFixed(2)}
                      readOnly
                      className="rounded-full font-semibold text-right bg-[color-mix(in_oklch,var(--primary)_12%,white)] dark:bg-[color-mix(in_oklch,var(--primary)_24%,black)] text-gray-900 dark:text-white border border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{t('quotations.form.notes')}</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('quotations.form.notes') + '...'}
                    disabled={isFormLocked}
                    rows={4}
                    className="rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row w-full justify-center sm:justify-center items-stretch sm:items-center gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-6 sm:px-8 py-4 bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky bottom-0 z-10">
            <Button
              type="button"
              variant="outline"
              className="rounded-full w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
              disabled={isFormLocked}
            >
              {t('action.cancel')}
            </Button>
            <Button
              type="submit"
              variant="new"
              className="rounded-full px-6 w-full sm:w-auto"
              disabled={isSubmitDisabled}
            >
              {isLoading ? t('message.saving') : quotation ? t('action.update') : t('action.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}