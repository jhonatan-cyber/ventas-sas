// Función simple para formatear fechas
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('es-BO', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  })
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString('es-BO', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleTimeString('es-BO', { 
    hour: '2-digit',
    minute: '2-digit'
  })
}

