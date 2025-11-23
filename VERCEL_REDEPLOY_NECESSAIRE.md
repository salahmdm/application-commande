# ⚠️ Redéploiement Vercel nécessaire

## 🔍 Problème

L'erreur `column products.is_active does not exist` persiste sur Vercel même après la correction du code.

**Cause** : Vercel n'a pas encore redéployé avec le nouveau code qui utilise `is_available` au lieu de `is_active`.

## ✅ Solution

J'ai créé un commit vide pour forcer un redéploiement sur Vercel.

### Vérification

1. **Allez dans Vercel Dashboard → Deployments**
2. **Vérifiez** qu'un nouveau déploiement est en cours ou vient de se terminer
3. **Attendez** 2-3 minutes que le déploiement se termine
4. **Testez** l'application déployée

### Si l'erreur persiste après le redéploiement

1. **Videz le cache du navigateur** (Ctrl+Shift+Delete)
2. **Ouvrez l'application en navigation privée**
3. **Vérifiez** que l'URL de la requête contient `is_available` et non `is_active`

### Vérification du code déployé

Dans la console du navigateur, vérifiez l'URL de la requête :
- ❌ **Ancien** : `...&is_active=eq.true&...`
- ✅ **Nouveau** : `...&is_available=eq.true&...`

## 📋 Checklist

- [ ] Nouveau déploiement Vercel détecté
- [ ] Déploiement terminé avec succès
- [ ] Cache navigateur vidé
- [ ] URL de requête contient `is_available` (pas `is_active`)
- [ ] Produits s'affichent correctement


