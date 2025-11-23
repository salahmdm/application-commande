# 📦 Guide : Transfert des données vers le nouveau compte Supabase

## ⚠️ Important

**Je n'ai PAS encore transféré les données** de l'ancien compte vers le nouveau compte.

J'ai seulement :
- ✅ Mis à jour le code pour pointer vers le nouveau compte
- ✅ Créé le script de transfert

## 📋 Ce qui a été fait

1. ✅ **Code mis à jour** : Tous les fichiers de code pointent maintenant vers le nouveau compte Supabase
2. ✅ **Tables créées** : Vous avez exécuté `CREATE_ALL_TABLES_SUPABASE.sql` dans le nouveau compte
3. ❌ **Données non transférées** : Les données (produits, catégories, utilisateurs, commandes, etc.) ne sont pas encore dans le nouveau compte

## 🚀 Comment transférer les données

### Option 1 : Script automatique (recommandé)

1. **Installez les dépendances** (si ce n'est pas déjà fait) :
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Exécutez le script de transfert** :
   ```bash
   node database/transfer-supabase-to-supabase.js
   ```

Le script va :
- Récupérer toutes les données de l'ancien compte
- Les insérer dans le nouveau compte
- Respecter l'ordre des dépendances (tables sans dépendances d'abord)
- Afficher un résumé détaillé

### Option 2 : Export/Import manuel

1. **Dans l'ancien compte Supabase** :
   - Allez dans **Table Editor**
   - Pour chaque table, cliquez sur **Export** → **CSV**
   - Téléchargez les fichiers CSV

2. **Dans le nouveau compte Supabase** :
   - Allez dans **Table Editor**
   - Pour chaque table, cliquez sur **Import** → **CSV**
   - Uploadez les fichiers CSV

**⚠️ Important** : Importez dans l'ordre des dépendances :
1. `categories`, `settings`, `app_settings`, `inventory`, `promo_codes`, `news`
2. `users`
3. `ingredients`, `products`
4. `favorites`, `refresh_tokens`, `shopping_list`, `loyalty_rewards`, etc.
5. `orders`
6. `order_items`, `order_payments`, `notifications`, etc.

## 📝 Informations des comptes

### Ancien compte (source)
- URL : `https://crkpunuoliiqyuxtgqlr.supabase.co`
- Clé : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNya3B1bnVvbGlpcXl1eHRncWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTQ5NzcsImV4cCI6MjA3OTM3MDk3N30.5_ck1BCakmbijIr8tbIkvfrNPwllmnMEAgEq6gCN2c0`

### Nouveau compte (destination)
- URL : `https://brygzpxiemwthickhuqb.supabase.co`
- Clé : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A`

## ✅ Checklist

- [x] Tables créées dans le nouveau compte
- [x] Code mis à jour pour pointer vers le nouveau compte
- [ ] **Données transférées de l'ancien compte vers le nouveau** ⬅️ **À FAIRE**
- [ ] Policies RLS exécutées dans le nouveau compte
- [ ] Variables d'environnement configurées dans Vercel
- [ ] Test de l'application

## 🎯 Prochaines étapes

1. **Exécutez le script de transfert** : `node database/transfer-supabase-to-supabase.js`
2. **Vérifiez les données** dans le nouveau compte Supabase
3. **Exécutez les policies RLS** : `SUPABASE_RLS_POLICIES_SIMPLE.sql`
4. **Configurez les variables Vercel** avec les nouvelles informations


