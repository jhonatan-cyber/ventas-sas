import { CashRegister } from "@prisma/client"

export type CashRegisterWithRelations = Omit<CashRegister, 'createdAt' | 'updatedAt' | 'openingBalance' | 'currentBalance' | 'lastOpenAt' | 'lastCloseAt'> & {
  createdAt: Date | string
  updatedAt: Date | string
  openingBalance: number | CashRegister['openingBalance']
  currentBalance: number | CashRegister['currentBalance']
  lastOpenAt: Date | string | null
  lastCloseAt: Date | string | null
  branch?: { id: string; name: string; address?: string | null } | null
  openedBy?: { id: string; nombre: string; apellido: string } | null
  closedBy?: { id: string; nombre: string; apellido: string } | null
}

