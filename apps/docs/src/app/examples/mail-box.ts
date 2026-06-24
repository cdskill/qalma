import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  HardBreakPlugin,
  HistoryPlugin,
  HorizontalRulePlugin,
  LinkPlugin,
  ListsPlugin,
  PasteRulesPlugin,
  PlaceholderPlugin,
  QalmaCommand,
  QalmaContent,
  QalmaEditor,
  QalmaToolbar,
  TextAlignPlugin,
  TextFormattingKit,
  createQalmaEditor,
} from '@qalma/editor';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideAlignCenter,
  lucideAlignLeft,
  lucideAlignRight,
  lucideBold,
  lucideItalic,
  lucideLink,
  lucideList,
  lucideListOrdered,
  lucidePaperclip,
  lucideStrikethrough,
  lucideTrash2,
  lucideUnderline,
} from '@ng-icons/lucide';

import { LinkPopoverController } from '../playground/link-popover-controller';
import { PlaygroundLinkPopover } from '../playground/link-popover';
import { PosthogService } from '../services/posthog.service';

const SEED = `<p>Hi team,</p>
<p>Quick recap before the launch on <strong>Friday</strong>:</p>
<ul><li><p>Docs are live — see the <a href="https://qalma.dev/examples">examples page</a></p></li><li><p>Bundle is down to <strong>~77&nbsp;KB</strong> gzip</p></li></ul>
<p>Shout if anything looks off.</p>
<hr>
<p>— Sent with Qalma</p>`;

/**
 * Example: an email composer. A familiar "new message" window — recipients,
 * subject, then a rich body with the formatting an email actually needs
 * (alignment, lists, links) and an HTML payload ready to send. Reuses the
 * playground link primitives so there's a single source of truth.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-mail-box',
  imports: [
    NgIcon,
    QalmaCommand,
    QalmaContent,
    QalmaEditor,
    QalmaToolbar,
    PlaygroundLinkPopover,
  ],
  providers: [
    provideIcons({
      lucideAlignCenter,
      lucideAlignLeft,
      lucideAlignRight,
      lucideBold,
      lucideItalic,
      lucideLink,
      lucideList,
      lucideListOrdered,
      lucidePaperclip,
      lucideStrikethrough,
      lucideTrash2,
      lucideUnderline,
    }),
  ],
  template: `
    @let messageSent = sent();
    @let linkIsActive = linkActive();

    <div
      class="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm"
    >
      <div
        class="flex items-center justify-between border-b border-border bg-secondary/40 px-4 py-2.5 text-sm"
      >
        <span class="font-medium">New message</span>
        @if (messageSent) {
          <span class="text-xs font-medium text-accent">Sent ✓</span>
        }
      </div>

      <div
        class="flex items-center gap-2 border-b border-border px-4 py-2 text-sm"
      >
        <span class="w-14 shrink-0 text-muted-foreground">To</span>
        <span
          class="inline-flex items-center gap-1.5 rounded-full bg-accent-subtle px-2 py-0.5 text-xs font-medium text-accent"
        >
          team&#64;acme.com
        </span>
        <span class="ml-auto text-xs text-muted-foreground">Cc Bcc</span>
      </div>

      <div
        class="flex items-center gap-2 border-b border-border px-4 py-2 text-sm"
      >
        <span class="w-14 shrink-0 text-muted-foreground">Subject</span>
        <span class="font-medium">Launch recap</span>
      </div>

      <qalma-editor [editor]="editor">
        <qalma-toolbar
          class="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5"
        >
          <button [class]="btnClass" qalmaCommand="toggleBold" aria-label="Bold">
            <ng-icon [class]="iconClass" name="lucideBold" aria-hidden="true" />
          </button>
          <button [class]="btnClass" qalmaCommand="toggleItalic" aria-label="Italic">
            <ng-icon [class]="iconClass" name="lucideItalic" aria-hidden="true" />
          </button>
          <button
            [class]="btnClass"
            qalmaCommand="toggleUnderline"
            aria-label="Underline"
          >
            <ng-icon [class]="iconClass" name="lucideUnderline" aria-hidden="true" />
          </button>
          <button
            [class]="btnClass"
            qalmaCommand="toggleStrike"
            aria-label="Strikethrough"
          >
            <ng-icon
              [class]="iconClass"
              name="lucideStrikethrough"
              aria-hidden="true"
            />
          </button>

          <span [class]="sepClass" aria-hidden="true"></span>

          <button
            [class]="btnClass"
            qalmaCommand="toggleBulletList"
            aria-label="Bullet list"
          >
            <ng-icon [class]="iconClass" name="lucideList" aria-hidden="true" />
          </button>
          <button
            [class]="btnClass"
            qalmaCommand="toggleOrderedList"
            aria-label="Numbered list"
          >
            <ng-icon [class]="iconClass" name="lucideListOrdered" aria-hidden="true" />
          </button>

          <span [class]="sepClass" aria-hidden="true"></span>

          <button
            [class]="btnClass"
            qalmaCommand="setTextAlignLeft"
            aria-label="Align left"
          >
            <ng-icon [class]="iconClass" name="lucideAlignLeft" aria-hidden="true" />
          </button>
          <button
            [class]="btnClass"
            qalmaCommand="setTextAlignCenter"
            aria-label="Align center"
          >
            <ng-icon [class]="iconClass" name="lucideAlignCenter" aria-hidden="true" />
          </button>
          <button
            [class]="btnClass"
            qalmaCommand="setTextAlignRight"
            aria-label="Align right"
          >
            <ng-icon [class]="iconClass" name="lucideAlignRight" aria-hidden="true" />
          </button>

          <span [class]="sepClass" aria-hidden="true"></span>

          <button
            type="button"
            [class]="btnClass"
            [class.qalma-command-active]="linkIsActive"
            [attr.aria-pressed]="linkIsActive"
            (mousedown)="$event.preventDefault()"
            (click)="linkPopover.showToolbarEditor($event)"
            aria-label="Link"
          >
            <ng-icon [class]="iconClass" name="lucideLink" aria-hidden="true" />
          </button>
        </qalma-toolbar>

        <qalma-content
          class="block max-h-72 overflow-y-auto px-4 py-3 [&_.ProseMirror]:min-h-44 [&_.ProseMirror]:break-words [&_.ProseMirror]:outline-none"
          (focus)="linkPopover.showPreview($event)"
          (blur)="linkPopover.scheduleHideFromEvent($event)"
          (focusin)="linkPopover.showPreview($event)"
          (focusout)="linkPopover.scheduleHideFromEvent($event)"
        />
      </qalma-editor>

      <div
        class="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5"
      >
        <button
          type="button"
          class="inline-flex h-8 items-center rounded-md bg-accent px-4 text-xs font-semibold text-accent-foreground transition-opacity hover:opacity-90"
          (click)="send()"
        >
          Send
        </button>
        <div class="flex items-center gap-1 text-muted-foreground">
          <span [class]="ghostBtnClass" aria-hidden="true">
            <ng-icon [class]="iconClass" name="lucidePaperclip" />
          </span>
          <span [class]="ghostBtnClass" aria-hidden="true">
            <ng-icon [class]="iconClass" name="lucideTrash2" />
          </span>
        </div>
      </div>
    </div>

    <app-playground-link-popover
      [popover]="linkPopover.popover()"
      [href]="linkPopover.href()"
      (hrefChange)="linkPopover.href.set($event)"
      (edit)="linkPopover.edit($event)"
      (save)="linkPopover.save($event)"
      (remove)="linkPopover.remove($event)"
      (dismiss)="linkPopover.hide()"
      (keepOpen)="linkPopover.keepOpen()"
      (scheduleHide)="linkPopover.scheduleHide()"
    />
  `,
})
export class MailBox {
  private readonly posthogService = inject(PosthogService);

  protected readonly editor = createQalmaEditor({
    content: SEED,
    plugins: [
      ...TextFormattingKit,
      LinkPlugin,
      ListsPlugin,
      TextAlignPlugin,
      HorizontalRulePlugin,
      HardBreakPlugin,
      PasteRulesPlugin,
      PlaceholderPlugin.configure({ placeholder: 'Write your message…' }),
      HistoryPlugin,
    ],
  });

  protected readonly linkPopover = new LinkPopoverController(this.editor);
  protected readonly sent = signal(false);

  protected readonly linkActive = (): boolean =>
    this.editor.isCommandActive('setLink');

  protected readonly btnClass =
    'inline-flex h-[1.85rem] w-[1.85rem] cursor-pointer items-center justify-center rounded-[0.4rem] border border-transparent text-muted-foreground transition hover:bg-secondary hover:text-foreground [&.qalma-command-active]:border-accent/40 [&.qalma-command-active]:bg-accent-subtle [&.qalma-command-active]:text-accent';
  protected readonly ghostBtnClass =
    'inline-flex h-[1.85rem] w-[1.85rem] items-center justify-center rounded-[0.4rem]';
  protected readonly iconClass = 'text-[0.9rem]';
  protected readonly sepClass = 'mx-0.5 h-5 w-px shrink-0 self-center bg-border';

  protected send(): void {
    this.sent.set(true);
    this.posthogService.posthog.capture('example_mail_sent');
  }
}
