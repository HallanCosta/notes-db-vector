import { test, expect } from "@playwright/test"

const connectionErrorMessage =
  "Não consegui me conectar com o assistente. Verifique a conexão e tente novamente."

test.describe("Chat AI", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/chat/messages**", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "[]",
        })
        return
      }

      await route.continue()
    })
  })

  test("exibe a resposta devolvida pela API", async ({ page }) => {
    await page.route("**/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user_message: { role: "user", content: "Como estão minhas notas?" },
          assistant_message: { role: "assistant", content: "Encontrei uma resposta nas suas notas." },
        }),
      })
    })

    await page.goto("/")
    await page.getByRole("button", { name: "Chat AI" }).click()

    const input = page.getByPlaceholder("Ask about your notes...")
    await input.fill("Como estão minhas notas?")
    await page.getByRole("button", { name: "Enviar mensagem" }).click()

    await expect(page.getByText("Como estão minhas notas?")).toBeVisible()
    await expect(page.getByText("Encontrei uma resposta nas suas notas.")).toBeVisible()
    await expect(input).toBeEnabled()
  })

  test("informa quando não consegue se conectar ao assistente", async ({ page }) => {
    await page.route("**/chat", async (route) => {
      await route.abort("failed")
    })

    await page.goto("/")
    await page.getByRole("button", { name: "Chat AI" }).click()

    const input = page.getByPlaceholder("Ask about your notes...")
    await input.fill("Tente responder sem conexão")
    await page.getByRole("button", { name: "Enviar mensagem" }).click()

    await expect(page.getByText(connectionErrorMessage)).toBeVisible()
    await expect(page.getByText("Tente responder sem conexão")).toBeVisible()
    await expect(input).toBeEnabled()
  })
})
