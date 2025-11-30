-- Script SQL pour créer tarek@test.com dans Supabase
-- À exécuter dans Supabase Dashboard > SQL Editor

-- Créer l'utilisateur tarek@test.com
INSERT INTO users (
  email, 
  password_hash, 
  first_name, 
  last_name, 
  role, 
  is_active, 
  email_verified, 
  created_at, 
  updated_at
)
VALUES (
  'tarek@test.com',
  '$2b$10$SUPABASE_USER_NO_PASSWORD_REQUIRED',
  'Tarek',
  '',
  'client',
  1,
  0,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  updated_at = NOW(),
  is_active = 1;

-- Vérifier que l'utilisateur a été créé
SELECT id, email, first_name, last_name, role, is_active, created_at 
FROM users 
WHERE email = 'tarek@test.com';

