import { describe, it, expect } from 'vitest'

import { AppError } from '@/lib/errors/app-error'

describe('AppError', () => {
  describe('constructor', () => {
    it('debería crear un error con statusCode y message', () => {
      const error = new AppError(404, 'Recurso no encontrado')

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
      expect(error.statusCode).toBe(404)
      expect(error.message).toBe('Recurso no encontrado')
      expect(error.isOperational).toBe(true)
    })

    it('debería crear un error no operacional cuando se especifica', () => {
      const error = new AppError(500, 'Error interno', false)

      expect(error.isOperational).toBe(false)
    })

    it('debería aceptar código y detalles adicionales', () => {
      const error = new AppError(400, 'Error de validación', true, 'VALIDATION_ERROR', {
        field: 'email',
        reason: 'Formato inválido',
      })

      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.details).toEqual({
        field: 'email',
        reason: 'Formato inválido',
      })
    })
  })

  describe('static methods', () => {
    it('validation() debería crear un error 400 con código VALIDATION_ERROR', () => {
      const error = AppError.validation('Email inválido')

      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.isOperational).toBe(true)
    })

    it('unauthorized() debería crear un error 401', () => {
      const error = AppError.unauthorized('Token inválido')

      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('UNAUTHORIZED')
      expect(error.message).toBe('Token inválido')
    })

    it('unauthorized() debería usar mensaje por defecto', () => {
      const error = AppError.unauthorized()

      expect(error.statusCode).toBe(401)
      expect(error.message).toBe('No autorizado')
    })

    it('forbidden() debería crear un error 403', () => {
      const error = AppError.forbidden('Sin permisos')

      expect(error.statusCode).toBe(403)
      expect(error.code).toBe('FORBIDDEN')
      expect(error.message).toBe('Sin permisos')
    })

    it('notFound() debería crear un error 404', () => {
      const error = AppError.notFound('Usuario no encontrado')

      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('NOT_FOUND')
      expect(error.message).toBe('Usuario no encontrado')
    })

    it('conflict() debería crear un error 409', () => {
      const error = AppError.conflict('Email ya existe', { email: 'test@example.com' })

      expect(error.statusCode).toBe(409)
      expect(error.code).toBe('CONFLICT')
      expect(error.details).toEqual({ email: 'test@example.com' })
    })

    it('tooManyRequests() debería crear un error 429', () => {
      const error = AppError.tooManyRequests('Demasiados intentos')

      expect(error.statusCode).toBe(429)
      expect(error.code).toBe('TOO_MANY_REQUESTS')
    })

    it('internal() debería crear un error 500 no operacional', () => {
      const error = AppError.internal('Error de base de datos')

      expect(error.statusCode).toBe(500)
      expect(error.code).toBe('INTERNAL_ERROR')
      expect(error.isOperational).toBe(false)
    })
  })

  describe('toJSON', () => {
    it('debería convertir el error a formato JSON', () => {
      const error = AppError.validation('Email inválido', { field: 'email' })
      const json = error.toJSON()

      expect(json).toEqual({
        error: 'Email inválido',
        code: 'VALIDATION_ERROR',
        details: { field: 'email' },
      })
    })

    it('debería omitir details si no están presentes', () => {
      const error = AppError.notFound('Usuario no encontrado')
      const json = error.toJSON()

      expect(json).toEqual({
        error: 'Usuario no encontrado',
        code: 'NOT_FOUND',
      })
      expect(json.details).toBeUndefined()
    })
  })
})

