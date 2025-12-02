import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Plugin pour utiliser index-kitchen.html au lieu de index.html
const kitchenHtmlPlugin = () => {
  return {
    name: 'kitchen-html-plugin',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === '/' || req.url === '/index.html') {
          req.url = '/index-kitchen.html';
        }
        next();
      });
    },
    transformIndexHtml(html, ctx) {
      if (ctx.path === '/index.html' || ctx.path === '/index-kitchen.html') {
        const kitchenHtmlPath = path.resolve(__dirname, 'index-kitchen.html');
        if (fs.existsSync(kitchenHtmlPath)) {
          return fs.readFileSync(kitchenHtmlPath, 'utf-8');
        }
      }
      return html;
    }
  };
};

// Configuration Vite pour l'Écran de Cuisine (port 3050)
export default defineConfig({
  root: __dirname,
  plugins: [
    react({
      // Configuration simple comme dans vite.config.js principal
    }),
    kitchenHtmlPlugin()
  ],
  publicDir: 'public',
  server: {
    host: '0.0.0.0',
    port: 3050,
    strictPort: true,
    open: '/',
    cors: true,
    hmr: {
      overlay: false,
      port: 3050
    },
    fs: {
      strict: false
    }
  },
  build: {
    outDir: 'dist-kitchen',
    sourcemap: false,
    minify: 'esbuild', // Utiliser esbuild (inclus avec Vite) au lieu de terser
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index-kitchen.html')
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

