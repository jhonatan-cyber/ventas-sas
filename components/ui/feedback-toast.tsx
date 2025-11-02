"use client"

import { toast } from "sonner"
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react"

interface ToastOptions {
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export const showSuccessToast = (message: string, options?: ToastOptions) => {
  return toast.success(message, {
    duration: options?.duration || 3000,
    icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    action: options?.action,
  })
}

export const showErrorToast = (message: string, options?: ToastOptions) => {
  return toast.error(message, {
    duration: options?.duration || 5000,
    icon: <XCircle className="h-5 w-5 text-red-500" />,
    action: options?.action,
  })
}

export const showWarningToast = (message: string, options?: ToastOptions) => {
  return toast.warning(message, {
    duration: options?.duration || 4000,
    icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    action: options?.action,
  })
}

export const showInfoToast = (message: string, options?: ToastOptions) => {
  return toast.info(message, {
    duration: options?.duration || 3000,
    icon: <Info className="h-5 w-5 text-blue-500" />,
    action: options?.action,
  })
}

export const showLoadingToast = (message: string, promise: Promise<any>) => {
  return toast.promise(promise, {
    loading: message,
    success: "Operación completada",
    error: "Error al completar la operación",
  })
}

