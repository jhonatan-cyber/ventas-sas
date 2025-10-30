"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { UsuarioSas, RoleSas, Branch } from "@prisma/client"

interface UsuarioSasFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario?: UsuarioSas & { rol?: any; sucursal?: any }
  roles: (RoleSas & { customer?: any; sucursal?: any })[]
  sucursales: { id: string; name: string }[]
  onSave: (data: any) => void
}

export function UsuarioSasFormDialog({ open, onOpenChange, usuario, roles, sucursales, onSave }: UsuarioSasFormDialogProps) {
  const [ci, setCi] = useState("")
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [direccion, setDireccion] = useState("")
  const [telefono, setTelefono] = useState("")
  const [correo, setCorreo] = useState("")
  const [contraseña, setContraseña] = useState("")
  const [rolId, setRolId] = useState<string>("")
  const [foto, setFoto] = useState("")
  const [sucursalId, setSucursalId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (usuario) {
      setCi(usuario.ci || "")
      setNombre(usuario.nombre || "")
      setApellido(usuario.apellido || "")
      setDireccion(usuario.direccion || "")
      setTelefono(usuario.telefono || "")
      setCorreo(usuario.correo || "")
      setContraseña("") // No mostrar contraseña al editar
      setRolId(usuario.rolId || "")
      setFoto(usuario.foto || "")
      setSucursalId(usuario.sucursalId || "")
    } else {
      setCi("")
      setNombre("")
      setApellido("")
      setDireccion("")
      setTelefono("")
      setCorreo("")
      setContraseña("")
      setRolId("")
      setFoto("")
      setSucursalId("")
    }
  }, [usuario, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nombre.trim() || !apellido.trim()) {
      return
    }

    setIsLoading(true)
    try {
      const data: any = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
      }

      if (ci) data.ci = ci.trim()
      if (direccion) data.direccion = direccion.trim()
      if (telefono) data.telefono = telefono.trim()
      if (correo) data.correo = correo.trim()
      if (contraseña) data.contraseña = contraseña.trim()
      if (rolId) data.rolId = rolId
      if (foto) data.foto = foto.trim()
      if (sucursalId) data.sucursalId = sucursalId

      await onSave(data)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {usuario ? "Editar Usuario" : "Nuevo Usuario"}
          </DialogTitle>
          <DialogDescription>
            {usuario 
              ? "Modifica los datos del usuario" 
              : "Completa los datos para crear un nuevo usuario"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre <span className="text-red-500">*</span></Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido <span className="text-red-500">*</span></Label>
                <Input
                  id="apellido"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  placeholder="Apellido"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ci">CI</Label>
                <Input
                  id="ci"
                  value={ci}
                  onChange={(e) => setCi(e.target.value)}
                  placeholder="Cédula de Identidad"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Teléfono"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="correo">Correo Electrónico</Label>
              <Input
                id="correo"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="correo@ejemplo.com"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Dirección completa"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rolId">Rol</Label>
                <Select value={rolId} onValueChange={setRolId} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin rol</SelectItem>
                    {roles.map((rol) => (
                      <SelectItem key={rol.id} value={rol.id}>
                        {rol.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sucursalId">Sucursal</Label>
                <Select value={sucursalId} onValueChange={setSucursalId} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las sucursales</SelectItem>
                    {sucursales.map((sucursal) => (
                      <SelectItem key={sucursal.id} value={sucursal.id}>
                        {sucursal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contraseña">
                  {usuario ? "Nueva Contraseña" : "Contraseña"}
                  {!usuario && <span className="text-red-500"> *</span>}
                </Label>
                <Input
                  id="contraseña"
                  type="password"
                  value={contraseña}
                  onChange={(e) => setContraseña(e.target.value)}
                  placeholder={usuario ? "Dejar vacío para mantener" : "Contraseña"}
                  required={!usuario}
                  disabled={isLoading}
                />
                {usuario && (
                  <p className="text-xs text-gray-500">Dejar vacío para mantener la contraseña actual</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="foto">URL de Foto</Label>
                <Input
                  id="foto"
                  type="url"
                  value={foto}
                  onChange={(e) => setFoto(e.target.value)}
                  placeholder="https://ejemplo.com/foto.jpg"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-green-600 hover:bg-green-700"
              disabled={isLoading || !nombre.trim() || !apellido.trim()}
            >
              {isLoading ? "Guardando..." : usuario ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

