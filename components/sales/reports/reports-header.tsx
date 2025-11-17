"use client"

import { useTranslations } from "next-intl"

export function ReportsHeader() {
  const t = useTranslations()
  
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {t('reports.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('reports.description')}
        </p>
      </div>
    </div>
  )
}

