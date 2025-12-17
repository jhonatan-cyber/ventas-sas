/**
 * Servicio de Autenticación de Dos Factores (2FA)
 * 
 * Implementa TOTP (Time-based One-Time Password) usando otplib
 * Compatible con Google Authenticator, Authy, Microsoft Authenticator, etc.
 */

import crypto from 'crypto'

import { authenticator } from 'otplib'
import QRCode from 'qrcode'

import { PasswordService } from './password'

// Configurar otplib
authenticator.options = {
  step: 30, // Códigos válidos por 30 segundos
  window: 1, // Permitir 1 paso de tolerancia (±30 segundos)
}

export interface TwoFactorSetup {
  secret: string
  qrCode: string // Data URL de la imagen QR
  backupCodes: string[] // Códigos de respaldo (mostrar solo una vez)
}

export interface TwoFactorVerificationResult {
  valid: boolean
  isBackupCode?: boolean
}

export class TwoFactorService {
  /**
   * Genera un secret único para el usuario
   */
  static generateSecret(): string {
    return authenticator.generateSecret()
  }

  /**
   * Genera un código TOTP para un secret dado (útil para testing)
   */
  static generateToken(secret: string): string {
    return authenticator.generate(secret)
  }

  /**
   * Valida un código TOTP contra un secret
   */
  static verifyToken(secret: string, token: string): boolean {
    try {
      return authenticator.verify({ token, secret })
    } catch {
      return false
    }
  }

  /**
   * Genera QR Code para configuración inicial
   */
  static async generateQRCode(
    secret: string,
    email: string,
    serviceName: string = 'Ventas SAS'
  ): Promise<string> {
    // Crear URI para authenticator apps
    const otpauth = authenticator.keyuri(email, serviceName, secret)

    // Generar QR Code como Data URL
    try {
      const qrCodeDataURL = await QRCode.toDataURL(otpauth, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 2,
      })
      return qrCodeDataURL
    } catch {
      throw new Error('Error generando QR Code')
    }
  }

  /**
   * Genera códigos de respaldo (backup codes)
   * Cada código debe ser único y aleatorio
   */
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
      // Generar código de 8 dígitos
      const code = crypto.randomInt(10000000, 99999999).toString()
      codes.push(code)
    }
    return codes
  }

  /**
   * Hashea un backup code para almacenamiento seguro
   */
  static async hashBackupCode(code: string): Promise<string> {
    // Usar bcrypt para hashear backup codes
    return await PasswordService.hashPassword(code)
  }

  /**
   * Verifica un backup code contra la lista hasheada
   */
  static async verifyBackupCode(
    code: string,
    hashedCodes: string[]
  ): Promise<boolean> {
    for (const hashedCode of hashedCodes) {
      const isValid = await PasswordService.verifyPassword(code, hashedCode)
      if (isValid) {
        return true
      }
    }
    return false
  }

  /**
   * Hashea todos los backup codes para almacenamiento
   */
  static async hashBackupCodes(codes: string[]): Promise<string[]> {
    return Promise.all(codes.map(code => this.hashBackupCode(code)))
  }

  /**
   * Prepara setup completo de 2FA para un usuario
   */
  static async setupTwoFactor(
    email: string,
    serviceName: string = 'Ventas SAS'
  ): Promise<TwoFactorSetup> {
    // Generar secret
    const secret = this.generateSecret()

    // Generar QR Code
    const qrCode = await this.generateQRCode(secret, email, serviceName)

    // Generar backup codes
    const backupCodes = this.generateBackupCodes(10)

    return {
      secret,
      qrCode,
      backupCodes,
    }
  }

  /**
   * Valida un código 2FA (puede ser TOTP o backup code)
   */
  static async verifyTwoFactor(
    secret: string | null,
    token: string,
    backupCodes?: string[] | null
  ): Promise<TwoFactorVerificationResult> {
    // Si no hay secret, 2FA no está habilitado
    if (!secret) {
      return { valid: false }
    }

    // Intentar verificar como TOTP primero
    if (this.verifyToken(secret, token)) {
      return { valid: true, isBackupCode: false }
    }

    // Si falla TOTP, verificar como backup code
    if (backupCodes && Array.isArray(backupCodes) && backupCodes.length > 0) {
      const isValidBackup = await this.verifyBackupCode(token, backupCodes)
      if (isValidBackup) {
        return { valid: true, isBackupCode: true }
      }
    }

    return { valid: false }
  }

  /**
   * Encripta un secret para almacenamiento seguro
   * En producción, usar una clave de encriptación desde variables de entorno
   */
  static encryptSecret(secret: string): string {
    const algorithm = 'aes-256-cbc'
    const key = Buffer.from(
      process.env.ENCRYPTION_KEY || 
      'your-32-char-encryption-key-here-change-in-production',
      'utf8'
    ).slice(0, 32)
    
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(algorithm, key, iv)
    
    let encrypted = cipher.update(secret, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Retornar IV + encrypted data (base64)
    return Buffer.from(iv.toString('hex') + ':' + encrypted, 'utf8').toString('base64')
  }

  /**
   * Desencripta un secret almacenado
   */
  static decryptSecret(encryptedSecret: string): string {
    try {
      const algorithm = 'aes-256-cbc'
      const key = Buffer.from(
        process.env.ENCRYPTION_KEY || 
        'your-32-char-encryption-key-here-change-in-production',
        'utf8'
      ).slice(0, 32)
      
      const data = Buffer.from(encryptedSecret, 'base64').toString('utf8')
      const [ivHex, encrypted] = data.split(":")
      
      if (!ivHex || !encrypted) {
        throw new Error('Formato de secret encriptado inválido')
      }
      
      const iv = Buffer.from(ivHex, 'hex')
      const decipher = crypto.createDecipheriv(algorithm, key, iv)
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch {
      throw new Error('Error desencriptando secret')
    }
  }

  /**
   * Formatea el secret en grupos de 4 caracteres para mejor legibilidad
   */
  static formatSecret(secret: string): string {
    return secret.match(/.{1,4}/g)?.join(' ') || secret
  }
}

