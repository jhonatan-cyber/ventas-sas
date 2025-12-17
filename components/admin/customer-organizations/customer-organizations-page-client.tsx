"use client"

import { useState, useEffect } from "react"

import { CustomerOrganizationsContainer } from "./customer-organizations-container"
import { CustomerOrganizationsFormDialog } from "./customer-organizations-form-dialog"
import { CustomerOrganizationsHeader } from "./customer-organizations-header"

import { AdminLayout } from "@/components/layout/admin-layout"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useOrganizationActions } from "@/hooks/admin/organization/use-organization-actions"
import { useToast } from "@/hooks/use-toast"

interface Customer {
  id: string
  nombre?: string
  apellido?: string
  email?: string
  razonSocial?: string
  ci?: string
  organizations: Array<{
    id: string
    organizationId: string
    isActive: boolean
    joinedAt: string
    organization: {
      id: string
      name: string
      razonSocial?: string
      nit?: string
      address?: string // Usar 'address' en lugar de 'direccion'
      phone?: string // Usar 'phone' en lugar de 'telefono'
      slug: string
      subscriptionStatus?: string
    }
  }>
}

interface Organization {
  id: string
  name: string
  razonSocial?: string
  nit?: string
  slug: string
}

interface CustomerOrganizationsPageClientProps {
  initialCustomers: Customer[]
  initialOrganizations: Organization[]
}

export function CustomerOrganizationsPageClient({
  initialCustomers,
  initialOrganizations,
}: CustomerOrganizationsPageClientProps) {
  const { toast } = useToast()
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedOrganization, setSelectedOrganization] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const {
    openDialog,
    setOpenDialog,
    isEditDialogOpen,
    setIsEditDialogOpen,
    selectedOrganization: selectedOrganizationForEdit,
    setSelectedOrganization: setSelectedOrganizationForEdit,
    deleteDialog,
    setDeleteDialog,
    handleNewClick,
    handleEdit,
    handleSave,
    handleToggleStatus,
    handleDeleteClick,
    handleDeleteConfirm,
    isPending,
  } = useOrganizationActions()

  const [initialCustomerId, setInitialCustomerId] = useState<string | undefined>(undefined)

  // Recargar datos después de actualizaciones
  useEffect(() => {
    const reloadData = async () => {
      try {
        // Recargar clientes
        const customersResponse = await fetch(`/api/administracion/customer-organizations`)
        if (customersResponse.ok) {
          const customersData = await customersResponse.json()
          if (customersData.success && customersData.customers) {
            setCustomers(customersData.customers)
          }
        }

        // Recargar organizaciones
        const orgsResponse = await fetch("/api/administracion/organizations")
        if (orgsResponse.ok) {
          const orgsData = await orgsResponse.json()
          setOrganizations(orgsData.organizations || [])
        }
      } catch (error) {
        console.error('Error recargando datos:', error)
      }
    }

    // Escuchar eventos de recarga
    const handleReload = () => reloadData()
    window.addEventListener('organization-updated', handleReload)
    
    return () => {
      window.removeEventListener('organization-updated', handleReload)
    }
  }, [])

  // Actualizar datos cuando cambien los initial (después de router.refresh)
  useEffect(() => {
    setCustomers(initialCustomers)
  }, [initialCustomers])

  useEffect(() => {
    setOrganizations(initialOrganizations)
  }, [initialOrganizations])

  const handleAddOrganization = async () => {
    const customerId = selectedCustomer?.id || ""
    
    if (!customerId || !selectedOrganization) {
      toast({
        title: "Error",
        description: "Por favor selecciona un cliente y una organización",
        variant: "destructive",
      })
      return
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(customerId) || !uuidRegex.test(selectedOrganization)) {
      toast({
        title: "Error",
        description: "Los IDs seleccionados no son válidos",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/administracion/customer-organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          organizationId: selectedOrganization,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Éxito",
          description: "Cliente agregado a la organización exitosamente",
        })
        setIsAddDialogOpen(false)
        setSelectedCustomer(null)
        setSelectedOrganization("")
        // Disparar evento para recargar datos
        window.dispatchEvent(new Event("Organization-updated"))
      } else {
        throw new Error(data.error || "Error al agregar cliente")
      }
    } catch (error: any) {
      console.error("Error al agregar organización:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el cliente a la organización",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }


  const handleRemoveOrganization = async (customerId: string, organizationId: string) => {
    if (!confirm("¿Estás seguro de que deseas remover este cliente de la organización?")) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/administracion/customer-organizations/${customerId}/${organizationId}`,
        {
          method: "DELETE",
        }
      )

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Éxito",
          description: "Cliente removido de la organización exitosamente",
        })
        // Disparar evento para recargar datos
        window.dispatchEvent(new Event("Organization-updated"))
      } else {
        throw new Error(data.error || "Error al remover cliente")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo remover el cliente de la organización",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }


  const getCustomerName = (customer: Customer) => {
    if (customer.razonSocial) return customer.razonSocial
    const fullName = `${customer.nombre || ""} ${customer.apellido || ""}`.trim()
    return fullName || customer.email || "Sin nombre"
  }

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 px-4 md:px-0">
        {/* Header */}
        <CustomerOrganizationsHeader onAddClick={handleNewClick} />

        {/* Contenedor con filtros, tabla y paginación */}
        <CustomerOrganizationsContainer
          customers={customers}
          organizations={organizations}
          isLoading={isLoading}
          onAddOrganization={(customer) => {
            // Abrir modal de creación con el cliente preseleccionado
            setInitialCustomerId(customer.id)
            setOpenDialog(true)
          }}
          onRemoveOrganization={handleRemoveOrganization}
          onEditOrganization={handleEdit}
          onToggleOrganizationStatus={handleToggleStatus}
          onDeleteOrganization={handleDeleteClick}
        />

        {/* Dialog para crear nueva organización */}
        <CustomerOrganizationsFormDialog
          open={openDialog}
          onOpenChange={(open) => {
            setOpenDialog(open)
            if (!open) {
              setInitialCustomerId(undefined)
            }
          }}
          initialCustomerId={initialCustomerId}
          onSave={handleSave}
        />

        {/* Dialog para editar organización */}
        <CustomerOrganizationsFormDialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open)
            if (!open) {
              setSelectedOrganizationForEdit(undefined)
            }
          }}
          organization={selectedOrganizationForEdit}
          onSave={handleSave}
        />

        {/* Dialog para asociar organización existente a cliente */}
        <Dialog 
          open={isAddDialogOpen} 
          onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (!open) {
              setSelectedCustomer(null)
              setSelectedOrganization("")
            }
          }}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Agregar Organización a Cliente</DialogTitle>
              <DialogDescription>
                Selecciona un cliente y una organización para asociarlos
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="customer-select">Cliente *</Label>
                <Select
                  value={selectedCustomer?.id || ""}
                  onValueChange={(value) => {
                    const customer = customers.find((c) => c.id === value)
                    setSelectedCustomer(customer || null)
                  }}
                >
                  <SelectTrigger id="customer-select">
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.length === 0 ? (
                      <div className="px-2 py-4 text-sm text-gray-500 text-center">
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization-select">Organización *</Label>
                <Select 
                  value={selectedOrganization} 
                  onValueChange={setSelectedOrganization}
                >
                  <SelectTrigger id="organization-select">
                    <SelectValue placeholder="Selecciona una organización" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.length === 0 ? (
                      <div className="px-2 py-4 text-sm text-gray-500 text-center">
                        No hay organizaciones disponibles
                      </div>
                    ) : (
                      organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.razonSocial || org.name} {org.nit && `(${org.nit})`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleAddOrganization} 
                disabled={isLoading || !selectedCustomer?.id || !selectedOrganization}
              >
                {isLoading ? "Agregando..." : "Agregar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para confirmar eliminación de organización */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <AlertDialogContent className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] rounded-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                ¿Eliminar organización?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                Esta acción no se puede deshacer. Se eliminará permanentemente la organización <strong>{deleteDialog.organizationName}</strong> y todos sus datos relacionados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col sm:flex-row sm:justify-center gap-3">
              <AlertDialogCancel className="w-full sm:w-auto rounded-lg">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="w-full sm:w-auto rounded-lg bg-red-600 hover:bg-red-700 text-white"
              >
                {isPending ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  )
}
