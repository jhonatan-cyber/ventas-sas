"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Building2, Plus, X, Star, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Customer {
  id: string
  nombre?: string
  apellido?: string
  email?: string
  razonSocial?: string
  organizations: Array<{
    id: string
    organizationId: string
    isPrimary: boolean
    isActive: boolean
    joinedAt: string
    organization: {
      id: string
      name: string
      razonSocial?: string
      nit?: string
      slug: string
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
  const [isPrimary, setIsPrimary] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const fetchCustomers = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) {
        params.append("search", searchQuery)
      }

      const response = await fetch(`/api/administracion/customer-organizations?${params}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.customers) {
          setCustomers(data.customers)
        }
      }
    } catch (error) {
      console.error("Error al cargar clientes:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [searchQuery])

  const handleAddOrganization = async () => {
    // Obtener el customerId del estado o del select
    const customerId = selectedCustomer?.id || ""
    
    if (!customerId || !selectedOrganization) {
      toast({
        title: "Error",
        description: "Por favor selecciona un cliente y una organización",
        variant: "destructive",
      })
      return
    }

    // Validar que ambos sean UUIDs válidos
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
          isPrimary,
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
        setIsPrimary(false)
        fetchCustomers()
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

  const handleSetPrimary = async (customerId: string, organizationId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/administracion/customer-organizations/${customerId}/${organizationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "set-primary" }),
        }
      )

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Éxito",
          description: "Organización establecida como principal",
        })
        fetchCustomers()
      } else {
        throw new Error(data.error || "Error al establecer organización principal")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo establecer la organización principal",
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
        fetchCustomers()
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

  const filteredCustomers = customers.filter((customer) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      customer.nombre?.toLowerCase().includes(query) ||
      customer.apellido?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.organizations.some((org) =>
        org.organization.name.toLowerCase().includes(query) ||
        org.organization.razonSocial?.toLowerCase().includes(query) ||
        org.organization.nit?.toLowerCase().includes(query)
      )
    )
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Organizaciones de Clientes
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestiona las organizaciones asociadas a cada cliente
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Organización
        </Button>
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Buscar por cliente, email, organización..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Tabla de clientes con organizaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes y sus Organizaciones</CardTitle>
          <CardDescription>
            Lista de clientes y las organizaciones a las que pertenecen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Organizaciones</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      No se encontraron clientes
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        {customer.razonSocial ||
                          `${customer.nombre || ""} ${customer.apellido || ""}`.trim() ||
                          "Sin nombre"}
                      </TableCell>
                      <TableCell>{customer.email || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {customer.organizations.length === 0 ? (
                            <Badge variant="outline">Sin organizaciones</Badge>
                          ) : (
                            customer.organizations.map((org) => (
                              <Badge
                                key={org.id}
                                variant={org.isPrimary ? "default" : "secondary"}
                                className="flex items-center gap-1"
                              >
                                {org.isPrimary && <Star className="h-3 w-3" />}
                                {org.organization.razonSocial || org.organization.name}
                                {org.organization.nit && ` (${org.organization.nit})`}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCustomer(customer)
                            setIsAddDialogOpen(true)
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Agregar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Lista detallada de organizaciones por cliente */}
      <div className="grid gap-4">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {customer.razonSocial ||
                      `${customer.nombre || ""} ${customer.apellido || ""}`.trim() ||
                      "Sin nombre"}
                  </CardTitle>
                  <CardDescription>{customer.email || "Sin email"}</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCustomer(customer)
                    setIsAddDialogOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Organización
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {customer.organizations.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Este cliente no tiene organizaciones asignadas
                </p>
              ) : (
                <div className="space-y-2">
                  {customer.organizations.map((org) => (
                    <div
                      key={org.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {org.organization.razonSocial || org.organization.name}
                            </span>
                            {org.isPrimary && (
                              <Badge variant="default" className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                Principal
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            {org.organization.razonSocial && org.organization.razonSocial !== org.organization.name && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {org.organization.name}
                              </p>
                            )}
                            {org.organization.nit && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                NIT: {org.organization.nit}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {org.organization.slug}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!org.isPrimary && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleSetPrimary(customer.id, org.organizationId)
                            }
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleRemoveOrganization(customer.id, org.organizationId)
                          }
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog para agregar organización */}
      <Dialog 
        open={isAddDialogOpen} 
        onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (!open) {
            // Resetear estado al cerrar
            setSelectedCustomer(null)
            setSelectedOrganization("")
            setIsPrimary(false)
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
                        {customer.razonSocial ||
                          `${customer.nombre || ""} ${customer.apellido || ""}`.trim() ||
                          customer.email ||
                          "Sin nombre"}
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
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPrimary"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isPrimary" className="cursor-pointer">
                Establecer como organización principal
              </Label>
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
    </div>
    </AdminLayout>
  )
}

