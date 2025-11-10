"use client"

import { useState, useEffect } from "react"

import { Widget, DEFAULT_WIDGETS } from "./types"

const STORAGE_KEY = "admin-dashboard-widgets"

export function useWidgetConfig() {
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Cargar configuración desde localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setWidgets(parsed)
      }
    } catch (error) {
      console.error("Error loading widget config:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const saveWidgets = (newWidgets: Widget[]) => {
    setWidgets(newWidgets)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newWidgets))
    } catch (error) {
      console.error("Error saving widget config:", error)
    }
  }

  const updateWidget = (id: string, updates: Partial<Widget>) => {
    const updated = widgets.map((w) =>
      w.id === id ? { ...w, ...updates } : w
    )
    saveWidgets(updated)
  }

  const removeWidget = (id: string) => {
    const updated = widgets.map((w) =>
      w.id === id ? { ...w, enabled: false } : w
    )
    saveWidgets(updated)
  }

  const resetWidgets = () => {
    saveWidgets(DEFAULT_WIDGETS)
  }

  return {
    widgets,
    isLoading,
    saveWidgets,
    updateWidget,
    removeWidget,
    resetWidgets,
  }
}
