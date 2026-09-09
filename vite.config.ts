import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        devOptions: {
          enabled: true,
          type: 'module'
        },
        includeAssets: ['pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          name: 'دستیار هوشمند فارسی',
          short_name: 'دستیار هوشمند',
          description: 'دستیار هوشمند فارسی با پشتیبانی از مدل‌های مختلف',
          theme_color: '#0f172a',
          background_color: '#020617',
          dir: 'rtl',
          lang: 'fa-IR',
          display: 'standalone',
          orientation: 'portrait-primary',
          icons: [
            { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          navigateFallbackDenylist: [/^\/api/],
          runtimeCaching: [
            {
              urlPattern: /^\/api\/.*/,
              handler: 'NetworkOnly'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react-syntax-highlighter') || id.includes('prismjs')) {
                return 'syntax-highlighter';
              }
              if (id.includes('katex') || id.includes('rehype-katex') || id.includes('remark-math')) {
                return 'katex';
              }
              if (id.includes('@solar-icons') || id.includes('lucide-react')) {
                return 'ui-icons';
              }
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('zustand')) {
                return 'vendor-react';
              }
            }
          }
        }
      }
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/server/data/**', '**/*.db', '**/*.db-*', '**/*.sqlite*']
      },
    },
  };
});