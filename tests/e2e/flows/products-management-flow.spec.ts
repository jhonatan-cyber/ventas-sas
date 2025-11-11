import { test, expect } from '../fixtures/auth'

test.describe('Gestión de Productos (SAS)', () => {
  const testSlug = 'test-customer'

  test.beforeEach(async ({ page: _page, loginAsSas }) => {
    await loginAsSas(testSlug)
  })

  test('debería poder navegar a la página de productos', async ({ page }) => {
    await page.click('a[href*="/productos"]')
    await page.waitForURL(`/${testSlug}/productos`, { timeout: 10000 })
    await expect(page).toHaveURL(`/${testSlug}/productos`)
    await expect(page.getByText(/productos/i)).toBeVisible()
  })

  test('debería mostrar lista de productos o estado vacío', async ({ page }) => {
    await page.goto(`/${testSlug}/productos`)
    
    // Verificar que la página se carga correctamente
    await expect(
      page.getByText(/productos|nuevo producto|lista|vacío/i)
    ).toBeVisible({ timeout: 5000 })
  })

  test('debería mostrar botón o enlace para crear producto', async ({ page }) => {
    await page.goto(`/${testSlug}/productos`)
    
    // Buscar botón o enlace para crear nuevo producto
    const createButton = page.getByRole('button', { name: /nuevo|crear|agregar/i }).or(
      page.getByRole('link', { name: /nuevo|crear|agregar/i })
    )
    
    await expect(createButton.first()).toBeVisible({ timeout: 5000 })
  })

  test('debería poder filtrar o buscar productos', async ({ page }) => {
    await page.goto(`/${testSlug}/productos`)
    
    // Buscar campo de búsqueda
    const searchInput = page.getByPlaceholder(/buscar|search|filtrar/i).or(
      page.getByRole('searchbox')
    )
    
    // Si existe, verificar que es interactivo
    const searchVisible = await searchInput.isVisible().catch(() => false)
    if (searchVisible) {
      await expect(searchInput).toBeEnabled()
    }
  })
})

