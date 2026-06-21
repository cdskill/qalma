import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-qalma-logo-loader',
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <g class="qalma-loader__crest" stroke="var(--color-accent)">
        <path
          class="qalma-loader__feather qalma-loader__feather--outer-left"
          d="M10.8 11.2C9.3 8.8 7.7 6.9 5.8 5.4"
        />
        <path
          class="qalma-loader__feather qalma-loader__feather--inner-left"
          d="M12.4 10.4c-.7-2.5-1.4-4.8-2.5-7"
        />
        <path
          class="qalma-loader__feather qalma-loader__feather--inner-right"
          d="M14 10.2c.1-2.5.4-5 .9-7.4"
        />
        <path
          class="qalma-loader__feather qalma-loader__feather--outer-right"
          d="M15.6 10.8c.9-2.2 2-4.3 3.2-6.2"
        />
      </g>
      <g class="qalma-loader__head">
        <path d="M6.7 20c.5-3.2 2-5.8 4.4-7.3 2-1.3 4.5-1.4 6.5-.3" />
        <path d="M17.6 12.6c1.5-.2 3-.5 4.4-.9" />
        <path d="M18.1 14.2c1.5-.4 2.8-1.1 3.9-2.5" />
        <path d="M18.1 14.2c-1 1.6-2.8 2.6-5 2.6-1.4 0-2.7-.4-3.8-1.2" />
        <path class="qalma-loader__eye" d="M14.7 12.9h.01" />
      </g>
    </svg>
    <span class="sr-only">{{ label() }}</span>
  `,
  host: {
    role: 'status',
    'aria-live': 'polite',
  },
  styles: `
    :host {
      display: inline-grid;
      width: var(--qalma-logo-loader-size, 2.75rem);
      height: var(--qalma-logo-loader-size, 2.75rem);
      place-items: center;
      color: var(--color-foreground);
    }

    svg {
      width: 100%;
      height: 100%;
      overflow: visible;
      animation: qalma-loader-breathe 2.8s ease-in-out infinite;
    }

    .qalma-loader__feather {
      transform-box: view-box;
      transform-origin: var(--qalma-loader-origin);
      animation: qalma-loader-feather var(--qalma-loader-speed, 3.2s)
        ease-in-out infinite;
      animation-delay: var(--qalma-loader-delay, 0s);
    }

    .qalma-loader__feather--outer-left {
      --qalma-loader-origin: 10.8px 11.2px;
      --qalma-loader-from: 2deg;
      --qalma-loader-to: -5deg;
      --qalma-loader-speed: 3.6s;
      --qalma-loader-delay: -0.45s;
    }

    .qalma-loader__feather--inner-left {
      --qalma-loader-origin: 12.4px 10.4px;
      --qalma-loader-from: 1deg;
      --qalma-loader-to: -3.5deg;
      --qalma-loader-speed: 3.2s;
      --qalma-loader-delay: -0.2s;
    }

    .qalma-loader__feather--inner-right {
      --qalma-loader-origin: 14px 10.2px;
      --qalma-loader-from: -1deg;
      --qalma-loader-to: 3.5deg;
      --qalma-loader-speed: 3.3s;
      --qalma-loader-delay: -0.1s;
    }

    .qalma-loader__feather--outer-right {
      --qalma-loader-origin: 15.6px 10.8px;
      --qalma-loader-from: -2deg;
      --qalma-loader-to: 5deg;
      --qalma-loader-speed: 3.7s;
      --qalma-loader-delay: -0.55s;
    }

    .qalma-loader__eye {
      transform-box: view-box;
      transform-origin: 14.7px 12.9px;
      animation: qalma-loader-eye 4.8s ease-in-out infinite;
    }

    @keyframes qalma-loader-breathe {
      0%,
      100% {
        opacity: 0.78;
        transform: scale(0.98);
      }

      50% {
        opacity: 1;
        transform: scale(1.02);
      }
    }

    @keyframes qalma-loader-feather {
      0%,
      100% {
        transform: rotate(var(--qalma-loader-from));
      }

      50% {
        transform: rotate(var(--qalma-loader-to));
      }
    }

    @keyframes qalma-loader-eye {
      0%,
      72%,
      79%,
      86%,
      100% {
        transform: scaleY(1);
      }

      75%,
      83% {
        transform: scaleY(0.08);
      }

      77%,
      85% {
        transform: scaleY(1);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      svg,
      .qalma-loader__feather,
      .qalma-loader__eye {
        animation: none;
      }

      svg {
        opacity: 1;
        transform: none;
      }
    }
  `,
})
export class QalmaLogoLoader {
  readonly label = input('Loading Qalma');
}
