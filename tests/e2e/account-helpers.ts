import { expect, type APIRequestContext, type Page } from '@playwright/test'
const mailpit = process.env.MAILPIT_URL || 'http://localhost:8025'
export const password = 'Test-Password-123!'
export async function emailLink(request: APIRequestContext, recipient: string, subject: string) {
  let id: string | undefined
  await expect.poll(async () => {
    const response = await request.get(`${mailpit}/api/v1/search?query=${encodeURIComponent(`to:${recipient}`)}`)
    if (!response.ok()) return false
    const data = await response.json() as { messages: { ID: string; Subject: string }[] }
    id = data.messages.find(message => message.Subject === subject)?.ID
    return Boolean(id)
  }, { timeout: 15000 }).toBe(true)
  const response = await request.get(`${mailpit}/api/v1/message/${id}`)
  expect(response.ok()).toBe(true)
  const message = await response.json() as { Text: string }
  const link = message.Text.split('\n').find(line => line.trim().startsWith('http'))?.trim()
  if (!link) throw new Error('Email did not contain an account link')
  return link
}
export async function followLink(page: Page, link: string) {
  const base = process.env.BASE_URL || 'http://localhost:5173'
  await page.goto(`${base}/${new URL(link).hash}`)
  await expect.poll(() => page.evaluate(() => !window.location.hash.includes('token='))).toBe(true)
}
export async function registerVerified(page: Page, email: string) {
  await page.getByRole('button', { name: 'New here? Create an account' }).click()
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Account created')
  const link = await emailLink(page.request, email, 'Verify your IGDash email')
  await followLink(page, link)
  await page.getByRole('button', { name: 'Confirm email', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Email verified')
  await page.getByRole('button', { name: 'Continue to sign in', exact: true }).click()
  await signIn(page, email)
}
export async function signIn(page: Page, email: string, secret = password) {
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(secret)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Log history', exact: true })).toBeVisible()
}
