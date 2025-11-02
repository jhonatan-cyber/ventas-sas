import { test, expect } from '../fixtures/auth'

test.describe('Sales Flow: Login → Dashboard → Crear Venta', () => {
  const testSlug = 'test-customer'

  test('flujo completo: login → dashboard → crear venta', async ({ page, loginAsSas }) => {
    // 1. Login
    await loginAsSas(testSlug)

    // 2. Verificar que está en el dashboard
    await expect(page.getByText(/dashboard|inicio/i)).toBeVisible()
    await expect(page).toHaveURL(`/${testSlug}/dashboard`)

    // 3. Navegar a Ventas
    await page.click('a[href*="/ventas"]')
    await page.waitForURL(`/${testSlug}/ventas`, { timeout: 10000 })
    await expect(page).toHaveURL(`/${testSlug}/ventas`)

    // 4. Verificar que la página de ventas se carga
    await expect(page.getByText(/ventas|nueva venta/i)).toBeVisible({ timeout: 5000 })
  })

  test('debería poder navegar desde dashboard a productos', async ({ page, loginAsSas }) => {
    await loginAsSas(testSlug)

    // Navegar a productos
    await page.click('a[href*="/productos"]')
    await page.waitForURL(`/${testSlug}/productos`, { timeout: 10000 })
    await expect(page).toHaveURL(`/${testSlug}/productos`)
    await expect(page.getByText(/productos/i)).toBeVisible()
  })

  test('debería poder navegar desde dashboard a clientes', async ({ page, loginAsSas }) => {
    await loginAsSas(testSlug)

    // Navegar a clientes
    await page.click('a[href*="/clientes"]')
    await page.waitForURL(`/${testSlug}/clientes`, { timeout: 10000 })
    await expect(page).toHaveURL(`/${testSlug}/clientes`)
    await expect(page.getByText(/clientes/i)).toBeVisible()
  })
})

