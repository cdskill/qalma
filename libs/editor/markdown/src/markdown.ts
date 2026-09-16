import { marked } from 'marked';

import { QalmaPlugin, createQalmaPlugin } from '@qalma/editor';

export const MarkdownPlugin = /* @__PURE__ */ createQalmaPlugin({
  key: 'markdown',
  contentParsers: {
    markdown: (content) => ({
      html: marked.parse(content, {
        async: false,
        gfm: true,
      }) as string,
    }),
  },
});

export const MarkdownKit: readonly QalmaPlugin[] = [MarkdownPlugin];
