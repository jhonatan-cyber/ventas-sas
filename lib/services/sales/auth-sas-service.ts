import { prisma } from '@/lib/prisma'
import { SasJWTService } from '@/lib/auth/sas-jwt'
import { PasswordService } from '@/lib/auth/password'
import { getCustomerBySlug } from '@/lib/utils/organization'
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

      // Obtener el cliente por slug
      const customer = await getCustomerBySlug(customerSlug)
      if (!customer) {
        return {
          success: false,
          error: 'Cliente no encontrado o inactivo'
        }
      }

      // Buscar usuario en la tabla usuarios_sas
      const where: any = {
        customerId: customer.id
      }

      if (ci) {
        where.ci = ci
      } else if (correo) {
        where.correo = correo
      }

      const usuario = await prisma.usuarioSas.findFirst({
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
          customerId: true,
          twoFactorEnabled: true,
          twoFactorSecret: true,
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
          customer: {
            select: {
              id: true,
              razonSocial: true,
              slug: true
            }
          }
        }
      })

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

      if (!usuario.contraseña) {
        return {
          success: false,
          error: 'Contraseña no configurada'
        }
      }

      // Verificar contraseña
      const isValidPassword = await PasswordService.verifyPassword(contraseña, usuario.contraseña)
      if (!isValidPassword) {
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
            customerId: usuario.customer.id,
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
          customer: usuario.customer,
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
      const { SessionManagement } = await import('@/lib/auth/session-management')
      
      // Obtener info del request
      const ipAddress = request?.ip || request?.headers.get('x-forwarded-for')?.split(',')[0] || undefined
      const userAgent = request?.headers.get('user-agent') || undefined
      const deviceInfo = request ? SessionManagement.getDeviceInfo(request) : undefined
      
      const sessionToken = await SessionManagement.createSession({
        userId: usuario.id,
        customerId: usuario.customer.id,
        systemType: 'sas',
        ipAddress,
        userAgent,
        deviceInfo,
      }, {
        forceSingleSession: false, // Permitir múltiples sesiones
        trackDevice: true,
      })

      // Generar token JWT (SAS) con sessionId
      const token = await SasJWTService.generateToken({ 
        userId: usuario.id, 
        correo: usuario.correo || undefined,
        customerId: usuario.customer.id,
        sessionId: sessionToken
      })

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
        customer: usuario.customer,
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
      return {
        success: false,
        error: 'Error interno del servidor'
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
          customer: true
        }
      })

      if (!usuario) {
        logger.debug('Usuario no encontrado al verificar token', { userId: decoded.userId, customerSlug })
        return null
      }

      if (usuario.customerId !== customer.id) {
        logger.debug('Usuario no pertenece al cliente', { 
          userId: decoded.userId, 
          usuarioCustomerId: usuario.customerId,
          customerId: customer.id,
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

