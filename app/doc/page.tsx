"use client";

/**
 * Swagger UI Documentation Page
 *
 * Ruta: /doc (página)
 * Muestra la interfaz visual de Swagger UI utilizando el endpoint /api/doc
 */

import dynamic from 'next/dynamic'

const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
        <p className="text-gray-600">Cargando documentación...</p>
      </div>
    </div>
  )
})

import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocPage() {
  const apiUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/api/doc` : '/api/doc'

  return (
    <div className="swagger-container">
      <style jsx global>{`
        .swagger-container {
          height: 100vh;
          overflow: auto;
        }
        .swagger-ui .topbar {
          display: none;
        }
        .swagger-ui .info {
          margin: 20px 0;
        }
      `}</style>
      <SwaggerUI
        url={apiUrl}
        docExpansion="list"
        defaultModelsExpandDepth={1}
        defaultModelExpandDepth={1}
        persistAuthorization={true}
      />
    </div>
  )
}

