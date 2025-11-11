declare module 'swagger-ui-react' {
  import { Component } from 'react'

  export interface SwaggerUIProps {
    url?: string
    spec?: Record<string, unknown>
    docExpansion?: 'list' | 'full' | 'none'
    defaultModelsExpandDepth?: number
    defaultModelExpandDepth?: number
    persistAuthorization?: boolean
    onComplete?: (system: unknown) => void
    requestInterceptor?: (request: unknown) => unknown
    responseInterceptor?: (response: unknown) => unknown
    [key: string]: unknown
  }

  export default class SwaggerUI extends Component<SwaggerUIProps> {}
}
