import { prisma } from '@/lib/prisma'
import { SasJWTService } from '@/lib/auth/sas-jwt'
import { PasswordService } from '@/lib/auth/password'
import { getCustomerBySlug, getOrganizationBySlug } from '@/lib/utils/organization'
import type { NextRequest } from 'next/server'
import { logger } from '@/lib/utils/logger'

export interface LoginSasCredentials {
  ci?: string
  correo?: string
  contraseña: string
}

export interface AuthSasResult {
  success: boolean
  user?: any
  token?: string
  error?: string
}

export class AuthSasService {
  // Login de usuario del sistema SAS
  static async login(
    customerSlug: string, 
    credentials: LoginSasCredentials,
    request?: NextRequest
  ): Promise<AuthSasResult> {
    try {
      const { ci, correo, contraseña } = credentials

      if (!contraseña) {
        return {
          success: false,
          error: 'La contraseña es requerida'
        }
      }

      if (!ci && !correo) {
        return {
          success: false,
          error: 'CI o correo electrónico es requerido'
        }
      }

      // Obtener la organización por slug (valida suscripción activa)
      let organization
      try {
        organization = await getOrganizationBySlug(customerSlug)
        if (!organization) {
          logger.debug('Organización no encontrada o sin suscripción activa', { customerSlug })
          return {
            success: false,
            error: 'Organización no encontrada, inactiva o sin suscripción activa'
          }
        }
      } catch (orgError) {
        logger.error('Error al obtener organización por slug', orgError as Error, { customerSlug })
        return {
          success: false,
          error: 'Error al validar organización'
        }
      }

      // Buscar usuario en la tabla usuarios_sas por organizationId
      const where: any = {
        organizationId: organization.id
      }

      if (ci) {
        where.ci = ci
      } else if (correo) {
        where.correo = correo
      }

      let usuario
      try {
        usuario = await prisma.usuarioSas.findFirst({
          where,
          select: {
            id: true,
            ci: true,
            nombre: true,
            apellido: true,
            correo: true,
            direccion: true,
            telefono: true,
            foto: true,
            contraseña: true,
            isActive: true,
            organizationId: true,
            twoFactorEnabled: true,
            twoFactorSecret: true,
            rolId: true,
            sucursalId: true,
            rol: {
              select: {
                id: true,
                nombre: true,
                descripcion: true
              }
            },
            sucursal: {
              select: {
                id: true,
                name: true
              }
            },
            organization: {
              select: {
                id: true,
                razonSocial: true,
                slug: true
              }
            }
          }
        })
      } catch (dbError) {
        logger.error('Error al buscar usuario SAS', dbError as Error, {
          organizationId: organization.id,
          hasCi: !!ci,
          hasCorreo: !!correo,
        })
        throw new Error('Error al buscar usuario en la base de datos')
      }

      if (!usuario) {
        return {
          success: false,
          error: 'Credenciales inválidas'
        }
      }

      if (!usuario.isActive) {
        return {
          success: false,
          error: 'Cuenta desactivada'
        }
      }

      // Validar que el usuario tenga organización asociada
      if (!usuario.organization || !usuario.organization.id) {
        logger.error('Usuario sin organización asociada', {
          userId: usuario.id,
          organizationId: usuario.organizationId,
        })
        return {
          success: false,
          error: 'Usuario sin organización asociada'
        }
      }

      if (!usuario.contraseña) {
        logger.debug('Usuario sin contraseña configurada', {
          userId: usuario.id,
          organizationId: usuario.organizationId,
        })
        return {
          success: false,
          error: 'Contraseña no configurada'
        }
      }

      // Verificar contraseña
      let isValidPassword = false
      try {
        isValidPassword = await PasswordService.verifyPassword(contraseña, usuario.contraseña)
      } catch (passwordError) {
        logger.error('Error al verificar contraseña', passwordError as Error, {
          userId: usuario.id,
          organizationId: usuario.organizationId,
        })
        return {
          success: false,
          error: 'Error al verificar credenciales'
        }
      }

      if (!isValidPassword) {
        logger.debug('Contraseña inválida', {
          userId: usuario.id,
          organizationId: usuario.organizationId,
          hasCi: !!ci,
          hasCorreo: !!correo,
        })
        return {
          success: false,
          error: 'Credenciales inválidas'
        }
      }

      // Verificar si tiene 2FA habilitado
      if (usuario.twoFactorEnabled && usuario.twoFactorSecret) {
        // Generar token temporal (válido por 5 minutos) para verificación 2FA
        const { default: jwt } = await import('jsonwebtoken')
        const SAS_JWT_SECRET = process.env.SAS_JWT_SECRET || 'dev-sas-secret'
        
        const tempToken = jwt.sign(
          {
            userId: usuario.id,
            organizationId: usuario.organization.id,
            temp: true,
          },
          SAS_JWT_SECRET,
          { expiresIn: '5m' } // 5 minutos para verificar 2FA
        )

        // Preparar datos del usuario (sin información sensible)
        const userData = {
          id: usuario.id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          correo: usuario.correo,
          organization: usuario.organization,
        }

        return {
          success: true,
          user: userData,
          requires2FA: true,
          tempToken, // Token temporal para verificar 2FA
        }
      }

      // No tiene 2FA: proceder con login normal
      // Crear sesión en BD
      let sessionToken: string | null = null
      try {
        const { SessionManagement } = await import('@/lib/auth/session-management')
        
        // Obtener info del request
        const ipAddress = request?.ip || request?.headers.get('x-forwarded-for')?.split(',')[0] || undefined
        const userAgent = request?.headers.get('user-agent') || undefined
        const deviceInfo = request ? SessionManagement.getDeviceInfo(request) : undefined
        
        sessionToken = await SessionManagement.createSession({
          userId: usuario.id,
          organizationId: usuario.organization.id,
          systemType: 'sas',
          ipAddress,
          userAgent,
          deviceInfo,
        }, {
          forceSingleSession: false, // Permitir múltiples sesiones
          trackDevice: true,
        })
      } catch (sessionError) {
        logger.error('Error al crear sesión SAS', sessionError as Error, {
          userId: usuario.id,
          organizationId: usuario.organization.id,
        })
        // Continuar sin sesión si falla (no crítico para el login)
        console.warn('No se pudo crear sesión, continuando sin ella:', sessionError)
      }

      // Generar token JWT (SAS) con sessionId
      let token: string
      try {
        token = await SasJWTService.generateToken({ 
          userId: usuario.id, 
          correo: usuario.correo || undefined,
          organizationId: usuario.organization.id,
          sessionId: sessionToken || undefined
        })
      } catch (tokenError) {
        logger.error('Error al generar token JWT SAS', tokenError as Error, {
          userId: usuario.id,
          organizationId: usuario.organization.id,
        })
        throw new Error('Error al generar token de autenticación')
      }

      // Preparar datos del usuario (sin contraseña)
      const userData = {
        id: usuario.id,
        ci: usuario.ci,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        direccion: usuario.direccion,
        telefono: usuario.telefono,
        foto: usuario.foto,
        rol: usuario.rol,
        sucursal: usuario.sucursal,
        organization: usuario.organization,
        isActive: usuario.isActive
      }

      return {
        success: true,
        user: userData,
        token
      }

    } catch (error) {
      logger.error('Error en login SAS', error as Error, {
        customerSlug,
        hasCi: !!credentials.ci,
        hasCorreo: !!credentials.correo,
      })
      console.error('Error completo en AuthSasService.login:', error)
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack available')
      
      // Retornar mensaje de error más específico en desarrollo
      const errorMessage = process.env.NODE_ENV === 'development' && error instanceof Error
        ? error.message
        : 'Error interno del servidor'
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  // Verificar token y obtener usuario
  static async verifyToken(customerSlug: string, token: string) {
    try {
      // verifyToken es asíncrono, debemos esperarlo
      const decoded = await SasJWTService.verifyToken(token)
      if (!decoded) {
        logger.debug('Token SAS no decodificado', { customerSlug })
        return null
      }

      // Verificar que el usuario pertenece al cliente
      const customer = await getCustomerBySlug(customerSlug)
      if (!customer) {
        logger.debug('Cliente no encontrado al verificar token', { customerSlug })
        return null
      }

      const usuario = await prisma.usuarioSas.findUnique({
        where: { id: decoded.userId },
        include: {
          rol: true,
          sucursal: true,
          organization: true
        }
      })

      if (!usuario) {
        logger.debug('Usuario no encontrado al verificar token', { userId: decoded.userId, customerSlug })
        return null
      }

      // Obtener la organización por slug para validar
      const organization = await getOrganizationBySlug(customerSlug)
      if (!organization || usuario.organizationId !== organization.id) {
        logger.debug('Usuario no pertenece a la organización', { 
          userId: decoded.userId, 
          usuarioOrganizationId: usuario.organizationId,
          organizationId: organization?.id,
          customerSlug 
        })
        return null
      }

      if (!usuario.isActive) {
        logger.debug('Usuario inactivo', { userId: decoded.userId, customerSlug })
        return null
      }

      // No retornar la contraseña
      const { contraseña, ...usuarioSinPassword } = usuario
      return usuarioSinPassword

    } catch (error) {
      logger.error('Error verificando token SAS', error as Error, {
        customerSlug,
        errorMessage: error instanceof Error ? error.message : String(error),
      })
      return null
    }
  }
}

