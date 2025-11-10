"use client"

import { BrowserMultiFormatReader } from "@zxing/library"
import { ScanLine, X, Check, AlertCircle } from "lucide-react"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { toast } from "sonner"

import { SalesSaleWithRelations } from "./types"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"




interface SaleCancelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sale: SalesSaleWithRelations | null
  onCancel: () => Promise<void>
}

export function SaleCancelDialog({ open, onOpenChange, sale, onCancel }: SaleCancelDialogProps) {
  const [isCancelling, setIsCancelling] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanningProductId, setScanningProductId] = useState<string | null>(null)
  const [scannedCodes, setScannedCodes] = useState<Record<string, Set<string>>>({})
  const [codeReaderRef, setCodeReaderRef] = useState<BrowserMultiFormatReader | null>(null)
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null)
  const [scannerVideoRef, setScannerVideoRef] = useState<HTMLVideoElement | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(false)

  const stopScanning = useCallback(() => {
    if (codeReaderRef) {
      try {
        codeReaderRef.reset()
      } catch (error) {
        console.error('Error stopping scan:', error)
      }
    }
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop())
      setVideoStream(null)
    }
    setIsScanning(false)
    setScanningProductId(null)
  }, [codeReaderRef, videoStream])

  const saleIdRef = useRef<string | null>(null)
  const itemsWithCodes = useMemo(() => {
    return sale?.items.filter(item => item.trackingCodes && item.trackingCodes.length > 0) || []
  }, [sale?.items?.map(item => `${item.id}-${item.trackingCodes?.length || 0}`).join(',')])

  useEffect(() => {
    if (!open || !sale) {
      setScannedCodes({})
      stopScanning()
      saleIdRef.current = null
      return
    }

    // Solo inicializar si es una nueva venta
    if (saleIdRef.current === sale.id) {
      return
    }

    saleIdRef.current = sale.id

    // Inicializar los códigos escaneados
    const initialCodes: Record<string, Set<string>> = {}
    itemsWithCodes.forEach(item => {
      if (item.productId) {
        initialCodes[item.productId] = new Set()
      }
    })
    setScannedCodes(initialCodes)
  }, [open, sale, itemsWithCodes, stopScanning])

  const validateCode = useCallback((productId: string, code: string): boolean => {
    if (!sale) return false
    const item = itemsWithCodes.find(item => item.productId === productId)
    if (!item || !item.trackingCodes) return false
    return item.trackingCodes.includes(code)
  }, [sale, itemsWithCodes])

  const startScanning = useCallback(async (productId: string) => {
    try {
      stopScanning()
      setIsScanning(true)
      
      const reader = new BrowserMultiFormatReader()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      setCodeReaderRef(reader)
      setVideoStream(stream)
      setScanningProductId(productId)
      
      await new Promise((resolve) => setTimeout(resolve, 100))

      const video = document.getElementById('scanner-video') as HTMLVideoElement
      if (video) {
        video.srcObject = stream
        video.setAttribute('playsinline', 'true')
        video.setAttribute('muted', 'true')
        await video.play()
      }

      reader.decodeFromVideoDevice(null, video as HTMLVideoElement, (result, err) => {
        if (result) {
          const scannedCode = result.getText()
          
          // Validar el código antes de agregarlo
          if (!validateCode(productId, scannedCode)) {
            toast.error(`El código "${scannedCode}" no pertenece a este producto`)
            stopScanning()
            return
          }
          
          setScannedCodes(prev => {
            const newCodes = { ...prev }
            if (!newCodes[productId]) {
              newCodes[productId] = new Set()
            }
            // Verificar si ya existe
            if (newCodes[productId].has(scannedCode)) {
              return newCodes
            }
            newCodes[productId] = new Set(newCodes[productId]).add(scannedCode)
            return newCodes
          })
          stopScanning()
          toast.success(`Código escaneado: ${scannedCode}`)
        }
        if (err && !(err as any).closed) {
          if (!err.message || !err.message.toLowerCase().includes('no multiformat readers')) {
            // Silenciar errores esperados
          }
        }
      })
    } catch (error) {
      console.error('Error al acceder a la cámara:', error)
      toast.error('No se pudo acceder a la cámara')
      stopScanning()
    }
  }, [stopScanning, validateCode])

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [stopScanning])

  const addManualCode = useCallback((productId: string, code: string) => {
    const trimmedCode = code.trim()
    if (!trimmedCode) return

    // Validar el código antes de agregarlo
    if (!validateCode(productId, trimmedCode)) {
      toast.error(`El código "${trimmedCode}" no pertenece a este producto`)
      return
    }

    setScannedCodes(prev => {
      const newCodes = { ...prev }
      if (!newCodes[productId]) {
        newCodes[productId] = new Set()
      }
      // Verificar si ya existe
      if (newCodes[productId].has(trimmedCode)) {
        toast.warning(`El código "${trimmedCode}" ya fue agregado`)
        return newCodes
      }
      newCodes[productId] = new Set(newCodes[productId]).add(trimmedCode)
      toast.success(`Código agregado: ${trimmedCode}`)
      return newCodes
    })
  }, [validateCode])

  const removeCode = useCallback((productId: string, code: string) => {
    setScannedCodes(prev => {
      const newCodes = { ...prev }
      if (newCodes[productId]) {
        const newSet = new Set(newCodes[productId])
        newSet.delete(code)
        newCodes[productId] = newSet
      }
      return newCodes
    })
  }, [])

  const handleCancel = async () => {
    if (!sale) return

    // Verificar que todos los códigos requeridos estén escaneados
    for (const item of itemsWithCodes) {
      if (!item.productId) continue
      const expectedCodes = item.trackingCodes || []
      const scannedCount = scannedCodes[item.productId]?.size || 0
      
      if (scannedCount !== expectedCodes.length) {
        toast.error(`Faltan códigos para ${item.product?.name || 'producto'}. Se requiere ${expectedCodes.length}, se han escaneado ${scannedCount}.`)
        return
      }

      // Verificar que cada código escaneado coincida con uno de los esperados
      const scannedSet = scannedCodes[item.productId] || new Set()
      const expectedSet = new Set(expectedCodes)
      const hasValidCodes = Array.from(scannedSet).every(code => expectedSet.has(code))
      
      if (!hasValidCodes) {
        toast.error(`Algunos códigos para ${item.product?.name || 'producto'} no coinciden con los de la venta.`)
        return
      }
    }

    setIsCancelling(true)
    try {
      await onCancel()
      onOpenChange(false)
    } finally {
      setIsCancelling(false)
    }
  }

  const isCodeComplete = (productId: string, expectedCount: number) => {
    return (scannedCodes[productId]?.size || 0) === expectedCount
  }

  if (!sale) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-white">Anular Venta</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Verifica los códigos únicos de los productos para anular esta venta.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {itemsWithCodes.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Esta venta no tiene códigos únicos registrados. ¿Estás seguro de que deseas anularla?
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {itemsWithCodes.map((item) => {
                const expectedCodes = item.trackingCodes || []
                const scannedSet = scannedCodes[item.productId] || new Set()
                const isComplete = isCodeComplete(item.productId || '', expectedCodes.length)
                const inputKey = `code-input-${item.productId}`

                return (
                  <div
                    key={item.productId}
                    className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-white/5 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{item.product?.name || 'Producto desconocido'}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Cantidad: {item.quantity} | Requiere: {expectedCodes.length} códigos
                        </p>
                      </div>
                      {isComplete && (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800">
                          <Check className="h-3 w-3 mr-1" />
                          Completo
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Input
                        key={inputKey}
                        placeholder="Ingresa o escanea código"
                        className="rounded-full flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            addManualCode(item.productId || '', e.currentTarget.value)
                            e.currentTarget.value = ''
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="rounded-full"
                        onClick={() => startScanning(item.productId || '')}
                        disabled={isLoadingData || isComplete}
                      >
                        <ScanLine className="h-4 w-4" />
                      </Button>
                    </div>

                    {scannedSet.size > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {Array.from(scannedSet).map((code) => (
                          <Badge
                            key={code}
                            variant="secondary"
                            className="inline-flex items-center gap-1 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 border-0"
                          >
                            #{code}
                            <button
                              type="button"
                              onClick={() => removeCode(item.productId || '', code)}
                              className="ml-1 text-gray-500 hover:text-rose-500 dark:text-gray-400 dark:hover:text-rose-400"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    {!isComplete && expectedCodes.length > 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Faltan {expectedCodes.length - scannedSet.size} código(s)
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-gray-200 dark:border-[#2a2a2a] px-6 py-4">
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)} disabled={isCancelling}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            className="rounded-full"
            onClick={handleCancel}
            disabled={isCancelling}
          >
            {isCancelling ? 'Anulando...' : 'Anular Venta'}
          </Button>
        </DialogFooter>

        {isScanning && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70" onClick={stopScanning} />
            <div className="relative z-[121] flex flex-col items-center gap-4">
              <video
                id="scanner-video"
                className="w-72 h-72 rounded-3xl border-4 border-white object-cover shadow-2xl"
                autoPlay
                muted
                playsInline
              />
              <Button type="button" variant="secondary" className="rounded-full" onClick={stopScanning}>
                Detener escaneo
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

