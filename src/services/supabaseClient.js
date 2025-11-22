/**
 * Client Supabase pour l'application
 * Remplace les connexions MySQL
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://crkpunuoliiqyuxtgqlr.supabase.co';
// Utiliser la clé depuis .env.local ou directement (pour développement)
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                    process.env.SUPABASE_KEY || 
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNya3B1bnVvbGlpcXl1eHRncWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTQ5NzcsImV4cCI6MjA3OTM3MDk3N30.5_ck1BCakmbijIr8tbIkvfrNPwllmnMEAgEq6gCN2c0';

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export default supabase;

