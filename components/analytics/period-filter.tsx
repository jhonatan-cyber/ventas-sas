"use client"

import { Button } from "@/components/ui/button"

interface PeriodFilterProps {
  period: 'daily' | 'weekly' | 'monthly'
  onPeriodChange: (period: 'daily' | 'weekly' | 'monthly') => void
}

export function PeriodFilter({ period, onPeriodChange }: PeriodFilterProps) {
  return (
    <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
      <Button
        variant={period === 'daily' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onPeriodChange('daily')}
        className="w-full"
      >
        Diario
      </Button>
      <Button
        variant={period === 'weekly' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onPeriodChange('weekly')}
        className="w-full"
      >
        Semanal
      </Button>
      <Button
        variant={period === 'monthly' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onPeriodChange('monthly')}
        className="w-full"
      >
        Mensual
      </Button>
    </div>
  )
}

