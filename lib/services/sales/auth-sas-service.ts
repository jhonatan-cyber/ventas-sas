import { prisma } from '@/lib/prisma'
import { JWTService, type JWTPayload } from '@/lib/auth/jwt'
import { PasswordService } from '@/lib/auth/password'
import { getCustomerBySlug } from '@/lib/utils/organization'

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
  static async login(customerSlug: string, credentials: LoginSasCredentials): Promise<AuthSasResult> {
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
        include: {
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

      // Generar token JWT
      const payload: JWTPayload = {
        userId: usuario.id,
        email: usuario.correo || '',
        isSuperAdmin: false
      }

      const token = JWTService.generateToken(payload)

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
      console.error('Error en login SAS:', error)
      return {
        success: false,
        error: 'Error interno del servidor'
      }
    }
  }

  // Verificar token y obtener usuario
  static async verifyToken(customerSlug: string, token: string) {
    try {
      const decoded = JWTService.verifyToken(token)
      if (!decoded) return null

      // Verificar que el usuario pertenece al cliente
      const customer = await getCustomerBySlug(customerSlug)
      if (!customer) return null

      const usuario = await prisma.usuarioSas.findUnique({
        where: { id: decoded.userId },
        include: {
          rol: true,
          sucursal: true,
          customer: true
        }
      })

      if (!usuario || usuario.customerId !== customer.id || !usuario.isActive) {
        return null
      }

      // No retornar la contraseña
      const { contraseña, ...usuarioSinPassword } = usuario
      return usuarioSinPassword

    } catch (error) {
      console.error('Error verificando token SAS:', error)
      return null
    }
  }
}

