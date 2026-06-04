import { test, expect, applyBackendMocks } from "../mocks/backends";
import {
  journeyOverrides,
  workspacePopulatedOverrides,
} from "../fixtures/overrides";

test.describe("jobs page", () => {
  test.beforeEach(async ({ page }) => {
    await applyBackendMocks(page, {
      overrides: [
        // Workspace.get (favorites) fired when /jobs page loads the workspace sidebar chrome.
        ...workspacePopulatedOverrides,
        ...journeyOverrides,
      ],
    });
  });

  test("renders the Jobs heading for signed-in user", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page).not.toHaveURL(/sign-in/);
    await expect(page.getByRole("heading", { level: 1, name: /^jobs$/i })).toBeVisible();
  });

  test("shows job status pill in navbar for signed-in user with jobs", async ({ page }) => {
    await page.goto("/jobs");
    // journeyOverrides includes jobsOverrides which mocks the summary endpoint with
    // 1 completed + 1 running job, so displayableCount > 0 and the pill should render.
    const pill = page.getByRole("button", { name: /view job status/i });
    await expect(pill).toBeVisible();
  });

  test("job status pill opens popover with job list on click", async ({ page }) => {
    await page.goto("/jobs");
    const pill = page.getByRole("button", { name: /view job status/i });
    await expect(pill).toBeVisible();
    await pill.click();
    await expect(page.getByText("My Jobs")).toBeVisible();
    await expect(page.getByText("View all →")).toBeVisible();
  });
});
