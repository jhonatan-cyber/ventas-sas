"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { UserWithDetails } from "@/lib/services/admin/user-admin-service"
import { RoleWithStats } from "@/lib/services/admin/role-admin-service"

interface Role {
  id: string
  name: string
  description?: string
}

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: UserWithDetails
  onSave: (data: any) => void
}

// Función para capitalizar texto
const capitalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function UserFormDialog({ open, onOpenChange, user, onSave }: UserFormDialogProps) {
  const [email, setEmail] = useState(user?.email || "")
  const [ci, setCi] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [roleId, setRoleId] = useState<string>("")
  const [isSuperAdmin, setIsSuperAdmin] = useState(user?.isSuperAdmin || false)
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)

  // Cargar roles al abrir el modal
  useEffect(() => {
    if (open) {
      loadRoles()
    }
  }, [open])

  const loadRoles = async () => {
    try {
      setRolesLoading(true)
      const response = await fetch('/api/administracion/roles')
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      }
    } catch (error) {
      console.error('Error al cargar roles:', error)
    } finally {
      setRolesLoading(false)
    }
  }

  // Resetear el formulario cuando el modal se abre o se cambia el usuario
  useEffect(() => {
    if (user) {
      setEmail(user.email)
      setCi((user as any).ci || "")
      // Dividir fullName en firstName y lastName
      const fullName = user.fullName || ""
      const nameParts = fullName.split(" ")
      const fName = nameParts[0] || ""
      const lName = nameParts.slice(1).join(" ") || ""
      setFirstName(fName)
      setLastName(lName)
      setAddress(user.address || "")
      setPhone(user.phone || "")
      // Intentar obtener el rol del usuario
      // Primero buscar en organizationMembers, luego usar el rol del perfil
      const firstRole = user.organizationMembers?.[0]?.role
      // Buscar el rol en la lista de roles cargados por nombre
      const roleMatch = roles.find(r => r.name === user.role)
      setRoleId(firstRole?.id || roleMatch?.id || "")
      setIsSuperAdmin(user.isSuperAdmin)
      setPassword("")
    } else {
      setEmail("")
      setCi("")
      setFirstName("")
      setLastName("")
      setAddress("")
      setPhone("")
      setRoleId("")
      setIsSuperAdmin(false)
      setPassword("")
    }
  }, [user, open])

  // Actualizar el rolId cuando se cargue la lista de roles
  useEffect(() => {
    if (user && roles.length > 0 && !roleId) {
      // Buscar el rol en la lista de roles cargados por nombre
      const roleMatch = roles.find(r => r.name === user.role)
      if (roleMatch) {
        setRoleId(roleMatch.id)
      }
    }
  }, [roles, user, roleId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const selectedRole = roles.find(r => r.id === roleId)
      // Combinar nombre y apellido
      const fullName = `${firstName} ${lastName}`.trim()
      const data: any = {
        email,
        ci,
        fullName,
        address,
        phone,
        role: selectedRole?.name || "user",
        roleId,
        isSuperAdmin,
        isActive: user ? user.isActive : true, // Mantener el estado actual si es edición, crear como activo si es nuevo
      }

      // Para nuevos usuarios, usar el CI como contraseña. Para edición, solo si se especificó password
      if (!user) {
        data.password = ci // El CI será hasheado en el servidor
      } else if (password && password.trim() !== "") {
        data.password = password
      }

      await onSave(data)
      onOpenChange(false)
      // Resetear formulario
      setEmail("")
      setCi("")
      setFirstName("")
      setLastName("")
      setAddress("")
      setPhone("")
      setRoleId("")
      setIsSuperAdmin(false)
      setPassword("")
    } catch (error) {
      console.error("Error al guardar el usuario:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              {user ? "Editar Usuario" : "Nuevo Usuario"}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {user ? "Actualiza la información del usuario" : "Completa la información para crear un nuevo usuario"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="ci" className="text-gray-700 dark:text-gray-300">
                CI *
              </Label>
              <Input
                id="ci"
                type="text"
                placeholder="12345678"
                value={ci}
                onChange={(e) => setCi(e.target.value)}
                required
                className="bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName" className="text-gray-700 dark:text-gray-300">
                  Nombre *
                </Label>
                <Input
                  id="firstName"
                  placeholder="Juan"
                  value={firstName}
                  onChange={(e) => setFirstName(capitalizeText(e.target.value))}
                  required
                  className="bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName" className="text-gray-700 dark:text-gray-300">
                  Apellido *
                </Label>
                <Input
                  id="lastName"
                  placeholder="Pérez"
                  value={lastName}
                  onChange={(e) => setLastName(capitalizeText(e.target.value))}
                  required
                  className="bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address" className="text-gray-700 dark:text-gray-300">
                Dirección
              </Label>
              <Input
                id="address"
                placeholder="Calle Principal 123"
                value={address}
                onChange={(e) => setAddress(capitalizeText(e.target.value))}
                className="bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
              />
            </div>

            <div className={`grid gap-4 ${isSuperAdmin ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <div className="grid gap-2">
                <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300">
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                />
              </div>

              {!isSuperAdmin && (
                <div className="grid gap-2">
                  <Label htmlFor="role" className="text-gray-700 dark:text-gray-300">
                    Rol
                  </Label>
                  <Select value={roleId} onValueChange={setRoleId} disabled={rolesLoading}>
                    <SelectTrigger className="w-full bg-gray-50 dark:bg-[#2a2a2a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
                      <SelectValue placeholder={rolesLoading ? "Cargando roles..." : "Selecciona un rol"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white">
                      {roles.map((role) => (
                        <SelectItem 
                          key={role.id} 
                          value={role.id} 
                          className="hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                        >
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            {roles.length === 0 && !rolesLoading && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                No hay roles disponibles. Crea roles en el módulo de Roles.
              </p>
            )}

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label className="text-gray-700 dark:text-gray-300">Super Administrador</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Acceso completo al sistema</p>
              </div>
              <Switch
                checked={isSuperAdmin}
                onCheckedChange={(checked) => {
                  setIsSuperAdmin(checked)
                  // Limpiar el rol si se activa super admin
                  if (checked) {
                    setRoleId("")
                  }
                }}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          </div>

          <DialogFooter className="bg-gray-50 dark:bg-[#2a2a2a] -mx-6 -mb-6 px-6 py-4 border-t border-gray-200 dark:border-[#2a2a2a] !flex !justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              rounded="full"
              onClick={() => onOpenChange(false)}
              className="border-gray-200 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              rounded="full"
              disabled={isLoading || !email.trim()}
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
            >
              {isLoading ? "Guardando..." : user ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

