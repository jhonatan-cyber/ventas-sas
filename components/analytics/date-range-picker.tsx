"use client"

import { useState } from "react"
import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"

interface DateRangePickerProps {
  dateRange: { start: Date; end: Date } | null
  onDateRangeChange: (range: { start: Date; end: Date } | null) => void
}

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)

  const handleSelect: any = (range: { from: Date | undefined; to: Date | undefined } | undefined) => {
    if (range?.from && range?.to) {
      onDateRangeChange({ start: range.from, end: range.to })
      setOpen(false)
    } else if (range?.from) {
      // Esperar a que se seleccione el segundo día
    }
  }

  const handleReset = () => {
    onDateRangeChange(null)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="rounded-full">
          <Calendar className="h-4 w-4 mr-2" />
          {dateRange ? (
            <>
              {format(dateRange.start, "dd/MM/yyyy")} - {format(dateRange.end, "dd/MM/yyyy")}
            </>
          ) : (
            "Seleccionar rango"
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <CalendarComponent
          mode="range"
          selected={{
            from: dateRange?.start,
            to: dateRange?.end
          }}
          onSelect={handleSelect}
          numberOfMonths={2}
        />
        {dateRange && (
          <div className="p-3 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleReset}
              className="w-full rounded-full"
            >
              Limpiar
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

