"use client"

import { useState, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GripVertical, X } from "lucide-react"
import { Widget, WidgetType } from "./types"

interface WidgetContainerProps {
  widget: Widget
  children: React.ReactNode
  onRemove?: (id: string) => void
  onSizeChange?: (id: string, size: Widget['size']) => void
}

function SortableWidgetItem({
  widget,
  children,
  onRemove,
  onSizeChange,
}: WidgetContainerProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2 flex-1">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing touch-none"
            >
              <GripVertical className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
            </div>
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {widget.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {onSizeChange && (
              <div className="flex gap-1">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <Button
                    key={size}
                    variant={widget.size === size ? "default" : "ghost"}
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => onSizeChange(widget.id, size)}
                  >
                    {size === 'small' ? 'S' : size === 'medium' ? 'M' : 'L'}
                  </Button>
                ))}
              </div>
            )}
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemove(widget.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  )
}

interface DragAndDropWidgetsProps {
  widgets: Widget[]
  onWidgetsChange: (widgets: Widget[]) => void
  children: (widget: Widget) => React.ReactNode
  onRemove?: (id: string) => void
  onSizeChange?: (id: string, size: Widget['size']) => void
  columns?: number
}

export function DragAndDropWidgets({
  widgets,
  onWidgetsChange,
  children,
  onRemove,
  onSizeChange,
  columns = 4,
}: DragAndDropWidgetsProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const enabledWidgets = widgets.filter((w) => w.enabled).sort((a, b) => a.order - b.order)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = enabledWidgets.findIndex((w) => w.id === active.id)
      const newIndex = enabledWidgets.findIndex((w) => w.id === over.id)

      const newWidgets = arrayMove(enabledWidgets, oldIndex, newIndex).map(
        (widget, index) => ({
          ...widget,
          order: index,
        })
      )

      // Actualizar todos los widgets manteniendo los deshabilitados
      const allWidgets = widgets.map((widget) => {
        const updated = newWidgets.find((w) => w.id === widget.id)
        return updated || widget
      })

      onWidgetsChange(allWidgets)
    }
  }

  const getGridCols = (size: Widget['size']) => {
    switch (size) {
      case 'small':
        return 'col-span-1'
      case 'medium':
        return 'col-span-2'
      case 'large':
        return 'col-span-4'
      default:
        return 'col-span-1'
    }
  }

  const gridColsClass = columns === 4 ? 'grid-cols-4' : columns === 3 ? 'grid-cols-3' : 'grid-cols-2'

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={enabledWidgets.map((w) => w.id)}
        strategy={rectSortingStrategy}
      >
        <div className={`grid ${gridColsClass} gap-4`}>
          {enabledWidgets.map((widget) => (
            <div key={widget.id} className={getGridCols(widget.size)}>
              <SortableWidgetItem
                widget={widget}
                onRemove={onRemove}
                onSizeChange={onSizeChange}
              >
                {children(widget)}
              </SortableWidgetItem>
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
