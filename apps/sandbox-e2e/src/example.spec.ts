import { test, expect } from '@playwright/test';

test('renders the configured plugin toolbar', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'ProseMirror editor foundation' }),
  ).toBeVisible();

  const toolbar = page.getByRole('toolbar', { name: 'Editor toolbar' });
  const paragraph = toolbar.getByRole('button', { name: 'P' });
  const heading1 = toolbar.getByRole('button', { name: 'H1' });
  const heading2 = toolbar.getByRole('button', { name: 'H2' });
  const heading3 = toolbar.getByRole('button', { name: 'H3' });
  const underline = toolbar.getByRole('button', { name: 'U' });
  const bulletList = toolbar.getByRole('button', { name: 'Bullet list' });
  const orderedList = toolbar.getByRole('button', { name: 'Ordered list' });
  const liftListItem = toolbar.getByRole('button', { name: 'Lift list item' });
  const sinkListItem = toolbar.getByRole('button', { name: 'Sink list item' });
  const link = toolbar.getByRole('button', { name: 'Link' });
  const unlink = toolbar.getByRole('button', { name: 'Unlink' });
  const undo = toolbar.getByRole('button', { name: 'Undo' });
  const redo = toolbar.getByRole('button', { name: 'Redo' });

  await expect(page.locator('rte-editor > button')).toHaveCount(0);
  await expect(toolbar.getByRole('button')).toHaveCount(16);
  await expect(paragraph).toHaveAttribute('title', 'Paragraph');
  await expect(heading1).toHaveAttribute('title', 'Heading 1');
  await expect(heading2).toHaveAttribute('title', 'Heading 2');
  await expect(heading3).toHaveAttribute('title', 'Heading 3');
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
  await expect(bulletList).toHaveAttribute('title', 'Bullet list');
  await expect(bulletList).toBeDisabled();
  await expect(orderedList).toHaveAttribute('title', 'Ordered list');
  await expect(orderedList).toBeDisabled();
  await expect(liftListItem).toHaveAttribute('title', 'Lift list item');
  await expect(liftListItem).toBeDisabled();
  await expect(sinkListItem).toHaveAttribute('title', 'Sink list item');
  await expect(sinkListItem).toBeDisabled();
  await expect(link).toHaveAttribute('title', 'Link');
  await expect(link).toBeEnabled();
  await expect(unlink).toHaveAttribute('title', 'Unlink');
  await expect(unlink).toBeDisabled();
  await expect(undo).toBeDisabled();
  await expect(redo).toBeDisabled();

  await expect(page.locator('.ProseMirror')).toContainText('Angular RTE');
  await expect(page.locator('pre')).toContainText(
    '<h1><strong>Angular RTE</strong></h1>',
  );
  await expect(page.locator('pre')).toContainText(
    '<ul><li><p>Compose plugins in TypeScript.</p></li><li><p>Keep toolbar markup in the consuming app.</p></li></ul>',
  );
  await expect(page.locator('pre')).toContainText(
    '<ol><li><p>Pick capabilities for the current product surface.</p></li><li><p>Render controls with Angular templates and rteCommand.</p></li></ol>',
  );
  await expect(page.locator('pre')).toContainText('<u>underline</u>');
  await expect(page.locator('pre')).toContainText(
    '<a href="https://angular.dev" target="_blank" rel="noopener noreferrer">links</a>',
  );

  await page
    .locator('.ProseMirror')
    .getByText('Build headless editing primitives')
    .selectText();
  await heading2.click();
  await expect(heading2).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('pre')).toContainText(
    '<h2>Build headless editing primitives with a plugin stack that remains fully selected by the consumer.</h2>',
  );
  await paragraph.click();
  await expect(page.locator('pre')).toContainText(
    '<p>Build headless editing primitives with a plugin stack that remains fully selected by the consumer.</p>',
  );
  await expect(bulletList).toBeEnabled();
  await expect(orderedList).toBeEnabled();

  await bulletList.click();
  await expect(bulletList).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('pre')).toContainText(
    '<ul><li><p>Build headless editing primitives with a plugin stack that remains fully selected by the consumer.</p></li></ul>',
  );
  await page.locator('.ProseMirror').press('Tab');
  await expect(page.locator('.ProseMirror')).toBeFocused();
  await page.locator('.ProseMirror').press('Escape');
  await expect(page.locator('.ProseMirror')).not.toBeFocused();
  await page
    .locator('.ProseMirror')
    .getByText('Build headless editing primitives')
    .selectText();

  await orderedList.click();
  await expect(orderedList).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('pre')).toContainText(
    '<ol><li><p>Build headless editing primitives with a plugin stack that remains fully selected by the consumer.</p></li></ol>',
  );

  await orderedList.click();
  await expect(page.locator('pre')).toContainText(
    '<p>Build headless editing primitives with a plugin stack that remains fully selected by the consumer.</p>',
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
    '<h1><strong><a href="/docs" target="_blank" rel="noopener noreferrer">Angular RTE</a></strong></h1>',
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
    '<h1><strong><a href="/guide" target="_blank" rel="noopener noreferrer">Angular RTE</a></strong></h1>',
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
    '<h1><strong>Angular RTE</strong></h1>',
  );

  await page.locator('.ProseMirror').pressSequentially('X');
  await expect(undo).toBeEnabled();
  await expect(redo).toBeDisabled();

  await undo.click();
  await expect(redo).toBeEnabled();
});
