import { test, expect, signInAs, SEED } from './fixtures'

test('signed-out visitors are sent to sign in', async ({ page }) => {
  await page.goto('/en/profile')
  await expect(page).toHaveURL(/\/en\/auth\/signin$/)
  await expect(page.getByRole('heading', { name: 'Hi 😊' })).toBeVisible()
})

test('the browser language picks the locale', async ({ browser }) => {
  const page = await browser.newPage({ locale: 'ru-RU' })
  await page.goto('/')
  await expect(page).toHaveURL(/\/ru\/auth\/signin$/)
})

test('the language switcher changes locale', async ({ page }) => {
  await page.goto('/en/auth/signin')
  await page.getByRole('combobox', { name: 'Language' }).click()
  await page.getByRole('option', { name: /Русский/ }).click()
  await expect(page).toHaveURL(/\/ru\/auth\/signin$/)
})

test('wrong password shows the server error', async ({ page }) => {
  let body: unknown
  await page.route('**/api/auth/signin-password', route => {
    body = route.request().postDataJSON()
    return route.fulfill({ status: 401, json: { error: 'Invalid email or password' } })
  })
  await page.goto('/en/auth/signin')
  await page.getByLabel('Email').fill('someone@example.com')
  await page.getByPlaceholder('Enter your password').fill('wrong-password')
  await page.getByRole('button', { name: 'Login' }).click()
  await expect(page.getByText('Invalid email or password')).toBeVisible()
  expect(body).toEqual({ email: 'someone@example.com', password: 'wrong-password' })
})

test('requesting a magic link leads to the check-your-email page', async ({ page }) => {
  let body: unknown
  await page.route('**/api/auth/signin', route => {
    body = route.request().postDataJSON()
    return route.fulfill({ json: { ok: true } })
  })
  await page.goto('/en/auth/signin')
  await page.getByRole('tab', { name: 'Magic Link' }).click()
  await page.getByRole('tabpanel').getByLabel('Email').fill('someone@example.com')
  await page.getByRole('button', { name: 'Send Magic Link' }).click()
  await expect(page).toHaveURL(/\/en\/auth\/verify-request\?email=someone%40example\.com$/)
  await expect(page.getByText('Check your email')).toBeVisible()
  expect(body).toEqual({ email: 'someone@example.com' })
})

test('an expired magic link explains what happened', async ({ page }) => {
  await page.goto('/en/auth/signin?error=expired-link')
  await expect(page.getByText('This magic link has expired or has already been used.')).toBeVisible()
})

test('a stale session cookie lands on sign-in instead of looping', async ({ page }) => {
  // e.g. the session expired or the local database was reset
  await page.context().addCookies([{ name: 'session-token', value: 'stale', url: 'http://localhost:3100' }])
  await page.goto('/en')
  await expect(page).toHaveURL(/\/en\/auth\/signin$/)
  await expect(page.getByLabel('Email')).toBeVisible()
})

test('a signed-in user who opens sign-in goes to their lists', async ({ page }) => {
  await signInAs(page, SEED.alex.email)
  await page.goto('/en/auth/signin')
  await expect(page).toHaveURL(/\/en$/)
})
