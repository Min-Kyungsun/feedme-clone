import { expect, test } from "@playwright/test";

test("홈 화면이 열리고 URL 입력란과 빈 상태 안내가 보인다", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("URL → Markdown");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "URL → Markdown"
  );
  await expect(page.getByLabel("웹 페이지 URL")).toBeVisible();
  await expect(page.getByText("아직 변환한 페이지가 없습니다")).toBeVisible();
});
