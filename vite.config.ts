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
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true,
          type: 'module'
        },
        includeAssets: ['pwa-192x192.svg', 'pwa-512x512.svg'],
        manifest: {
          name: 'دستیار هوشمند فارسی',
          short_name: 'AI Chatbox',
          description: 'دستیار هوشمند فارسی با پشتیبانی از مدل‌های مختلف',
          theme_color: '#0f172a',
          background_color: '#020617',
          dir: 'rtl',
          lang: 'fa-IR',
          display: 'standalone',
          orientation: 'portrait-primary',
          icons: [
            { src: '/pwa-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
            { src: '/pwa-512x512.svg', sizes: '512x512', type: 'image/svg+xml' },
            { src: '/pwa-512x512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' }
          ]
        },
        workbox: {
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
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});