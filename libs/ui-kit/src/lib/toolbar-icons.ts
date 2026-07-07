import { provideIcons } from '@ng-icons/core';
import {
  lucideAlignCenter,
  lucideAlignJustify,
  lucideAlignLeft,
  lucideAlignRight,
  lucideBetweenHorizontalEnd,
  lucideBetweenVerticalEnd,
  lucideBold,
  lucideCode,
  lucideColumns3,
  lucideEraser,
  lucideHeading,
  lucideHeading1,
  lucideHeading2,
  lucideHeading3,
  lucideIndent,
  lucideItalic,
  lucideLetterText,
  lucideList,
  lucideListOrdered,
  lucideListTodo,
  lucideOutdent,
  lucidePilcrow,
  lucideRedo2,
  lucideRows3,
  lucideSquareCode,
  lucideStrikethrough,
  lucideSubscript,
  lucideSuperscript,
  lucideTable,
  lucideTextQuote,
  lucideTrash2,
  lucideUnderline,
  lucideUndo2,
  lucideUnlink,
} from '@ng-icons/lucide';

/**
 * Registers the Lucide icons referenced by the default toolbar command
 * fragments (`QALMA_TOOLBAR_*`), so consumers can wire the standard toolbar
 * without re-declaring the icon set:
 *
 * ```ts
 * providers: [provideQalmaToolbarIcons()]
 * ```
 *
 * Add your own `provideIcons({ … })` alongside it for any custom controls
 * (color pickers, upload buttons…) that live outside the command registry.
 */
export function provideQalmaToolbarIcons() {
  return provideIcons({
    lucideAlignCenter,
    lucideAlignJustify,
    lucideAlignLeft,
    lucideAlignRight,
    lucideBetweenHorizontalEnd,
    lucideBetweenVerticalEnd,
    lucideBold,
    lucideCode,
    lucideColumns3,
    lucideEraser,
    lucideHeading,
    lucideHeading1,
    lucideHeading2,
    lucideHeading3,
    lucideIndent,
    lucideItalic,
    lucideLetterText,
    lucideList,
    lucideListOrdered,
    lucideListTodo,
    lucideOutdent,
    lucidePilcrow,
    lucideRedo2,
    lucideRows3,
    lucideSquareCode,
    lucideStrikethrough,
    lucideSubscript,
    lucideSuperscript,
    lucideTable,
    lucideTextQuote,
    lucideTrash2,
    lucideUnderline,
    lucideUndo2,
    lucideUnlink,
  });
}
