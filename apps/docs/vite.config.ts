/// <reference types="vitest" />

import analog from '@analogjs/platform';
import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
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
        prerender: {
          // Routes de départ. `discover` crawl ensuite les liens internes pour
          // découvrir automatiquement les autres pages (ex: futures pages /docs/*).
          routes: ['/'],
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
