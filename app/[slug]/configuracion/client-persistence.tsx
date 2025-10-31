"use client"

import { useEffect } from "react"

function setCookie(name: string, value: string, days = 365) {
  const isProduction = typeof window !== 'undefined' && window.location.protocol === 'https:'
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax; Expires=${expires}${isProduction ? '; Secure' : ''}`
}

export default function ClientPersistence({ slug }: { slug: string }) {
  useEffect(() => {
    const forms = document.querySelectorAll('form')
    const formPrefs = forms[0] as HTMLFormElement | null
    const formBranch = forms[1] as HTMLFormElement | null
    // Inicializar valores desde cookie
    try {
      const raw = document.cookie.split('; ').find(c => c.startsWith(`sas-prefs-${slug}=`))?.split('=')[1]
      if (raw && formPrefs) {
        const prefs = JSON.parse(decodeURIComponent(raw))
        const currency = formPrefs.querySelector('[name="currency"]') as HTMLInputElement | null
        const dateFormat = formPrefs.querySelector('[name="dateFormat"]') as HTMLInputElement | null
        const themeColorSelect = formPrefs.querySelector('[name="themeColor"]') as HTMLSelectElement | null
        if (currency && prefs.currency) currency.value = prefs.currency
        if (dateFormat && prefs.dateFormat) dateFormat.value = prefs.dateFormat
        if (themeColorSelect && prefs.themeColor) themeColorSelect.value = prefs.themeColor
        if (prefs.themeColor) document.documentElement.setAttribute('data-sas-color', prefs.themeColor)
        const preview = document.getElementById('themeColorPreview') as HTMLDivElement | null
        if (preview) preview.style.background = 'var(--primary)'
      }
    } catch {}
    if (formPrefs) {
      formPrefs.addEventListener('change', () => {
        const currency = (formPrefs.querySelector('[name="currency"]') as HTMLInputElement)?.value || ''
        const dateFormat = (formPrefs.querySelector('[name="dateFormat"]') as HTMLInputElement)?.value || ''
        const themeColor = (formPrefs.querySelector('[name="themeColor"]') as HTMLSelectElement)?.value || 'green'
        setCookie(`sas-prefs-${slug}`, JSON.stringify({ currency, dateFormat, themeColor }))
        // Aplicar color al instante via data-attr
        document.documentElement.setAttribute('data-sas-color', themeColor)
        const preview = document.getElementById('themeColorPreview') as HTMLDivElement | null
        if (preview) preview.style.background = 'var(--primary)'
      })
      // Swatches
      formPrefs.querySelectorAll('.color-swatch').forEach((el) => {
        el.addEventListener('click', () => {
          const color = (el as HTMLElement).dataset.color || 'green'
          const select = formPrefs.querySelector('[name="themeColor"]') as HTMLSelectElement | null
          if (select) select.value = color
          const currency = (formPrefs.querySelector('[name="currency"]') as HTMLInputElement)?.value || ''
          const dateFormat = (formPrefs.querySelector('[name="dateFormat"]') as HTMLInputElement)?.value || ''
          setCookie(`sas-prefs-${slug}`, JSON.stringify({ currency, dateFormat, themeColor: color }))
          document.documentElement.setAttribute('data-sas-color', color)
          const preview = document.getElementById('themeColorPreview') as HTMLDivElement | null
          if (preview) preview.style.background = 'var(--primary)'
        })
      })
    }
    if (formBranch) {
      formBranch.addEventListener('change', () => {
        const branchId = (formBranch.querySelector('[name="branchId"]') as HTMLSelectElement)?.value || ''
        setCookie(`sas-branch-${slug}`, branchId)
      })
    }
  }, [slug])
  return null
}


