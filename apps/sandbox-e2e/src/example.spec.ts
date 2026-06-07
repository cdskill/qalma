import { test, expect } from '@playwright/test';

test('autolinks plain text URLs on paste', async ({ page }) => {
  await page.goto('/');

  const editor = page.locator('.ProseMirror');

  await editor.click();
  await page.keyboard.press(
    process.platform === 'darwin' ? 'Meta+A' : 'Control+A',
  );
  await page.keyboard.press('Backspace');
  await editor.evaluate((element) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', 'Read https://angular.dev/docs.');
    element.dispatchEvent(
      new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData,
      }),
    );
  });

  await expect(page.locator('pre')).toContainText(
    '<p>Read <a href="https://angular.dev/docs" target="_blank" rel="noopener noreferrer">https://angular.dev/docs</a>.</p>',
  );
});

test('cleans pasted HTML links', async ({ page }) => {
  await page.goto('/');

  const editor = page.locator('.ProseMirror');

  await editor.click();
  await page.keyboard.press(
    process.platform === 'darwin' ? 'Meta+A' : 'Control+A',
  );
  await page.keyboard.press('Backspace');
  await editor.evaluate((element) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData(
      'text/html',
      '<span class="text-red-500" style="color: red;">Server-Side Rendering</span>',
    );
    clipboardData.setData('text/plain', 'Server-Side Rendering');
    clipboardData.setData(
      'text/uri-list',
      'https://analogjs.org/docs/features/server-side-rendering',
    );
    element.dispatchEvent(
      new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData,
      }),
    );
  });

  await expect(page.locator('pre')).toContainText(
    '<p><a href="https://analogjs.org/docs/features/server-side-rendering" target="_blank" rel="noopener noreferrer">Server-Side Rendering</a></p>',
  );
});

test('renders the configured plugin toolbar', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'ProseMirror editor foundation' }),
  ).toBeVisible();

  const toolbar = page.getByRole('toolbar', { name: 'Editor toolbar' });
  const paragraph = toolbar.getByRole('button', { name: 'Paragraph' });
  const heading1 = toolbar.getByRole('button', { name: 'Heading 1' });
  const heading2 = toolbar.getByRole('button', { name: 'Heading 2' });
  const heading3 = toolbar.getByRole('button', { name: 'Heading 3' });
  const alignLeft = toolbar.getByRole('button', { name: 'Align left' });
  const alignCenter = toolbar.getByRole('button', { name: 'Align center' });
  const alignRight = toolbar.getByRole('button', { name: 'Align right' });
  const justify = toolbar.getByRole('button', { name: 'Justify' });
  const underline = toolbar.getByRole('button', { name: 'Underline' });
  const subscript = toolbar.getByRole('button', { name: 'Subscript' });
  const superscript = toolbar.getByRole('button', { name: 'Superscript' });
  const highlight = toolbar.getByRole('button', { name: 'Highlight' });
  const mintHighlight = toolbar.getByRole('button', {
    name: 'Mint highlight',
  });
  const clearHighlight = toolbar.getByRole('button', {
    name: 'Clear highlight',
  });
  const roseTextColor = toolbar.getByRole('button', {
    name: 'Rose text color',
  });
  const skyBackgroundColor = toolbar.getByRole('button', {
    name: 'Sky background color',
  });
  const clearTextColor = toolbar.getByRole('button', {
    name: 'Clear text color',
  });
  const clearBackgroundColor = toolbar.getByRole('button', {
    name: 'Clear background color',
  });
  const clearFormatting = toolbar.getByRole('button', {
    name: 'Clear formatting',
  });
  const bulletList = toolbar.getByRole('button', { name: 'Bullet list' });
  const orderedList = toolbar.getByRole('button', { name: 'Ordered list' });
  const blockquote = toolbar.getByRole('button', { name: 'Blockquote' });
  const codeBlock = toolbar.getByRole('button', { name: 'Code block' });
  const liftListItem = toolbar.getByRole('button', { name: 'Lift list item' });
  const sinkListItem = toolbar.getByRole('button', { name: 'Sink list item' });
  const link = toolbar.getByRole('button', { name: 'Link' });
  const unlink = toolbar.getByRole('button', { name: 'Unlink' });
  const undo = toolbar.getByRole('button', { name: 'Undo' });
  const redo = toolbar.getByRole('button', { name: 'Redo' });

  await expect(page.locator('rte-editor > button')).toHaveCount(0);
  await expect(toolbar.getByRole('button')).toHaveCount(41);
  await expect(paragraph).toHaveAttribute('title', 'Paragraph');
  await expect(heading1).toHaveAttribute('title', 'Heading 1');
  await expect(heading2).toHaveAttribute('title', 'Heading 2');
  await expect(heading3).toHaveAttribute('title', 'Heading 3');
  await expect(alignLeft).toHaveAttribute('title', 'Align left');
  await expect(alignLeft).toBeEnabled();
  await expect(alignCenter).toHaveAttribute('title', 'Align center');
  await expect(alignCenter).toBeEnabled();
  await expect(alignRight).toHaveAttribute('title', 'Align right');
  await expect(alignRight).toBeEnabled();
  await expect(justify).toHaveAttribute('title', 'Justify');
  await expect(justify).toBeEnabled();
  await expect(toolbar.getByRole('button', { name: 'Bold' })).toHaveAttribute(
    'title',
    'Bold',
  );
  await expect(toolbar.getByRole('button', { name: 'Italic' })).toHaveAttribute(
    'title',
    'Italic',
  );
  await expect(underline).toHaveAttribute('title', 'Underline');
  await expect(underline).toBeEnabled();
  await expect(
    toolbar.getByRole('button', { name: 'Strikethrough' }),
  ).toHaveAttribute('title', 'Strikethrough');
  await expect(subscript).toHaveAttribute('title', 'Subscript');
  await expect(subscript).toBeEnabled();
  await expect(superscript).toHaveAttribute('title', 'Superscript');
  await expect(superscript).toBeEnabled();
  await expect(highlight).toHaveAttribute('title', 'Highlight');
  await expect(highlight).toBeEnabled();
  await expect(mintHighlight).toHaveAttribute('title', 'Mint highlight');
  await expect(mintHighlight).toBeEnabled();
  await expect(clearHighlight).toHaveAttribute('title', 'Clear highlight');
  await expect(clearHighlight).toBeDisabled();
  await expect(roseTextColor).toHaveAttribute('title', 'Rose text color');
  await expect(roseTextColor).toBeEnabled();
  await expect(skyBackgroundColor).toHaveAttribute(
    'title',
    'Sky background color',
  );
  await expect(skyBackgroundColor).toBeEnabled();
  await expect(clearTextColor).toHaveAttribute('title', 'Clear text color');
  await expect(clearTextColor).toBeDisabled();
  await expect(clearBackgroundColor).toHaveAttribute(
    'title',
    'Clear background color',
  );
  await expect(clearBackgroundColor).toBeDisabled();
  await expect(clearFormatting).toHaveAttribute('title', 'Clear formatting');
  await expect(clearFormatting).toBeEnabled();
  await expect(bulletList).toHaveAttribute('title', 'Bullet list');
  await expect(bulletList).toBeDisabled();
  await expect(orderedList).toHaveAttribute('title', 'Ordered list');
  await expect(orderedList).toBeDisabled();
  await expect(blockquote).toHaveAttribute('title', 'Blockquote');
  await expect(blockquote).toBeEnabled();
  await expect(codeBlock).toHaveAttribute('title', 'Code block');
  await expect(codeBlock).toBeEnabled();
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
    '<p style="text-align: center;">Build headless editing primitives with a plugin stack that remains fully selected by the consumer.</p>',
  );
  await expect(page.locator('pre')).toContainText(
    '<h1><strong>Angular RTE</strong></h1>',
  );
  await expect(page.locator('pre')).toContainText(
    '<ul><li><p>Compose plugins in TypeScript.</p></li><li><p>Keep toolbar markup in the consuming app.</p></li></ul>',
  );
  await expect(page.locator('pre')).toContainText(
    '<ol><li><p>Pick capabilities for the current product surface.</p></li><li><p>Render controls with Angular templates and rteCommand.</p></li></ol>',
  );
  await expect(page.locator('pre')).toContainText(
    '<blockquote><p>Quote important passages without taking ownership away from the consuming app.</p></blockquote>',
  );
  await expect(page.locator('pre')).toContainText('<u>underline</u>');
  await expect(page.locator('pre')).toContainText('<mark>highlight</mark>');
  await expect(page.locator('pre')).toContainText(
    '<span style="color: rgb(14, 116, 144); background-color: rgb(254, 240, 138);">color</span>',
  );
  await expect(page.locator('pre')).toContainText(
    'formulas like H<sub>2</sub>O and E=mc<sup>2</sup>',
  );
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
  await alignRight.click();
  await expect(alignRight).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('pre')).toContainText(
    '<p style="text-align: right;">Build headless editing primitives with a plugin stack that remains fully selected by the consumer.</p>',
  );
  await alignLeft.click();
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
  await alignRight.click();
  await expect(page.locator('pre')).toContainText(
    '<ul><li style="text-align: right;"><p>Build headless editing primitives with a plugin stack that remains fully selected by the consumer.</p></li></ul>',
  );
  await alignLeft.click();
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

  await blockquote.click();
  await expect(blockquote).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('pre')).toContainText(
    '<blockquote><p>Build headless editing primitives with a plugin stack that remains fully selected by the consumer.</p></blockquote>',
  );

  await blockquote.click();
  await expect(page.locator('pre')).toContainText(
    '<p>Build headless editing primitives with a plugin stack that remains fully selected by the consumer.</p>',
  );

  await underline.click();
  await expect(underline).toHaveAttribute('aria-pressed', 'true');

  await page.locator('.ProseMirror a[href="https://angular.dev"]').hover();
  await expect(
    page.getByRole('dialog', { name: 'Link preview' }),
  ).toBeVisible();
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

  await page.locator('.ProseMirror').getByText('highlight').selectText();
  await mintHighlight.click();
  await expect(mintHighlight).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('pre')).toContainText(
    '<mark style="background-color: rgb(187, 247, 208);">highlight</mark>',
  );
  await clearHighlight.click();
  await expect(page.locator('pre')).toContainText(
    'strikethrough</s>, highlight, <span style="color: rgb(14, 116, 144);',
  );

  await page.locator('.ProseMirror sub').selectText();
  await expect(subscript).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('pre')).toContainText('H<sub>2</sub>O');
  await superscript.click();
  await expect(superscript).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('pre')).toContainText('H<sup>2</sup>O');
  await subscript.click();
  await expect(page.locator('pre')).toContainText('H<sub>2</sub>O');

  await page.locator('.ProseMirror').getByText('color').selectText();
  await roseTextColor.click();
  await expect(roseTextColor).toHaveAttribute('aria-pressed', 'true');
  await skyBackgroundColor.click();
  await expect(skyBackgroundColor).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('pre')).toContainText(
    '<span style="color: rgb(190, 18, 60); background-color: rgb(186, 230, 253);">color</span>',
  );
  await clearTextColor.click();
  await expect(page.locator('pre')).toContainText(
    '<span style="background-color: rgb(186, 230, 253);">color</span>',
  );
  await clearBackgroundColor.click();
  await expect(page.locator('pre')).toContainText(
    'try <em>italic</em>, <u>underline</u>, <s>strikethrough</s>, highlight, color, formulas like H<sub>2</sub>O and E=mc<sup>2</sup>, and <a href="https://angular.dev"',
  );

  await page.locator('.ProseMirror').pressSequentially('X');
  await expect(undo).toBeEnabled();
  await expect(redo).toBeDisabled();

  await undo.click();
  await expect(redo).toBeEnabled();
});
