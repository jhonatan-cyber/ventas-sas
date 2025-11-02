"use client"

import { Button } from "@/components/ui/button"

interface PeriodFilterProps {
  period: 'daily' | 'weekly' | 'monthly'
  onPeriodChange: (period: 'daily' | 'weekly' | 'monthly') => void
}

export function PeriodFilter({ period, onPeriodChange }: PeriodFilterProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant={period === 'daily' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onPeriodChange('daily')}
      >
        Diario
      </Button>
      <Button
        variant={period === 'weekly' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onPeriodChange('weekly')}
      >
        Semanal
      </Button>
      <Button
        variant={period === 'monthly' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onPeriodChange('monthly')}
      >
        Mensual
      </Button>
    </div>
  )
}

