import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Limpiar después de cada test
afterEach(() => {
  cleanup()
})

// Mock de variables de entorno
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.SAS_JWT_SECRET = 'test-sas-jwt-secret'
process.env.ADMIN_JWT_SECRET = 'test-admin-jwt-secret'
process.env.NODE_ENV = 'test'

// Extender expect con matchers de testing-library
expect.extend({
  // Puedes agregar matchers personalizados aquí si los necesitas
})

