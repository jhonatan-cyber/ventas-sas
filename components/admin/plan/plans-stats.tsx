"use client";

import {
  CreditCard,
  DollarSign,
  Power,
  TrendingUp,
} from "lucide-react";

import { SerializedSubscriptionPlanWithStats } from "./types";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PlansStatsProps {
  plans: SerializedSubscriptionPlanWithStats[];
}

export function PlansStats({ plans }: PlansStatsProps) {
  const totalPlans = plans.length;
  const plansInUse = plans.filter(
    (plan) => plan._count.organizations > 0
  ).length;
  const _plansNotUsed = plans.filter(
    (plan) => plan._count.organizations === 0
  ).length;
  const plansActive = plans.filter((plan) => plan.isActive ?? true).length;
  const _plansInactive = plans.filter((plan) => !(plan.isActive ?? true)).length;
  const totalRevenue = plans.reduce((sum, plan) => {
    // Calcular ingresos mensuales: usar priceMonthly si existe, sino usar priceYearly / 12
    const monthlyPrice =
      plan.hasMonthly && plan.priceMonthly
        ? plan.priceMonthly
        : plan.hasYearly && plan.priceYearly
        ? plan.priceYearly / 12
        : 0;
    return sum + monthlyPrice * plan._count.organizations;
  }, 0);

  const usagePercentage =
    totalPlans > 0 ? Math.round((plansInUse / totalPlans) * 100) : 0;
  const activePercentage =
    totalPlans > 0 ? Math.round((plansActive / totalPlans) * 100) : 0;

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-0 p-1.5 md:p-4">
          <CardTitle className="text-[10px] md:text-sm font-medium text-gray-700 dark:text-gray-300">
            Total
          </CardTitle>
          <CreditCard className="h-3 w-3 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent className="p-1.5 md:p-4 pt-0 pb-1 -mt-4 md:mt-0">
          <div className="text-base md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
            {totalPlans}
          </div>
          <CardDescription className="text-[9px] md:text-xs text-gray-600 dark:text-gray-400 mt-0">
            Planes en el sistema
          </CardDescription>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-0 p-1.5 md:p-4">
          <CardTitle className="text-[10px] md:text-sm font-medium text-gray-700 dark:text-gray-300">
            En Uso
          </CardTitle>
          <TrendingUp className="h-3 w-3 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent className="p-1.5 md:p-4 pt-0 pb-1 -mt-4 md:mt-0">
          <div className="text-base md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
            {plansInUse}
          </div>
          <CardDescription className="text-[9px] md:text-xs text-gray-600 dark:text-gray-400 mt-0">
            {usagePercentage}% del total
          </CardDescription>
          <div className="mt-1 w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-1">
            <div
              className="bg-green-600 dark:bg-green-500 h-1 rounded-full transition-all"
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-0 p-1.5 md:p-4">
          <CardTitle className="text-[10px] md:text-sm font-medium text-gray-700 dark:text-gray-300">
            Activos
          </CardTitle>
          <Power className="h-3 w-3 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
        </CardHeader>
        <CardContent className="p-1.5 md:p-4 pt-0 pb-1 -mt-4 md:mt-0">
          <div className="text-base md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
            {plansActive}
          </div>
          <CardDescription className="text-[9px] md:text-xs text-gray-600 dark:text-gray-400 mt-0">
            {activePercentage}% del total
          </CardDescription>
          <div className="mt-1 w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-1">
            <div
              className="bg-purple-600 dark:bg-purple-500 h-1 rounded-full transition-all"
              style={{ width: `${activePercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-0 p-1.5 md:p-4">
          <CardTitle className="text-[10px] md:text-sm font-medium text-gray-700 dark:text-gray-300">
            Ingresos
          </CardTitle>
          <DollarSign className="h-3 w-3 md:h-5 md:w-5 text-yellow-600 dark:text-yellow-400" />
        </CardHeader>
        <CardContent className="p-1.5 md:p-4 pt-0 pb-1 -mt-4 md:mt-0">
          <div className="text-base md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
            ${totalRevenue.toLocaleString()}
          </div>
          <CardDescription className="text-[9px] md:text-xs text-gray-600 dark:text-gray-400 mt-0">
            Ingresos mensuales
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
