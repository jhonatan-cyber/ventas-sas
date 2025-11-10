"use client"

import { Plus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'


interface AbTest {
  id: string
  name: string
  description?: string
  testType: string
  status: string
  startDate?: string
  endDate?: string
}

interface AbTestsClientProps {
  initialTests: AbTest[]
}

export function AbTestsClient({ initialTests }: AbTestsClientProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Tests A/B ({initialTests.length})</CardTitle>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Test
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {initialTests.map((test) => (
              <div key={test.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{test.name}</h3>
                    {test.description && (
                      <p className="text-sm text-muted-foreground">{test.description}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Badge>{test.testType}</Badge>
                      <Badge variant={test.status === 'running' ? 'default' : 'outline'}>
                        {test.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {initialTests.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No hay tests A/B creados aún
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

