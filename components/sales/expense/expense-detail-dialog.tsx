"use client"

import { Calendar, Building2, User, DollarSign, FileText, Tag } from "lucide-react"

import { useTranslations } from "next-intl"

import { SalesExpenseWithRelations } from "./types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { formatDateTime } from "@/lib/utils/date"
import { formatDateWithPreferences, formatCurrencyWithPreferences } from "@/lib/utils/preferences"
import { getTranslatableText } from "@/lib/utils/translatable-text"

interface ExpenseDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense: SalesExpenseWithRelations | null
  customerSlug: string
  maxBranches?: number | null
  onEdit?: () => void
}

export function ExpenseDetailDialog({
  open,
  onOpenChange,
  expense,
  customerSlug,
  maxBranches,
  onEdit,
}: ExpenseDetailDialogProps) {
  const t = useTranslations()

  if (!expense) {
    return <Dialog open={open} onOpenChange={onOpenChange} />
  }

  // Obtener el idioma actual para las traducciones
  const currentLanguage = (() => {
    try {
      const prefs = JSON.parse(localStorage.getItem('sas_prefs') || '{}')
      return prefs?.language || 'es'
    } catch {
      return 'es'
    }
  })()

  const description = getTranslatableText(
    expense.description,
    (expense as any).descriptionTranslations,
    currentLanguage
  ) || expense.description

  const showBranchInfo = maxBranches == null || (maxBranches != null && maxBranches > 1)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="lg:max-w-2xl max-w-3xl sm:max-w-4xl h-[85vh] flex flex-col overflow-hidden p-0 rounded-lg">
        <DialogHeader className="sticky top-0 z-10 backdrop-blur bg-white/80 dark:bg-[#101010]/80 border-b border-gray-200 dark:border-gray-800 px-6 sm:px-8 py-4">
          <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-red-500" />
            {expense.name}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Registrado el {expense.createdAt ? formatDateTime(new Date(expense.createdAt)) : 'Sin fecha'}
          </DialogDescription>
          <div className="mt-2 flex flex-wrap gap-2">
            {expense.category && (
              <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                <Tag className="h-3 w-3 mr-1" />
                {expense.category}
              </Badge>
            )}
            <Badge variant="secondary" className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-0">
              Monto: {formatCurrencyWithPreferences(Number(expense.amount || 0), customerSlug)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-4">
          <div className="space-y-6">
            {/* Información Principal */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 p-4 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0d0d0d]">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <Calendar className="h-4 w-4" />
                  Fecha del Gasto
                </div>
                <p className="text-base font-medium text-gray-900 dark:text-white">
                  {formatDateWithPreferences(new Date(expense.date), customerSlug)}
                </p>
              </div>

              {showBranchInfo && expense.branch && (
                <div className="space-y-3 p-4 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0d0d0d]">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    <Building2 className="h-4 w-4" />
                    Sucursal
                  </div>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {expense.branch.name || t('common.noBranch')}
                  </p>
                  {expense.branch.address && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {expense.branch.address}
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* Información del Usuario */}
            <section className="p-4 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0d0d0d]">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                <User className="h-4 w-4" />
                Registrado por
              </div>
              <div className="space-y-1">
                <p className="text-base font-medium text-gray-900 dark:text-white">
                  {expense.user?.fullName || t('users.sas.unassignedUser')}
                </p>
                {expense.user?.email && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {expense.user.email}
                  </p>
                )}
              </div>
            </section>

            {/* Descripción */}
            <section className="p-4 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0d0d0d]">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                <FileText className="h-4 w-4" />
                Descripción
              </div>
              <p className="text-base text-gray-900 dark:text-white whitespace-pre-wrap">
                {description || 'Sin descripción'}
              </p>
            </section>

            {/* Información Adicional */}
            <section className="space-y-3">
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 mb-1">Creado</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {expense.createdAt ? formatDateTime(new Date(expense.createdAt)) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 mb-1">Última actualización</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {expense.updatedAt ? formatDateTime(new Date(expense.updatedAt)) : '—'}
                  </p>
                </div>
              </div>
            </section>

            {/* Resumen del Monto */}
            <section className="p-4 rounded-lg border-2 border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Monto Total
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrencyWithPreferences(Number(expense.amount || 0), customerSlug)}
                  </p>
                </div>
                <DollarSign className="h-12 w-12 text-red-500 dark:text-red-400 opacity-50" />
              </div>
            </section>
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 z-10 backdrop-blur bg-white/80 dark:bg-[#101010]/80 border-t border-gray-200 dark:border-gray-800 px-6 sm:px-8 py-4">
          <div className="w-full flex flex-row flex-wrap items-center justify-center gap-2 sm:gap-3">
            {onEdit && (
              <Button
                variant="default"
                className="rounded-full w-auto"
                onClick={() => {
                  onEdit()
                  onOpenChange(false)
                }}
              >
                Editar Gasto
              </Button>
            )}
            <Button variant="outline" className="rounded-full w-auto" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

