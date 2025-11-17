"use client"

import { ReportsContainer } from "./reports-container"
import { ReportsHeader } from "./reports-header"

interface ReportsPageClientProps {
  customerSlug: string
  maxBranches?: number | null
}

export function ReportsPageClient({ customerSlug, maxBranches }: ReportsPageClientProps) {
  return (
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-0 md:px-6">
      <ReportsHeader />
      <ReportsContainer customerSlug={customerSlug} maxBranches={maxBranches} />
    </div>
  )
}

