"use client"

import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"

import type { CashRegisterWithRelations } from "./types"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatDateTime } from "@/lib/utils/date"
import { formatCurrencyWithPreferences } from "@/lib/utils/preferences"

const formatCurrency = (value: number | string | undefined | null | { toNumber?: () => number }) => {
  let numValue = 0
  if (value && typeof value === 'object' && 'toNumber' in value && value.toNumber) {
    numValue = value.toNumber()
  } else {
    numValue = Number(value || 0)
  }
  return formatCurrencyWithPreferences(numValue)
}

interface CashRegisterDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cashRegister: CashRegisterWithRelations | null
  showBranchInfo?: boolean
}

const getUserFullName = (user?: { nombre: string; apellido: string } | null) => {
  if (!user) return "-"
  const parts = [user.nombre ?? "", user.apellido ?? ""].filter(Boolean)
  return parts.length > 0 ? parts.join(" ") : "-"
}

export function CashRegisterDetailsDialog({ open, onOpenChange, cashRegister, showBranchInfo = true }: CashRegisterDetailsDialogProps) {
  const t = useTranslations()
  const isOpen = cashRegister?.isOpen ?? false
  const openedAt = cashRegister?.lastOpenAt || cashRegister?.createdAt
  const closedAt = cashRegister?.lastCloseAt

  const params = useParams()
  const customerSlug = (params as { slug?: string }).slug || ""

  const [salesStats, setSalesStats] = useState<{
    totalSales: number
    byStatus: { 
      completed: { count: number; amount?: number }; 
      cancelled: { count: number; amount?: number } 
    }
    totals?: { revenue: number }
    byPaymentMethod?: {
      cash: number
      card: number
      transfer: number
      qr: number
    }
  } | null>(null)
  const [generalStats, setGeneralStats] = useState<{
    quotationsCount: number
  } | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  const [startDateStr, endDateStr] = useMemo(() => {
    const start = openedAt ? new Date(openedAt) : null
    const end = closedAt ? new Date(closedAt) : (isOpen ? new Date() : null)
    const toParam = (d: Date | null) => (d ? d.toISOString() : "")
    return [toParam(start), toParam(end)]
  }, [openedAt, closedAt, isOpen])

  useEffect(() => {
    if (!customerSlug || !startDateStr) return

    const controller = new AbortController()
    const fetchStats = async () => {
      setLoadingStats(true)
      try {
        // Parámetros de rango de fechas del período de la caja
        const rangeParams = new URLSearchParams()
        if (startDateStr) rangeParams.append("startDate", startDateStr)
        if (endDateStr) rangeParams.append("endDate", endDateStr)
        // Traer ventas y cotizaciones dentro del período (paginación amplia)
        rangeParams.append("page", "1")
        rangeParams.append("pageSize", "1000")

        const [salesRes, quotationsRes] = await Promise.all([
          fetch(`/api/${customerSlug}/ventas?${rangeParams.toString()}`, { signal: controller.signal }),
          fetch(`/api/${customerSlug}/cotizaciones?${rangeParams.toString()}`, { signal: controller.signal }),
        ])

        const salesJson = await salesRes.json()
        const quotationsJson = await quotationsRes.json()

        // Filtrar por sucursal de la caja (ventas cuyos items pertenecen a la misma sucursal)
        const branchId = cashRegister?.branchId || null
        const sales = Array.isArray(salesJson?.sales) ? salesJson.sales : []
        const filteredSales = branchId
          ? sales.filter((s: any) => Array.isArray(s.items) && s.items.some((it: any) => it?.product?.branchId === branchId))
          : sales

        const totalSales = filteredSales.length
        const completedSales = filteredSales.filter((s: any) => s.status === 'completed')
        const cancelledSales = filteredSales.filter((s: any) => s.status === 'cancelled')
        const completedCount = completedSales.length
        const cancelledCount = cancelledSales.length
        const completedAmount = completedSales.reduce((sum: number, s: any) => sum + Number(s.total || 0), 0)
        const cancelledAmount = cancelledSales.reduce((sum: number, s: any) => sum + Number(s.total || 0), 0)
        const revenue = completedAmount - cancelledAmount

        // Desglose por método de pago (neto: completadas - anuladas)
        const sumByMethod = (arr: any[]) => arr.reduce((acc: Record<string, number>, s: any) => {
          const m = (s.paymentMethod || 'cash') as string
          acc[m] = (acc[m] || 0) + Number(s.total || 0)
          return acc
        }, {})

        const completedByMethod = sumByMethod(completedSales)
        const cancelledByMethod = sumByMethod(cancelledSales)

        const byPaymentMethod = {
          cash: (completedByMethod['cash'] || 0) - (cancelledByMethod['cash'] || 0),
          card: (completedByMethod['card'] || 0) - (cancelledByMethod['card'] || 0),
          transfer: (completedByMethod['transfer'] || 0) - (cancelledByMethod['transfer'] || 0),
          qr: (completedByMethod['qr'] || 0) - (cancelledByMethod['qr'] || 0),
        }

        setSalesStats({
          totalSales,
          byStatus: {
            completed: { count: completedCount, amount: completedAmount },
            cancelled: { count: cancelledCount, amount: cancelledAmount },
          },
          totals: { revenue },
          byPaymentMethod,
        })

        // Cotizaciones filtradas por sucursal
        const quotations = Array.isArray(quotationsJson?.quotations) ? quotationsJson.quotations : []
        const filteredQuotations = branchId
          ? quotations.filter((q: any) => Array.isArray(q.items) && q.items.some((it: any) => it?.product?.branchId === branchId))
          : quotations

        setGeneralStats({
          quotationsCount: filteredQuotations.length,
        })
      } catch {
        // noop
      } finally {
        setLoadingStats(false)
      }
    }

    fetchStats()
    return () => controller.abort()
  }, [customerSlug, startDateStr, endDateStr, cashRegister?.branchId])

  const statusClasses = isOpen
    ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800"
    : "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border-rose-200 dark:border-rose-800"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] lg:max-w-2xl max-h-[92vh] flex flex-col overflow-hidden p-0 rounded-lg">
        <div className="px-6 sm:px-8 py-5 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/95 dark:bg-[#111111]/95 backdrop-blur sticky top-0 z-10">
          <DialogHeader className="px-0 py-0 space-y-2">
            <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-white">Detalles de la caja</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Información resumida del estado actual de la caja registradora.
            </DialogDescription>
          </DialogHeader>
        </div>

        {cashRegister ? (
          <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6 bg-gray-50/60 dark:bg-[#0c0c0c]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{cashRegister.name}</h3>
                {openedAt && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{formatDateTime(openedAt)}</p>
                )}
              </div>
              <Badge className={`${statusClasses} rounded-full px-4 py-1.5 text-xs font-semibold`}>
                {isOpen ? "Abierta" : "Cerrada"}
              </Badge>
            </div>

            <div className="space-y-3 text-sm">
              {showBranchInfo && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500 dark:text-gray-400">Sucursal</span>
                  <span className="font-medium text-gray-900 dark:text-white text-right">
                    {cashRegister.branch?.name || t('common.noBranch')}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500 dark:text-gray-400">Usuario de apertura</span>
                <span className="font-medium text-gray-900 dark:text-white text-right">
                  {getUserFullName(cashRegister.openedBy || null)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500 dark:text-gray-400">Cerrada por</span>
                <span className="font-medium text-gray-900 dark:text-white text-right">
                  {getUserFullName(cashRegister.closedBy || null)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500 dark:text-gray-400">Fecha de cierre</span>
                <span className="font-medium text-gray-900 dark:text-white text-right">
                  {closedAt ? formatDateTime(closedAt) : "Aún sin cerrar"}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="rounded-2xl bg-gray-100/80 dark:bg-[#252525] px-3 py-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Monto de apertura</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(cashRegister.openingBalance)}
                  </p>
                </div>
                <div className="rounded-2xl bg-green-100/80 dark:bg-green-900/20 px-3 py-3">
                  <p className="text-xs text-green-700 dark:text-green-300">Balance actual</p>
                  <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                    {formatCurrency(cashRegister.currentBalance)}
                  </p>
                </div>
              </div>

              {/* Stats periodo de caja */}
              <div className="pt-4 space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Resumen del período de caja
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-2xl bg-blue-50/70 dark:bg-blue-900/20 px-3 py-3">
                    <p className="text-xs text-blue-700 dark:text-blue-300">Ventas</p>
                    <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                      {loadingStats ? "—" : (salesStats?.totalSales ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50/70 dark:bg-emerald-900/20 px-3 py-3">
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">Finalizadas</p>
                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                      {loadingStats ? "—" : (salesStats?.byStatus.completed.count ?? 0)}
                    </p>
                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                      {loadingStats ? "" : formatCurrency(salesStats?.byStatus.completed.amount || 0)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-rose-50/70 dark:bg-rose-900/20 px-3 py-3">
                    <p className="text-xs text-rose-700 dark:text-rose-300">Anuladas</p>
                    <p className="text-xl font-bold text-rose-700 dark:text-rose-300">
                      {loadingStats ? "—" : (salesStats?.byStatus.cancelled.count ?? 0)}
                    </p>
                    <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80">
                      {loadingStats ? "" : formatCurrency(salesStats?.byStatus.cancelled.amount || 0)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-violet-50/70 dark:bg-violet-900/20 px-3 py-3">
                    <p className="text-xs text-violet-700 dark:text-violet-300">Cotizaciones</p>
                    <p className="text-xl font-bold text-violet-700 dark:text-violet-300">
                      {loadingStats ? "—" : (generalStats?.quotationsCount ?? 0)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-indigo-50/70 dark:bg-indigo-900/20 px-3 py-3">
                    <p className="text-xs text-indigo-700 dark:text-indigo-300">Ingreso neto período</p>
                    <p className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">
                      {loadingStats ? "—" : formatCurrency(salesStats?.totals?.revenue || 0)}
                    </p>
                  </div>
                </div>

                {/* Dónde está el dinero (por método de pago) */}
                <div className="pt-2 space-y-2">
                  <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                    Dónde está el dinero
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-2xl bg-gray-100/70 dark:bg-[#232323] px-3 py-3">
                      <p className="text-xs text-gray-600 dark:text-gray-300">Efectivo</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {loadingStats ? "—" : formatCurrency(salesStats?.byPaymentMethod?.cash || 0)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-gray-100/70 dark:bg-[#232323] px-3 py-3">
                      <p className="text-xs text-gray-600 dark:text-gray-300">Tarjeta</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {loadingStats ? "—" : formatCurrency(salesStats?.byPaymentMethod?.card || 0)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-gray-100/70 dark:bg-[#232323] px-3 py-3">
                      <p className="text-xs text-gray-600 dark:text-gray-300">Transferencia</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {loadingStats ? "—" : formatCurrency(salesStats?.byPaymentMethod?.transfer || 0)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-gray-100/70 dark:bg-[#232323] px-3 py-3">
                      <p className="text-xs text-gray-600 dark:text-gray-300">QR / Billetera</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {loadingStats ? "—" : formatCurrency(salesStats?.byPaymentMethod?.qr || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-6 sm:px-8 py-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Selecciona una caja para ver sus detalles.
            </p>
          </div>
        )}

        <div className="sticky bottom-0 z-10 w-full flex items-center justify-center gap-3 border-t border-gray-200 dark:border-[#2a2a2a] px-6 sm:px-8 py-4 bg-white/95 dark:bg-[#111111]/95 backdrop-blur">
          <Button variant="outline" className="rounded-full w-full sm:w-auto" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
