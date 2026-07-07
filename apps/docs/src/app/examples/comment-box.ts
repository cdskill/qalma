import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  HardBreakPlugin,
  HistoryPlugin,
  InlineCodePlugin,
  LinkPlugin,
  ListsPlugin,
  MentionPlugin,
  PasteRulesPlugin,
  PlaceholderPlugin,
  QalmaCommand,
  QalmaContent,
  QalmaEditor,
  QalmaToolbar,
  TextFormattingKit,
  createQalmaEditor,
} from '@qalma/editor';
import {
  LinkPopoverController,
  QalmaLinkPopover,
  QalmaMentionMenu,
  QalmaMentionOption,
} from '@qalma/kit';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBold,
  lucideCode,
  lucideItalic,
  lucideLink,
  lucideList,
} from '@ng-icons/lucide';

import {
  PlaygroundMentionController,
  PlaygroundMentionSource,
} from '../playground/mention';
import { PosthogService } from '../services/posthog.service';

interface CommentAuthor {
  readonly name: string;
  readonly initials: string;
}

interface PostedComment {
  readonly id: number;
  readonly author: CommentAuthor;
  readonly time: string;
  readonly body: SafeHtml;
}

/** Teammates the @-menu suggests — drives the mention plugin in this demo. */
const COMMENT_TEAMMATES: readonly QalmaMentionOption[] = [
  { id: 'lina', label: 'Lina Mansour', description: 'Frontend' },
  { id: 'yacine', label: 'Yacine Khaldi', description: 'Backend' },
  { id: 'sofia', label: 'Sofia Haddad', description: 'Design' },
  { id: 'omar', label: 'Omar Benali', description: 'Product' },
  { id: 'nora', label: 'Nora Cherif', description: 'QA' },
];

const MENTION_SOURCE: PlaygroundMentionSource = {
  kind: 'eager',
  items: COMMENT_TEAMMATES,
};

const SEED_COMMENTS: readonly {
  author: CommentAuthor;
  time: string;
  html: string;
}[] = [
  {
    author: { name: 'Lina Mansour', initials: 'LM' },
    time: '2h ago',
    html: '<p>Shipped the fix — see <a href="https://github.com/cdskill/qalma">the PR</a>. The <strong>drag handle</strong> bug is gone.</p>',
  },
  {
    author: { name: 'Yacine Khaldi', initials: 'YK' },
    time: 'just now',
    html: '<p>Nice work. <span data-qalma-mention data-mention-id="lina" data-mention-label="Lina Mansour" data-mention-trigger="@" contenteditable="false">@Lina Mansour</span> can you tag a release?</p>',
  },
];

/**
 * Example: a comment box. The same Qalma editor as the home playground, but
 * with a deliberately small plugin subset and a compact toolbar — wrapped in
 * the chrome of a real discussion panel so the visitor pictures it inside their
 * own product. Reuses the playground's mention + link primitives so there's a
 * single source of truth, not a fork.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-comment-box',
  imports: [
    NgIcon,
    QalmaCommand,
    QalmaContent,
    QalmaEditor,
    QalmaToolbar,
    QalmaLinkPopover,
    QalmaMentionMenu,
  ],
  providers: [
    provideIcons({
      lucideBold,
      lucideCode,
      lucideItalic,
      lucideLink,
      lucideList,
    }),
  ],
  template: `
    @let postedComments = comments();
    @let linkIsActive = linkActive();
    @let editorIsEmpty = empty();

    <div
      class="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm"
    >
      <div
        class="flex items-center gap-2 border-b border-border px-4 py-2.5 text-sm"
      >
        <svg
          class="size-4 text-muted-foreground"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          />
        </svg>
        <span class="font-medium">Discussion</span>
        <span class="text-xs text-muted-foreground"
          >{{ postedComments.length }} comments</span
        >
      </div>

      <ul class="m-0 list-none p-0">
        @for (comment of postedComments; track comment.id) {
          <li class="flex gap-3 border-b border-border px-4 py-3.5">
            <span
              class="mt-0.5 flex size-8 shrink-0 select-none items-center justify-center rounded-full bg-accent-subtle text-xs font-semibold text-accent"
              aria-hidden="true"
            >
              {{ comment.author.initials }}
            </span>
            <div class="min-w-0">
              <div class="flex items-baseline gap-2">
                <span class="text-sm font-medium">{{ comment.author.name }}</span>
                <span class="text-xs text-muted-foreground">{{
                  comment.time
                }}</span>
              </div>
              <div
                class="qalma-comment-body mt-0.5 text-sm"
                [innerHTML]="comment.body"
              ></div>
            </div>
          </li>
        }
      </ul>

      <div class="bg-secondary/30 px-4 py-3">
        <qalma-editor
          class="block overflow-hidden rounded-lg border border-border bg-card focus-within:border-accent focus-within:ring-2 focus-within:ring-ring/25"
          [editor]="editor"
        >
          <qalma-toolbar
            class="flex items-center gap-0.5 border-b border-border px-1.5 py-1.5"
          >
            <button [class]="btnClass" qalmaCommand="toggleBold" aria-label="Bold">
              <ng-icon [class]="iconClass" name="lucideBold" aria-hidden="true" />
            </button>
            <button
              [class]="btnClass"
              qalmaCommand="toggleItalic"
              aria-label="Italic"
            >
              <ng-icon
                [class]="iconClass"
                name="lucideItalic"
                aria-hidden="true"
              />
            </button>
            <button
              [class]="btnClass"
              qalmaCommand="toggleInlineCode"
              aria-label="Inline code"
            >
              <ng-icon [class]="iconClass" name="lucideCode" aria-hidden="true" />
            </button>
            <button
              [class]="btnClass"
              qalmaCommand="toggleBulletList"
              aria-label="Bullet list"
            >
              <ng-icon [class]="iconClass" name="lucideList" aria-hidden="true" />
            </button>
            <span
              class="mx-0.5 h-5 w-px shrink-0 self-center bg-border"
              aria-hidden="true"
            ></span>
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
            #surface
            class="block max-h-56 overflow-y-auto px-3 py-2.5 text-sm [&_.ProseMirror]:min-h-[3.5rem] [&_.ProseMirror]:break-words [&_.ProseMirror]:outline-none"
            (keydown)="onKeydown($event)"
            (focus)="linkPopover.showPreview($event); mentionController.refresh()"
            (blur)="linkPopover.scheduleHideFromEvent($event)"
            (focusin)="linkPopover.showPreview($event)"
            (focusout)="linkPopover.scheduleHideFromEvent($event)"
            (click)="mentionController.refresh()"
          />

          <div
            class="flex items-center justify-between gap-3 border-t border-border px-3 py-2"
          >
            <span class="text-[0.6875rem] text-muted-foreground">
              <span class="font-medium">&#64;</span> to mention ·
              <span class="font-medium">⌘↵</span> to send
            </span>
            <button
              type="button"
              class="inline-flex h-8 items-center rounded-md bg-accent px-3.5 text-xs font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              [disabled]="editorIsEmpty"
              (click)="submit()"
            >
              Comment
            </button>
          </div>
        </qalma-editor>
      </div>
    </div>

    @if (mentionController.open()) {
      <qalma-mention-menu
        [placement]="mentionController.placement()"
        [suggestions]="mentionController.suggestions()"
        [loading]="mentionController.loading()"
        [activeIndex]="mentionController.activeIndex()"
        (activate)="mentionController.setActiveIndex($event)"
        (pick)="onMentionPick($event)"
        (dismiss)="mentionController.hide()"
      />
    }

    <qalma-link-popover
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
export class CommentBox {
  private readonly destroyRef = inject(DestroyRef);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly posthogService = inject(PosthogService);

  // `#surface` sits on <qalma-content>, so without `read` the query resolves to
  // the component instance (whose `.nativeElement` is undefined).
  private readonly surface = viewChild.required<
    HTMLElement,
    ElementRef<HTMLElement>
  >('surface', { read: ElementRef });

  protected readonly editor = createQalmaEditor({
    plugins: [
      ...TextFormattingKit,
      InlineCodePlugin,
      LinkPlugin,
      ListsPlugin,
      MentionPlugin.configure({ trigger: '@' }),
      PlaceholderPlugin.configure({ placeholder: 'Write a comment…' }),
      HardBreakPlugin,
      PasteRulesPlugin,
      HistoryPlugin,
    ],
  });

  protected readonly linkPopover = new LinkPopoverController(this.editor);
  protected readonly mentionController = new PlaygroundMentionController(
    this.editor,
    MENTION_SOURCE,
  );

  private nextId = SEED_COMMENTS.length;
  protected readonly comments = signal<readonly PostedComment[]>(
    SEED_COMMENTS.map((comment, index) => ({
      id: index,
      author: comment.author,
      time: comment.time,
      body: this.trust(comment.html),
    })),
  );

  /** Recomputes whenever the document changes via `editor.html()`. */
  protected readonly empty = (): boolean => isBlankHtml(this.editor.html());

  protected readonly linkActive = (): boolean =>
    this.editor.isCommandActive('setLink');

  protected readonly btnClass =
    'inline-flex h-[1.85rem] w-[1.85rem] cursor-pointer items-center justify-center rounded-[0.4rem] border border-transparent text-muted-foreground transition hover:bg-secondary hover:text-foreground [&.qalma-command-active]:border-accent/40 [&.qalma-command-active]:bg-accent-subtle [&.qalma-command-active]:text-accent';
  protected readonly iconClass = 'text-[0.9rem]';

  constructor() {
    afterNextRender(() => {
      const surface = this.surface().nativeElement;
      const refreshMentions = () => this.mentionController.refresh();
      const handleMentionKeydown = (event: Event) =>
        this.mentionController.handleMentionKeydown(event);

      surface.addEventListener('qalma-mention-update', refreshMentions);
      surface.addEventListener('qalma-mention-keydown', handleMentionKeydown);

      this.destroyRef.onDestroy(() => {
        surface.removeEventListener('qalma-mention-update', refreshMentions);
        surface.removeEventListener(
          'qalma-mention-keydown',
          handleMentionKeydown,
        );
      });
    });
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      this.submit();
    }
  }

  protected submit(): void {
    const html = this.editor.html();

    if (isBlankHtml(html)) {
      return;
    }

    this.comments.update((comments) => [
      ...comments,
      {
        id: this.nextId++,
        author: { name: 'You', initials: 'YO' },
        time: 'just now',
        body: this.trust(html),
      },
    ]);

    this.editor.setHtml('<p></p>');
    this.editor.focus();
    this.posthogService.posthog.capture('example_comment_posted');
  }

  protected onMentionPick(option: QalmaMentionOption): void {
    this.mentionController.insert(option);
  }

  // The editor only serializes nodes/marks its schema allows — no scripts can
  // reach this HTML — so trusting it is safe and keeps mention pills + marks
  // rendering exactly as authored (Angular's sanitizer would strip data-* here).
  private trust(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}

function isBlankHtml(html: string): boolean {
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;|\u00a0/g, '')
    .trim();

  return text.length === 0;
}
