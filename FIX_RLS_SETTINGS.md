# 🔧 Correction des erreurs 406 (RLS) pour la table `settings`

## ⚠️ Problème

Les erreurs `406 (Not Acceptable)` indiquent que la table `settings` est bloquée par les **Row Level Security (RLS)** de Supabase.

## ✅ Solution appliquée

Le code a été amélioré pour :
1. Détecter correctement les erreurs 406 (RLS)
2. Essayer automatiquement la table `app_settings` en fallback
3. Ne pas générer d'erreurs dans la console si les paramètres ne sont pas accessibles

## 🔍 Vérification dans Supabase

Pour vérifier et corriger les politiques RLS :

1. **Aller sur https://supabase.com/dashboard**
2. **Sélectionner votre projet**
3. **Aller dans Authentication → Policies**
4. **Vérifier les politiques pour la table `settings`**

### Option 1 : Désactiver RLS pour `settings` (si les paramètres doivent être publics)

```sql
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
```

### Option 2 : Créer une politique publique pour la lecture

```sql
CREATE POLICY "Allow public read access to settings"
ON settings
FOR SELECT
USING (true);
```

### Option 3 : Utiliser uniquement `app_settings` (recommandé)

Si vous préférez utiliser uniquement `app_settings`, vous pouvez :
1. Désactiver RLS pour `app_settings`
2. Ou créer une politique publique pour `app_settings`

```sql
-- Désactiver RLS pour app_settings
ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;

-- OU créer une politique publique
CREATE POLICY "Allow public read access to app_settings"
ON app_settings
FOR SELECT
USING (true);
```

## 📝 Notes

- Les erreurs 406 ne sont **pas critiques** : l'application continue de fonctionner
- Le code essaie automatiquement `app_settings` en fallback
- Si les deux tables sont bloquées, l'application utilise des valeurs par défaut

