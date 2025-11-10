"use client"

import { FileText, Eye, EyeOff, Globe, TrendingUp } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface CmsBlogPost {
  id: string
  organizationId?: string | null
  slug: string
  title: string
  isPublished: boolean
  viewCount: number
  organization?: {
    id: string
    name: string
    slug: string
  } | null
}

interface CmsBlogStatsProps {
  posts: CmsBlogPost[]
}

export function CmsBlogStats({ posts }: CmsBlogStatsProps) {
  const totalPosts = posts.length
  const publishedPosts = posts.filter((post) => post.isPublished).length
  const draftPosts = posts.filter((post) => !post.isPublished).length
  const organizationPosts = posts.filter((post) => post.organizationId).length
  const totalViews = posts.reduce((sum, post) => sum + post.viewCount, 0)

  const publishedPercentage = totalPosts > 0 ? Math.round((publishedPosts / totalPosts) * 100) : 0
  const draftPercentage = totalPosts > 0 ? Math.round((draftPosts / totalPosts) * 100) : 0
  const orgPercentage = totalPosts > 0 ? Math.round((organizationPosts / totalPosts) * 100) : 0

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-6 md:grid-cols-2 lg:grid-cols-5">
      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-0 p-1.5 md:p-4">
          <CardTitle className="text-[10px] md:text-sm font-medium text-gray-700 dark:text-gray-300">
            Total
          </CardTitle>
          <FileText className="h-3 w-3 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent className="p-1.5 md:p-4 pt-0 pb-1 -mt-4 md:mt-0">
          <div className="text-base md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
            {totalPosts}
          </div>
          <CardDescription className="text-[9px] md:text-xs text-gray-600 dark:text-gray-400 mt-0">
            Posts en el sistema
          </CardDescription>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-0 p-1.5 md:p-4">
          <CardTitle className="text-[10px] md:text-sm font-medium text-gray-700 dark:text-gray-300">
            Publicados
          </CardTitle>
          <Eye className="h-3 w-3 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent className="p-1.5 md:p-4 pt-0 pb-1 -mt-4 md:mt-0">
          <div className="text-base md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
            {publishedPosts}
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
            {draftPosts}
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
            {organizationPosts}
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

      <Card className="bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-0 p-1.5 md:p-4">
          <CardTitle className="text-[10px] md:text-sm font-medium text-gray-700 dark:text-gray-300">
            Vistas Totales
          </CardTitle>
          <TrendingUp className="h-3 w-3 md:h-5 md:w-5 text-indigo-600 dark:text-indigo-400" />
        </CardHeader>
        <CardContent className="p-1.5 md:p-4 pt-0 pb-1 -mt-4 md:mt-0">
          <div className="text-base md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
            {totalViews.toLocaleString()}
          </div>
          <CardDescription className="text-[9px] md:text-xs text-gray-600 dark:text-gray-400 mt-0">
            Visualizaciones
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}
