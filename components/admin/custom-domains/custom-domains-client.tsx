"use client"

import { Plus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'


interface CustomDomain {
  id: string
  domain: string
  subdomain?: string
  status: string
  sslEnabled: boolean
}

interface Organization {
  id: string
  name: string
  slug: string
}

interface CustomDomainsClientProps {
  initialDomains: CustomDomain[]
  initialOrganizations: Organization[]
}

export function CustomDomainsClient({ initialDomains, initialOrganizations: _initialOrganizations }: CustomDomainsClientProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Dominios ({initialDomains.length})</CardTitle>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Dominio
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {initialDomains.map((domain) => (
              <div key={domain.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">
                      {domain.subdomain ? `${domain.subdomain}.` : ''}
                      {domain.domain}
                    </h3>
                    <div className="flex gap-2 mt-2">
                      <Badge>{domain.status}</Badge>
                      {domain.sslEnabled && <Badge variant="outline">SSL</Badge>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {initialDomains.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No hay dominios configurados aún
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

