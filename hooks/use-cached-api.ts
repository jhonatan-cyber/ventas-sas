"use client"

import { useCallback, useEffect, useState } from 'react'

import { getCachedOrganization, getCachedPreferences } from '@/lib/cache/api-cache'

/**
 * Hook para obtener información de la organización con caché
 */
export function useCachedOrganization(slug: string) {
  const [organization, setOrganization] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadOrganization = useCallback(async () => {
    if (!slug) return

    try {
      setLoading(true)
      setError(null)
      const data = await getCachedOrganization(slug)
      setOrganization(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar organización')
      console.error('Error loading organization:', err)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    loadOrganization()
  }, [loadOrganization])

  return { organization, loading, error, reload: loadOrganization }
}

/**
 * Hook para obtener preferencias con caché
 */
export function useCachedPreferences(slug: string) {
  const [preferences, setPreferences] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPreferences = useCallback(async () => {
    if (!slug) return

    try {
      setLoading(true)
      setError(null)
      const data = await getCachedPreferences(slug)
      setPreferences(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar preferencias')
      console.error('Error loading preferences:', err)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  return { preferences, loading, error, reload: loadPreferences }
}

/**
 * Hook combinado para obtener tanto organización como preferencias
 */
export function useCachedOrganizationData(slug: string) {
  const orgResult = useCachedOrganization(slug)
  const prefResult = useCachedPreferences(slug)

  return {
    organization: orgResult.organization,
    preferences: prefResult.preferences,
    loading: orgResult.loading || prefResult.loading,
    error: orgResult.error || prefResult.error,
    reloadOrganization: orgResult.reload,
    reloadPreferences: prefResult.reload,
    reloadAll: () => {
      orgResult.reload()
      prefResult.reload()
    }
  }
}