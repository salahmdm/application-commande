-- ============================================================================
-- Migration : Permettre user_id NULL dans la table orders
-- ============================================================================
-- Cette migration permet de créer des commandes pour les utilisateurs
-- qui ne sont pas encore présents dans la table users de Supabase
-- ============================================================================
-- Date : 2025
-- ============================================================================

-- Étape 1 : Supprimer la contrainte NOT NULL sur user_id
ALTER TABLE "orders" 
  ALTER COLUMN "user_id" DROP NOT NULL;

-- Étape 2 : Modifier la contrainte de clé étrangère pour permettre NULL
-- (La contrainte FOREIGN KEY existe déjà, mais elle doit permettre NULL)
-- Si la contrainte existe déjà, cette commande peut échouer, c'est normal
-- Dans ce cas, la contrainte FOREIGN KEY permet déjà NULL

-- Vérification : La contrainte FOREIGN KEY existante devrait déjà permettre NULL
-- car PostgreSQL permet les valeurs NULL dans les clés étrangères par défaut

-- Note : Les commandes avec user_id NULL sont utilisées pour :
-- - Les invités (nom stocké dans les notes)
-- - Les commandes issues du kiosk
-- - Les commandes créées avant la synchronisation complète des comptes

