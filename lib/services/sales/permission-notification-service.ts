/**
 * Servicio para notificar cambios de permisos en tiempo real
 * Este servicio hace llamadas HTTP a la API para enviar notificaciones
 */
export class PermissionNotificationService {
  /**
   * Notifica que se han actualizado los permisos de un rol
   */
  static async notifyRolePermissionsUpdated(
    customerSlug: string,
    roleId: string,
    roleName: string
  ) {
    try {
      await fetch(`/api/${customerSlug}/permissions/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'role_updated',
          roleId,
          roleName,
          message: `Los permisos del rol "${roleName}" han sido actualizados`
        })
      })
    } catch (error) {
      console.error('Error notificando cambio de permisos:', error)
    }
  }

  /**
   * Notifica que se han cambiado permisos generales
   */
  static async notifyPermissionsChanged(
    customerSlug: string,
    message: string,
    userId?: string
  ) {
    try {
      await fetch(`/api/${customerSlug}/permissions/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'permissions_changed',
          userId,
          message
        })
      })
    } catch (error) {
      console.error('Error notificando cambio de permisos:', error)
    }
  }

  /**
   * Notifica cuando se actualiza un rol (nombre, estado, etc.)
   */
  static async notifyRoleUpdated(
    customerSlug: string,
    roleId: string,
    roleName: string,
    action: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated'
  ) {
    try {
      const actionMessages = {
        created: 'creado',
        updated: 'actualizado',
        deleted: 'eliminado',
        activated: 'activado',
        deactivated: 'desactivado'
      }

      await fetch(`/api/${customerSlug}/permissions/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'role_updated',
          roleId,
          roleName,
          message: `El rol "${roleName}" ha sido ${actionMessages[action]}`
        })
      })
    } catch (error) {
      console.error('Error notificando actualización de rol:', error)
    }
  }
}