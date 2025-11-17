"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { ArrowLeft, Download, Sparkles, TrendingUp, Activity, Target, Users, Package, DollarSign } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import type { AdvancedReportResponse } from "@/lib/services/sales/report-ai-service"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrencyWithPreferences } from "@/lib/utils/preferences"

interface AiReportPageClientProps {
  customerSlug: string
}

export function AiReportPageClient({ customerSlug }: AiReportPageClientProps) {
  const t = useTranslations()
  const router = useRouter()

  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [report, setReport] = useState<AdvancedReportResponse | null>(null)

  const fetchReport = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)

      const response = await fetch(`/api/${customerSlug}/reportes/ai-advanced?${params.toString()}`, {
        credentials: "include",
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || "AI advanced report error")
      }
      setReport(data.data)
    } catch (error) {
      console.error("AI advanced report error:", error)
      toast.error(t("reports.aiAdvanced.error"))
      setReport(null)
    } finally {
      setIsLoading(false)
    }
  }, [customerSlug, startDate, endDate, t])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handleDownloadSummary = useCallback(() => {
    if (!report) {
      toast.error(t("reports.aiAdvanced.noData"))
      return
    }

    const { ai, branchPerformance, productHighlights, customerHighlights } = report
    const markdownSections = [
      `# ${t("reports.aiAdvanced.title")}`,
      ``,
      `## ${t("reports.aiSummary.title")}`,
      ai.summary,
      ``,
      `## ${t("reports.aiAdvanced.opportunities")}`,
      ...(ai.opportunities.length ? ai.opportunities.map((item) => `- ${item}`) : ["- —"]),
      ``,
      `## ${t("reports.aiAdvanced.risks")}`,
      ...(ai.risks.length ? ai.risks.map((item) => `- ${item}`) : ["- —"]),
      ``,
      `## ${t("reports.aiAdvanced.nextActions")}`,
      ...(ai.nextActions.length ? ai.nextActions.map((item) => `- ${item}`) : ["- —"]),
      ``,
      `## ${t("reports.aiAdvanced.branchHighlights")}`,
      ...branchPerformance.map(
        (branch) =>
          `- ${branch.branchName}: ${formatCurrencyWithPreferences(branch.revenue, customerSlug)} (${branch.salesCount} ventas)`
      ),
      ``,
      `## ${t("reports.aiAdvanced.topProducts")}`,
      ...productHighlights.map((product) => `- ${product.productName}: ${product.quantitySold} unidades`),
      ``,
      `## ${t("reports.aiAdvanced.topCustomers")}`,
      ...customerHighlights.map((customer) => `- ${customer.customerName}: ${formatCurrencyWithPreferences(customer.totalSpent, customerSlug)}`),
    ]

    const blob = new Blob([markdownSections.join("\n")], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `reporte-inteligente-${new Date().toISOString().slice(0, 10)}.md`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(t("reports.aiAdvanced.exported"))
  }, [report, t, customerSlug])

  const summaryChips = useMemo(() => {
    if (!report) return []
    const chips = [
      {
        label: t("reports.aiAdvanced.revenue"),
        value: formatCurrencyWithPreferences(report.kpis.totalRevenue, customerSlug),
        icon: DollarSignIcon,
      },
      {
        label: t("reports.aiAdvanced.netProfit"),
        value: formatCurrencyWithPreferences(report.kpis.netProfit, customerSlug),
        icon: TrendingIcon,
      },
      {
        label: t("reports.aiAdvanced.margin"),
        value: `${report.kpis.profitMargin.toFixed(1)}%`,
        icon: TargetIcon,
      },
      {
        label: t("reports.aiAdvanced.expenses"),
        value: formatCurrencyWithPreferences(report.kpis.totalExpenses, customerSlug),
        icon: ActivityIcon,
      },
    ]
    return chips
  }, [report, t, customerSlug])

  return (
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-0 md:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
            {t("reports.reports.aiAdvanced.title")}
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
            {t("reports.reports.aiAdvanced.description")}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full w-full sm:w-auto text-xs sm:text-sm"
            onClick={() => router.push(`/${customerSlug}/reportes`)}
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            {t("action.back")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full w-full sm:w-auto text-xs sm:text-sm"
            onClick={handleDownloadSummary}
            disabled={!report}
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            {t("reports.aiAdvanced.download")}
          </Button>
        </div>
      </div>

      <Card className="border-dashed border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-[#101010]/80 shadow-none">
        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {t("reports.filters.startDate") || "Fecha inicio"}
              </label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-full" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {t("reports.filters.endDate") || "Fecha fin"}
              </label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-full" />
            </div>
            <div className="flex items-end">
              <Button className="rounded-full w-full" onClick={fetchReport}>
                {t("reports.filters.apply") || "Aplicar filtros"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          {t("message.loading")}...
        </div>
      )}

      {!isLoading && report && (
        <>
          <Card className="border border-purple-200/70 dark:border-purple-900/40 bg-gradient-to-br from-purple-50/60 to-indigo-50/40 dark:from-purple-950/30 dark:to-indigo-950/20">
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-600 text-white rounded-full p-2">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                      {t("reports.aiSummary.title")}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t("reports.aiAdvanced.updated", { time: new Date(report.generatedAt).toLocaleString() })}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] sm:text-xs bg-white/70 dark:bg-white/5 border-purple-200 dark:border-purple-800">
                  {t("reports.aiSummary.powered")}
                </Badge>
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-100 leading-relaxed">{report.ai.summary}</p>
              <div className="grid gap-3 md:grid-cols-3">
                <InsightList
                  title={t("reports.aiAdvanced.opportunities")}
                  items={report.ai.opportunities}
                  tone="positive"
                />
                <InsightList title={t("reports.aiAdvanced.risks")} items={report.ai.risks} tone="warning" />
                <InsightList title={t("reports.aiAdvanced.nextActions")} items={report.ai.nextActions} tone="neutral" />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-4">
            {summaryChips.map((chip) => (
              <Card key={chip.label} className="border border-gray-200/70 dark:border-gray-800/60 bg-white/80 dark:bg-[#101010]/80 backdrop-blur">
                <CardContent className="p-4 sm:p-5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                    <chip.icon className="h-4 w-4" />
                    {chip.label}
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{chip.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border border-gray-200/70 dark:border-gray-800/60 bg-white/80 dark:bg-[#101010]/80">
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    {t("reports.aiAdvanced.branchHighlights")}
                  </h3>
                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                    {t("reports.aiAdvanced.branches")}
                  </Badge>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("reports.aiAdvanced.branch")}</TableHead>
                      <TableHead>{t("reports.aiAdvanced.sales")}</TableHead>
                      <TableHead>{t("reports.aiAdvanced.revenue")}</TableHead>
                      <TableHead>{t("reports.aiAdvanced.avgTicket")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.branchPerformance.map((branch) => (
                      <TableRow key={branch.branchId}>
                        <TableCell className="font-medium">{branch.branchName}</TableCell>
                        <TableCell>{branch.salesCount}</TableCell>
                        <TableCell>{formatCurrencyWithPreferences(branch.revenue, customerSlug)}</TableCell>
                        <TableCell>{formatCurrencyWithPreferences(branch.averageTicket, customerSlug)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="border border-gray-200/70 dark:border-gray-800/60 bg-white/80 dark:bg-[#101010]/80">
                <CardContent className="p-4 sm:p-6 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                    <Package className="h-4 w-4 text-indigo-500" />
                    {t("reports.aiAdvanced.topProducts")}
                  </div>
                  <ul className="space-y-2">
                    {report.productHighlights.map((product) => (
                      <li key={product.productId} className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                        <span>{product.productName}</span>
                        <span className="font-semibold">{product.quantitySold} uds</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border border-gray-200/70 dark:border-gray-800/60 bg-white/80 dark:bg-[#101010]/80">
                <CardContent className="p-4 sm:p-6 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                    <Users className="h-4 w-4 text-emerald-500" />
                    {t("reports.aiAdvanced.topCustomers")}
                  </div>
                  <ul className="space-y-2">
                    {report.customerHighlights.map((customer) => (
                      <li
                        key={customer.customerId}
                        className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300"
                      >
                        <span>{customer.customerName}</span>
                        <span className="font-semibold">
                          {formatCurrencyWithPreferences(customer.totalSpent, customerSlug)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function InsightList({
  title,
  items,
  tone,
}: {
  title: string
  items: string[]
  tone: "positive" | "warning" | "neutral"
}) {
  const colors =
    tone === "positive"
      ? "text-emerald-600 dark:text-emerald-300"
      : tone === "warning"
      ? "text-amber-600 dark:text-amber-300"
      : "text-gray-600 dark:text-gray-300"

  return (
    <div>
      <p className={`text-xs font-semibold uppercase mb-2 ${colors}`}>{title}</p>
      <ul className="space-y-2">
        {items.length === 0 && <li className="text-xs text-gray-400">—</li>}
        {items.map((item, index) => (
          <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function DollarSignIcon() {
  return <DollarSign className="h-4 w-4 text-emerald-500" />
}

function TrendingIcon() {
  return <TrendingUp className="h-4 w-4 text-blue-500" />
}

function TargetIcon() {
  return <Target className="h-4 w-4 text-purple-500" />
}

function ActivityIcon() {
  return <Activity className="h-4 w-4 text-orange-500" />
}


