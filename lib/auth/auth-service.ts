import { prisma } from '../prisma'
import { JWTService, type JWTPayload } from './jwt'
import { PasswordService } from './password'
import { AuthService as ProfileService } from '../services/auth-service'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  fullName?: string
  companyName?: string
  organizationId?: string
}

export interface AuthResult {
  success: boolean
  user?: any
  token?: string
  error?: string
}

export class AuthService {
  // Login de usuario
  static async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const { email, password } = credentials

      // Buscar usuario en la tabla Profile (sistema de administración)
      const user = await prisma.profile.findUnique({
        where: { email },
        include: {
          organizationMembers: {
            include: {
              organization: true
            }
          }
        }
      })

      if (!user) {
        return {
          success: false,
          error: 'Credenciales inválidas'
        }
      }

      if (!user.isActive) {
        return {
          success: false,
          error: 'Cuenta desactivada'
        }
      }

      if (!user.password) {
        return {
          success: false,
          error: 'Contraseña no configurada'
        }
      }

      // Verificar contraseña
      const isValidPassword = await PasswordService.verifyPassword(password, user.password)
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Credenciales inválidas'
        }
      }

      // Actualizar último login
      await prisma.profile.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      })

      // Generar token JWT
      const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin
      }

      const token = JWTService.generateToken(payload)

      // Preparar datos del usuario
      const userData = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        organizationMembers: user.organizationMembers
      }

      return {
        success: true,
        user: userData,
        token
      }

    } catch (error) {
      console.error('Error en login:', error)
      return {
        success: false,
        error: 'Error interno del servidor'
      }
    }
  }

  // Registro de usuario
  static async register(data: RegisterData): Promise<AuthResult> {
    try {
      const { email, password, fullName, companyName, organizationId } = data

      // Verificar si el email ya existe
      const existingUser = await prisma.profile.findUnique({
        where: { email }
      })

      if (existingUser) {
        return {
          success: false,
          error: 'El email ya está registrado'
        }
      }

      // Validar fortaleza de contraseña
      const passwordValidation = PasswordService.validatePasswordStrength(password)
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.errors.join(', ')
        }
      }

      // Hash de la contraseña
      const hashedPassword = await PasswordService.hashPassword(password)

      // Crear usuario
      const user = await prisma.profile.create({
        data: {
          email,
          password: hashedPassword,
          fullName,
          companyName,
          organizationId,
          role: 'user',
          isActive: true
        },
        include: {
          organization: true
        }
      })

      // Generar token JWT
      const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
        organizationId: user.organizationId
      }

      const token = JWTService.generateToken(payload)

      // Preparar datos del usuario
      const userData = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        companyName: user.companyName,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        organizationId: user.organizationId,
        organization: user.organization
      }

      return {
        success: true,
        user: userData,
        token
      }

    } catch (error) {
      console.error('Error en registro:', error)
      return {
        success: false,
        error: 'Error interno del servidor'
      }
    }
  }

  // Verificar token y obtener usuario
  static async verifyToken(token: string) {
    try {
      const user = await JWTService.getAuthenticatedUser(token)
      return user
    } catch (error) {
      return null
    }
  }

  // Logout (solo invalidar token del lado del cliente)
  static async logout(): Promise<{ success: boolean }> {
    // En una implementación completa, aquí podrías:
    // 1. Agregar el token a una lista negra
    // 2. Actualizar el lastLogoutAt del usuario
    // 3. Limpiar sesiones activas
    
    return { success: true }
  }

  // Cambiar contraseña
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<AuthResult> {
    try {
      const user = await prisma.profile.findUnique({
        where: { id: userId }
      })

      if (!user || !user.password) {
        return {
          success: false,
          error: 'Usuario no encontrado'
        }
      }

      // Verificar contraseña actual
      const isValidCurrentPassword = await PasswordService.verifyPassword(currentPassword, user.password)
      if (!isValidCurrentPassword) {
        return {
          success: false,
          error: 'Contraseña actual incorrecta'
        }
      }

      // Validar nueva contraseña
      const passwordValidation = PasswordService.validatePasswordStrength(newPassword)
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.errors.join(', ')
        }
      }

      // Hash de la nueva contraseña
      const hashedNewPassword = await PasswordService.hashPassword(newPassword)

      // Actualizar contraseña
      await prisma.profile.update({
        where: { id: userId },
        data: { 
          password: hashedNewPassword,
          updatedAt: new Date()
        }
      })

      return {
        success: true
      }

    } catch (error) {
      console.error('Error cambiando contraseña:', error)
      return {
        success: false,
        error: 'Error interno del servidor'
      }
    }
  }

  // Resetear contraseña (para super admin)
  static async resetPassword(userId: string, newPassword: string): Promise<AuthResult> {
    try {
      // Validar nueva contraseña
      const passwordValidation = PasswordService.validatePasswordStrength(newPassword)
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.errors.join(', ')
        }
      }

      // Hash de la nueva contraseña
      const hashedPassword = await PasswordService.hashPassword(newPassword)

      // Actualizar contraseña
      await prisma.profile.update({
        where: { id: userId },
        data: { 
          password: hashedPassword,
          updatedAt: new Date()
        }
      })

      return {
        success: true
      }

    } catch (error) {
      console.error('Error reseteando contraseña:', error)
      return {
        success: false,
        error: 'Error interno del servidor'
      }
    }
  }

  // Generar contraseña temporal
  static async generateTemporaryPassword(userId: string): Promise<AuthResult> {
    try {
      const tempPassword = PasswordService.generateRandomPassword(12)
      const hashedPassword = await PasswordService.hashPassword(tempPassword)

      await prisma.profile.update({
        where: { id: userId },
        data: { 
          password: hashedPassword,
          updatedAt: new Date()
        }
      })

      return {
        success: true,
        user: { tempPassword }
      }

    } catch (error) {
      console.error('Error generando contraseña temporal:', error)
      return {
        success: false,
        error: 'Error interno del servidor'
      }
    }
  }
}
