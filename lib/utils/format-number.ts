/**
 * Formatea un número con separadores de miles de forma consistente
 * para evitar problemas de hidratación entre servidor y cliente
 * 
 * @param value - Número a formatear
 * @returns String con el número formateado (ej: "1,000" o "1.000")
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0'
  
  // Usar formato simple con comas para evitar problemas de hidratación
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * Formatea un precio con símbolo de moneda
 * 
 * @param value - Precio a formatear
 * @param currency - Símbolo de moneda (por defecto '$')
 * @returns String con el precio formateado (ej: "$1,000")
 */
export function formatPrice(value: number | null | undefined, currency: string = '$'): string {
  if (value === null || value === undefined || value === 0) return 'Gratis'
  
  return `${currency}${formatNumber(value)}`
}

/**
 * Formatea un número con sufijo (ej: "usuarios", "productos")
 * 
 * @param value - Número a formatear
 * @param suffix - Sufijo a agregar
 * @param infinitySymbol - Símbolo para valores ilimitados (por defecto '∞')
 * @returns String con el número formateado y sufijo
 */
export function formatNumberWithSuffix(
  value: number | null | undefined,
  suffix: string,
  infinitySymbol: string = '∞'
): string {
  if (value === null || value === undefined) {
    return `${infinitySymbol} ${suffix}`
  }
  
  return `${formatNumber(value)} ${suffix}`
}
