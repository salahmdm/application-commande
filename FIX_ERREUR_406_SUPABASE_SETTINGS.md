# 🔧 Correction de l'erreur 406 Supabase Settings

## ❌ Erreur identifiée

**Erreur** : `GET https://brygzpxiemwthickhuqb.supabase.co/rest/v1/settings?select=*&setting_key=eq.table_number_enabled 406 (Not Acceptable)`

**Cause** : L'erreur 406 (Not Acceptable) de Supabase indique généralement que :
1. Les politiques RLS (Row Level Security) bloquent l'accès à la table `settings`
2. La table `settings` n'existe pas dans Supabase
3. Les en-têtes de la requête ne sont pas corrects

## ✅ Corrections appliquées

### 1. Fallback vers `app_settings`

**Fichier** : `src/services/supabaseService.js` - méthode `getSetting()`

**Modification** : Si l'accès à la table `settings` est bloqué (erreur 406), essayer automatiquement avec la table `app_settings` :

```javascript
async getSetting(key) {
  try {
    // ✅ Essayer d'abord la table 'settings'
    let { data, error } = await this.getClient()
      .from('settings')
      .select('*')
      .eq('setting_key', key)
      .single();

    // ✅ Si erreur 406 (RLS bloqué), essayer 'app_settings'
    if (error && (error.code === 'PGRST301' || error.status === 406)) {
      console.warn(`⚠️ Supabase - Table 'settings' inaccessible, essai avec 'app_settings'`);
      
      const result = await this.getClient()
        .from('app_settings')
        .select('*')
        .eq('setting_key', key)
        .single();
      
      // Convertir app_settings vers le format settings
      return { 
        success: true, 
        data: {
          id: result.data.id,
          setting_key: result.data.setting_key,
          setting_value: result.data.setting_value,
          value: result.data.setting_value, // Alias pour compatibilité
          description: result.data.description
        }
      };
    }
    
    // ... reste du code
  }
}
```

### 2. Gestion gracieuse des erreurs RLS

**Modification** : Si les deux tables sont bloquées par RLS, retourner une erreur gracieuse au lieu de planter :

```javascript
if (result.error.code === 'PGRST301' || result.error.status === 406) {
  console.warn(`⚠️ Supabase - Accès refusé à app_settings pour ${key} (RLS probablement activé)`);
  return { success: false, error: 'Paramètre non accessible (RLS)', data: null };
}
```

### 3. Conversion de format pour compatibilité

**Modification** : Ajouter un alias `value` pour compatibilité avec le format attendu par le frontend :

```javascript
return { 
  success: true, 
  data: {
    ...data,
    value: data.setting_value // Alias pour compatibilité
  }
};
```

### 4. Même logique pour `getAllSettings()`

**Modification** : Appliquer la même logique de fallback pour `getAllSettings()` :

```javascript
async getAllSettings() {
  try {
    // ✅ Essayer d'abord la table 'settings'
    let { data, error } = await this.getClient()
      .from('settings')
      .select('*')
      .order('setting_key', { ascending: true });

    // ✅ Si erreur 406 (RLS bloqué), essayer 'app_settings'
    if (error && (error.code === 'PGRST301' || error.status === 406)) {
      const result = await this.getClient()
        .from('app_settings')
        .select('*')
        .order('setting_key', { ascending: true });
      
      // Convertir app_settings vers le format settings
      data = result.data.map(item => ({
        id: item.id,
        setting_key: item.setting_key,
        setting_value: item.setting_value,
        value: item.setting_value, // Alias pour compatibilité
        description: item.description
      }));
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

## 📝 Notes importantes

1. **Fallback automatique** : Si `settings` est bloqué, l'application essaie automatiquement `app_settings`.

2. **Gestion gracieuse** : Si les deux tables sont bloquées, l'application retourne une erreur non-bloquante et utilise des valeurs par défaut.

3. **Compatibilité** : Le code gère les deux formats de données (`setting_value` pour Supabase, `value` pour compatibilité).

4. **RLS** : Si vous avez activé RLS sur les tables `settings` ou `app_settings`, vous devez créer des politiques pour permettre l'accès public en lecture. Voir `GUIDE_RLS_SUPABASE.md`.

## 🎯 Résultat attendu

Après ces corrections :
- ✅ Plus d'erreur 406 dans la console (gérée gracieusement)
- ✅ L'application essaie automatiquement `app_settings` si `settings` est bloqué
- ✅ Les valeurs par défaut sont utilisées si les paramètres ne sont pas accessibles
- ✅ L'application fonctionne même si les tables sont bloquées par RLS

## 🔄 Solution alternative : Désactiver RLS ou créer des politiques

Si vous voulez que les paramètres soient accessibles publiquement, vous pouvez :

1. **Désactiver RLS** sur la table `settings` ou `app_settings` dans Supabase Dashboard
2. **Créer une politique RLS** pour permettre l'accès public en lecture :

```sql
-- Dans Supabase SQL Editor
CREATE POLICY "Allow public read access to settings"
ON settings FOR SELECT
USING (true);

-- Ou pour app_settings
CREATE POLICY "Allow public read access to app_settings"
ON app_settings FOR SELECT
USING (true);
```

## 🔍 Test

1. **Rechargez** l'application dans le navigateur (Ctrl+F5)
2. **Vérifiez** la console : l'erreur 406 devrait être gérée gracieusement
3. **Vérifiez** que les paramètres utilisent des valeurs par défaut si non accessibles
4. **Vérifiez** que l'application fonctionne normalement

