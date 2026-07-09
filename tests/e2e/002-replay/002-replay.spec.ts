import { expect, test } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';

test('old game action logs can be replayed', async ({ page }, testInfo) => {
  const tester = new TestStepHelper(page, testInfo);
  tester.setMetadata('Replay an old game', 'A historical action log reconstructs players, answers, and scores.');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/replay');

  await tester.step('sample-replay', {
    description: 'Sample action log is replayed',
    verifications: [
      { spec: 'Category appears', check: async () => await expect(page.getByText('Things ... you should never say during a job interview')).toBeVisible() },
      { spec: 'All actions replayed', check: async () => await expect(page.getByText('10 actions replayed')).toBeVisible() },
      { spec: 'Final score appears', check: async () => await expect(page.getByText('Cam').locator('..').getByText('2')).toBeVisible() }
    ]
  });

  tester.generateDocs();
});
