import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormField,
  form,
  submit as submitForm,
} from '@angular/forms/signals';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  HardBreakPlugin,
  HistoryPlugin,
  LinkPlugin,
  ListsPlugin,
  PasteRulesPlugin,
  PlaceholderPlugin,
  QalmaCommand,
  QalmaContent,
  QalmaEditor,
  QalmaToolbar,
  TextFormattingKit,
  createQalmaEditor,
} from '@qalma/editor';
import { LinkPopoverController, QalmaLinkPopover } from '@qalma/kit';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBold,
  lucideItalic,
  lucideLink,
  lucideList,
} from '@ng-icons/lucide';

import { PosthogService } from '../services/posthog.service';

interface PostedReview {
  readonly id: number;
  readonly author: string;
  readonly rating: number;
  readonly headline: string;
  readonly body: SafeHtml;
}

type ReviewRating = '0' | '1' | '2' | '3' | '4' | '5';

interface ReviewFormValue {
  readonly rating: ReviewRating;
  readonly headline: string;
}

const STARS: readonly {
  readonly value: Exclude<ReviewRating, '0'>;
  readonly score: number;
}[] = [
  { value: '1', score: 1 },
  { value: '2', score: 2 },
  { value: '3', score: 3 },
  { value: '4', score: 4 },
  { value: '5', score: 5 },
];

const SEED: readonly {
  author: string;
  rating: number;
  headline: string;
  html: string;
}[] = [
  {
    author: 'Imen B.',
    rating: 5,
    headline: 'Exactly what I needed',
    html: '<p>Dropped it into our app in an afternoon. The <strong>bundle size</strong> sold me — see the <a href="https://qalma.dev/docs/bundle-size">numbers</a>.</p>',
  },
];

/**
 * Example: a product review widget. The editor is just one field in a form,
 * sitting next to a star-rating control and a headline input — showing how
 * Qalma drops into your own UI rather than owning it. Reuses the playground
 * link primitives.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-product-review',
  imports: [
    FormField,
    NgIcon,
    QalmaCommand,
    QalmaContent,
    QalmaEditor,
    QalmaToolbar,
    QalmaLinkPopover,
  ],
  providers: [provideIcons({ lucideBold, lucideItalic, lucideLink, lucideList })],
  template: `
    @let postedReviews = reviews();
    @let selectedScore = selectedRating();
    @let previewScore = displayRating();
    @let linkIsActive = linkActive();
    @let editorIsEmpty = empty();

    <div
      class="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm"
    >
      <div class="border-b border-border px-4 py-2.5 text-sm font-medium">
        Reviews
      </div>

      <ul class="m-0 list-none p-0">
        @for (review of postedReviews; track review.id) {
          @let reviewRating = review.rating;

          <li class="border-b border-border px-4 py-3.5">
            <div class="flex items-center gap-2">
              <span class="flex" [attr.aria-label]="reviewRating + ' out of 5'">
                @for (star of stars; track star.value) {
                  <svg
                    class="size-3.5"
                    [class]="
                      star.score <= reviewRating
                        ? 'text-accent'
                        : 'text-muted-foreground/35'
                    "
                    viewBox="0 0 24 24"
                    [attr.fill]="
                      star.score <= reviewRating ? 'currentColor' : 'none'
                    "
                    stroke="currentColor"
                    stroke-width="1.5"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 17.3l-5.5 3.2 1.5-6.2L3 9.9l6.3-.5L12 3.5l2.7 5.9 6.3.5-5 4.4 1.5 6.2z"
                    />
                  </svg>
                }
              </span>
              <span class="text-sm font-medium">{{ review.headline }}</span>
            </div>
            <div
              class="qalma-comment-body mt-1 text-sm"
              [innerHTML]="review.body"
            ></div>
            <p class="mt-1 text-xs text-muted-foreground">{{ review.author }}</p>
          </li>
        }
      </ul>

      <form class="bg-secondary/30 px-4 py-3" (submit)="submit($event)">
        <p class="mb-2 text-sm font-medium">Write a review</p>

        <fieldset class="mb-2">
          <legend class="sr-only">Your rating</legend>

          <div class="flex items-center gap-1">
            @for (star of stars; track star.value) {
              <label
                class="cursor-pointer rounded p-0.5 transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-ring/40"
                (mouseenter)="hover.set(star.score)"
                (mouseleave)="hover.set(0)"
              >
                <input
                  type="radio"
                  class="sr-only"
                  [formField]="reviewForm.rating"
                  value="{{ star.value }}"
                  [attr.aria-label]="star.score + ' stars'"
                  (focus)="hover.set(star.score)"
                  (blur)="hover.set(0)"
                />
                <svg
                  class="size-5"
                  [class]="
                    star.score <= previewScore
                      ? 'text-accent'
                      : 'text-muted-foreground/40'
                  "
                  viewBox="0 0 24 24"
                  [attr.fill]="
                    star.score <= previewScore ? 'currentColor' : 'none'
                  "
                  stroke="currentColor"
                  stroke-width="1.5"
                  aria-hidden="true"
                >
                  <path
                    d="M12 17.3l-5.5 3.2 1.5-6.2L3 9.9l6.3-.5L12 3.5l2.7 5.9 6.3.5-5 4.4 1.5 6.2z"
                  />
                </svg>
              </label>
            }
          </div>
        </fieldset>

        <input
          type="text"
          [formField]="reviewForm.headline"
          placeholder="Add a headline"
          aria-label="Review headline"
          class="mb-2 block w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-ring/25"
        />

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
            <button [class]="btnClass" qalmaCommand="toggleItalic" aria-label="Italic">
              <ng-icon [class]="iconClass" name="lucideItalic" aria-hidden="true" />
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
            class="block max-h-40 overflow-y-auto px-3 py-2.5 text-sm [&_.ProseMirror]:min-h-16 [&_.ProseMirror]:break-words [&_.ProseMirror]:outline-none"
            (focus)="linkPopover.showPreview($event)"
            (blur)="linkPopover.scheduleHideFromEvent($event)"
            (focusin)="linkPopover.showPreview($event)"
            (focusout)="linkPopover.scheduleHideFromEvent($event)"
          />
        </qalma-editor>

        <div class="mt-2 flex justify-end">
          <button
            type="submit"
            class="inline-flex h-8 items-center rounded-md bg-accent px-4 text-xs font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            [disabled]="selectedScore === 0 || editorIsEmpty"
          >
            Post review
          </button>
        </div>
      </form>
    </div>

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
export class ProductReview {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly posthogService = inject(PosthogService);

  protected readonly stars = STARS;
  protected readonly reviewModel = signal<ReviewFormValue>({
    rating: '0',
    headline: '',
  });
  protected readonly reviewForm = form(this.reviewModel);
  protected readonly hover = signal(0);
  protected readonly selectedRating = computed(() =>
    Number(this.reviewForm.rating().value()),
  );
  protected readonly displayRating = computed(
    () => this.hover() || this.selectedRating(),
  );

  protected readonly editor = createQalmaEditor({
    plugins: [
      ...TextFormattingKit,
      LinkPlugin,
      ListsPlugin,
      PlaceholderPlugin.configure({ placeholder: 'Share your experience…' }),
      HardBreakPlugin,
      PasteRulesPlugin,
      HistoryPlugin,
    ],
  });

  protected readonly linkPopover = new LinkPopoverController(this.editor);

  private nextId = SEED.length;
  protected readonly reviews = signal<readonly PostedReview[]>(
    SEED.map((review, index) => ({
      id: index,
      author: review.author,
      rating: review.rating,
      headline: review.headline,
      body: this.trust(review.html),
    })),
  );

  protected readonly empty = (): boolean => isBlankHtml(this.editor.html());

  protected readonly linkActive = (): boolean =>
    this.editor.isCommandActive('setLink');

  protected readonly btnClass =
    'inline-flex h-[1.85rem] w-[1.85rem] cursor-pointer items-center justify-center rounded-[0.4rem] border border-transparent text-muted-foreground transition hover:bg-secondary hover:text-foreground [&.qalma-command-active]:border-accent/40 [&.qalma-command-active]:bg-accent-subtle [&.qalma-command-active]:text-accent';
  protected readonly iconClass = 'text-[0.9rem]';

  protected submit(event: Event): void {
    event.preventDefault();

    submitForm(this.reviewForm, async () => {
      const html = this.editor.html();
      const rating = this.selectedRating();

      if (rating === 0 || isBlankHtml(html)) {
        return;
      }

      this.reviews.update((reviews) => [
        {
          id: this.nextId++,
          author: 'You',
          rating,
          headline: this.reviewForm.headline().value().trim() || 'My review',
          body: this.trust(html),
        },
        ...reviews,
      ]);

      this.reviewModel.set({ rating: '0', headline: '' });
      this.editor.setHtml('<p></p>');
      this.posthogService.posthog.capture('example_review_posted', {
        rating,
      });
    });
  }

  // The editor only serializes schema-allowed nodes/marks — no scripts can
  // reach this HTML — so trusting it keeps marks rendering as authored.
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
