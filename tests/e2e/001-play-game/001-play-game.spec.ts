import { expect, test } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';

test('moderator runs a mobile game round', async ({ page }, testInfo) => {
  const tester = new TestStepHelper(page, testInfo);
  tester.setMetadata('Play a round', 'The moderator creates a category, records answers, and scores guesses.');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/table?slug=e2e-play&me=ana@example.com');
  await expect(page.locator('main[data-ready="true"]')).toBeVisible();

  await page.getByLabel('Player email').fill('ana@example.com');
  await page.getByRole('button', { name: 'Join' }).click();
  await page.getByLabel('Player email').fill('bev@example.com');
  await page.getByRole('button', { name: 'Join' }).click();
  await page.getByLabel('Player email').fill('cam@example.com');
  await page.getByRole('button', { name: 'Join' }).click();

  await tester.step('players-joined', {
    description: 'Players joined the table',
    verifications: [
      { spec: 'Ana is listed', check: async () => await expect(page.getByText('Ana').first()).toBeVisible() },
      { spec: 'Bev is listed', check: async () => await expect(page.getByText('Bev').first()).toBeVisible() },
      { spec: 'Cam is listed', check: async () => await expect(page.getByText('Cam').first()).toBeVisible() },
      { spec: 'Draw category button visible', check: async () => await expect(page.getByRole('button', { name: 'Draw Category Card' })).toBeVisible() }
    ]
  });

  await page.getByLabel('Category').fill('you should never say at dinner');
  await page.getByRole('button', { name: 'Reveal Category' }).click();

  for (const [player, answer] of [
    ['ana@example.com', 'I already ate'],
    ['bev@example.com', 'This tastes expensive'],
    ['cam@example.com', 'I brought spreadsheets']
  ]) {
    await page.getByLabel('Player email').fill(player);
    await page.getByLabel('Answer for selected player').fill(answer);
    await page.getByRole('button', { name: 'Record' }).click();
  }

  await tester.step('answers-ready', {
    description: 'All answers are recorded',
    verifications: [
      { spec: 'Show Answers on Cast is available', check: async () => await expect(page.getByRole('button', { name: 'Show Answers on Cast' })).toBeVisible() },
      { spec: 'Submitted roster counts all players', check: async () => await expect(page.getByText('Submitted (3)')).toBeVisible() },
      { spec: 'Answer actions are replayed', check: async () => await expect(page.locator('code').filter({ hasText: 'answer_category' })).toHaveCount(3) }
    ]
  });

  await page.getByRole('button', { name: 'Show Answers on Cast' }).click();
  await page.getByRole('button', { name: 'Ana guessed Bev' }).click();

  await tester.step('score-guess', {
    description: 'Moderator scores a correct guess',
    verifications: [
      { spec: 'Current player is visible', check: async () => await expect(page.getByText('Current player: Ana')).toBeVisible() },
      { spec: 'Eliminated player is marked out', check: async () => await expect(page.locator('section[aria-label="Scoreboard"] article').filter({ hasText: 'Bev' })).toHaveClass(/out/) },
      { spec: 'Elimination action recorded', check: async () => await expect(page.locator('code').filter({ hasText: 'eliminates' })).toHaveCount(1) }
    ]
  });

  tester.generateDocs();
});
