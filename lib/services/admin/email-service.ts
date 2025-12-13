import { Resend } from 'resend'

import { logger } from '@/lib/utils/logger'

export interface CredentialsEmailData {
  email: string
  password: string
  username: string // CI o email
  organizationName: string
  organizationSlug: string
  landingUrl: string
  loginUrl: string
  customerName?: string
  ownerName?: string
  ownerEmail?: string
  planName?: string
  planDescription?: string
  planPrice?: string
  subscriptionPeriod?: string
  subscriptionStatus?: string
  isFirstInvoice?: boolean
  pdfAttachment?: {
    content: string // Base64 string
    filename: string
  }
}

export interface PasswordResetEmailData {
  email: string
  resetUrl: string
  userName: string
  organizationName: string
}

export class EmailService {
  /**
   * Enviar credenciales por email usando Resend
   */
  static async sendCredentials(data: CredentialsEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const resendApiKey = process.env.RESEND_API_KEY
      const mailFrom = process.env.MAIL_FROM || 'Soporte Nuwevet <onboarding@resend.dev>'

      if (!resendApiKey) {
        logger.error('RESEND_API_KEY no está configurada')
        return {
          success: false,
          error: 'Configuración de email no encontrada'
        }
      }

      const resend = new Resend(resendApiKey)

      const subject = data.isFirstInvoice
        ? `¡Bienvenido a ${data.organizationName}! - Credenciales de acceso`
        : `Credenciales de acceso - ${data.organizationName}`

      const htmlContent = this.generateWelcomeEmailTemplate(data)

      logger.info('Enviando credenciales por email', {
        to: data.email,
        organization: data.organizationName,
        isFirstInvoice: data.isFirstInvoice,
      })

      // En desarrollo, logueamos el contenido del email
      if (process.env.NODE_ENV === 'development') {
        console.log('\n=== EMAIL DE CREDENCIALES ===')
        console.log('To:', data.email)
        console.log('Subject:', subject)
        console.log('HTML Content Length:', htmlContent.length)
        console.log('===========================\n')
      }

      // Intentar enviar el email
      const result = await resend.emails.send({
        from: mailFrom,
        to: data.email,
        subject,
        html: htmlContent,
        attachments: data.pdfAttachment ? [
          {
            content: data.pdfAttachment.content,
            filename: data.pdfAttachment.filename,
          }
        ] : undefined,
      })

      if (result.error) {
        logger.error('Error al enviar email con Resend', result.error)
        
        // Mensaje de error más específico y útil
        let errorMessage = result.error.message || 'Error al enviar el email'
        
        if (result.error.message?.includes('testing emails') || 
            result.error.message?.includes('verify a domain')) {
          errorMessage = `Resend solo permite enviar emails de prueba a direcciones verificadas (actualmente: jhonatanancasi@gmail.com). Para enviar a "${data.email}", por favor verifica un dominio en https://resend.com/domains y actualiza la variable MAIL_FROM para usar ese dominio.`
        }
        
        return {
          success: false,
          error: errorMessage
        }
      }

      logger.info('Email enviado exitosamente', {
        emailId: result.data?.id,
        to: data.email,
      })

      return { success: true }
    } catch (error) {
      logger.error('Error al enviar credenciales por email', error as Error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al enviar el email'
      }
    }
  }

  /**
   * Generar plantilla HTML para el email de bienvenida con credenciales
   */
  private static generateWelcomeEmailTemplate(data: CredentialsEmailData): string {
    const welcomeSection = data.isFirstInvoice ? `
      <div style="background-color: #f5f5f5; color: #333333; padding: 50px 30px; text-align: center; border-bottom: 2px solid #e5e5e5;">
        <h1 style="margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 2px; text-transform: uppercase;">¡Bienvenido</h1>
        <p style="margin: 12px 0 0 0; font-size: 16px; font-weight: 300; letter-spacing: 1px; color: #666666;">${data.organizationName}</p>
      </div>
    ` : ''

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.7; 
            color: #333333; 
            margin: 0; 
            padding: 0; 
            background-color: #ffffff;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff;
            border: 1px solid #e5e5e5;
          }
          .content { 
            padding: 50px 40px; 
          }
          .section {
            background-color: #ffffff;
            padding: 28px 0;
            margin: 32px 0;
            border-top: 1px solid #d1d5db;
            border-bottom: 1px solid #d1d5db;
          }
          .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #333333;
            margin: 0 0 20px 0;
            padding-bottom: 12px;
            border-bottom: 1px solid #d1d5db;
            letter-spacing: 1.5px;
            text-transform: uppercase;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e5e5e5;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-label {
            font-weight: 400;
            color: #666666;
            flex: 1;
            font-size: 14px;
            letter-spacing: 0.3px;
          }
          .info-value {
            color: #333333;
            flex: 1;
            text-align: right;
            font-weight: 500;
            font-size: 14px;
          }
          .credentials-box {
            background-color: #f5f5f5;
            color: #333333;
            padding: 40px 32px;
            margin: 40px 0;
            text-align: center;
            border: 2px solid #d1d5db;
          }
          .credentials-box h3 {
            margin: 0 0 32px 0;
            font-size: 18px;
            font-weight: 400;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #333333;
          }
          .credential-item {
            background-color: #ffffff;
            color: #333333;
            padding: 20px 24px;
            margin: 16px 0;
            border: 1px solid #d1d5db;
          }
          .credential-label {
            font-size: 11px;
            margin-bottom: 10px;
            font-weight: 400;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: #666666;
          }
          .credential-value {
            font-size: 22px;
            font-weight: 500;
            font-family: 'Courier New', monospace;
            letter-spacing: 1px;
            color: #333333;
          }
          .button { 
            display: inline-block; 
            padding: 16px 40px; 
            background-color: #f5f5f5; 
            color: #333333; 
            text-decoration: none; 
            margin: 8px 6px;
            font-weight: 400;
            font-size: 14px;
            letter-spacing: 1px;
            text-transform: uppercase;
            border: 1px solid #d1d5db;
          }
          .button:hover {
            background-color: #e5e5e5;
            color: #333333;
          }
          .footer { 
            text-align: center; 
            padding: 40px 20px; 
            color: #666666; 
            font-size: 12px; 
            background-color: #ffffff;
            border-top: 1px solid #e5e5e5;
            line-height: 1.8;
            letter-spacing: 0.5px;
          }
          .url-box {
            text-align: center;
            margin: 40px 0;
          }
          .note-box {
            margin-top: 32px;
            padding: 20px 24px;
            background-color: #f9fafb;
            border: 1px solid #d1d5db;
            color: #333333;
            font-size: 13px;
            line-height: 1.7;
            letter-spacing: 0.3px;
          }
          .note-box strong {
            color: #333333;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${welcomeSection}
          <div class="content">
            <p style="font-size: 16px; color: #333333; margin-bottom: 24px; letter-spacing: 0.3px;">Estimado/a <strong>${data.customerName || 'Usuario'}</strong>,</p>
            
            ${data.isFirstInvoice ? `
              <p style="font-size: 15px; color: #333333; margin-top: 0; line-height: 1.8; letter-spacing: 0.2px;">
                Nos complace darte la bienvenida a nuestra plataforma. Tu factura ha sido procesada exitosamente y tu cuenta está lista para usar.
              </p>
            ` : `
              <p style="font-size: 15px; color: #333333; margin-top: 0; line-height: 1.8; letter-spacing: 0.2px;">
                Te enviamos tus credenciales de acceso para <strong>${data.organizationName}</strong>:
              </p>
            `}

            <div class="credentials-box">
              <h3>🔐 Tus Credenciales de Acceso</h3>
              <div class="credential-item">
                <div class="credential-label">Usuario</div>
                <div class="credential-value" style="margin-bottom: 10px;">Correo: ${data.email}</div>
                ${data.ci ? `<div class="credential-value">CI: ${data.ci}</div>` : ''}
              </div>
              <div class="credential-item">
                <div class="credential-label">Contraseña</div>
                <div class="credential-value">${data.password}</div>
              </div>
              <p style="font-size: 12px; margin-top: 20px; padding: 16px; background-color: #ffffff; color: #333333; border: 1px solid #d1d5db; letter-spacing: 0.3px; line-height: 1.6;">
                <strong>Importante:</strong> Puedes iniciar sesión usando tu <strong>correo electrónico (${data.email})</strong>${data.ci ? ` o tu <strong>CI (${data.ci})</strong>` : ''} como usuario.
              </p>
            </div>

            <div class="url-box">
              <a href="${data.loginUrl}" class="button">Iniciar Sesión</a>
              <a href="${data.landingUrl}" class="button">Ir al Dashboard</a>
            </div>

            <div class="section">
              <div class="section-title">Información de la Empresa</div>
              <div class="info-row">
                <span class="info-label">Nombre:</span>
                <span class="info-value">${data.organizationName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">URL de Acceso:</span>
                <span class="info-value">${data.organizationSlug}</span>
              </div>
              ${data.ownerName ? `
                <div class="info-row">
                  <span class="info-label">Dueño:</span>
                  <span class="info-value">${data.ownerName}</span>
                </div>
              ` : ''}
              ${data.ownerEmail ? `
                <div class="info-row">
                  <span class="info-label">Email del Dueño:</span>
                  <span class="info-value">${data.ownerEmail}</span>
                </div>
              ` : ''}
            </div>

            ${data.planName ? `
              <div class="section">
                <div class="section-title">Información del Plan</div>
                <div class="info-row">
                  <span class="info-label">Plan:</span>
                  <span class="info-value">${data.planName}</span>
                </div>
                ${data.planPrice ? `
                  <div class="info-row">
                    <span class="info-label">Precio:</span>
                    <span class="info-value" style="font-weight: 600;">${data.planPrice}</span>
                  </div>
                ` : ''}
                ${data.planDescription ? `
                  <div class="info-row">
                    <span class="info-label">Descripción:</span>
                    <span class="info-value">${data.planDescription}</span>
                  </div>
                ` : ''}
                ${data.subscriptionPeriod ? `
                  <div class="info-row">
                    <span class="info-label">Periodo de Facturación:</span>
                    <span class="info-value">${data.subscriptionPeriod}</span>
                  </div>
                ` : ''}
                ${data.subscriptionStatus ? `
                  <div class="info-row">
                    <span class="info-label">Estado:</span>
                    <span class="info-value">${data.subscriptionStatus}</span>
                  </div>
                ` : ''}
              </div>
            ` : ''}

            <div class="note-box">
              <strong>⚠️ Importante:</strong> Por favor, guarda esta información de forma segura. Tu contraseña es tu CI (Cédula de Identidad).
            </div>

            <p style="margin-top: 32px; color: #333333; font-size: 14px; line-height: 1.8; letter-spacing: 0.2px;">
              Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. Estamos aquí para ayudarte.
            </p>
          </div>
          <div class="footer">
            <p style="margin: 0;">Este es un email automático, por favor no responda.</p>
            <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} ${data.organizationName}. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Enviar email de recuperación de contraseña
   */
  static async sendPasswordReset(data: PasswordResetEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const resendApiKey = process.env.RESEND_API_KEY
      const mailFrom = process.env.MAIL_FROM || 'Soporte Nuwevet <onboarding@resend.dev>'

      if (!resendApiKey) {
        logger.error('RESEND_API_KEY no está configurada')
        return {
          success: false,
          error: 'Configuración de email no encontrada'
        }
      }

      const resend = new Resend(resendApiKey)

      const subject = `Recuperación de contraseña - ${data.organizationName}`

      const htmlContent = this.generatePasswordResetEmailTemplate(data)

      logger.info('Enviando email de recuperación de contraseña', {
        to: data.email,
        organization: data.organizationName,
        from: mailFrom,
      })

      // En desarrollo, logueamos el contenido del email
      if (process.env.NODE_ENV === 'development') {
        console.log('\n=== EMAIL DE RECUPERACIÓN DE CONTRASEÑA ===')
        console.log('To:', data.email)
        console.log('Subject:', subject)
        console.log('Reset URL:', data.resetUrl)
        console.log('HTML Content Length:', htmlContent.length)
        console.log('==========================================\n')
      }

      // Intentar enviar el email
      const result = await resend.emails.send({
        from: mailFrom,
        to: data.email,
        subject,
        html: htmlContent,
      })

      if (result.error) {
        logger.error('Error al enviar email de recuperación con Resend', result.error)
        
        // Mensaje de error más específico y útil
        let errorMessage = result.error.message || 'Error al enviar el email'
        
        if (result.error.message?.includes('testing emails') || 
            result.error.message?.includes('verify a domain')) {
          errorMessage = `Resend solo permite enviar emails de prueba a direcciones verificadas (actualmente: jhonatanancasi@gmail.com). Para enviar a "${data.email}", por favor verifica un dominio en https://resend.com/domains y actualiza la variable MAIL_FROM para usar ese dominio.`
        }
        
        return {
          success: false,
          error: errorMessage
        }
      }

      logger.info('Email de recuperación enviado exitosamente', {
        emailId: result.data?.id,
        to: data.email,
      })

      return { success: true }
    } catch (error) {
      logger.error('Error al enviar email de recuperación de contraseña', error as Error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al enviar el email'
      }
    }
  }

  private static generatePasswordResetEmailTemplate(data: PasswordResetEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperación de Contraseña - ${data.organizationName}</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
            line-height: 1.6; 
            color: #333333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px; 
            margin: 20px auto; 
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            border: 1px solid #e5e7eb;
          }
          .header { 
            background-color: #f5f5f5;
            color: #333333;
            padding: 30px; 
            text-align: center; 
            border-bottom: 1px solid #e5e7eb;
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: -0.5px;
          }
          .header p {
            margin: 0;
            font-size: 16px;
            color: #666666;
          }
          .content { 
            padding: 30px; 
          }
          .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background-color: #ffffff;
            color: #333333;
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0;
            font-weight: 600;
            transition: background-color 0.3s, border-color 0.3s;
            border: 1px solid #d1d5db;
          }
          .button:hover {
            background-color: #f0f0f0;
            border-color: #a0a0a0;
          }
          .footer { 
            text-align: center; 
            padding: 20px; 
            color: #666666;
            font-size: 12px; 
            background-color: #f9fafb;
            border-top: 1px solid #e5e7eb;
          }
          .important-note {
            margin-top: 30px; 
            padding: 15px; 
            background-color: #fffbeb;
            border-left: 4px solid #f59e0b;
            border-radius: 4px; 
            color: #92400e;
            font-size: 14px;
          }
          .important-note strong {
            color: #92400e;
          }
          .url-box {
            text-align: center;
            margin: 25px 0;
            padding: 15px;
            background-color: #f5f5f5;
            border-radius: 6px;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Recuperación de Contraseña</h1>
            <p>Restablece tu contraseña de acceso</p>
          </div>
          <div class="content">
            <p style="font-size: 16px; color: #333333;">Estimado/a <strong>${data.userName}</strong>,</p>
            
            <p style="font-size: 16px; color: #666666; margin-top: 15px;">
              Recibimos una solicitud para restablecer tu contraseña en <strong>${data.organizationName}</strong>.
            </p>

            <div class="url-box">
              <a href="${data.resetUrl}" class="button">Restablecer Contraseña</a>
            </div>

            <p style="font-size: 14px; color: #666666; margin-top: 20px;">
              O copia y pega este enlace en tu navegador:
            </p>
            <p style="font-size: 12px; color: #999999; word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
              ${data.resetUrl}
            </p>

            <div class="important-note">
              <strong>Importante:</strong> Este enlace expirará en 1 hora. Si no solicitaste este cambio, puedes ignorar este email de forma segura.
            </div>

            <p style="margin-top: 20px; color: #666666; font-size: 14px;">
              Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.
            </p>
          </div>
          <div class="footer">
            <p style="margin: 0;">Este es un email automático, por favor no responda.</p>
            <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} ${data.organizationName}. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

