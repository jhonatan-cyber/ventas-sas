"use client"

import { m, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { useState, useEffect } from 'react'

import { cn } from '@/lib/utils'

interface ToastProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
  onClose: (id: string) => void
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

const toastStyles = {
  success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
  error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
}

export function AnimatedToast({
  id,
  type,
  title,
  description,
  duration = 5000,
  onClose
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const Icon = toastIcons[type]

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose(id), 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, id, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(id), 300)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <m.div
          initial={{ opacity: 0, x: 300, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.9 }}
          transition={{
            duration: 0.3,
            ease: [0.16, 1, 0.3, 1]
          }}
          className={cn(
            "relative flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm",
            toastStyles[type]
          )}
        >
          <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />

          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm">{title}</h4>
            {description && (
              <p className="text-sm opacity-90 mt-1">{description}</p>
            )}
          </div>

          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Barra de progreso */}
          <m.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
            className="absolute bottom-0 left-0 h-1 bg-current opacity-30 rounded-b-lg"
          />
        </m.div>
      )}
    </AnimatePresence>
  )
}

// Contenedor de toasts
export function ToastContainer({
  toasts,
  onClose
}: {
  toasts: ToastProps[],
  onClose: (id: string) => void
}) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <AnimatedToast
            key={toast.id}
            {...toast}
            onClose={onClose}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Hook para manejar toasts
export function useAnimatedToasts() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id, onClose: removeToast }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const success = (title: string, description?: string) => {
    addToast({ type: 'success', title, description })
  }

  const error = (title: string, description?: string) => {
    addToast({ type: 'error', title, description })
  }

  const warning = (title: string, description?: string) => {
    addToast({ type: 'warning', title, description })
  }

  const info = (title: string, description?: string) => {
    addToast({ type: 'info', title, description })
  }

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  }
}