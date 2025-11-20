"use client"

import { Organization } from "@prisma/client"
import { MapPin, Phone, Building2, User, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

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

interface CustomerOrganizationsFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization?: Organization
  initialCustomerId?: string
  onSave: (data: any) => void
}

// Función para capitalizar texto
const capitalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

interface Customer {
  id: string
  nombre?: string
  apellido?: string
  email?: string
  razonSocial?: string
}

export function CustomerOrganizationsFormDialog({
  open,
  onOpenChange,
  organization,
  initialCustomerId,
  onSave,
}: CustomerOrganizationsFormDialogProps) {
  const [customerId, setCustomerId] = useState("") // Cliente dueño (requerido)
  const [razonSocial, setRazonSocial] = useState("") // Razón social de la empresa (requerido)
  const [nit, setNit] = useState("")
  const [direccion, setDireccion] = useState("")
  const [telefono, setTelefono] = useState("")
  const [slug, setSlug] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)

  // Cargar clientes cuando se abre el modal
  useEffect(() => {
    if (open && !organization) {
      loadCustomers()
    }
  }, [open, organization])

  useEffect(() => {
    if (organization) {
      setRazonSocial((organization as any).razonSocial || "")
      setNit((organization as any).nit || "")
      setDireccion((organization as any).address || "")
      setTelefono((organization as any).phone || "")
      setSlug(organization.slug || "")
      setCustomerId("") // No se puede cambiar el dueño al editar
    } else {
      setRazonSocial("")
      setNit("")
      setDireccion("")
      setTelefono("")
      setSlug("")
      setCustomerId(initialCustomerId || "")
    }
  }, [organization, open, initialCustomerId])

  const loadCustomers = async () => {
    setIsLoadingCustomers(true)
    try {
      const response = await fetch("/api/administracion/customers?pageSize=1000")
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error("Error al cargar clientes:", error)
    } finally {
      setIsLoadingCustomers(false)
    }
  }

  const getCustomerName = (customer: Customer) => {
    if (customer.razonSocial) return customer.razonSocial
    const fullName = `${customer.nombre || ""} ${customer.apellido || ""}`.trim()
    return fullName || customer.email || "Sin nombre"
  }

  // Generar slug automáticamente desde la razón social
  useEffect(() => {
    if (!organization) {
      const source = razonSocial.trim()
      if (source) {
        const generatedSlug = source
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
        setSlug(generatedSlug)
      }
    }
  }, [razonSocial, organization])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!customerId && !organization) {
      alert("Por favor selecciona un cliente dueño")
      return
    }

    if (!razonSocial.trim()) {
      alert("Por favor ingresa la razón social")
      return
    }

    if (!direccion.trim()) {
      alert("Por favor ingresa la dirección")
      return
    }

    if (!telefono.trim()) {
      alert("Por favor ingresa el teléfono")
      return
    }

    if (!slug.trim()) {
      alert("El slug es requerido")
      return
    }

    setIsLoading(true)
    try {
      const data = {
        customerId: organization ? undefined : customerId, // Solo enviar customerId al crear
        razonSocial: capitalizeText(razonSocial),
        nit: nit.trim() || undefined,
        address: direccion.trim(),
        phone: telefono.trim(),
        slug: slug.trim(),
      }

      await onSave(data)
      
      // Resetear formulario solo si no hay error
      if (!organization) {
        setRazonSocial("")
        setNit("")
        setDireccion("")
        setTelefono("")
        setSlug("")
        setCustomerId(initialCustomerId || "")
      }
    } catch (error) {
      console.error("Error al guardar:", error)
      // No resetear el formulario si hay error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0 rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky top-0 z-10">
          <DialogHeader className="px-0 py-0 space-y-2">
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              {organization ? "Editar Organización" : "Nueva Organización"}
            </DialogTitle>
            <DialogDescription>
              {organization
                ? "Modifica los datos de la organización"
                : "Completa los datos para crear una nueva organización"}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 bg-gray-50/60 dark:bg-[#0c0c0c]">
            <div className="space-y-6">
              {/* Select de Cliente Dueño y NIT en la misma línea (solo al crear) */}
              {!organization && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Select de Cliente Dueño */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="customer-select"
                      className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      Cliente  <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={customerId}
                      onValueChange={setCustomerId}
                      disabled={isLoadingCustomers}
                      required
                    >
                      <SelectTrigger
                        id="customer-select"
                        className="w-full rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]"
                      >
                        {isLoadingCustomers ? (
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Cargando clientes...</span>
                          </div>
                        ) : (
                          <SelectValue placeholder="Selecciona el dueño de la empresa" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingCustomers ? (
                          <div className="px-2 py-8 text-sm text-gray-500 dark:text-gray-400 text-center flex flex-col items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                            <span>Cargando clientes...</span>
                          </div>
                        ) : customers.length === 0 ? (
                          <div className="px-2 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                            No hay clientes disponibles
                          </div>
                        ) : (
                          customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {getCustomerName(customer)}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Cliente dueño de la empresa (requerido)
                    </p>
                  </div>

                  {/* NIT */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="nit"
                      className="text-sm font-semibold text-gray-700 dark:text-gray-200"
                    >
                      NIT
                    </Label>
                    <Input
                      id="nit"
                      placeholder="12345678-9"
                      value={nit}
                      onChange={(e) => setNit(e.target.value)}
                      className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Número de Identificación Tributaria
                    </p>
                  </div>
                </div>
              )}

              {/* Razón Social */}
              <div className="space-y-2">
                <Label
                  htmlFor="razonSocial"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  Razón Social <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="razonSocial"
                  placeholder="Razón social de la empresa"
                  value={razonSocial}
                  required
                  onChange={(e) => setRazonSocial(capitalizeText(e.target.value))}
                  className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Nombre legal de la empresa (requerido). El slug se genera automáticamente desde este campo.
                </p>
              </div>

              {/* Dirección */}
              <div className="space-y-2">
                <Label
                  htmlFor="direccion"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  Dirección <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="direccion"
                  placeholder="Dirección de la empresa"
                  value={direccion}
                  required
                  onChange={(e) => setDireccion(capitalizeText(e.target.value))}
                  className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Dirección física de la empresa (requerido)
                </p>
              </div>

              {/* Teléfono y Slug en la misma línea */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Teléfono */}
                <div className="space-y-2">
                  <Label
                    htmlFor="telefono"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    Teléfono <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="telefono"
                    placeholder="+591 70000000"
                    value={telefono}
                    required
                    onChange={(e) => setTelefono(e.target.value)}
                    className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Teléfono de contacto (requerido)
                  </p>
                </div>

                {/* Slug (generado automáticamente desde razón social) */}
                <div className="space-y-2">
                  <Label
                    htmlFor="slug"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-200"
                  >
                    Slug <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="slug"
                    placeholder="Se genera automáticamente"
                    value={slug}
                    required
                    readOnly={!organization} // Solo editable al editar, no al crear
                    onChange={(e) => {
                      if (organization) {
                        // Solo permitir edición si está editando
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                      }
                    }}
                    className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {!organization 
                      ? "URL única generada automáticamente (requerido)"
                      : "URL única (puedes editarlo)"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex w-full flex-col sm:flex-row sm:justify-center items-center gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4 bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky bottom-0 z-10">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto rounded-full"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto rounded-full px-6"
              disabled={isLoading || (!customerId && !organization) || !razonSocial.trim() || !direccion.trim() || !telefono.trim() || !slug.trim()}
            >
              {isLoading ? "Agregando..." : organization ? "Actualizar" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

