"use client"

import { useEffect, useRef, useState, useCallback } from 'react'

interface BarcodeScannerOptions {
  onScan: (barcode: string) => void
  minLength?: number
  maxLength?: number
  timeout?: number
  enabled?: boolean
}

/**
 * Hook para detectar lectores de códigos de barras físicos (USB)
 * Los lectores de códigos de barras actúan como teclados, enviando el código seguido de Enter
 */
export function useBarcodeScanner({
  onScan,
  minLength = 8,
  maxLength = 20,
  timeout = 100,
  enabled = true
}: BarcodeScannerOptions) {
  const [isListening, setIsListening] = useState(false)
  const bufferRef = useRef<string>('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastKeypressTime = useRef<number>(0)

  const resetBuffer = useCallback(() => {
    bufferRef.current = ''
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!enabled || !isListening) return

    const currentTime = Date.now()
    const timeDiff = currentTime - lastKeypressTime.current

    // Si ha pasado mucho tiempo desde la última tecla, resetear el buffer
    if (timeDiff > timeout * 2) {
      resetBuffer()
    }

    lastKeypressTime.current = currentTime

    // Si es Enter, procesar el código escaneado
    if (event.key === 'Enter') {
      event.preventDefault()
      const scannedCode = bufferRef.current.trim()
      
      if (scannedCode.length >= minLength && scannedCode.length <= maxLength) {
        // Verificar que el código solo contenga caracteres válidos para códigos de barras
        const validBarcodePattern = /^[0-9A-Za-z\-_\.]+$/
        if (validBarcodePattern.test(scannedCode)) {
          onScan(scannedCode)
        }
      }
      
      resetBuffer()
      return
    }

    // Si es una tecla especial (Ctrl, Alt, etc.), ignorar
    if (event.ctrlKey || event.altKey || event.metaKey || event.key.length > 1) {
      return
    }

    // Agregar el carácter al buffer
    bufferRef.current += event.key

    // Limpiar el buffer después del timeout si no se presiona Enter
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      resetBuffer()
    }, timeout)

  }, [enabled, isListening, minLength, maxLength, timeout, onScan, resetBuffer])

  const startListening = useCallback(() => {
    setIsListening(true)
    resetBuffer()
  }, [resetBuffer])

  const stopListening = useCallback(() => {
    setIsListening(false)
    resetBuffer()
  }, [resetBuffer])

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handleKeyPress)
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
      resetBuffer()
    }
  }, [enabled, handleKeyPress, resetBuffer])

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    isListening,
    startListening,
    stopListening
  }
}

/**
 * Hook simplificado para usar en inputs específicos
 */
export function useBarcodeInput(onScan: (barcode: string) => void, enabled = true) {
  const [isActive, setIsActive] = useState(false)
  
  const { isListening, startListening, stopListening } = useBarcodeScanner({
    onScan: (barcode) => {
      onScan(barcode)
      setIsActive(false) // Desactivar después de escanear
    },
    enabled: enabled && isActive
  })

  const activateScanner = useCallback(() => {
    setIsActive(true)
    startListening()
  }, [startListening])

  const deactivateScanner = useCallback(() => {
    setIsActive(false)
    stopListening()
  }, [stopListening])

  return {
    isActive,
    isListening,
    activateScanner,
    deactivateScanner
  }
}