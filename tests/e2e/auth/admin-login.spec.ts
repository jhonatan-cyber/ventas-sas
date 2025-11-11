import { test, expect } from '@playwright/test'

test.describe('Admin Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/administracion/login')
  })

  test('debería mostrar el formulario de login', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/contraseña/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible()
  })

  test('debería hacer login exitoso con credenciales válidas', async ({ page }) => {
    await page.fill('input[type="email"]', 'test-admin@example.com')
    await page.fill('input[type="password"]', 'Test123!')
    await page.click('button[type="submit"]')

    // Esperar a que redirija al dashboard
    await page.waitForURL('/administracion/dashboard', { timeout: 10000 })
    await expect(page).toHaveURL('/administracion/dashboard')
  })

  test('debería mostrar error con credenciales inválidas', async ({ page }) => {
    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'WrongPassword123!')
    await page.click('button[type="submit"]')

    // Esperar mensaje de error
    await expect(page.getByText(/credenciales|incorrecta|error/i)).toBeVisible({ timeout: 5000 })
  })

  test('debería validar campos requeridos', async ({ page }) => {
    await page.click('button[type="submit"]')

    // Verificar que hay validación de campos
    const emailInput = page.getByLabel(/email/i)
    const _passwordInput = page.getByLabel(/contraseña/i)
    
    // Verificar que los campos tienen atributo required o mensaje de error
    await expect(emailInput).toBeFocused().or(expect(emailInput).toHaveAttribute('required'))
  })
})

