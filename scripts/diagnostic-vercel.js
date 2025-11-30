/**
 * Script de diagnostic pour Vercel
 * 
 * Ce script vérifie :
 * 1. Les variables d'environnement
 * 2. La configuration Supabase
 * 3. Les fichiers de build
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 DIAGNOSTIC VERCEL');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 1. Vérifier les variables d'environnement
console.log('1️⃣ Variables d\'environnement :\n');
const envVars = {
  'VITE_SUPABASE_URL': process.env.VITE_SUPABASE_URL,
  'VITE_SUPABASE_ANON_KEY': process.env.VITE_SUPABASE_ANON_KEY ? '✅ défini' : '❌ non défini',
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ défini' : '❌ non défini',
  'VITE_API_URL': process.env.VITE_API_URL || '❌ non défini (utilisera localhost:5000)'
};

Object.entries(envVars).forEach(([key, value]) => {
  console.log(`   ${key}: ${value || '❌ non défini'}`);
});

// 2. Vérifier la configuration Supabase
console.log('\n2️⃣ Configuration Supabase :\n');
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://brygzpxiemwthickhuqb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A';

try {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.from('users').select('count').limit(1);
  
  if (error) {
    console.log('   ❌ Erreur connexion Supabase:', error.message);
  } else {
    console.log('   ✅ Supabase connecté');
    console.log(`   URL: ${supabaseUrl}`);
  }
} catch (error) {
  console.log('   ❌ Erreur Supabase:', error.message);
}

// 3. Vérifier les fichiers de configuration
console.log('\n3️⃣ Fichiers de configuration :\n');
const configFiles = [
  'vercel.json',
  'vite.config.js',
  'tailwind.config.js',
  'postcss.config.js',
  'package.json'
];

configFiles.forEach(file => {
  const path = join(rootDir, file);
  if (existsSync(path)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} (manquant)`);
  }
});

// 4. Vérifier le dossier dist (si build effectué)
console.log('\n4️⃣ Build :\n');
const distPath = join(rootDir, 'dist');
if (existsSync(distPath)) {
  const indexHtml = join(distPath, 'index.html');
  if (existsSync(indexHtml)) {
    console.log('   ✅ Dossier dist existe');
    console.log('   ✅ index.html trouvé');
  } else {
    console.log('   ⚠️ Dossier dist existe mais index.html manquant');
  }
} else {
  console.log('   ⚠️ Dossier dist n\'existe pas (build non effectué)');
  console.log('   → Exécutez: npm run build');
}

// 5. Résumé
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 RÉSUMÉ');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const missingVars = Object.entries(envVars).filter(([_, value]) => !value || value.includes('❌'));
if (missingVars.length > 0) {
  console.log(`\n⚠️ ${missingVars.length} variable(s) d'environnement manquante(s):`);
  missingVars.forEach(([key]) => console.log(`   - ${key}`));
  console.log('\n💡 Configurez ces variables dans Vercel Dashboard → Settings → Environment Variables');
} else {
  console.log('\n✅ Toutes les variables d'environnement sont configurées');
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Diagnostic terminé');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

