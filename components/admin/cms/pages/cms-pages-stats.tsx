"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FileText, Eye, EyeOff, Globe } from "lucide-react"

interface CmsPage {
  id: string
  organizationId?: string | null
  slug: string
  title: string
  pageType: string
  isPublished: boolean
  organization?: {
    id: string
    name: string
    slug: string
  } | null
}

interface CmsPagesStatsProps {
  pages: CmsPage[]
}

export function CmsPagesStats({ pages }: CmsPagesStatsProps) {
  const totalPages = pages.length
  const publishedPages = pages.filter((page) => page.isPublished).length
  const draftPages = pages.filter((page) => !page.isPublished).length
  const organizationPages = pages.filter((page) => page.organizationId).length

  const publishedPercentage = totalPages > 0 ? Math.round((publishedPages / totalPages) * 100) : 0
  const draftPercentage = totalPages > 0 ? Math.round((draftPages / totalPages) * 100) : 0
  const orgPercentage = totalPages > 0 ? Math.round((organizationPages / totalPages) * 100) : 0

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-0 p-1.5 md:p-4">
          <CardTitle className="text-[10px] md:text-sm font-medium text-gray-700 dark:text-gray-300">
            Total
          </CardTitle>
          <FileText className="h-3 w-3 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent className="p-1.5 md:p-4 pt-0 pb-1 -mt-4 md:mt-0">
          <div className="text-base md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
            {totalPages}
          </div>
          <CardDescription className="text-[9px] md:text-xs text-gray-600 dark:text-gray-400 mt-0">
            Páginas en el sistema
          </CardDescription>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-0 p-1.5 md:p-4">
          <CardTitle className="text-[10px] md:text-sm font-medium text-gray-700 dark:text-gray-300">
            Publicadas
          </CardTitle>
          <Eye className="h-3 w-3 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent className="p-1.5 md:p-4 pt-0 pb-1 -mt-4 md:mt-0">
          <div className="text-base md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
            {publishedPages}
          </div>
          <CardDescription className="text-[9px] md:text-xs text-gray-600 dark:text-gray-400 mt-0">
            {publishedPercentage}% del total
          </CardDescription>
          <div className="mt-1 w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-1">
            <div
              className="bg-green-600 dark:bg-green-500 h-1 rounded-full transition-all"
              style={{ width: `${publishedPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-0 p-1.5 md:p-4">
          <CardTitle className="text-[10px] md:text-sm font-medium text-gray-700 dark:text-gray-300">
            Borradores
          </CardTitle>
          <EyeOff className="h-3 w-3 md:h-5 md:w-5 text-yellow-600 dark:text-yellow-400" />
        </CardHeader>
        <CardContent className="p-1.5 md:p-4 pt-0 pb-1 -mt-4 md:mt-0">
          <div className="text-base md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
            {draftPages}
          </div>
          <CardDescription className="text-[9px] md:text-xs text-gray-600 dark:text-gray-400 mt-0">
            {draftPercentage}% del total
          </CardDescription>
          <div className="mt-1 w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-1">
            <div
              className="bg-yellow-600 dark:bg-yellow-500 h-1 rounded-full transition-all"
              style={{ width: `${draftPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-0 p-1.5 md:p-4">
          <CardTitle className="text-[10px] md:text-sm font-medium text-gray-700 dark:text-gray-300">
            Por Organización
          </CardTitle>
          <Globe className="h-3 w-3 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
        </CardHeader>
        <CardContent className="p-1.5 md:p-4 pt-0 pb-1 -mt-4 md:mt-0">
          <div className="text-base md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
            {organizationPages}
          </div>
          <CardDescription className="text-[9px] md:text-xs text-gray-600 dark:text-gray-400 mt-0">
            {orgPercentage}% del total
          </CardDescription>
          <div className="mt-1 w-full bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-1">
            <div
              className="bg-purple-600 dark:bg-purple-500 h-1 rounded-full transition-all"
              style={{ width: `${orgPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

