/**
 * Fixtures de autenticación para tests E2E
 */

import { test as base } from '@playwright/test'
import type { Page } from '@playwright/test'

interface AuthFixtures {
  loginAsAdmin: () => Promise<void>
  loginAsSas: (slug: string) => Promise<void>
}

export const test = base.extend<AuthFixtures>({
  // Login como admin
  loginAsAdmin: async ({ page }, use) => {
    const loginFunction = async () => {
      await page.goto('/administracion/login')
      await page.fill('input[type="email"]', 'test-admin@example.com')
      await page.fill('input[type="password"]', 'Test123!')
      await page.click('button[type="submit"]')
      await page.waitForURL('/administracion/dashboard', { timeout: 10000 })
    }
    await use(loginFunction)
  },

  // Login como usuario SAS
  loginAsSas: async ({ page }, use) => {
    const loginFunction = async (slug: string) => {
      await page.goto(`/${slug}/login`)
      await page.fill('input[name="ci"]', '87654321')
      await page.fill('input[name="contraseña"]', 'Test123!')
      await page.click('button[type="submit"]')
      await page.waitForURL(`/${slug}/dashboard`, { timeout: 10000 })
    }
    await use(loginFunction)
  },
})

export { expect } from '@playwright/test'

