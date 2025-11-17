"use client"

import { Download, Upload, FileSpreadsheet, FileText, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ProductsExportImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  defaultCategoryId?: string // categoría actual desde la que se abrió el diálogo
}

export function ProductsExportImportDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultCategoryId,
}: ProductsExportImportDialogProps) {
  const t = useTranslations()
  const pathname = usePathname()
  const customerSlug = pathname.split('/')[1] || ''

  // Estado para exportación
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('excel')
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle')
  const [exportProgress, setExportProgress] = useState(0)

  // Estado para importación
  const [importFile, setImportFile] = useState<File | null>(null)
  // Siempre actualiza si coincide código de barras y continúa con errores (según requerimiento)
  const _updateExisting = true
  const _skipErrors = true
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string>("")
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [_userBranchId, setUserBranchId] = useState<string | null>(null)
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle')
  // Cargar sucursales (para select opcional).
  // No condicionamos por rol aquí; el backend aplicará la política para no admin.
  useEffect(() => {
    (async () => {
      try {
        // Obtener usuario para saber rol y sucursal
        const meRes = await fetch(`/api/${customerSlug}/auth/me`, { credentials: 'include' })
        if (meRes.ok) {
          const me = await meRes.json()
          const roleName = (me?.rol?.nombre || '').toLowerCase()
          const admin = roleName.includes('administrador') || roleName === 'admin'
          setIsAdmin(admin)
          setUserBranchId(me?.sucursalId || me?.sucursal?.id || null)
        }
        // Cargar sucursales si es admin (selector obligatorio)
        const bRes = await fetch(`/api/${customerSlug}/sucursales?status=active&page=1&pageSize=1000`, { credentials: 'include' })
        if (bRes.ok) {
          const data = await bRes.json()
          setBranches((data.branches || []).map((b: any) => ({ id: b.id, name: b.name })))
        }
      } catch {}
    })()
  }, [customerSlug])

  const [importResult, setImportResult] = useState<{
    imported: number
    updated: number
    skipped: number
    errors: Array<{ row: number; message: string }>
  } | null>(null)

  const handleExport = async () => {
    setExportStatus('exporting')
    setExportProgress(0)

    try {
      const response = await fetch(`/api/${customerSlug}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          entity: 'products',
          format: exportFormat,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al exportar')
      }

      // Descargar archivo
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `productos_${new Date().toISOString().split('T')[0]}.${exportFormat === 'excel' ? 'xlsx' : 'csv'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setExportProgress(100)
      setExportStatus('success')
      toast.success(t('products.export.success') || 'Productos exportados correctamente')
      
      setTimeout(() => {
        setExportStatus('idle')
        setExportProgress(0)
        onOpenChange(false)
        onSuccess?.()
      }, 2000)
    } catch (error) {
      setExportStatus('error')
      toast.error(error instanceof Error ? error.message : 'Error al exportar productos')
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      toast.error(t('products.import.fileRequired') || 'Selecciona un archivo')
      return
    }
    if (isAdmin && !selectedBranchId) {
      toast.error('Selecciona una sucursal destino')
      return
    }

    setImportStatus('importing')
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', importFile)
      formData.append('entity', 'products')
      formData.append('updateExisting', 'true')
      formData.append('skipErrors', 'true')
      // Si es admin, sucursal obligatoria; si no es admin, no enviar (el backend usará la del usuario)
      if (isAdmin && selectedBranchId) formData.append('selectedBranchId', selectedBranchId)
      if (defaultCategoryId) formData.append('selectedCategoryId', defaultCategoryId)

      const response = await fetch(`/api/${customerSlug}/import`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al importar')
      }

      setImportResult({
        imported: data.imported || 0,
        updated: data.updated || 0,
        skipped: data.skipped || 0,
        errors: data.errors || [],
      })

      if (data.errors && data.errors.length > 0) {
        setImportStatus('error')
        toast.warning(
          `${data.message}. ${data.errors.length} error(es) encontrado(s)`
        )
      } else {
        setImportStatus('success')
        toast.success(data.message || 'Productos importados correctamente')
        setTimeout(() => {
          onOpenChange(false)
          onSuccess?.()
        }, 3000)
      }
    } catch (error) {
      setImportStatus('error')
      toast.error(error instanceof Error ? error.message : 'Error al importar productos')
    }
  }

  const handleDownloadTemplate = async (format: 'excel' | 'csv') => {
    try {
      const response = await fetch(`/api/${customerSlug}/export/template?entity=products&format=${format}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Error al descargar plantilla')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `plantilla_importacion_productos.${format === 'excel' ? 'xlsx' : 'csv'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(t('products.import.templateDownloaded') || 'Plantilla descargada correctamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al descargar plantilla')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('products.exportImport.title') || 'Exportar / Importar Productos'}</DialogTitle>
          <DialogDescription>
            {t('products.exportImport.description') || 'Exporta tus productos a Excel/CSV o impórtalos desde un archivo'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">
              <Download className="mr-2 h-4 w-4" />
              {t('products.exportImport.export') || 'Exportar'}
            </TabsTrigger>
            <TabsTrigger value="import">
              <Upload className="mr-2 h-4 w-4" />
              {t('products.exportImport.import') || 'Importar'}
            </TabsTrigger>
          </TabsList>

          {/* Tab de Exportación */}
          <TabsContent value="export" className="space-y-4">
            <div className="space-y-2">
              <Label>{t('products.exportImport.format') || 'Formato'}</Label>
              <Select value={exportFormat} onValueChange={(value: 'excel' | 'csv') => setExportFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">
                    <div className="flex items-center">
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Excel (.xlsx)
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      CSV (.csv)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {exportStatus === 'exporting' && (
              <div className="space-y-2">
                <Progress value={exportProgress} />
                <p className="text-sm text-gray-500">{t('products.exportImport.exporting') || 'Exportando...'}</p>
              </div>
            )}

            {exportStatus === 'success' && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  {t('products.exportImport.exportSuccess') || 'Exportación completada correctamente'}
                </AlertDescription>
              </Alert>
            )}

            {exportStatus === 'error' && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('products.exportImport.exportError') || 'Error al exportar productos'}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleExport}
              disabled={exportStatus === 'exporting'}
              className="w-full"
            >
              {exportStatus === 'exporting' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('products.exportImport.exporting') || 'Exportando...'}
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  {t('products.exportImport.exportButton') || 'Exportar Productos'}
                </>
              )}
            </Button>
          </TabsContent>

          {/* Tab de Importación */}
          <TabsContent value="import" className="space-y-4">
            <div className="space-y-4">
              <div className={isAdmin ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "grid grid-cols-1 gap-3"}>
                <div className="space-y-2">
                  <Label>{t('products.exportImport.selectFile') || 'Seleccionar archivo'}</Label>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      if (!file) {
                        setImportFile(null)
                        return
                      }
                      const name = file.name.toLowerCase()
                      const allowed = name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')
                      if (!allowed) {
                        setImportFile(null)
                        e.currentTarget.value = ''
                        toast.error('Tipo de archivo no permitido. Usa Excel (.xlsx, .xls) o CSV (.csv).')
                        return
                      }
                      setImportFile(file)
                    }}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                  />
                  {importFile && (
                    <p className="text-sm text-gray-500">
                      {t('products.exportImport.selectedFile') || 'Archivo seleccionado'}: {importFile.name}
                    </p>
                  )}
                  {!importFile && (
                    <p className="text-xs text-gray-500">
                      Tipos admitidos: Excel (.xlsx, .xls) o CSV (.csv)
                    </p>
                  )}
                </div>
                {isAdmin && (
                  <div className="space-y-2">
                    <Label>
                      Sucursal destino <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={selectedBranchId}
                      onValueChange={setSelectedBranchId}
                      disabled={!importFile}
                    >
                      <SelectTrigger disabled={!importFile}>
                        <SelectValue placeholder={importFile ? 'Seleccionar sucursal' : 'Sube un archivo primero'} />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!importFile && (
                      <p className="text-xs text-gray-500">Selecciona un archivo para habilitar la sucursal.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Se eliminan los toggles: siempre se actualiza por código de barras y continúa con errores */}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadTemplate('excel')}
                  className="flex-1"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  {t('products.exportImport.downloadTemplate') || 'Descargar Plantilla Excel'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDownloadTemplate('csv')}
                  className="flex-1"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {t('products.exportImport.downloadTemplateCSV') || 'Descargar Plantilla CSV'}
                </Button>
              </div>
            </div>

            {importStatus === 'importing' && (
              <div className="space-y-2">
                <Progress value={50} />
                <p className="text-sm text-gray-500">{t('products.exportImport.importing') || 'Importando...'}</p>
              </div>
            )}

            {importStatus === 'success' && importResult && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p>{t('products.exportImport.importSuccess') || 'Importación completada'}</p>
                    <p className="text-sm">
                      {t('products.exportImport.imported') || 'Creados'}: {importResult.imported} |{' '}
                      {t('products.exportImport.updated') || 'Actualizados'}: {importResult.updated} |{' '}
                      {t('products.exportImport.skipped') || 'Omitidos'}: {importResult.skipped}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {importStatus === 'error' && importResult && importResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p>{t('products.exportImport.importErrors') || 'Errores encontrados'}: {importResult.errors.length}</p>
                    <div className="max-h-32 overflow-y-auto text-xs">
                      {importResult.errors.slice(0, 5).map((error, idx) => (
                        <p key={idx}>
                          {t('products.exportImport.row') || 'Fila'} {error.row}: {error.message}
                        </p>
                      ))}
                      {importResult.errors.length > 5 && (
                        <p>... y {importResult.errors.length - 5} más</p>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleImport}
              disabled={!importFile || importStatus === 'importing'}
              className="w-full"
            >
              {importStatus === 'importing' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('products.exportImport.importing') || 'Importando...'}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {t('products.exportImport.importButton') || 'Importar Productos'}
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

