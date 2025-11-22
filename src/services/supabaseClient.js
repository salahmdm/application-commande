/**
 * Client Supabase pour l'application
 * Remplace les connexions MySQL
 * 
 * ✅ VERCEL + VITE: Utilise import.meta.env pour les variables d'environnement
 * Les variables doivent être préfixées par VITE_ pour être exposées au client
 */

import { createClient } from '@supabase/supabase-js';

// ✅ VERCEL + VITE: Utiliser import.meta.env (Vite) au lieu de process.env
// Support des deux formats pour compatibilité :
// - VITE_SUPABASE_URL (format Vite standard)
// - NEXT_PUBLIC_SUPABASE_URL (format Next.js, aussi supporté par Vercel)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
                    import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 
                    'https://brygzpxiemwthickhuqb.supabase.co';

const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
                    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                    import.meta.env.SUPABASE_KEY || 
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A';

// ✅ VERCEL: Logs de débogage pour vérifier les variables d'environnement
if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
  console.log('🔍 Supabase Client - Variables d\'environnement:');
  console.log('   VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL || 'non défini');
  console.log('   NEXT_PUBLIC_SUPABASE_URL:', import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 'non défini');
  console.log('   VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'défini' : 'non défini');
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'défini' : 'non défini');
  console.log('   URL utilisée:', supabaseUrl);
  console.log('   Clé utilisée:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'non définie');
}

// Vérifier que les variables sont bien définies
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERREUR: Variables Supabase manquantes !');
  console.error('   VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', import.meta.env.NEXT_PUBLIC_SUPABASE_URL);
  console.error('   VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'défini' : 'non défini');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'défini' : 'non défini');
}

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export default supabase;

