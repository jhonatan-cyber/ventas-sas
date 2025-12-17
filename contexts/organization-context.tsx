"use client"

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'

import { getCachedOrganization, getCachedPreferences } from '@/lib/cache/api-cache'

interface OrganizationData {
  organization: any
  preferences: any
  loading: boolean
  error: string | null
  reload: () => void
}

const OrganizationContext = createContext<OrganizationData | null>(null)

interface OrganizationProviderProps {
  children: ReactNode
  slug: string
}

export function OrganizationProvider({ children, slug }: OrganizationProviderProps) {
  const [organization, setOrganization] = useState<any>(null)
  const [preferences, setPreferences] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!slug) return

    try {
      setLoading(true)
      setError(null)

      // Cargar ambos en paralelo usando caché
      const [orgData, prefData] = await Promise.all([
        getCachedOrganization(slug).catch(() => null),
        getCachedPreferences(slug).catch(() => null)
      ])

      setOrganization(orgData)
      setPreferences(prefData)
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos')
      console.error('Error loading organization data:', err)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    loadData()
  }, [slug, loadData])

  const value: OrganizationData = {
    organization,
    preferences,
    loading,
    error,
    reload: loadData
  }

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}