import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Plugin pour utiliser index-kiosk.html au lieu de index.html
const kioskHtmlPlugin = () => {
  return {
    name: 'kiosk-html-plugin',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === '/' || req.url === '/index.html') {
          req.url = '/index-kiosk.html';
        }
        next();
      });
    },
    transformIndexHtml(html, ctx) {
      if (ctx.path === '/index.html' || ctx.path === '/index-kiosk.html') {
        const kioskHtmlPath = path.resolve(__dirname, 'index-kiosk.html');
        if (fs.existsSync(kioskHtmlPath)) {
          return fs.readFileSync(kioskHtmlPath, 'utf-8');
        }
      }
      return html;
    }
  };
};

// Configuration Vite pour le Kiosk (port 3010)
export default defineConfig({
  root: __dirname,
  plugins: [
    react({
      // ✅ Configuration simple comme dans vite.config.js principal
      // Pas de configuration spéciale pour éviter les erreurs de préambule
    }),
    kioskHtmlPlugin()
  ],
  // ✅ Spécifier explicitement index-kiosk.html comme point d'entrée
  publicDir: 'public',
  server: {
    host: '0.0.0.0',
    port: 3010,
    strictPort: true,
    open: '/',
    cors: true,
    hmr: {
      overlay: false,
      // ✅ Utiliser le même port pour HMR
      port: 3010
    },
    // ✅ Forcer Vite à utiliser index-kiosk.html
    fs: {
      strict: false
    }
  },
  build: {
    outDir: 'dist-kiosk',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index-kiosk.html')
      },
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'zustand-vendor': ['zustand'],
          'ui-vendor': ['lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    dedupe: ['react', 'react-dom']
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'lucide-react'],
    exclude: [],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  }
});

