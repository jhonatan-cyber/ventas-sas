"use client"

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus } from 'lucide-react'

export function CmsClient() {
  return (
    <Tabs defaultValue="pages" className="space-y-4">
      <TabsList>
        <TabsTrigger value="pages">Páginas</TabsTrigger>
        <TabsTrigger value="blog">Blog</TabsTrigger>
      </TabsList>
      <TabsContent value="pages">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Páginas Estáticas</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Página
            </Button>
          </div>
          <p className="text-muted-foreground">Gestión de páginas estáticas del CMS - Por implementar</p>
        </Card>
      </TabsContent>
      <TabsContent value="blog">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Entradas de Blog</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Entrada
            </Button>
          </div>
          <p className="text-muted-foreground">Gestión de entradas de blog - Por implementar</p>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
