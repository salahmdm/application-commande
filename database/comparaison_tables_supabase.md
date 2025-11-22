# Comparaison des Tables Supabase vs Schéma SQL

## ✅ Tables identiques (nom et nombre de colonnes)

| Table Supabase | Colonnes Supabase | Colonnes SQL | Statut |
|----------------|-------------------|--------------|--------|
| **app_settings** (paramètres de l'application) | 7 | 7 | ✅ Identique |
| **audit_logs** (journaux d'audit) | 10 | 10 | ✅ Identique |
| **categories** (catégories) | 9 | 9 | ✅ Identique |
| **favorites** (favoris) | 4 | 4 | ✅ Identique |
| **ingredients** (ingrédients) | 15 | 15 | ✅ Identique |
| **inventory** (inventaire) | 9 | 9 | ✅ Identique |
| **inventory_logs** (journaux d'inventaire) | 9 | 9 | ✅ Identique |
| **loyalty_rewards** (récompenses de fidélité) | 12 | 12 | ✅ Identique |
| **loyalty_transactions** (transactions de fidélité) | 8 | 8 | ✅ Identique |
| **news** (nouvelles) | 15 | 15 | ✅ Identique |
| **notifications** (notifications) | 10 | 10 | ✅ Identique |
| **order_items** (articles_commandés) | 9 | 9 | ✅ Identique |
| **order_payments** (paiements_commande) | 7 | 7 | ✅ Identique |
| **orders** (ordres) | 24 | 24 | ✅ Identique |
| **products** (produits) | 17 | 17 | ✅ Identique |
| **promo_codes** (codes promotionnels) | 12 | 12 | ✅ Identique |
| **refresh_tokens** (jetons_d'actualisation) | 6 | 6 | ✅ Identique |
| **reviews** (avis) | 10 | 10 | ✅ Identique |
| **settings** (paramètres) | 8 | 8 | ✅ Identique |
| **shopping_list** (liste de courses) | 10 | 10 | ✅ Identique |
| **users** (utilisateurs) | ? (non spécifié) | 15 | ⚠️ À vérifier |

## ⚠️ Observations

1. **Table "catégories" en double** : Dans votre liste Supabase, "catégories" apparaît deux fois (une avec 0 lignes, une avec 4 lignes). Cela pourrait indiquer une duplication ou une erreur d'affichage.

2. **Table "users"** : Le nombre de colonnes n'est pas spécifié dans votre liste. Le schéma SQL définit 15 colonnes pour `users`.

## 📊 Résumé

- **Total de tables dans le schéma SQL** : 21 tables
- **Total de tables dans Supabase** : 21 tables (en comptant "catégories" une seule fois)
- **Tables correspondantes** : 20/21 (users à vérifier)

## ✅ Conclusion

**Les tables sont identiques** entre le schéma SQL et Supabase, à l'exception de :
- La table `users` dont le nombre de colonnes doit être vérifié (devrait être 15)
- La duplication apparente de "catégories" dans Supabase

**Recommandation** : Vérifier manuellement la table `users` dans Supabase pour confirmer qu'elle contient bien 15 colonnes comme défini dans le schéma SQL.

