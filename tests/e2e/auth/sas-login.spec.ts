import { test, expect } from '@playwright/test'

test.describe('SAS Login Flow', () => {
  const testSlug = 'test-customer'

  test.beforeEach(async ({ page }) => {
    await page.goto(`/${testSlug}/login`)
  })

  test('debería mostrar el formulario de login SAS', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible()
    await expect(page.getByLabel(/ci|cedula/i)).toBeVisible()
    await expect(page.getByLabel(/contraseña/i)).toBeVisible()
  })

  test('debería hacer login exitoso con CI y contraseña', async ({ page }) => {
    await page.fill('input[name="ci"]', '87654321')
    await page.fill('input[name="contraseña"]', 'Test123!')
    await page.click('button[type="submit"]')

    // Esperar a que redirija al dashboard
    await page.waitForURL(`/${testSlug}/dashboard`, { timeout: 10000 })
    await expect(page).toHaveURL(`/${testSlug}/dashboard`)
  })

  test('debería mostrar error con credenciales inválidas', async ({ page }) => {
    await page.fill('input[name="ci"]', '99999999')
    await page.fill('input[name="contraseña"]', 'WrongPassword123!')
    await page.click('button[type="submit"]')

    // Esperar mensaje de error
    await expect(page.getByText(/credenciales|incorrecta|error/i)).toBeVisible({ timeout: 5000 })
  })
})

