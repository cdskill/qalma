import { test, expect } from '@playwright/test';

test('renders the configured plugin toolbar', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'ProseMirror editor foundation' }),
  ).toBeVisible();

  const toolbar = page.getByRole('toolbar', { name: 'Editor toolbar' });
  const underline = toolbar.getByRole('button', { name: 'U' });
  const undo = toolbar.getByRole('button', { name: 'Undo' });
  const redo = toolbar.getByRole('button', { name: 'Redo' });

  await expect(page.locator('rte-editor > button')).toHaveCount(0);
  await expect(toolbar.getByRole('button')).toHaveCount(6);
  await expect(toolbar.getByRole('button', { name: 'B' })).toHaveAttribute(
    'title',
    'Bold',
  );
  await expect(toolbar.getByRole('button', { name: 'I' })).toHaveAttribute(
    'title',
    'Italic',
  );
  await expect(underline).toHaveAttribute('title', 'Underline');
  await expect(underline).toBeEnabled();
  await expect(toolbar.getByRole('button', { name: 'S' })).toHaveAttribute(
    'title',
    'Strikethrough',
  );
  await expect(undo).toBeDisabled();
  await expect(redo).toBeDisabled();

  await expect(toolbar.getByRole('button', { name: 'H1' })).toHaveCount(0);
  await expect(toolbar.getByRole('button', { name: 'UL' })).toHaveCount(0);
  await expect(page.locator('.ProseMirror')).toContainText('Angular RTE');
  await expect(page.locator('pre')).toContainText('<u>underline</u>');

  await underline.click();
  await expect(underline).toHaveAttribute('aria-pressed', 'true');

  await page.locator('.ProseMirror').pressSequentially('X');
  await expect(undo).toBeEnabled();
  await expect(redo).toBeDisabled();

  await undo.click();
  await expect(redo).toBeEnabled();
});
