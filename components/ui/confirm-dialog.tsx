"use client"

import { AlertTriangle, Trash2, Info } from 'lucide-react'
import * as React from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive' | 'warning'
  isLoading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  const Icon = variant === 'destructive' ? Trash2 : variant === 'warning' ? AlertTriangle : Info

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <Icon
              className={`h-5 w-5 ${
                variant === 'destructive'
                  ? 'text-destructive'
                  : variant === 'warning'
                  ? 'text-yellow-500'
                  : 'text-primary'
              }`}
            />
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={
              variant === 'destructive'
                ? 'bg-destructive hover:bg-destructive/90'
                : variant === 'warning'
                ? 'bg-yellow-500 hover:bg-yellow-600'
                : ''
            }
          >
            {isLoading ? 'Procesando...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Hook para usar confirmaciones fácilmente
export function useConfirm() {
  const [state, setState] = React.useState<{
    open: boolean
    title: string
    description: string
    onConfirm: (() => void) | null
    variant?: 'default' | 'destructive' | 'warning'
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: null,
    variant: 'default',
  })

  const confirm = React.useCallback(
    (
      title: string,
      description: string,
      onConfirm: () => void | Promise<void>,
      variant: 'default' | 'destructive' | 'warning' = 'default'
    ) => {
      setState({
        open: true,
        title,
        description,
        onConfirm: () => {
          Promise.resolve(onConfirm()).then(() => {
            setState((prev) => ({ ...prev, open: false, onConfirm: null }))
          })
        },
        variant,
      })
    },
    []
  )

  const handleConfirm = React.useCallback(() => {
    state.onConfirm?.()
  }, [state.onConfirm])

  const Dialog = React.useMemo(
    () => (
      <ConfirmDialog
        open={state.open}
        onOpenChange={(open) => setState((prev) => ({ ...prev, open }))}
        onConfirm={handleConfirm}
        title={state.title}
        description={state.description}
        variant={state.variant}
      />
    ),
    [state, handleConfirm]
  )

  return { confirm, Dialog }
}

