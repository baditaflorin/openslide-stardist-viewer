import { expect, test } from "@playwright/test";

test("loads the published viewer and counts nuclei", async ({ page }) => {
  await page.goto(
    process.env.SMOKE_APP_URL ??
      "http://127.0.0.1:4173/openslide-stardist-viewer/",
  );

  await expect(
    page.getByRole("heading", { name: "OpenSlide StarDist Viewer" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Star/i })).toHaveAttribute(
    "href",
    "https://github.com/baditaflorin/openslide-stardist-viewer",
  );
  await expect(page.getByRole("link", { name: /PayPal/i })).toHaveAttribute(
    "href",
    "https://www.paypal.com/paypalme/florinbadita",
  );

  await expect(page.getByText("Ready")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: /demo/i })).toBeVisible();
  await page.getByRole("button", { name: /Segment Viewport/i }).click();
  await expect(page.getByText(/nuclei counted/i)).toBeVisible({
    timeout: 20_000,
  });
  await expect(
    page.getByRole("button", { name: /Export JSON/i }),
  ).toBeEnabled();
  await expect(page.getByRole("button", { name: /Export CSV/i })).toBeEnabled();
  await expect(
    page.getByRole("button", { name: /Copy Summary/i }),
  ).toBeEnabled();
});
