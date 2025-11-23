/**
 * Client Supabase pour l'application
 * Compatible Vercel + Vite
 * 
 * Vite : seules les variables préfixées par VITE_ sont exposées au client
 */

import { createClient } from '@supabase/supabase-js';

// Lecture des variables d'environnement (Vite)
// Valeurs par défaut pour assurer le fonctionnement même sans variables configurées
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://brygzpxiemwthickhuqb.supabase.co';

const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A';

// Logs pour diagnostic (toujours actifs pour voir la configuration)
const hasEnvVars = !!(import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL);
if (!hasEnvVars) {
  console.warn('⚠️ Supabase - Variables d\'environnement non détectées, utilisation des valeurs par défaut');
  console.warn('   → Configurez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans Vercel pour une meilleure sécurité');
}

if (import.meta.env.DEV || !hasEnvVars) {
  console.log('🔍 Supabase - Configuration :');
  console.log('   VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL || '❌ non défini (valeur par défaut utilisée)');
  console.log('   NEXT_PUBLIC_SUPABASE_URL:', import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '❌ non défini (valeur par défaut utilisée)');
  console.log('   VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ défini' : '❌ non défini (valeur par défaut utilisée)');
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ défini' : '❌ non défini (valeur par défaut utilisée)');
  console.log('   URL utilisée:', supabaseUrl);
}

// Création du client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export default supabase;
