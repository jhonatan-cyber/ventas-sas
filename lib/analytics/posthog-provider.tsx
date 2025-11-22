"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import { useEffect } from "react"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
      const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com"

      if (posthogKey) {
        posthog.init(posthogKey, {
          api_host: posthogHost,
          loaded: (_posthog) => {
            if (process.env.NODE_ENV === "development") {
              console.log("PostHog initialized")
            }
          },
          // Capturar automáticamente eventos de página
          capture_pageview: true,
          capture_pageleave: true,
          // No capturar automáticamente clicks (solo eventos específicos)
          autocapture: false,
        })
      }
    }
  }, [])

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY

  if (!posthogKey) {
    return <>{children}</>
  }

  return <PHProvider client={posthog}>{children}</PHProvider>
}

