"use client"

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Feedback {
  id: string
  category: string
  title: string
  description: string
  status: string
  priority: string
  votes: number
}

interface FeedbackClientProps {
  initialFeedbacks: { feedbacks: Feedback[]; total: number }
  initialStats: any
  initialOrganizations: any[]
}

export function FeedbackClient({ initialFeedbacks, initialStats }: FeedbackClientProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{initialStats?.total || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Abiertos</p>
              <p className="text-2xl font-bold">{initialStats?.byStatus?.open || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">En Progreso</p>
              <p className="text-2xl font-bold">{initialStats?.byStatus?.['in_progress'] || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completados</p>
              <p className="text-2xl font-bold">{initialStats?.byStatus?.completed || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feedbacks ({initialFeedbacks.total})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {initialFeedbacks.feedbacks.map((feedback) => (
              <div key={feedback.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{feedback.title}</h3>
                    <p className="text-sm text-muted-foreground">{feedback.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge>{feedback.category}</Badge>
                    <Badge variant="outline">{feedback.status}</Badge>
                    <Badge variant="secondary">{feedback.votes} votos</Badge>
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
