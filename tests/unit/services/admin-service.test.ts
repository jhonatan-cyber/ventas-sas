import { describe, it, expect, beforeEach, vi } from 'vitest'

import { AdminService } from '@/lib/services/admin/admin-service'

// Mock de Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    organization: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

describe('AdminService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllOrganizations', () => {
    it('debería retornar una lista de organizaciones', async () => {
      const mockOrganizations = [
        { id: '1', name: 'Org 1', slug: 'org-1' },
        { id: '2', name: 'Org 2', slug: 'org-2' },
      ]

      const { prisma } = await import('@/lib/prisma')
      vi.mocked(prisma.organization.findMany).mockResolvedValue(mockOrganizations as any)
      vi.mocked(prisma.organization.count).mockResolvedValue(2)

      const result = await AdminService.getAllOrganizations()

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Org 1')
    })
  })
})

