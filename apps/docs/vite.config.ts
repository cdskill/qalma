/// <reference types="vitest" />

import analog from '@analogjs/platform';
import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    root: __dirname,
    cacheDir: `../../node_modules/.vite`,
    build: {
      outDir: '../../dist/apps/docs/client',
      reportCompressedSize: true,
      target: ['es2020'],
    },
    server: {
      fs: {
        allow: ['.'],
      },
    },
    plugins: [
      analog({
        // SSG : prérend les pages en HTML statique sans produire de serveur Node.
        // Sortie 100% statique → hébergeable sur Amplify (static) / S3+CloudFront.
        static: true,
        // Active le pipeline de contenu markdown (src/content/**) pour les
        // pages /docs/*. Sans `highlighter`, @analogjs/content n'enregistre
        // pas les plugins qui transforment les fichiers .md.
        content: {
          highlighter: 'prism',
        },
        prerender: {
          // Routes de départ. `discover` crawl ensuite les liens internes pour
          // découvrir automatiquement les autres pages. Les pages /docs/* qui
          // ont un contenu réel sont listées explicitement pour garantir leur
          // présence dans le sitemap, même si le crawl évolue.
          routes: [
            '/',
            '/docs/introduction',
            '/docs/installation',
            '/docs/quick-start',
          ],
          discover: true,
          // Sitemap pour le SEO. ⚠️ Remplace `host` par ton vrai domaine Route 53.
          sitemap: {
            host: 'https://qalma.dev/',
          },
        },
      }),
      nxViteTsPaths(),
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['src/test-setup.ts'],
      include: ['**/*.spec.ts'],
      reporters: ['default'],
    },
  };
});
