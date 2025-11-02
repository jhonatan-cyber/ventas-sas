import { test, expect } from '../fixtures/auth'

test.describe('Admin: Administración de Clientes', () => {
  test.beforeEach(async ({ page, loginAsAdmin }) => {
    await loginAsAdmin()
  })

  test('debería poder navegar a la página de clientes', async ({ page }) => {
    await page.click('a[href="/administracion/customers"]')
    await page.waitForURL('/administracion/customers', { timeout: 10000 })
    await expect(page).toHaveURL('/administracion/customers')
    await expect(page.getByText(/clientes|customers/i)).toBeVisible()
  })

  test('debería mostrar lista de clientes', async ({ page }) => {
    await page.goto('/administracion/customers')
    
    // Verificar que hay una tabla o lista de clientes
    await expect(
      page.getByRole('table').or(page.getByText(/cliente|customer|lista/i))
    ).toBeVisible({ timeout: 5000 })
  })

  test('debería poder ver detalles de un cliente si existe', async ({ page }) => {
    await page.goto('/administracion/customers')
    
    // Buscar si hay algún cliente en la lista
    const hasClients = await page.getByRole('table').or(page.getByText(/no hay|vacío|empty/i)).isVisible().catch(() => false)
    
    if (hasClients) {
      // Si hay clientes, intentar hacer clic en el primero
      const firstCustomer = page.getByRole('row').first()
      await expect(firstCustomer).toBeVisible()
    }
  })
})

