"use client"

import { WifiOff, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function OfflinePage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <WifiOff className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle className="text-center">Sin conexión</CardTitle>
          <CardDescription className="text-center">
            No tienes conexión a internet. Por favor, verifica tu conexión y vuelve a intentar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

