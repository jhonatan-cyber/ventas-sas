"use client"

import { ReportsContainer } from "./reports-container"
import { ReportsHeader } from "./reports-header"

interface ReportsPageClientProps {
  customerSlug: string
}

export function ReportsPageClient({ customerSlug }: ReportsPageClientProps) {
  return (
    <div className="space-y-4 md:space-y-6 py-4 md:py-6 px-0 md:px-6">
      <ReportsHeader />
      <ReportsContainer customerSlug={customerSlug} />
    </div>
  )
}

