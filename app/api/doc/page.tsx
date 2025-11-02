/**
 * Swagger UI Documentation Page
 * 
 * Ruta: /api/doc (página)
 * Muestra la interfaz visual de Swagger UI
 */

'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'

// Cargar Swagger UI solo en cliente para evitar errores de SSR
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando documentación...</p>
      </div>
    </div>
  ),
})

// Importar estilos de Swagger UI
import 'swagger-ui-react/swagger-ui.css'

export default function ApiDocPage() {
  const apiUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/doc` 
    : '/api/doc'

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

