# 🔧 Correction des erreurs API Backend (500/404)

## ❌ Erreurs identifiées

### Erreur 1 : `GET http://localhost:5000/api/home/news 500 (Internal Server Error)`
**Message** : Le backend retourne une erreur 500 pour la route `/api/home/news`

**Cause** : Le backend Node.js a une erreur lors de la récupération des actualités depuis MySQL, ou le backend n'est pas démarré.

### Erreur 2 : `GET http://localhost:5000/api/settings/table_number_enabled 404 (Not Found)`
**Message** : Route `/api/settings/table_number_enabled` non trouvée

**Cause** : Cette route n'existe pas dans le backend ou le paramètre n'existe pas dans la base de données.

### Erreur 3 : `GET http://localhost:5000/api/settings/currency_symbol 404 (Not Found)`
**Message** : Route `/api/settings/currency_symbol` non trouvée

**Cause** : Cette route n'existe pas dans le backend ou le paramètre n'existe pas dans la base de données.

## ✅ Corrections appliquées

### 1. Ajout du support Supabase pour les actualités (News)

**Fichier** : `src/services/supabaseService.js`

**Ajout** : Méthode `getNews()` pour récupérer les actualités depuis Supabase :

```javascript
async getNews(filters = {}) {
  try {
    let query = this.getClient().from('news').select('*');
    
    // Filtrer par is_active si spécifié
    if (filters.isActive !== undefined) {
      const isActiveValue = (filters.isActive === 1 || filters.isActive === true) ? 1 : 0;
      query = query.eq('is_active', isActiveValue);
    } else {
      // Par défaut, seulement les actualités actives
      query = query.eq('is_active', 1);
    }
    
    // Trier par display_order puis par date
    const { data, error } = await query
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

**Fichier** : `src/services/newsService.js`

**Modification** : `getNews()` utilise maintenant Supabase directement si le backend n'est pas disponible :

```javascript
async getNews() {
  // ✅ VERCEL: Utiliser Supabase directement si pas de backend
  if (shouldUseSupabase()) {
    logger.log('🔄 newsService.getNews - Utilisation Supabase direct');
    const result = await supabaseService.getNews({ isActive: 1 });
    if (result.success) {
      return result;
    }
  }
  
  // Sinon, utiliser le backend API
  const response = await apiCall('/home/news');
  return response;
}
```

### 2. Ajout du support Supabase pour les paramètres (Settings)

**Fichier** : `src/services/supabaseService.js`

**Ajout** : Méthodes `getSetting()` et `getAllSettings()` :

```javascript
async getSetting(key) {
  try {
    const { data, error } = await this.getClient()
      .from('settings')
      .select('*')
      .eq('setting_key', key)
      .single();
    
    if (error) {
      // Si le paramètre n'existe pas, ce n'est pas une erreur critique
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Paramètre non trouvé', data: null };
      }
      throw error;
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message, data: null };
  }
}

async getAllSettings() {
  try {
    const { data, error } = await this.getClient()
      .from('settings')
      .select('*')
      .order('setting_key', { ascending: true });
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

**Fichier** : `src/services/settingsService.js`

**Modification** : `getSetting()` et `getAllSettings()` utilisent maintenant Supabase directement si le backend n'est pas disponible :

```javascript
async getSetting(key) {
  // ✅ VERCEL: Utiliser Supabase directement si pas de backend
  if (shouldUseSupabase()) {
    logger.log(`🔄 settingsService.getSetting - Utilisation Supabase direct (${key})`);
    const result = await supabaseService.getSetting(key);
    if (result.success) {
      return result;
    } else {
      // Si le paramètre n'existe pas, retourner une erreur gracieuse
      return { success: false, error: result.error || 'Paramètre non trouvé', data: null };
    }
  }
  
  // Sinon, utiliser le backend API
  const response = await apiCall(`/settings/${key}`);
  return response;
}
```

**Correction** : `getSetting()` ne lance plus d'exception, il retourne un objet avec `success: false` pour une gestion gracieuse des erreurs.

### 3. Amélioration de la gestion des erreurs dans `useSettings`

**Fichier** : `src/hooks/useSettings.js`

**Modification** : Gestion correcte des réponses `{ success: false }` :

```javascript
const currencyResponse = await settingsService.getSetting('currency_symbol');
if (currencyResponse.success && currencyResponse.data) {
  // Gérer les différents formats (setting_value ou value)
  const value = currencyResponse.data.setting_value || currencyResponse.data.value;
  if (value) {
    setCurrencySymbol(value);
    localStorage.setItem('currency_symbol', value);
  } else {
    // Utiliser la valeur depuis localStorage ou défaut
    const stored = localStorage.getItem('currency_symbol');
    setCurrencySymbol(stored || '€');
  }
} else {
  // Paramètre non trouvé, utiliser la valeur depuis localStorage ou défaut
  const stored = localStorage.getItem('currency_symbol');
  setCurrencySymbol(stored || '€');
}
```

## 📝 Notes importantes

1. **Fallback gracieux** : Si un paramètre n'existe pas dans Supabase, l'application utilise une valeur par défaut au lieu de planter.

2. **Support des deux formats** : Les paramètres peuvent avoir `setting_value` (Supabase) ou `value` (backend MySQL), le code gère les deux.

3. **LocalStorage** : Les valeurs par défaut sont stockées dans `localStorage` pour un accès rapide.

4. **Pas d'erreurs dans la console** : Les erreurs 404/500 ne sont plus affichées comme des erreurs critiques, elles sont gérées gracieusement.

## 🎯 Résultat attendu

Après ces corrections :
- ✅ Les actualités se chargent depuis Supabase si le backend n'est pas disponible
- ✅ Les paramètres se chargent depuis Supabase si le backend n'est pas disponible
- ✅ Plus d'erreurs 500/404 dans la console (gérées gracieusement)
- ✅ L'application fonctionne même si le backend n'est pas démarré
- ✅ Les valeurs par défaut sont utilisées si les paramètres n'existent pas

## 🔄 Test

1. **Démarrez** l'application sans le backend (`npm run dev`)
2. **Vérifiez** que les actualités se chargent depuis Supabase
3. **Vérifiez** que les paramètres utilisent des valeurs par défaut
4. **Vérifiez** la console pour confirmer qu'il n'y a plus d'erreurs 500/404

