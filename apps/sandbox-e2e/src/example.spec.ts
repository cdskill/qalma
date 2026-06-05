import { test, expect } from '@playwright/test';

test('renders the configured plugin toolbar', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'ProseMirror editor foundation' }),
  ).toBeVisible();

  const toolbar = page.getByRole('toolbar', { name: 'Editor toolbar' });
  const underline = toolbar.getByRole('button', { name: 'U' });
  const link = toolbar.getByRole('button', { name: 'Link' });
  const unlink = toolbar.getByRole('button', { name: 'Unlink' });
  const undo = toolbar.getByRole('button', { name: 'Undo' });
  const redo = toolbar.getByRole('button', { name: 'Redo' });

  await expect(page.locator('rte-editor > button')).toHaveCount(0);
  await expect(toolbar.getByRole('button')).toHaveCount(8);
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
  await expect(link).toHaveAttribute('title', 'Link');
  await expect(link).toBeEnabled();
  await expect(unlink).toHaveAttribute('title', 'Unlink');
  await expect(unlink).toBeDisabled();
  await expect(undo).toBeDisabled();
  await expect(redo).toBeDisabled();

  await expect(toolbar.getByRole('button', { name: 'H1' })).toHaveCount(0);
  await expect(toolbar.getByRole('button', { name: 'UL' })).toHaveCount(0);
  await expect(page.locator('.ProseMirror')).toContainText('Angular RTE');
  await expect(page.locator('pre')).toContainText('<u>underline</u>');
  await expect(page.locator('pre')).toContainText(
    '<a href="https://angular.dev" target="_blank" rel="noopener noreferrer">links</a>',
  );

  await underline.click();
  await expect(underline).toHaveAttribute('aria-pressed', 'true');

  await page.locator('.ProseMirror a[href="https://angular.dev"]').hover();
  await expect(page.getByRole('dialog', { name: 'Link preview' })).toBeVisible();
  await expect(
    page.getByRole('dialog', { name: 'Link preview' }).getByRole('link'),
  ).toContainText('https://angular.dev');

  await page.locator('.ProseMirror').getByText('Angular RTE').selectText();
  await link.click();
  await page
    .getByRole('dialog', { name: 'Link preview' })
    .getByRole('textbox', { name: 'Edit link URL' })
    .fill('/docs');
  await page
    .getByRole('dialog', { name: 'Link preview' })
    .getByRole('button', { name: 'Save' })
    .click();
  await expect(page.locator('pre')).toContainText(
    '<strong><a href="/docs" target="_blank" rel="noopener noreferrer">Angular RTE</a></strong>',
  );
  await expect(unlink).toBeEnabled();

  await page.locator('.ProseMirror a[href="/docs"]').hover();
  await page
    .getByRole('dialog', { name: 'Link preview' })
    .getByRole('button', { name: 'Edit' })
    .click();
  await page
    .getByRole('dialog', { name: 'Link preview' })
    .getByRole('textbox', { name: 'Edit link URL' })
    .fill('/guide');
  await page
    .getByRole('dialog', { name: 'Link preview' })
    .getByRole('button', { name: 'Save' })
    .click();
  await expect(page.locator('pre')).toContainText(
    '<strong><a href="/guide" target="_blank" rel="noopener noreferrer">Angular RTE</a></strong>',
  );

  const popupPromise = page.waitForEvent('popup');
  await page.locator('.ProseMirror a[href="/guide"]').click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL('/guide');
  await popup.close();

  await page.locator('.ProseMirror a[href="/guide"]').hover();
  await page
    .getByRole('dialog', { name: 'Link preview' })
    .getByRole('button', { name: 'Unlink' })
    .click();
  await expect(page.locator('pre')).toContainText(
    '<strong>Angular RTE</strong>',
  );

  await page.locator('.ProseMirror').pressSequentially('X');
  await expect(undo).toBeEnabled();
  await expect(redo).toBeDisabled();

  await undo.click();
  await expect(redo).toBeEnabled();
});
