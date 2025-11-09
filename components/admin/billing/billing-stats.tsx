"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, DollarSign, AlertCircle, CheckCircle2 } from "lucide-react";
import { BillingStats } from "@/lib/services/admin/billing-service";

interface BillingStatsProps {
  stats: BillingStats;
}

export function BillingStats({ stats }: BillingStatsProps) {
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(numAmount)
  }

  const paidPercentage = stats.totalInvoices > 0 
    ? Math.round((stats.paidInvoices / stats.totalInvoices) * 100) 
    : 0;
  
  const pendingPercentage = stats.totalInvoices > 0 
    ? Math.round((stats.pendingInvoices / stats.totalInvoices) * 100) 
    : 0;
  
  const overduePercentage = stats.totalInvoices > 0 
    ? Math.round((stats.overdueInvoices / stats.totalInvoices) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-0 p-1.5 md:p-4">
          <CardTitle className="text-[10px] md:text-sm font-medium text-gray-700 dark:text-gray-300">
            Total Facturas
          </CardTitle>
          <FileText className="h-3 w-3 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent className="p-1.5 md:p-4 pt-0 pb-1 -mt-4 md:mt-0">
          <div className="text-base md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
            {stats.totalInvoices}
          </div>
          <CardDescription className="text-[9px] md:text-xs text-gray-600 dark:text-gray-400 mt-0">
            Facturas registradas
          </CardDescription>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-0 p-1.5 md:p-4">
          <CardTitle className="text-[10px] md:text-sm font-medium text-gray-700 dark:text-gray-300">
            Ingresos Totales
          </CardTitle>
          <DollarSign className="h-3 w-3 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent className="p-1.5 md:p-4 pt-0 pb-1 -mt-4 md:mt-0">
          <div className="text-base md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
            {formatCurrency(stats.totalRevenue)}
          </div>
          <CardDescription className="text-[9px] md:text-xs text-gray-600 dark:text-gray-400 mt-0">
            {paidPercentage}% pagadas
          </CardDescription>
          <div className="mt-1 w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-1">
            <div
              className="bg-green-600 dark:bg-green-500 h-1 rounded-full transition-all"
              style={{ width: `${paidPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-0 p-1.5 md:p-4">
          <CardTitle className="text-[10px] md:text-sm font-medium text-gray-700 dark:text-gray-300">
            Pendientes
          </CardTitle>
          <AlertCircle className="h-3 w-3 md:h-5 md:w-5 text-yellow-600 dark:text-yellow-400" />
        </CardHeader>
        <CardContent className="p-1.5 md:p-4 pt-0 pb-1 -mt-4 md:mt-0">
          <div className="text-base md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
            {formatCurrency(stats.pendingAmount)}
          </div>
          <CardDescription className="text-[9px] md:text-xs text-gray-600 dark:text-gray-400 mt-0">
            {stats.pendingInvoices} facturas ({pendingPercentage}%)
          </CardDescription>
          <div className="mt-1 w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-1">
            <div
              className="bg-yellow-600 dark:bg-yellow-500 h-1 rounded-full transition-all"
              style={{ width: `${pendingPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-0 p-1.5 md:p-4">
          <CardTitle className="text-[10px] md:text-sm font-medium text-gray-700 dark:text-gray-300">
            Vencidas
          </CardTitle>
          <CheckCircle2 className="h-3 w-3 md:h-5 md:w-5 text-red-600 dark:text-red-400" />
        </CardHeader>
        <CardContent className="p-1.5 md:p-4 pt-0 pb-1 -mt-4 md:mt-0">
          <div className="text-base md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
            {formatCurrency(stats.overdueAmount)}
          </div>
          <CardDescription className="text-[9px] md:text-xs text-gray-600 dark:text-gray-400 mt-0">
            {stats.overdueInvoices} facturas ({overduePercentage}%)
          </CardDescription>
          <div className="mt-1 w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-1">
            <div
              className="bg-red-600 dark:bg-red-500 h-1 rounded-full transition-all"
              style={{ width: `${overduePercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

