export interface ExpenseUserSummary {
  id: string
  fullName?: string | null
  email?: string | null
}

export interface ExpenseBranchSummary {
  id?: string
  name?: string | null
  address?: string | null
}

export interface SalesExpenseWithRelations {
  id: string
  organizationId: string
  userId: string
  branchId: string | null
  name: string
  category?: string | null
  description: string
  amount: number
  date: string
  createdAt: string
  updatedAt: string
  user?: ExpenseUserSummary | null
  branch?: ExpenseBranchSummary | null
}
