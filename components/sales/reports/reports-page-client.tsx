"use client"

import { ReportsHeader } from "./reports-header"
import { ReportsContainer } from "./reports-container"

interface ReportsPageClientProps {
  customerSlug: string
}

export function ReportsPageClient({ customerSlug }: ReportsPageClientProps) {
  return (
    <div className="space-y-6 p-6">
      <ReportsHeader />
      <ReportsContainer customerSlug={customerSlug} />
    </div>
  )
}

