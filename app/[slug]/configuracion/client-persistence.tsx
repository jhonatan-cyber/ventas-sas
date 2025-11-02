"use client"

import { useEffect } from "react"

function setCookie(name: string, value: string, days = 365) {
  const isProduction = typeof window !== 'undefined' && window.location.protocol === 'https:'
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax; Expires=${expires}${isProduction ? '; Secure' : ''}`
}

type SasPrefs = {
  currency: string
  dateFormat: string
  themeColor: string
  whatsappNumber: string
  companyName?: string
  companyContactName?: string
  companyEmail?: string
  companyPhone?: string
  companyAddress?: string
  companyWebsite?: string
  companyLogo?: string
  branchCount?: number
}

export default function ClientPersistence({ slug }: { slug: string }) {
  useEffect(() => {
    const forms = document.querySelectorAll('form')
    const formPrefs = forms[0] as HTMLFormElement | null
    const formBranch = forms[1] as HTMLFormElement | null
    const logoPreview = document.getElementById('companyLogoPreview') as HTMLDivElement | null

    let cachedPrefs: SasPrefs = {
      currency: '',
      dateFormat: '',
      themeColor: 'green',
      whatsappNumber: '',
      companyContactName: '',
      branchCount: undefined,
    }

    const renderLogoPreview = (url?: string) => {
      if (!logoPreview) return
      logoPreview.innerHTML = ''
      if (url) {
        const img = document.createElement('img')
        img.src = url
        img.alt = 'Logo de la empresa'
        img.className = 'w-full h-full object-contain'
        logoPreview.appendChild(img)
      } else {
        const span = document.createElement('span')
        span.textContent = 'Sin logo'
        span.className = 'text-xs text-gray-400'
        logoPreview.appendChild(span)
      }
    }

    const persistPrefs = (overrides?: Partial<SasPrefs>) => {
      cachedPrefs = {
        ...cachedPrefs,
        ...(overrides || {}),
      }
      setCookie(`sas-prefs-${slug}`, JSON.stringify(cachedPrefs))
    }

    const readFormIntoPrefs = () => {
      if (!formPrefs) return
      const currency = (formPrefs.querySelector('[name="currency"]') as HTMLInputElement)?.value || ''
      const dateFormat = (formPrefs.querySelector('[name="dateFormat"]') as HTMLInputElement)?.value || ''
      const themeColor = (formPrefs.querySelector('[name="themeColor"]') as HTMLSelectElement)?.value || 'green'
      const whatsappNumber = (formPrefs.querySelector('[name="whatsappNumber"]') as HTMLInputElement)?.value || ''
      const companyName = (formPrefs.querySelector('[name="companyName"]') as HTMLInputElement)?.value || ''
      const companyContactName = (formPrefs.querySelector('[name="companyContactName"]') as HTMLInputElement)?.value || ''
      const companyEmail = (formPrefs.querySelector('[name="companyEmail"]') as HTMLInputElement)?.value || ''
      const companyPhone = (formPrefs.querySelector('[name="companyPhone"]') as HTMLInputElement)?.value || ''
      const companyAddress = (formPrefs.querySelector('[name="companyAddress"]') as HTMLInputElement)?.value || ''
      const companyWebsite = (formPrefs.querySelector('[name="companyWebsite"]') as HTMLInputElement)?.value || ''
      const branchCount = formBranch ? formBranch.querySelectorAll('option').length : cachedPrefs.branchCount

      persistPrefs({
        currency,
        dateFormat,
        themeColor,
        whatsappNumber,
        companyName,
        companyContactName,
        companyEmail,
        companyPhone,
        companyAddress,
        companyWebsite,
        branchCount,
      })

      document.documentElement.setAttribute('data-sas-color', themeColor)
      const preview = document.getElementById('themeColorPreview') as HTMLDivElement | null
      if (preview) preview.style.background = 'var(--primary)'
    }

    const setFormValuesFromPrefs = (prefs: Partial<SasPrefs>) => {
      if (!formPrefs) return
      const currency = formPrefs.querySelector('[name="currency"]') as HTMLInputElement | null
      const dateFormat = formPrefs.querySelector('[name="dateFormat"]') as HTMLInputElement | null
      const themeColorSelect = formPrefs.querySelector('[name="themeColor"]') as HTMLSelectElement | null
      const whatsappInput = formPrefs.querySelector('[name="whatsappNumber"]') as HTMLInputElement | null
      const companyNameInput = formPrefs.querySelector('[name="companyName"]') as HTMLInputElement | null
      const companyContactNameInput = formPrefs.querySelector('[name="companyContactName"]') as HTMLInputElement | null
      const companyEmailInput = formPrefs.querySelector('[name="companyEmail"]') as HTMLInputElement | null
      const companyPhoneInput = formPrefs.querySelector('[name="companyPhone"]') as HTMLInputElement | null
      const companyAddressInput = formPrefs.querySelector('[name="companyAddress"]') as HTMLInputElement | null
      const companyWebsiteInput = formPrefs.querySelector('[name="companyWebsite"]') as HTMLInputElement | null

      if (currency && prefs.currency) currency.value = prefs.currency
      if (dateFormat && prefs.dateFormat) dateFormat.value = prefs.dateFormat
      if (themeColorSelect && prefs.themeColor) themeColorSelect.value = prefs.themeColor
      if (whatsappInput && prefs.whatsappNumber) whatsappInput.value = prefs.whatsappNumber
      if (companyNameInput && prefs.companyName) companyNameInput.value = prefs.companyName
      if (companyContactNameInput && prefs.companyContactName) companyContactNameInput.value = prefs.companyContactName
      if (companyEmailInput && prefs.companyEmail) companyEmailInput.value = prefs.companyEmail
      if (companyPhoneInput && prefs.companyPhone) companyPhoneInput.value = prefs.companyPhone
      if (companyAddressInput && prefs.companyAddress) companyAddressInput.value = prefs.companyAddress
      if (companyWebsiteInput && prefs.companyWebsite) companyWebsiteInput.value = prefs.companyWebsite

      if (prefs.themeColor) {
        document.documentElement.setAttribute('data-sas-color', prefs.themeColor)
        const preview = document.getElementById('themeColorPreview') as HTMLDivElement | null
        if (preview) preview.style.background = 'var(--primary)'
      }

      renderLogoPreview(prefs.companyLogo)
    }

    // Inicializar valores desde cookie
    try {
      const raw = document.cookie.split('; ').find(c => c.startsWith(`sas-prefs-${slug}=`))?.split('=')[1]
      if (raw) {
        const prefs = JSON.parse(decodeURIComponent(raw))
        cachedPrefs = {
          currency: prefs.currency || '',
          dateFormat: prefs.dateFormat || '',
          themeColor: prefs.themeColor || 'green',
          whatsappNumber: prefs.whatsappNumber || '',
          companyName: prefs.companyName || '',
          companyContactName: prefs.companyContactName || '',
          companyEmail: prefs.companyEmail || '',
          companyPhone: prefs.companyPhone || '',
          companyAddress: prefs.companyAddress || '',
          companyWebsite: prefs.companyWebsite || '',
          companyLogo: prefs.companyLogo || '',
          branchCount: prefs.branchCount,
        }
        setFormValuesFromPrefs(cachedPrefs)
      }
    } catch {}

    if (formPrefs) {
      formPrefs.addEventListener('change', () => {
        readFormIntoPrefs()
      })

      const logoInput = formPrefs.querySelector('[name="companyLogo"]') as HTMLInputElement | null
      if (logoInput) {
        logoInput.addEventListener('change', async () => {
          const file = logoInput.files?.[0]
          if (!file) {
            renderLogoPreview(cachedPrefs.companyLogo)
            return
          }
          try {
            const reader = new FileReader()
            const base64 = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve((reader.result as string).split(',')[1] || '')
              reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
              reader.readAsDataURL(file)
            })

            if (!base64) throw new Error('Archivo inválido')

            const response = await fetch(`/api/${slug}/config/logo`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ logoBase64: base64 })
            })

            if (!response.ok) {
              const error = await response.json().catch(() => ({}))
              throw new Error(error?.error || 'No se pudo guardar el logo')
            }

            const data = await response.json()
            const url = data?.url as string | undefined
            if (url) {
              const absoluteUrl = new URL(url, window.location.origin).toString()
              renderLogoPreview(absoluteUrl)
              persistPrefs({ companyLogo: absoluteUrl })
            }
          } catch (error) {
            console.error('Error cargando logo:', error)
            renderLogoPreview(cachedPrefs.companyLogo)
          } finally {
            logoInput.value = ''
          }
        })
      }

      // Swatches
      formPrefs.querySelectorAll('.color-swatch').forEach((el) => {
        el.addEventListener('click', () => {
          const color = (el as HTMLElement).dataset.color || 'green'
          const select = formPrefs.querySelector('[name="themeColor"]') as HTMLSelectElement | null
          if (select) select.value = color
          readFormIntoPrefs()
        })
      })

      // Inicial persist (en caso de que no haya cookie previa)
      readFormIntoPrefs()
    }

    if (formBranch) {
      formBranch.addEventListener('change', () => {
        const branchId = (formBranch.querySelector('[name="branchId"]') as HTMLSelectElement)?.value || ''
        setCookie(`sas-branch-${slug}`, branchId)
        const count = formBranch.querySelectorAll('option').length
        persistPrefs({ branchCount: count })
      })
    }
  }, [slug])
  return null
}


