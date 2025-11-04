"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Settings,
  Shield,
  Key,
  FileText,
  BarChart3,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Database,
  Mail,
  Bell,
  Plug,
  Download,
  Upload,
  Wrench,
  Save,
  Plus,
  Edit,
  Eye,
  Clock,
  HardDrive
} from "lucide-react"
import { toast } from "sonner"
import type { SystemConfig, JwtSecretInfo } from "@/lib/services/admin/system-config-service"

interface SystemConfigClientProps {
  initialConfig: Partial<SystemConfig>
  initialJwtSecrets: JwtSecretInfo[]
  initialMetrics: any
}

export function SystemConfigClient({
  initialConfig,
  initialJwtSecrets,
  initialMetrics
}: SystemConfigClientProps) {
  const [activeTab, setActiveTab] = useState("general")
  const [config, setConfig] = useState<Partial<SystemConfig>>(initialConfig)
  const [jwtSecrets, setJwtSecrets] = useState(initialJwtSecrets)
  const [metrics, setMetrics] = useState(initialMetrics)
  const [isLoading, setIsLoading] = useState(false)
  const [backups, setBackups] = useState<any[]>([])
  const [emailConfigs, setEmailConfigs] = useState<any[]>([])
  const [alertConfigs, setAlertConfigs] = useState<any[]>([])
  const [integrationConfigs, setIntegrationConfigs] = useState<any[]>([])
  const [backupsLoading, setBackupsLoading] = useState(false)
  const [emailConfigsLoading, setEmailConfigsLoading] = useState(false)
  const [alertConfigsLoading, setAlertConfigsLoading] = useState(false)
  const [integrationConfigsLoading, setIntegrationConfigsLoading] = useState(false)
  
  // Estados para diálogos
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [alertDialogOpen, setAlertDialogOpen] = useState(false)
  const [integrationDialogOpen, setIntegrationDialogOpen] = useState(false)
  const [selectedEmailConfig, setSelectedEmailConfig] = useState<any>(null)
  const [selectedAlertConfig, setSelectedAlertConfig] = useState<any>(null)
  const [selectedIntegrationConfig, setSelectedIntegrationConfig] = useState<any>(null)

  // Cargar datos según el tab activo
  useEffect(() => {
    if (activeTab === 'backups') {
      loadBackups()
    } else if (activeTab === 'email') {
      loadEmailConfigs()
    } else if (activeTab === 'alerts') {
      loadAlertConfigs()
    } else if (activeTab === 'integrations') {
      loadIntegrationConfigs()
    }
  }, [activeTab])

  // Cargar backups
  const loadBackups = async () => {
    setBackupsLoading(true)
    try {
      const response = await fetch('/api/administracion/system-config/backups')
      const data = await response.json()
      if (data.success) {
        setBackups(data.backups || [])
      }
    } catch (error) {
      toast.error('Error al cargar backups')
    } finally {
      setBackupsLoading(false)
    }
  }

  // Cargar configuraciones de email
  const loadEmailConfigs = async () => {
    setEmailConfigsLoading(true)
    try {
      const response = await fetch('/api/administracion/system-config/email-configs')
      const data = await response.json()
      if (data.success) {
        setEmailConfigs(data.configs || [])
      }
    } catch (error) {
      toast.error('Error al cargar configuraciones de email')
    } finally {
      setEmailConfigsLoading(false)
    }
  }

  // Cargar configuraciones de alertas
  const loadAlertConfigs = async () => {
    setAlertConfigsLoading(true)
    try {
      const response = await fetch('/api/administracion/system-config/alert-configs')
      const data = await response.json()
      if (data.success) {
        setAlertConfigs(data.configs || [])
      }
    } catch (error) {
      toast.error('Error al cargar configuraciones de alertas')
    } finally {
      setAlertConfigsLoading(false)
    }
  }

  // Cargar configuraciones de integraciones
  const loadIntegrationConfigs = async () => {
    setIntegrationConfigsLoading(true)
    try {
      const response = await fetch('/api/administracion/system-config/integration-configs')
      const data = await response.json()
      if (data.success) {
        setIntegrationConfigs(data.configs || [])
      }
    } catch (error) {
      toast.error('Error al cargar configuraciones de integraciones')
    } finally {
      setIntegrationConfigsLoading(false)
    }
  }

  // Guardar configuración general
  const saveGeneralConfig = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/administracion/system-config/general', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemName: config.systemName,
          systemEmail: config.systemEmail,
          systemUrl: config.systemUrl,
          supportEmail: config.supportEmail,
        })
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Configuración general guardada')
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error al guardar configuración')
    } finally {
      setIsLoading(false)
    }
  }

  // Guardar configuración de seguridad
  const saveSecurityConfig = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/administracion/system-config/security', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionTimeoutMinutes: config.sessionTimeoutMinutes,
          jwtExpirationDays: config.jwtExpirationDays,
          jwtRotationDays: config.jwtRotationDays,
          require2FA: config.require2FA,
          passwordMinLength: config.passwordMinLength,
          passwordRequireUppercase: config.passwordRequireUppercase,
          passwordRequireLowercase: config.passwordRequireLowercase,
          passwordRequireNumbers: config.passwordRequireNumbers,
          passwordRequireSymbols: config.passwordRequireSymbols,
          passwordExpirationDays: config.passwordExpirationDays,
          maxLoginAttempts: config.maxLoginAttempts,
          lockoutDurationMinutes: config.lockoutDurationMinutes,
          sessionSingleMode: config.sessionSingleMode,
        })
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Configuración de seguridad guardada')
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error al guardar configuración')
    } finally {
      setIsLoading(false)
    }
  }

  // Guardar configuración de mantenimiento
  const saveMaintenanceConfig = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/administracion/system-config/maintenance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maintenanceMode: config.maintenanceMode,
          maintenanceMessage: config.maintenanceMessage,
          maintenanceScheduledAt: config.maintenanceScheduledAt,
          maintenanceScheduledEnd: config.maintenanceScheduledEnd,
        })
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Configuración de mantenimiento guardada')
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error al guardar configuración')
    } finally {
      setIsLoading(false)
    }
  }

  // Guardar límites y quotas
  const saveLimitsConfig = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/administracion/system-config/limits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxOrganizations: config.maxOrganizations,
          maxUsersPerOrganization: config.maxUsersPerOrganization,
          maxStorageGB: config.maxStorageGB,
        })
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Configuración de límites guardada')
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error al guardar configuración')
    } finally {
      setIsLoading(false)
    }
  }

  // Guardar configuración de notificaciones
  const saveNotificationsConfig = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/administracion/system-config/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationsEnabled: config.notificationsEnabled,
          emailNotificationsEnabled: config.emailNotificationsEnabled,
          smsNotificationsEnabled: config.smsNotificationsEnabled,
        })
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Configuración de notificaciones guardada')
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error al guardar configuración')
    } finally {
      setIsLoading(false)
    }
  }

  // Rotar secret JWT
  const rotateJwtSecret = async (systemType: 'admin' | 'sas') => {
    if (!confirm(`¿Estás seguro de rotar el secret JWT para ${systemType}? Esta acción invalidará todos los tokens actuales.`)) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/administracion/system-config/jwt-secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemType })
      })
      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        const secretsResponse = await fetch('/api/administracion/system-config/jwt-secrets')
        const secretsData = await secretsResponse.json()
        if (secretsData.success) {
          setJwtSecrets(secretsData.secrets)
        }
      } else {
        toast.error(data.error || 'Error al rotar secret')
      }
    } catch (error) {
      toast.error('Error al rotar secret')
    } finally {
      setIsLoading(false)
    }
  }

  // Crear backup
  const createBackup = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/administracion/system-config/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Backup ${new Date().toISOString()}`,
          type: 'manual',
          databaseName: 'main'
        })
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Backup creado exitosamente')
        loadBackups()
      } else {
        toast.error(data.error || 'Error al crear backup')
      }
    } catch (error) {
      toast.error('Error al crear backup')
    } finally {
      setIsLoading(false)
    }
  }

  // Exportar configuración
  const exportConfig = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/administracion/system-config/export', {
        method: 'POST'
      })
      const data = await response.json()
      if (data.success) {
        const blob = new Blob([JSON.stringify(data.config, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `system-config-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Configuración exportada')
      } else {
        toast.error(data.error || 'Error al exportar')
      }
    } catch (error) {
      toast.error('Error al exportar configuración')
    } finally {
      setIsLoading(false)
    }
  }

  // Importar configuración
  const importConfig = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const text = await file.text()
      const importedConfig = JSON.parse(text)
      
      const response = await fetch('/api/administracion/system-config/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importedConfig)
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Configuración importada exitosamente')
        // Recargar página para ver cambios
        window.location.reload()
      } else {
        toast.error(data.error || 'Error al importar')
      }
    } catch (error) {
      toast.error('Error al importar configuración')
    } finally {
      setIsLoading(false)
    }
  }

  // Refrescar métricas
  const refreshMetrics = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/administracion/system-config/metrics')
      const data = await response.json()
      if (data.success) {
        setMetrics(data.metrics)
        toast.success('Métricas actualizadas')
      }
    } catch (error) {
      toast.error('Error al cargar métricas')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 lg:grid-cols-7 mb-6">
        <TabsTrigger value="general">
          <Settings className="h-4 w-4 mr-2" />
          <span className="hidden md:inline">General</span>
        </TabsTrigger>
        <TabsTrigger value="security">
          <Shield className="h-4 w-4 mr-2" />
          <span className="hidden md:inline">Seguridad</span>
        </TabsTrigger>
        <TabsTrigger value="jwt">
          <Key className="h-4 w-4 mr-2" />
          <span className="hidden md:inline">JWT</span>
        </TabsTrigger>
        <TabsTrigger value="maintenance">
          <Wrench className="h-4 w-4 mr-2" />
          <span className="hidden md:inline">Mantenimiento</span>
        </TabsTrigger>
        <TabsTrigger value="backups">
          <Database className="h-4 w-4 mr-2" />
          <span className="hidden md:inline">Backups</span>
        </TabsTrigger>
        <TabsTrigger value="email">
          <Mail className="h-4 w-4 mr-2" />
          <span className="hidden md:inline">Email</span>
        </TabsTrigger>
        <TabsTrigger value="alerts">
          <Bell className="h-4 w-4 mr-2" />
          <span className="hidden md:inline">Alertas</span>
        </TabsTrigger>
        <TabsTrigger value="integrations">
          <Plug className="h-4 w-4 mr-2" />
          <span className="hidden md:inline">Integraciones</span>
        </TabsTrigger>
        <TabsTrigger value="limits">
          <HardDrive className="h-4 w-4 mr-2" />
          <span className="hidden md:inline">Límites</span>
        </TabsTrigger>
        <TabsTrigger value="notifications">
          <Bell className="h-4 w-4 mr-2" />
          <span className="hidden md:inline">Notificaciones</span>
        </TabsTrigger>
        <TabsTrigger value="metrics">
          <BarChart3 className="h-4 w-4 mr-2" />
          <span className="hidden md:inline">Métricas</span>
        </TabsTrigger>
        <TabsTrigger value="export">
          <Download className="h-4 w-4 mr-2" />
          <span className="hidden md:inline">Exportar</span>
        </TabsTrigger>
      </TabsList>

      {/* Tab General */}
      <TabsContent value="general" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Configuración General</CardTitle>
            <CardDescription>
              Configuración básica del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="systemName">Nombre del Sistema</Label>
                <Input
                  id="systemName"
                  value={config.systemName || ''}
                  onChange={(e) => setConfig({ ...config, systemName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="systemUrl">URL del Sistema</Label>
                <Input
                  id="systemUrl"
                  value={config.systemUrl || ''}
                  onChange={(e) => setConfig({ ...config, systemUrl: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="systemEmail">Email del Sistema</Label>
                <Input
                  id="systemEmail"
                  type="email"
                  value={config.systemEmail || ''}
                  onChange={(e) => setConfig({ ...config, systemEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportEmail">Email de Soporte</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={config.supportEmail || ''}
                  onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={saveGeneralConfig} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab Seguridad */}
      <TabsContent value="security" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Seguridad</CardTitle>
            <CardDescription>
              Configuración de seguridad y sesiones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sesiones */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Sesiones</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Timeout de Sesión (minutos)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={config.sessionTimeoutMinutes || 30}
                    onChange={(e) => setConfig({ ...config, sessionTimeoutMinutes: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionSingleMode">Solo una sesión activa</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="sessionSingleMode"
                      checked={config.sessionSingleMode || false}
                      onCheckedChange={(checked) => setConfig({ ...config, sessionSingleMode: checked })}
                    />
                    <Label htmlFor="sessionSingleMode" className="cursor-pointer">
                      {config.sessionSingleMode ? 'Activado' : 'Desactivado'}
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* JWT */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">JWT</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="jwtExpiration">Expiración JWT (días)</Label>
                  <Input
                    id="jwtExpiration"
                    type="number"
                    value={config.jwtExpirationDays || 7}
                    onChange={(e) => setConfig({ ...config, jwtExpirationDays: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jwtRotation">Rotación JWT (días)</Label>
                  <Input
                    id="jwtRotation"
                    type="number"
                    value={config.jwtRotationDays || 90}
                    onChange={(e) => setConfig({ ...config, jwtRotationDays: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Autenticación */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Autenticación</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="require2FA">Requerir 2FA</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="require2FA"
                      checked={config.require2FA || false}
                      onCheckedChange={(checked) => setConfig({ ...config, require2FA: checked })}
                    />
                    <Label htmlFor="require2FA" className="cursor-pointer">
                      {config.require2FA ? 'Activado' : 'Desactivado'}
                    </Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Máximo intentos de login</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={config.maxLoginAttempts || 5}
                    onChange={(e) => setConfig({ ...config, maxLoginAttempts: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lockoutDuration">Duración de bloqueo (minutos)</Label>
                  <Input
                    id="lockoutDuration"
                    type="number"
                    value={config.lockoutDurationMinutes || 30}
                    onChange={(e) => setConfig({ ...config, lockoutDurationMinutes: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Políticas de Contraseña */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Políticas de Contraseña</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Longitud mínima</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={config.passwordMinLength || 8}
                    onChange={(e) => setConfig({ ...config, passwordMinLength: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordExpirationDays">Expiración de contraseña (días)</Label>
                  <Input
                    id="passwordExpirationDays"
                    type="number"
                    value={config.passwordExpirationDays || ''}
                    onChange={(e) => setConfig({ ...config, passwordExpirationDays: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="Sin expiración"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Requisitos</Label>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="passwordRequireUppercase"
                        checked={config.passwordRequireUppercase || false}
                        onCheckedChange={(checked) => setConfig({ ...config, passwordRequireUppercase: checked })}
                      />
                      <Label htmlFor="passwordRequireUppercase" className="cursor-pointer">
                        Requerir mayúsculas
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="passwordRequireLowercase"
                        checked={config.passwordRequireLowercase || false}
                        onCheckedChange={(checked) => setConfig({ ...config, passwordRequireLowercase: checked })}
                      />
                      <Label htmlFor="passwordRequireLowercase" className="cursor-pointer">
                        Requerir minúsculas
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="passwordRequireNumbers"
                        checked={config.passwordRequireNumbers || false}
                        onCheckedChange={(checked) => setConfig({ ...config, passwordRequireNumbers: checked })}
                      />
                      <Label htmlFor="passwordRequireNumbers" className="cursor-pointer">
                        Requerir números
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="passwordRequireSymbols"
                        checked={config.passwordRequireSymbols || false}
                        onCheckedChange={(checked) => setConfig({ ...config, passwordRequireSymbols: checked })}
                      />
                      <Label htmlFor="passwordRequireSymbols" className="cursor-pointer">
                        Requerir símbolos
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Button onClick={saveSecurityConfig} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab JWT Secrets */}
      <TabsContent value="jwt" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Secrets JWT</CardTitle>
            <CardDescription>
              Ver y rotar secrets JWT del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {jwtSecrets.map((secret) => (
                <div
                  key={secret.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{secret.systemType.toUpperCase()}</span>
                      <Badge variant={secret.isActive ? "default" : "secondary"}>
                        {secret.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                      <Badge variant="outline">Versión {secret.version}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      Creado: {new Date(secret.createdAt).toLocaleString('es-ES')}
                    </p>
                    {secret.rotatedAt && (
                      <p className="text-sm text-gray-500">
                        Rotado: {new Date(secret.rotatedAt).toLocaleString('es-ES')}
                      </p>
                    )}
                  </div>
                  {secret.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => rotateJwtSecret(secret.systemType as 'admin' | 'sas')}
                      disabled={isLoading}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Rotar
                    </Button>
                  )}
                </div>
              ))}
              {jwtSecrets.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No hay secrets JWT registrados en el sistema.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Advertencia:</strong> Rotar un secret invalidará todos los tokens actuales.
                Los usuarios necesitarán iniciar sesión nuevamente.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab Mantenimiento */}
      <TabsContent value="maintenance" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Modo Mantenimiento</CardTitle>
            <CardDescription>
              Activar modo mantenimiento y programar ventanas de mantenimiento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenanceMode">Modo Mantenimiento</Label>
                  <p className="text-sm text-gray-500">
                    Activar o desactivar el modo mantenimiento
                  </p>
                </div>
                <Switch
                  id="maintenanceMode"
                  checked={config.maintenanceMode || false}
                  onCheckedChange={(checked) => setConfig({ ...config, maintenanceMode: checked })}
                />
              </div>

              {config.maintenanceMode && (
                <div className="space-y-2">
                  <Label htmlFor="maintenanceMessage">Mensaje de Mantenimiento</Label>
                  <Textarea
                    id="maintenanceMessage"
                    value={config.maintenanceMessage || ''}
                    onChange={(e) => setConfig({ ...config, maintenanceMessage: e.target.value })}
                    placeholder="El sistema está en mantenimiento. Por favor, intente más tarde."
                    rows={3}
                  />
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="maintenanceScheduledAt">Inicio Programado</Label>
                  <Input
                    id="maintenanceScheduledAt"
                    type="datetime-local"
                    value={config.maintenanceScheduledAt ? new Date(config.maintenanceScheduledAt).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setConfig({ ...config, maintenanceScheduledAt: e.target.value ? new Date(e.target.value) : undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenanceScheduledEnd">Fin Programado</Label>
                  <Input
                    id="maintenanceScheduledEnd"
                    type="datetime-local"
                    value={config.maintenanceScheduledEnd ? new Date(config.maintenanceScheduledEnd).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setConfig({ ...config, maintenanceScheduledEnd: e.target.value ? new Date(e.target.value) : undefined })}
                  />
                </div>
              </div>
            </div>

            <Button onClick={saveMaintenanceConfig} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab Backups - Continuará en el siguiente mensaje debido a la longitud */}
      <TabsContent value="backups" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Gestión de Backups</CardTitle>
                <CardDescription>
                  Crear y gestionar backups del sistema
                </CardDescription>
              </div>
              <Button onClick={createBackup} disabled={isLoading}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Backup
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {backupsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : backups.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No hay backups registrados.
                </AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-medium">{backup.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{backup.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          backup.status === 'completed' ? 'default' :
                          backup.status === 'failed' ? 'destructive' :
                          backup.status === 'running' ? 'secondary' : 'outline'
                        }>
                          {backup.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(backup.createdAt).toLocaleString('es-ES')}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab Email/SMTP */}
      <TabsContent value="email" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Configuración de Email/SMTP</CardTitle>
                <CardDescription>
                  Gestionar configuraciones SMTP para envío de emails
                </CardDescription>
              </div>
              <Button onClick={() => { setSelectedEmailConfig(null); setEmailDialogOpen(true) }}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Configuración
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {emailConfigsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : emailConfigs.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No hay configuraciones de email registradas.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {emailConfigs.map((emailConfig) => (
                  <div key={emailConfig.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{emailConfig.name}</span>
                          {emailConfig.isActive && (
                            <Badge variant="default">Activo</Badge>
                          )}
                          {emailConfig.isDefault && (
                            <Badge variant="outline">Por Defecto</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {emailConfig.host}:{emailConfig.port} - {emailConfig.fromEmail}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEmailConfig(emailConfig)
                            setEmailDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Probar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab Alertas */}
      <TabsContent value="alerts" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Configuración de Alertas</CardTitle>
                <CardDescription>
                  Gestionar alertas y notificaciones del sistema
                </CardDescription>
              </div>
              <Button onClick={() => { setSelectedAlertConfig(null); setAlertDialogOpen(true) }}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Alerta
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {alertConfigsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : alertConfigs.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No hay alertas configuradas.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {alertConfigs.map((alert) => (
                  <div key={alert.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{alert.name}</span>
                          <Badge variant={alert.type === 'security' ? 'destructive' : 'outline'}>
                            {alert.type}
                          </Badge>
                          {alert.enabled && (
                            <Badge variant="default">Activada</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Disparada {alert.triggerCount} veces
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAlertConfig(alert)
                          setAlertDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab Integraciones */}
      <TabsContent value="integrations" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Integraciones</CardTitle>
                <CardDescription>
                  Gestionar integraciones con servicios externos
                </CardDescription>
              </div>
              <Button onClick={() => { setSelectedIntegrationConfig(null); setIntegrationDialogOpen(true) }}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Integración
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {integrationConfigsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : integrationConfigs.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No hay integraciones configuradas.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {integrationConfigs.map((integration) => (
                  <div key={integration.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{integration.name}</span>
                          <Badge variant="outline">{integration.type}</Badge>
                          <Badge variant="outline">{integration.provider}</Badge>
                          {integration.enabled && (
                            <Badge variant="default">Activa</Badge>
                          )}
                          {integration.testMode && (
                            <Badge variant="secondary">Modo Prueba</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedIntegrationConfig(integration)
                            setIntegrationDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Probar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab Límites */}
      <TabsContent value="limits" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Límites y Quotas</CardTitle>
            <CardDescription>
              Configurar límites globales del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxOrganizations">Máximo de Organizaciones</Label>
                <Input
                  id="maxOrganizations"
                  type="number"
                  value={config.maxOrganizations || ''}
                  onChange={(e) => setConfig({ ...config, maxOrganizations: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Sin límite"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUsersPerOrganization">Máximo Usuarios por Organización</Label>
                <Input
                  id="maxUsersPerOrganization"
                  type="number"
                  value={config.maxUsersPerOrganization || ''}
                  onChange={(e) => setConfig({ ...config, maxUsersPerOrganization: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Sin límite"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStorageGB">Almacenamiento Máximo (GB)</Label>
                <Input
                  id="maxStorageGB"
                  type="number"
                  value={config.maxStorageGB || ''}
                  onChange={(e) => setConfig({ ...config, maxStorageGB: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Sin límite"
                />
              </div>
            </div>
            <Button onClick={saveLimitsConfig} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab Notificaciones */}
      <TabsContent value="notifications" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Notificaciones</CardTitle>
            <CardDescription>
              Habilitar o deshabilitar tipos de notificaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notificationsEnabled">Notificaciones Habilitadas</Label>
                  <p className="text-sm text-gray-500">
                    Activar o desactivar todas las notificaciones
                  </p>
                </div>
                <Switch
                  id="notificationsEnabled"
                  checked={config.notificationsEnabled || false}
                  onCheckedChange={(checked) => setConfig({ ...config, notificationsEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotificationsEnabled">Notificaciones por Email</Label>
                  <p className="text-sm text-gray-500">
                    Enviar notificaciones por correo electrónico
                  </p>
                </div>
                <Switch
                  id="emailNotificationsEnabled"
                  checked={config.emailNotificationsEnabled || false}
                  onCheckedChange={(checked) => setConfig({ ...config, emailNotificationsEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="smsNotificationsEnabled">Notificaciones por SMS</Label>
                  <p className="text-sm text-gray-500">
                    Enviar notificaciones por SMS
                  </p>
                </div>
                <Switch
                  id="smsNotificationsEnabled"
                  checked={config.smsNotificationsEnabled || false}
                  onCheckedChange={(checked) => setConfig({ ...config, smsNotificationsEnabled: checked })}
                />
              </div>
            </div>

            <Button onClick={saveNotificationsConfig} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab Métricas */}
      <TabsContent value="metrics" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Métricas del Sistema</CardTitle>
                <CardDescription>
                  Estadísticas y métricas del sistema
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshMetrics}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Organizaciones</p>
                  <p className="text-2xl font-bold">{metrics?.organizations?.total || 0}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Usuarios</p>
                  <p className="text-2xl font-bold">{metrics?.users?.total || 0}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Clientes</p>
                  <p className="text-2xl font-bold">{metrics?.customers?.total || 0}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Sesiones Activas</p>
                  <p className="text-2xl font-bold">{metrics?.sessions?.active || 0}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Logs (24h)</p>
                  <p className="text-2xl font-bold">{metrics?.security?.logsLast24h || 0}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Secrets JWT Activos</p>
                  <p className="text-2xl font-bold">{metrics?.security?.activeJwtSecrets || 0}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab Exportar/Importar */}
      <TabsContent value="export" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Exportar Configuración</CardTitle>
              <CardDescription>
                Descargar una copia de todas las configuraciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Exporta todas las configuraciones del sistema en formato JSON para hacer un backup o transferir a otro entorno.
              </p>
              <Button onClick={exportConfig} disabled={isLoading} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                {isLoading ? 'Exportando...' : 'Exportar Configuración'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Importar Configuración</CardTitle>
              <CardDescription>
                Cargar configuraciones desde un archivo JSON
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Importa configuraciones desde un archivo JSON exportado previamente.
              </p>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept=".json"
                  onChange={importConfig}
                  disabled={isLoading}
                  className="cursor-pointer"
                />
                <p className="text-xs text-gray-500">
                  Selecciona un archivo JSON válido
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  )
}
