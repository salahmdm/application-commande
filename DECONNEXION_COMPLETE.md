# 🚪 Déconnexion Complète de Tous les Comptes

## ✅ Fonction Créée

J'ai créé une fonction `logoutAll()` qui déconnecte de **TOUS les comptes** et nettoie **TOUT le stockage**.

## 📋 Ce qui est nettoyé

1. ✅ **Application principale** (authStore)
2. ✅ **Kiosk** (kioskStore)
3. ✅ **localStorage** (token, user, cart, etc.)
4. ✅ **sessionStorage** (toutes les données de session)
5. ✅ **Cookies** (côté serveur et client)
6. ✅ **Stores Zustand** (réinitialisation complète)

## 🚀 Utilisation

### Option 1 : Depuis la console du navigateur

Ouvrez la console (F12) et exécutez :

```javascript
// Importer et exécuter la fonction
import('/src/utils/logoutAll.js').then(module => {
  module.logoutAll().then(() => {
    console.log('✅ Déconnexion complète effectuée');
    window.location.href = '/';
  });
});
```

### Option 2 : Utiliser le bouton dans l'interface

J'ai créé un composant `LogoutAllButton` que vous pouvez ajouter n'importe où dans votre interface :

```jsx
import LogoutAllButton from './components/common/LogoutAllButton';

// Dans votre composant
<LogoutAllButton variant="default" />
```

### Option 3 : Depuis le code

```javascript
import { logoutAll } from './utils/logoutAll';

// Déconnexion complète
await logoutAll();
```

## 🔧 Script Rapide pour Console

Copiez-collez ceci dans la console du navigateur :

```javascript
(async () => {
  // Nettoyer localStorage
  localStorage.clear();
  
  // Nettoyer sessionStorage
  sessionStorage.clear();
  
  // Supprimer tous les cookies
  document.cookie.split(";").forEach((c) => {
    const eqPos = c.indexOf("=");
    const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
  });
  
  // Appeler l'API de déconnexion
  try {
    await fetch('http://localhost:5000/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch (e) {}
  
  // Rediriger
  window.location.href = '/';
  console.log('✅ Déconnexion complète effectuée');
})();
```

## 📝 Fichiers Créés

1. **`src/utils/logoutAll.js`** : Fonction principale de déconnexion
2. **`src/components/common/LogoutAllButton.jsx`** : Bouton réutilisable

---

**Utilisez l'une de ces méthodes pour vous déconnecter complètement !**

