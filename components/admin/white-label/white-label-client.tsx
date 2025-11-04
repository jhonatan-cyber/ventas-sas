"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface Organization {
  id: string
  name: string
  slug: string
}

interface Branding {
  id?: string
  organizationId: string
  logoUrl?: string
  faviconUrl?: string
  primaryColor?: string
  secondaryColor?: string
  customEmailDomain?: string
  customEmailFrom?: string
  companyName?: string
  companyWebsite?: string
  enabled?: boolean
  organization?: Organization
}

interface WhiteLabelClientProps {
  initialOrganizations: Organization[]
}

export function WhiteLabelClient({ initialOrganizations }: WhiteLabelClientProps) {
  const [organizations] = useState(initialOrganizations)
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [branding, setBranding] = useState<Branding | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSelectOrg = async (orgId: string) => {
    setSelectedOrg(orgId)
    setIsLoading(true)
    try {
      const res = await fetch(`/api/administracion/white-label/${orgId}`)
      const data = await res.json()
      if (data.success) {
        setBranding(data.branding || { organizationId: orgId, enabled: false })
        setIsDialogOpen(true)
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al cargar branding', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedOrg || !branding) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/administracion/white-label/${selectedOrg}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branding),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Éxito', description: 'Branding actualizado correctamente' })
        setIsDialogOpen(false)
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Error al guardar branding', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organizaciones</CardTitle>
          <CardDescription>Selecciona una organización para configurar su branding</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {organizations.map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                onClick={() => handleSelectOrg(org.id)}
              >
                <div>
                  <p className="font-medium">{org.name}</p>
                  <p className="text-sm text-muted-foreground">{org.slug}</p>
                </div>
                <Button variant="outline" size="sm">
                  Configurar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar Branding</DialogTitle>
            <DialogDescription>
              Personaliza la apariencia y branding para esta organización
            </DialogDescription>
          </DialogHeader>
          {branding && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enabled">Habilitado</Label>
                <Switch
                  id="enabled"
                  checked={branding.enabled}
                  onCheckedChange={(checked) => setBranding({ ...branding, enabled: checked })}
                />
              </div>
              <div>
                <Label htmlFor="logoUrl">URL del Logo</Label>
                <Input
                  id="logoUrl"
                  value={branding.logoUrl || ''}
                  onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                  placeholder="https://ejemplo.com/logo.png"
                />
              </div>
              <div>
                <Label htmlFor="faviconUrl">URL del Favicon</Label>
                <Input
                  id="faviconUrl"
                  value={branding.faviconUrl || ''}
                  onChange={(e) => setBranding({ ...branding, faviconUrl: e.target.value })}
                  placeholder="https://ejemplo.com/favicon.ico"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Color Primario</Label>
                  <Input
                    id="primaryColor"
                    type="color"
                    value={branding.primaryColor || '#000000'}
                    onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="secondaryColor">Color Secundario</Label>
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={branding.secondaryColor || '#000000'}
                    onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="companyName">Nombre de la Empresa</Label>
                <Input
                  id="companyName"
                  value={branding.companyName || ''}
                  onChange={(e) => setBranding({ ...branding, companyName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="companyWebsite">Sitio Web</Label>
                <Input
                  id="companyWebsite"
                  value={branding.companyWebsite || ''}
                  onChange={(e) => setBranding({ ...branding, companyWebsite: e.target.value })}
                  placeholder="https://ejemplo.com"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
