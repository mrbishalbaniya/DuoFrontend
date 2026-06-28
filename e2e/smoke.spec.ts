import { test, expect } from "@playwright/test";

test.describe("Public pages", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Duo/i);
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("Your password")).toBeVisible();
  });

  test("register page loads", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("body")).toContainText(/register|create|account/i);
  });
});

test.describe("Protected routes", () => {
  test("unauthenticated user is redirected from match", async ({ page }) => {
    await page.goto("/match");
    await expect(page).toHaveURL(/\/login/);
  });
});
