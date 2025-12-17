"use client"

import { useEffect } from "react"

/**
 * Componente simplificado para manejar la persistencia visual del color del tema
 * 
 * Las preferencias principales (moneda, formato de fecha) ahora se manejan
 * directamente desde configuracion-client.tsx usando el hook useConfiguration
 * y se guardan en la base de datos a través de la API.
 * 
 * Este componente solo se encarga de:
 * - Manejar los clicks en los swatches de color
 * - Aplicar el color visualmente al DOM
 * - Guardar el color en la API cuando se selecciona
 */
export default function ClientPersistence({ slug }: { slug: string }) {
  useEffect(() => {
    let colorClickHandler: ((e: Event) => void) | null = null

    /**
     * Actualiza la selección visual del color y lo guarda en la API
     */
    const updateColorSelection = (selectedColor: string) => {
      // Actualizar el select oculto
      const currentFormPrefs = document.querySelector('form[data-form="preferencias"]') as HTMLFormElement | null
      const select = currentFormPrefs?.querySelector('[name="themeColor"]') as HTMLSelectElement | null
      if (select) {
        select.value = selectedColor
        // Disparar evento change para que React se entere
        select.dispatchEvent(new Event('change', { bubbles: true }))
      }

      // Aplicar el color inmediatamente al documento
      document.documentElement.setAttribute('data-sas-color', selectedColor)

      // Forzar reflow para aplicar CSS
      void document.documentElement.offsetHeight

      // Actualizar vista previa y selección visual
      requestAnimationFrame(() => {
        const preview = document.getElementById('themeColorPreview') as HTMLDivElement | null
        if (preview) {
          preview.style.background = 'var(--primary)'
        }

        // Actualizar estilos visuales de los botones
        const swatches = document.querySelectorAll('.color-swatch')
        swatches.forEach((swatch) => {
          const swatchColor = (swatch as HTMLElement).dataset.color
          if (swatchColor === selectedColor) {
            // Color seleccionado: borde más grueso y sombra
            swatch.classList.remove('border-2')
            swatch.classList.add('border-4', 'ring-2', 'ring-offset-2')
            swatch.classList.add('ring-gray-400', 'dark:ring-gray-600')
          } else {
            // Color no seleccionado: borde normal
            swatch.classList.remove('border-4', 'ring-2', 'ring-offset-2')
            swatch.classList.remove('ring-gray-400', 'dark:ring-gray-600')
            swatch.classList.add('border-2')
          }
        })
      })

      // Guardar en la API
      fetch(`/api/${slug}/config/preferencias`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ themeColor: selectedColor }),
      }).catch((error) => {
        console.error('Error guardando color en API:', error)
      })
    }

    /**
     * Configura los listeners para los clicks en los swatches de color
     */
    const setupColorListeners = () => {
      if (!colorClickHandler) {
        colorClickHandler = (e: Event) => {
          const target = e.target as HTMLElement
          const swatch = target.closest(".color-swatch") as HTMLElement | null

          if (swatch) {
            e.preventDefault()
            e.stopPropagation()
            const color = swatch.dataset.color || 'green'

            // Actualizar el select antes de aplicar el color
            const currentFormPrefs = document.querySelector('form[data-form="preferencias"]') as HTMLFormElement | null
            if (currentFormPrefs) {
              const select = currentFormPrefs.querySelector('[name="themeColor"]') as HTMLSelectElement | null
              if (select) {
                select.value = color
              }
            }

            // Aplicar el color
            updateColorSelection(color)
          }
        }

        // Agregar listener al documento (event delegation)
        document.addEventListener('click', colorClickHandler, true)
      }
    }

    // Configurar listeners inmediatamente
    setupColorListeners()

    // También configurar cuando se agregan nuevos swatches dinámicamente
    const observer = new MutationObserver(() => {
      const swatches = document.querySelectorAll('.color-swatch')
      swatches.forEach((swatch) => {
        if (!(swatch as any).__colorHandlerAttached) {
          ;(swatch as any).__colorHandlerAttached = true
          swatch.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            const color = (swatch as HTMLElement).dataset.color || 'green'

            const currentFormPrefs = document.querySelector('form[data-form="preferencias"]') as HTMLFormElement | null
            if (currentFormPrefs) {
              const select = currentFormPrefs.querySelector('[name="themeColor"]') as HTMLSelectElement | null
              if (select) {
                select.value = color
              }
            }

            updateColorSelection(color)
          })
        }
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    // Cargar color inicial desde la API
    fetch(`/api/${slug}/config/preferencias`, {
      credentials: 'include',
    })
      .then((response) => {
        if (response.ok) {
          return response.json()
        }
        return null
      })
      .then((data) => {
        if (data?.success && data.configuration?.themeColor) {
          const color = data.configuration.themeColor
          // Aplicar color sin guardar (ya está en la BD)
          document.documentElement.setAttribute('data-sas-color', color)
          
          // Actualizar selección visual
          const swatches = document.querySelectorAll('.color-swatch')
          swatches.forEach((swatch) => {
            const swatchColor = (swatch as HTMLElement).dataset.color
            if (swatchColor === color) {
              swatch.classList.remove('border-2')
              swatch.classList.add('border-4', 'ring-2', 'ring-offset-2')
              swatch.classList.add('ring-gray-400', 'dark:ring-gray-600')
            } else {
              swatch.classList.remove('border-4', 'ring-2', 'ring-offset-2')
              swatch.classList.remove('ring-gray-400', 'dark:ring-gray-600')
              swatch.classList.add('border-2')
            }
          })
        }
      })
      .catch(() => {
        // Si falla, usar color por defecto
        document.documentElement.setAttribute('data-sas-color', 'green')
      })

    // Limpiar al desmontar
    return () => {
      if (colorClickHandler) {
        document.removeEventListener('click', colorClickHandler, true)
      }
      observer.disconnect()
    }
  }, [slug])

  return null // Este componente no renderiza nada
}
