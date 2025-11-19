/**
 * Selector de idioma para el login y otras páginas públicas
 * Guarda la preferencia en localStorage hasta que el usuario inicie sesión
 */

"use client"

import { Globe } from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

import type { Locale } from "@/i18n"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const LANGUAGES: { value: Locale; label: string }[] = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "pt", label: "Português" },
]

interface LanguageSelectorProps {
  customerSlug?: string
}

export function LanguageSelector({ customerSlug }: LanguageSelectorProps) {
  // const t = useTranslations()
  const params = useParams()
  const slug = customerSlug || (params?.slug as string | undefined)
  const [currentLanguage, setCurrentLanguage] = useState<Locale>("es")

  // Cargar idioma desde localStorage o usar español por defecto
  useEffect(() => {
    if (typeof window === "undefined") return

    const storedLanguage = localStorage.getItem("sas-language-preference")
    if (storedLanguage && ["es", "en", "pt"].includes(storedLanguage)) {
      setCurrentLanguage(storedLanguage as Locale)
    } else {
      setCurrentLanguage("es")
    }
  }, [])

  const handleLanguageChange = async (newLanguage: string) => {
    // Validar que el idioma no esté vacío y sea válido
    if (!newLanguage || !['es', 'en', 'pt'].includes(newLanguage)) {
      console.warn('[LanguageSelector] Idioma inválido o vacío:', newLanguage)
      return
    }

    const validLanguage = newLanguage as Locale
    console.log('[LanguageSelector] Cambiando idioma a:', validLanguage, 'slug:', slug)
    setCurrentLanguage(validLanguage)

    // Guardar en localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("sas-language-preference", validLanguage)
      console.log('[LanguageSelector] Idioma guardado en localStorage')

      // Si hay slug, intentar actualizar también en la base de datos
      // Solo si el usuario está autenticado (verificamos con un GET primero)
      if (slug) {
        try {
          // Verificar si el usuario está autenticado intentando obtener las preferencias
          const checkResponse = await fetch(`/api/${slug}/config/preferencias`, {
            method: 'GET',
            credentials: 'include',
          })

          if (checkResponse.ok) {
            // Usuario autenticado, actualizar en BD
            console.log('[LanguageSelector] Usuario autenticado, actualizando idioma en la base de datos...')
            const response = await fetch(`/api/${slug}/config/preferencias`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ language: validLanguage }),
            })

            if (response.ok) {
              console.log('[LanguageSelector] Idioma actualizado en la base de datos')
              // Invalidar caché de preferencias
              const { invalidateConfigCache } = await import('@/lib/utils/preferences')
              invalidateConfigCache(slug)
            } else {
              const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
              console.warn('[LanguageSelector] Error al actualizar idioma en BD:', errorData.error || 'Error desconocido')
            }
          } else {
            // Usuario no autenticado (página de login), solo guardar en localStorage
            console.log('[LanguageSelector] Usuario no autenticado, idioma guardado solo en localStorage')
          }
        } catch (error) {
          console.error('[LanguageSelector] Error al verificar autenticación o actualizar idioma:', error)
          // Continuar de todas formas, el cambio en localStorage ya está hecho
        }
      }

      // Disparar evento para actualizar el provider (funciona con o sin slug)
      const event1 = new CustomEvent("language-updated", {
        detail: { slug: slug || null, language: validLanguage },
      })
      window.dispatchEvent(event1)
      console.log('[LanguageSelector] Evento language-updated disparado')

      // También disparar un evento personalizado para cambios en localStorage
      // Esto ayuda cuando no hay slug
      const event2 = new CustomEvent("localStorage-language-changed", {
        detail: { language: validLanguage },
      })
      window.dispatchEvent(event2)
      console.log('[LanguageSelector] Evento localStorage-language-changed disparado')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      <Select value={currentLanguage} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[140px] h-9 rounded-full border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a1a]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-2xl">
          {LANGUAGES.map((lang) => (
            <SelectItem
              key={lang.value}
              value={lang.value}
              className="rounded-xl"
            >
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

