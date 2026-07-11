import { describe, expect, it } from 'vitest';

import { mapPagefindResults } from './pagefind-search';

describe('mapPagefindResults', () => {
  it('maps page sections, metadata, excerpts, and clean Angular URLs', async () => {
    const results = await mapPagefindResults({
      results: [
        {
          id: 'page-1',
          data: async () => ({
            url: '/kit/toolbar-button/',
            excerpt: 'Toolbar overview',
            meta: { title: 'Toolbar Button', section: 'UI Kit' },
            sub_results: [
              {
                title: 'API',
                url: '/kit/toolbar-button/#api',
                excerpt: 'The <mark>command</mark> input.',
              },
            ],
          }),
        },
      ],
    });

    expect(results).toEqual([
      {
        id: 'page-1-0',
        url: '/kit/toolbar-button#api',
        pageTitle: 'Toolbar Button',
        sectionTitle: 'API',
        section: 'UI Kit',
        excerpt: 'The <mark>command</mark> input.',
      },
    ]);
  });

  it('deduplicates section URLs returned by Pagefind', async () => {
    const duplicate = {
      title: 'Commands',
      url: '/docs/commands/#registry',
      excerpt: 'Command registry',
    };
    const results = await mapPagefindResults({
      results: [
        {
          id: 'page-1',
          data: async () => ({
            url: '/docs/commands/',
            excerpt: 'Commands',
            meta: { title: 'Commands', section: 'Docs' },
            sub_results: [duplicate, duplicate],
          }),
        },
      ],
    });

    expect(results).toHaveLength(1);
  });
});
