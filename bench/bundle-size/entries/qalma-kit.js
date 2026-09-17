// Optional styled UI layer for an existing Qalma editor. The editor itself is
// external in build.mjs so this measures only @qalma/kit and its UI helpers.
import {
  QalmaContextualToolbar,
  QalmaDragHandle,
  QalmaLinkPopover,
  QalmaMentionMenu,
  QalmaSlashCommandMenu,
  QalmaToolbarButton,
  QalmaToolbarRegistry,
  provideQalmaToolbarIcons,
} from '@qalma/kit';

globalThis.__sink = [
  QalmaContextualToolbar,
  QalmaDragHandle,
  QalmaLinkPopover,
  QalmaMentionMenu,
  QalmaSlashCommandMenu,
  QalmaToolbarButton,
  QalmaToolbarRegistry,
  provideQalmaToolbarIcons,
];
