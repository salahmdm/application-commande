/**
 * Client Supabase pour l'application
 * Compatible Vercel + Vite
 * 
 * Vite : seules les variables préfixées par VITE_ sont exposées au client
 */

import { createClient } from '@supabase/supabase-js';

// Lecture des variables d'environnement (Vite)
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Logs en développement uniquement
if (import.meta.env.DEV) {
  console.log('Supabase - Vérification des variables d\'environnement :');
  console.log('  VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL || 'non défini');
  console.log('  NEXT_PUBLIC_SUPABASE_URL:', import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 'non défini');
  console.log('  VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'défini' : 'non défini');
  console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'défini' : 'non défini');
}

// Sécurisation : empêche l’utilisation sans clés valides
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Variables Supabase manquantes. Assurez-vous que VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont définies dans Vercel.'
  );
}

// Création du client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export default supabase;
