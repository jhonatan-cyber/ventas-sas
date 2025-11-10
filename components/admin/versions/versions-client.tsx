"use client"

import { Plus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'


interface Version {
  id: string
  version: string
  versionName?: string
  releaseType?: string
  isReleased: boolean
  isCurrent: boolean
  releasedAt?: string
}

interface VersionsClientProps {
  initialVersions: Version[]
  initialCurrentVersion: Version | null
  initialStats: any
}

export function VersionsClient({ initialVersions, initialCurrentVersion, initialStats }: VersionsClientProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Versión Actual</CardTitle>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Versión
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {initialCurrentVersion ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{initialCurrentVersion.version}</span>
                {initialCurrentVersion.versionName && (
                  <span className="text-muted-foreground">({initialCurrentVersion.versionName})</span>
                )}
                <Badge>Actual</Badge>
              </div>
              {initialCurrentVersion.releasedAt && (
                <p className="text-sm text-muted-foreground">
                  Liberada: {new Date(initialCurrentVersion.releasedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No hay versión actual</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Versiones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {initialVersions.map((version) => (
              <div key={version.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{version.version}</span>
                      {version.versionName && (
                        <span className="text-muted-foreground">({version.versionName})</span>
                      )}
                      {version.isCurrent && <Badge>Actual</Badge>}
                      {version.isReleased && <Badge variant="outline">Liberada</Badge>}
                      {version.releaseType && (
                        <Badge variant="secondary">{version.releaseType}</Badge>
                      )}
                    </div>
                    {version.releasedAt && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(version.releasedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
