import { createBrowserClient } from "@supabase/ssr";

// ✅ VERCEL + VITE: Utiliser import.meta.env pour Vite
// Support des deux formats pour compatibilité
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
                    import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
                    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERREUR: Variables Supabase manquantes dans client.ts');
  throw new Error('Variables Supabase manquantes. Vérifiez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY');
}

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );

