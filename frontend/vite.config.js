import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // GitHub Pages base path - set via environment variable or default to root
  const base = process.env.GITHUB_PAGES === 'true' 
    ? (process.env.REPO_NAME ? `/${process.env.REPO_NAME}/` : '/')
    : '/';

  return {
  // Vitest configuration (for testing)
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.config.js',
        '**/*.config.*.js',
        'dist/',
      ],
    },
  },
  plugins: [
    react(),
    // PWA plugin for service worker - only in production
    mode === 'production' && VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webp}'],
        // Offline fallback
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/api/],
        // Runtime caching strategies
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          // API caching with NetworkFirst strategy
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/voices'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-voices-cache',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              networkTimeoutSeconds: 3,
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/writings/genres') || url.pathname.startsWith('/api/poetry/styles'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-metadata-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 30 * 60, // 30 minutes
              },
              networkTimeoutSeconds: 3,
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/writings') && url.searchParams.has('search') === false,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-writings-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60, // 5 minutes
              },
              networkTimeoutSeconds: 3,
            },
          },
          // Audio/Video caching
          {
            urlPattern: /\.(?:mp3|wav|ogg|mp4|webm)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'media-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
        ],
      },
      manifest: {
        name: 'Prose & Pause - Writing Through Beautiful Audio',
        short_name: 'Prose & Pause',
        description: 'Explore wonderful writing through beautiful audio',
        theme_color: '#1e1b4b',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: '/vite.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
    // Bundle analyzer - only in analyze mode
    mode === 'analyze' && visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  
  build: {
    // Optimize build output
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
    
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            // Other vendor libraries
            return 'vendor';
          }
        },
        // Optimize chunk file names
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    
    // Build optimization
    chunkSizeWarningLimit: 1000,
    sourcemap: mode === 'development',
    
    // CSS optimization
    cssCodeSplit: true,
    cssMinify: true,
  },
  
  // Performance optimization
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion', 'lucide-react'],
    exclude: [],
  },
  
  // Build optimization
  esbuild: {
    legalComments: 'none',
    treeShaking: true,
  },
  
  // Preview server config
  preview: {
    port: 4173,
    host: true,
  },
  
  // Development server config
  server: {
    port: 5173,
    host: true,
  },
  
  // Base path for GitHub Pages
  base: base,
  };
})
