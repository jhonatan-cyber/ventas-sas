"use client"

import { useCallback } from 'react'

import { useToast } from '@/hooks/use-toast'

export function useToastHelpers() {
  const { toast } = useToast()

  const showSuccess = useCallback(
    (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: 'default',
      })
    },
    [toast]
  )

  const showError = useCallback(
    (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: 'destructive',
      })
    },
    [toast]
  )

  const showInfo = useCallback(
    (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: 'default',
      })
    },
    [toast]
  )

  const showLoading = useCallback(
    (title: string, description?: string) => {
      return toast({
        title,
        description,
        variant: 'default',
      })
    },
    [toast]
  )

  return {
    showSuccess,
    showError,
    showInfo,
    showLoading,
  }
}

