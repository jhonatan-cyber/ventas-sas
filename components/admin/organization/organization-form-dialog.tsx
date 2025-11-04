"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Organization } from "@prisma/client"

interface OrganizationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization?: Organization
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

export function OrganizationFormDialog({
  open,
  onOpenChange,
  organization,
  onSave,
}: OrganizationFormDialogProps) {
  const [name, setName] = useState("")
  const [razonSocial, setRazonSocial] = useState("")
  const [nit, setNit] = useState("")
  const [slug, setSlug] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (organization) {
      setName(organization.name || "")
      setRazonSocial((organization as any).razonSocial || "")
      setNit((organization as any).nit || "")
      setSlug(organization.slug || "")
    } else {
      setName("")
      setRazonSocial("")
      setNit("")
      setSlug("")
    }
  }, [organization, open])

  // Generar slug automáticamente desde el nombre o razón social
  useEffect(() => {
    if (!organization) {
      const source = razonSocial.trim() || name.trim()
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
  }, [name, razonSocial, organization])

  // Validar si todos los campos requeridos están llenos
  const isFormValid = name.trim() !== "" && slug.trim() !== ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    setIsLoading(true)

    const organizationData = {
      name: name.trim(),
      razonSocial: razonSocial.trim() || undefined,
      nit: nit.trim() || undefined,
      slug: slug.trim(),
    }

    onSave(organizationData)
    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0 rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky top-0 z-10">
          <DialogHeader className="px-0 py-0 space-y-2">
            <DialogTitle>
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
              {/* Nombre */}
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-200"
                >
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Nombre de la organización"
                  value={name}
                  required
                  onChange={(e) => setName(capitalizeText(e.target.value))}
                  className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                />
              </div>

              {/* Razón Social */}
              <div className="space-y-2">
                <Label
                  htmlFor="razonSocial"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-200"
                >
                  Razón Social
                </Label>
                <Input
                  id="razonSocial"
                  placeholder="Razón social de la empresa"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(capitalizeText(e.target.value))}
                  className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Nombre legal de la empresa (opcional)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {/* Slug */}
                <div className="space-y-2">
                  <Label
                    htmlFor="slug"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-200"
                  >
                    Slug <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="slug"
                    placeholder="organizacion-slug"
                    value={slug}
                    required
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    className="rounded-full bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    URL única para la organización
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
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? "Guardando..." : organization ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

