import { PostHog } from "posthog-node"

let posthogClient: PostHog | null = null

/**
 * Obtener o inicializar el cliente de PostHog para el servidor
 */
function getPostHogClient(): PostHog | null {
  if (posthogClient) {
    return posthogClient
  }

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com"

  if (!posthogKey) {
    return null
  }

  try {
    posthogClient = new PostHog(posthogKey, {
      host: posthogHost,
      flushAt: 20,
      flushInterval: 10000,
    })
    return posthogClient
  } catch (error) {
    console.error("Error al inicializar PostHog en el servidor:", error)
    return null
  }
}

/**
 * Capturar un evento desde el servidor
 */
export function captureServerEvent(
  distinctId: string,
  eventName: string,
  properties?: Record<string, any>
) {
  const client = getPostHogClient()
  if (!client) return

  try {
    client.capture({
      distinctId,
      event: eventName,
      properties: {
        ...properties,
        $lib: "posthog-node",
        $lib_version: "3.0.0",
      },
    })
  } catch (error) {
    console.error("Error al capturar evento en PostHog (servidor):", error)
  }
}

/**
 * Identificar un usuario desde el servidor
 */
export function identifyServerUser(
  distinctId: string,
  properties?: Record<string, any>
) {
  const client = getPostHogClient()
  if (!client) return

  try {
    client.identify({
      distinctId,
      properties,
    })
  } catch (error) {
    console.error("Error al identificar usuario en PostHog (servidor):", error)
  }
}

/**
 * Cerrar el cliente de PostHog (útil para cleanup)
 */
export async function shutdownPostHog() {
  if (posthogClient) {
    await posthogClient.shutdown()
    posthogClient = null
  }
}

