import { logger } from '@/lib/utils/logger'

export interface CredentialsEmailData {
  email: string
  password: string
  organizationName: string
  landingUrl: string
  loginUrl: string
  customerName?: string
}

export class EmailService {
  /**
   * Enviar credenciales por email
   */
  static async sendCredentials(data: CredentialsEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: Implementar envío real de email usando nodemailer, resend, o similar
      // Por ahora, solo logueamos la información
      
      const emailContent = `
        Estimado/a ${data.customerName || 'Usuario'},

        Le enviamos sus credenciales de acceso para ${data.organizationName}:

        Correo electrónico: ${data.email}
        Contraseña: ${data.password}

        URLs de acceso:
        - Landing: ${data.landingUrl}
        - Login: ${data.loginUrl}

        Por favor, guarde esta información de forma segura.

        Saludos,
        Equipo de Soporte
      `

      logger.info('Enviando credenciales por email', {
        to: data.email,
        organization: data.organizationName,
      })

      // En desarrollo, logueamos el contenido del email
      if (process.env.NODE_ENV === 'development') {
        console.log('\n=== EMAIL DE CREDENCIALES ===')
        console.log(emailContent)
        console.log('===========================\n')
      }

      // TODO: Implementar envío real
      // Ejemplo con nodemailer:
      // await transporter.sendMail({
      //   from: process.env.EMAIL_FROM,
      //   to: data.email,
      //   subject: `Credenciales de acceso - ${data.organizationName}`,
      //   html: generateEmailTemplate(data),
      // })

      return { success: true }
    } catch (error) {
      logger.error('Error al enviar credenciales por email', error as Error)
      return {
        success: false,
        error: 'Error al enviar el email'
      }
    }
  }

  /**
   * Generar plantilla HTML para el email de credenciales
   */
  private static generateEmailTemplate(data: CredentialsEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .credentials { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #4f46e5; }
          .urls { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px; margin: 5px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Credenciales de Acceso</h1>
          </div>
          <div class="content">
            <p>Estimado/a ${data.customerName || 'Usuario'},</p>
            <p>Le enviamos sus credenciales de acceso para <strong>${data.organizationName}</strong>:</p>
            
            <div class="credentials">
              <p><strong>Correo electrónico:</strong> ${data.email}</p>
              <p><strong>Contraseña:</strong> ${data.password}</p>
            </div>

            <div class="urls">
              <p><strong>URLs de acceso:</strong></p>
              <p>
                <a href="${data.landingUrl}" class="button">Ir a Landing</a>
                <a href="${data.loginUrl}" class="button">Iniciar Sesión</a>
              </p>
            </div>

            <p style="margin-top: 20px;">Por favor, guarde esta información de forma segura.</p>
          </div>
          <div class="footer">
            <p>Este es un email automático, por favor no responda.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

