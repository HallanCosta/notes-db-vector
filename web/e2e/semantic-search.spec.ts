import { execFileSync } from "node:child_process"
import { resolve } from "node:path"
import { test, expect } from "@playwright/test"

const repoRoot = resolve(process.cwd(), "..")
const seedScript = resolve(repoRoot, "scripts", "seed_notes.py")
const seedArgs = ["--backend", "fastapi", "--reset"]
const cleanupArgs = ["--backend", "fastapi", "--cleanup"]

test.describe("busca semântica com fixture em português", () => {
  test.beforeAll(() => {
    execFileSync("python3", [seedScript, ...seedArgs], {
      cwd: repoRoot,
      env: process.env,
      stdio: "inherit",
    })
  })

  test.afterAll(() => {
    execFileSync("python3", [seedScript, ...cleanupArgs], {
      cwd: repoRoot,
      env: process.env,
      stdio: "inherit",
    })
  })

  test("prioriza Pix para uma pergunta sobre transferência instantânea", async ({ page }) => {
    await page.goto("/")
    const search = page.getByRole("textbox", { name: "Search your notes" })

    await search.fill("como enviar dinheiro em segundos a qualquer hora pelo sistema instantâneo")

    const cards = page.locator("h3")
    await expect(cards.first()).toContainText("Pix e liquidação instantânea", { timeout: 180_000 })
    await expect(cards.filter({ hasText: "Carbonara romana" })).toHaveCount(0)
  })

  test("prioriza boleto para uma cobrança com código de barras", async ({ page }) => {
    await page.goto("/")
    const search = page.getByRole("textbox", { name: "Search your notes" })

    await search.fill("como pagar uma cobrança usando linha digitável e código de barras")

    const cards = page.locator("h3")
    await expect(cards.first()).toContainText("Código de barras e linha digitável", { timeout: 180_000 })
    await expect(cards.filter({ hasText: "Matrix e realidade simulada" })).toHaveCount(0)
  })

  test("prioriza carbonara para uma massa romana sem creme", async ({ page }) => {
    await page.goto("/")
    const search = page.getByRole("textbox", { name: "Search your notes" })

    await search.fill("massa romana com ovo queijo curado e bochecha de porco sem creme")

    const cards = page.locator("h3")
    await expect(cards.first()).toContainText("Carbonara romana", { timeout: 180_000 })
    await expect(cards.filter({ hasText: "Pix e liquidação instantânea" })).toHaveCount(0)
  })
})
