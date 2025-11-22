"use client"

import posthog from "posthog-js"

/**
 * Cliente de PostHog para tracking de eventos en el cliente
 */
export class PostHogClient {
  /**
   * Verificar si PostHog está inicializado
   */
  static isInitialized(): boolean {
    if (typeof window === "undefined") return false
    return posthog.__loaded || false
  }

  /**
   * Capturar un evento
   */
  static capture(eventName: string, properties?: Record<string, any>) {
    if (typeof window === "undefined") return
    if (!this.isInitialized()) {
      console.warn("PostHog no está inicializado")
      return
    }

    try {
      posthog.capture(eventName, properties)
    } catch (error) {
      console.error("Error al capturar evento en PostHog:", error)
    }
  }

  /**
   * Identificar un usuario
   */
  static identify(userId: string, properties?: Record<string, any>) {
    if (typeof window === "undefined") return
    if (!this.isInitialized()) {
      console.warn("PostHog no está inicializado")
      return
    }

    try {
      posthog.identify(userId, properties)
    } catch (error) {
      console.error("Error al identificar usuario en PostHog:", error)
    }
  }

  /**
   * Resetear la identificación del usuario (logout)
   */
  static reset() {
    if (typeof window === "undefined") return
    if (!this.isInitialized()) return

    try {
      posthog.reset()
    } catch (error) {
      console.error("Error al resetear PostHog:", error)
    }
  }

  /**
   * Establecer propiedades del usuario
   */
  static setPersonProperties(properties: Record<string, any>) {
    if (typeof window === "undefined") return
    if (!this.isInitialized()) return

    try {
      posthog.setPersonProperties(properties)
    } catch (error) {
      console.error("Error al establecer propiedades en PostHog:", error)
    }
  }
}

