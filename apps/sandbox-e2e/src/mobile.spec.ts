import { expect, test } from '@playwright/test';

test('edits Unicode text through a mobile WebKit composition sequence', async ({
  page,
}) => {
  await page.goto('/');

  const editor = page.locator('.ProseMirror');

  await editor.click();
  await page.keyboard.press('Meta+A');
  await page.keyboard.press('Backspace');
  await editor.dispatchEvent('compositionstart', {
    data: '',
  });
  await page.keyboard.insertText('日本語 👨‍👩‍👧‍👦');
  await editor.dispatchEvent('compositionend', {
    data: '日本語 👨‍👩‍👧‍👦',
  });

  await expect(editor).toContainText('日本語 👨‍👩‍👧‍👦');
});

test('opens and completes the slash command menu on mobile Safari', async ({
  page,
}) => {
  await page.goto('/');

  const editor = page.locator('.ProseMirror');

  await editor.click();
  await page.keyboard.press('Meta+A');
  await page.keyboard.press('Backspace');
  await page.keyboard.insertText('/he');

  const slashMenu = page.getByRole('listbox', {
    name: 'Slash command suggestions',
  });

  await expect(slashMenu).toBeVisible();
  await page.keyboard.press('Enter');
  await page.keyboard.insertText('Mobile heading');

  await expect(editor.locator('h1')).toContainText('Mobile heading');
});
