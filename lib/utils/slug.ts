/**
 * Convierte un texto a slug (URL-friendly)
 * Ejemplo: "Mi Empresa S.A.S" -> "mi-empresa-sas"
 */
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Normalizar caracteres especiales
    .replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos (acentos)
    .replace(/[^a-z0-9]+/g, '-') // Reemplazar espacios y caracteres especiales con guiones
    .replace(/^-+|-+$/g, '') // Eliminar guiones del inicio y final
    .trim()
}

/**
 * Genera un slug único agregando un número si es necesario
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let slug = baseSlug
  let counter = 1
  
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }
  
  return slug
}

