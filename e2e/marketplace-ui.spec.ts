import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  ;(page as typeof page & { runtimeErrors: string[] }).runtimeErrors = errors
})

test.afterEach(async ({ page }) => {
  expect((page as typeof page & { runtimeErrors: string[] }).runtimeErrors).toEqual([])
})

test('public pages render without overflow or retired navigation', async ({ page }) => {
  for (const path of ['/', '/marketplace', '/login', '/signup', '/contact', '/safety', '/privacy', '/terms']) {
    const response = await page.goto(path)
    expect(response?.status(), path).toBe(200)
    await expect(page.locator('.studio-content')).toBeVisible()
    await expect(page.locator('a[href="/about"], a[href^="/communities"], a[href^="/events"]')).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), path).toBe(true)
  }
})

test('retired feature URLs redirect to the marketplace', async ({ request }) => {
  for (const path of ['/about', '/communities', '/communities/create', '/communities/old-group/posts/old-post', '/events', '/events/create']) {
    const response = await request.get(path, { maxRedirects: 0 })
    expect(response.status(), path).toBe(303)
    expect(new URL(response.headers().location).pathname).toBe('/marketplace')
  }
})

test('private pages still require sign-in', async ({ request }) => {
  for (const path of ['/create', '/cart', '/orders', '/messages', '/admin', '/edit/00000000-0000-0000-0000-000000000000']) {
    const response = await request.get(path, { maxRedirects: 0 })
    expect(response.status(), path).toBe(307)
    expect(new URL(response.headers().location).pathname).toBe('/login')
  }
})

test('listings and action buttons have stable varied colors', async ({ page }) => {
  await page.goto('/marketplace')
  const cards = page.locator('.product-card')
  await expect(cards.first()).toBeVisible()
  const readColors = () => cards.evaluateAll(elements => elements.map(element => ({
    href: element.querySelector('a')?.getAttribute('href'),
    color: getComputedStyle(element).backgroundColor,
    action: getComputedStyle(element.querySelector('button.bg-ume-indigo')!).backgroundColor,
  })))
  const before = await readColors()
  expect(new Set(before.map(card => card.color)).size).toBeGreaterThan(2)
  expect(new Set(before.map(card => card.action)).size).toBeGreaterThan(2)
  await page.reload()
  await expect(cards.first()).toBeVisible()
  expect(await readColors()).toEqual(before)
})

test('category selection and clearing update the results', async ({ page }) => {
  await page.goto('/marketplace')
  const books = page.getByRole('button', { name: 'Filter by Books', exact: true })
  await books.click()
  await expect(page).toHaveURL(/category=books/)
  await expect(books).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('SHOP BOOKS')
  await page.getByRole('button', { name: 'View all categories' }).click()
  await expect(page).not.toHaveURL(/category=/)
  await expect(page.getByRole('button', { name: 'View all categories' })).toHaveAttribute('aria-pressed', 'true')
})

test('filters apply and can be cleared', async ({ page, isMobile }) => {
  await page.goto('/marketplace')
  if (isMobile) {
    await page.getByRole('button', { name: 'Open filters', exact: true }).click()
    const drawer = page.locator('.arcade-filter-drawer')
    await expect(drawer).toBeVisible()
    await drawer.locator('select').nth(0).selectOption('price-asc')
    await drawer.locator('select').nth(1).selectOption('Used')
    await page.getByRole('button', { name: 'Apply Filters', exact: true }).click()
    await expect(page).toHaveURL(/condition=Used/)
    await expect(page).toHaveURL(/sort=price-asc/)
    await page.getByRole('button', { name: 'Open filters', exact: true }).click()
    await page.getByRole('button', { name: 'Clear All', exact: true }).click()
    await expect(page).not.toHaveURL(/condition=|sort=/)
  } else {
    await page.getByRole('button', { name: 'Relevance', exact: true }).click()
    await page.getByRole('button', { name: 'Price: Low to High', exact: true }).click()
    await expect(page).toHaveURL(/sort=price-asc/)
    await page.getByRole('button', { name: 'Condition', exact: true }).click()
    await page.getByRole('button', { name: 'Used', exact: true }).click()
    await expect(page).toHaveURL(/condition=Used/)
    await page.getByRole('button', { name: 'Clear all', exact: true }).click()
    await expect(page).not.toHaveURL(/condition=|sort=/)
  }
})

test('long searches and empty results remain readable', async ({ page }) => {
  await page.goto('/marketplace?q=zzzz-no-match-' + 'long'.repeat(15))
  await expect(page.getByText('No listings match your filters')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
})

test('load more completes a server action without fetch errors', async ({ page }) => {
  await page.goto('/marketplace')
  const cards = page.locator('.product-card')
  await expect(cards.first()).toBeVisible()
  const initialCount = await cards.count()
  const more = page.getByRole('button', { name: 'Show More', exact: true })
  await expect(more).toBeVisible()
  await more.click()
  await expect.poll(() => cards.count()).toBeGreaterThan(initialCount)
  await expect(page.getByText('Failed to fetch', { exact: true })).toHaveCount(0)
})

test('FAQ controls work with keyboard navigation', async ({ page }) => {
  await page.goto('/')
  const question = page.getByRole('button', { name: 'What is UME and who can use it?', exact: true })
  await question.focus()
  await question.press('Enter')
  await expect(question).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('[id="' + await question.getAttribute('aria-controls') + '"]')).toBeVisible()
  await question.press('Enter')
  await expect(question).toHaveAttribute('aria-expanded', 'false')
})

test('reduced motion keeps listings and hero content visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/marketplace')
  await expect(page.locator('.product-card').first()).toHaveCSS('opacity', '1')
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(await page.locator('.object-card').evaluateAll(elements => elements.every(element => parseFloat(getComputedStyle(element).animationDuration) <= 0.001))).toBe(true)
})

test('navigation exposes marketplace actions on each screen size', async ({ page, isMobile }) => {
  await page.goto('/marketplace')
  if (isMobile) {
    await page.getByRole('button', { name: 'Open menu', exact: true }).click()
    const menu = page.getByRole('dialog')
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('link', { name: 'Marketplace', exact: true })).toBeVisible()
    await expect(menu.locator('a[href="/about"],a[href^="/communities"]')).toHaveCount(0)
    await page.keyboard.press('Escape')
    await expect(menu).not.toBeVisible()
  } else {
    await expect(page.locator('header').getByRole('link', { name: 'Marketplace', exact: true })).toBeVisible()
  }
})
