import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({
    // ✅ JSX transform automatique - React n'a pas besoin d'être importé pour JSX
    // Mais les hooks doivent toujours être importés depuis 'react'
  })],
  server: {
    host: '0.0.0.0', // ✅ Écouter sur toutes les interfaces (accessible via localhost)
    port: 3000,
    strictPort: true,
    open: true,
    cors: true,
    hmr: {
      overlay: false
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Désactivé pour la production
    minify: 'esbuild', // Utiliser esbuild (inclus avec Vite) au lieu de terser
    cssCodeSplit: false, // ✅ Forcer un seul fichier CSS pour éviter les problèmes de chargement
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'zustand-vendor': ['zustand'],
          'ui-vendor': ['lucide-react'],
          'charts-vendor': ['recharts'],
          'pdf-vendor': ['pdfmake']
        },
        // ✅ S'assurer que les assets CSS sont correctement nommés
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // ✅ Forcer une seule instance de React
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom')
    },
    dedupe: ['react', 'react-dom'] // ✅ Dédupliquer React
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'lucide-react'],
    exclude: [], // ✅ Ne pas exclure React
    force: true, // ✅ Forcer la re-optimisation
    esbuildOptions: {
      // ✅ Forcer React à être chargé en premier
      define: {
        global: 'globalThis'
      }
    }
  }
});

