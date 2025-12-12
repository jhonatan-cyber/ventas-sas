import { useCallback, useMemo } from 'react'

/**
 * Hook optimizado para manejar click handlers en tablas
 * Evita la creación de funciones anónimas en cada render
 */
export function useOptimizedHandlers<T>(
  item: T,
  handlers: {
    onView?: (item: T) => void
    onEdit?: (item: T) => void
    onDelete?: (item: T) => void
    onToggleStatus?: (item: T) => void
    [key: string]: ((item: T) => void) | undefined
  }
) {
  const optimizedHandlers = useMemo(() => {
    const result: Record<string, () => void> = {}
    
    Object.entries(handlers).forEach(([key, handler]) => {
      if (handler) {
        result[key] = () => handler(item)
      }
    })
    
    return result
  }, [item, handlers])

  return optimizedHandlers
}

/**
 * Hook para memoizar elementos de tabla pesados
 */
export function useTableRowMemo<T>(
  item: T,
  dependencies: any[] = []
) {
  return useMemo(() => item, [item, ...dependencies])
}

/**
 * Hook para optimizar re-renders de componentes de tabla
 */
export function useTableOptimization() {
  const requestIdleCallback = useCallback((callback: () => void) => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(callback)
    } else {
      setTimeout(callback, 0)
    }
  }, [])

  const debounce = useCallback((func: Function, wait: number) => {
    let timeout: NodeJS.Timeout
    return (...args: any[]) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(null, args), wait)
    }
  }, [])

  return { requestIdleCallback, debounce }
}