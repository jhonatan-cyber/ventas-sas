"use client"

import { RenewalDialog } from "./renewal-dialog"

export function RenewalDialogClient({ customerSlug, initialAmount }: { customerSlug: string; initialAmount?: string }) {
  return <RenewalDialog customerSlug={customerSlug} initialAmount={initialAmount} />
}


