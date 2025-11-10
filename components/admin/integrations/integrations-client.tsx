"use client"

import { Plus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'


interface Integration {
  id: string
  name: string
  slug: string
  description?: string
  category: string
  isActive: boolean
  isPublic: boolean
  _count?: {
    installations: number
  }
}

interface Organization {
  id: string
  name: string
  slug: string
}

interface IntegrationsClientProps {
  initialIntegrations: Integration[]
  initialOrganizations: Organization[]
}

export function IntegrationsClient({ initialIntegrations, initialOrganizations }: IntegrationsClientProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Integraciones ({initialIntegrations.length})</CardTitle>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Integración
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {initialIntegrations.map((integration) => (
              <div key={integration.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{integration.name}</h3>
                  <Badge variant="outline">{integration.category}</Badge>
                </div>
                {integration.description && (
                  <p className="text-sm text-muted-foreground mb-3">{integration.description}</p>
                )}
                <div className="flex gap-2">
                  {integration.isActive && <Badge variant="default">Activa</Badge>}
                  {integration.isPublic && <Badge variant="secondary">Pública</Badge>}
                  {integration._count && (
                    <Badge variant="outline">{integration._count.installations} instalaciones</Badge>
                  )}
                </div>
              </div>
            ))}
            {initialIntegrations.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground py-8">
                No hay integraciones disponibles aún
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

