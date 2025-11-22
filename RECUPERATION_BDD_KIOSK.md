# 📊 Récupération des Catégories et Produits depuis la BDD

## ✅ Configuration Actuelle

### Routes Backend

**Catégories** : `GET /api/kiosk/categories`
```sql
SELECT * FROM categories 
WHERE is_active = TRUE 
ORDER BY display_order ASC, name ASC
```

**Produits** : `GET /api/kiosk/products?categoryId=X`
```sql
SELECT 
  p.*,
  c.name as category_name,
  c.slug as category_slug,
  c.icon as category_icon
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_available = TRUE
[AND p.category_id = ?]
ORDER BY c.display_order ASC, p.name ASC
```

### Services Frontend

**kioskService.getCategories()**
- Appelle `/api/kiosk/categories`
- Logs détaillés pour debug
- Gestion d'erreurs complète

**kioskService.getProductsByCategory(categoryId)**
- Appelle `/api/kiosk/products?categoryId=X`
- Récupère TOUS les produits disponibles
- Logs détaillés pour debug

### Vues

**CategoryView**
- Charge les catégories au montage
- Affiche un message si aucune catégorie
- Logs détaillés dans la console

**ProductView**
- Charge tous les produits au montage
- Filtre par catégorie si sélectionnée
- Affiche un message si aucun produit
- Logs détaillés dans la console

## 🔍 Debug

### Console Navigateur

Ouvrez la console (F12) et vérifiez les logs :

1. **Authentification** :
   - `🔐 KioskApp - Authentification automatique...`
   - `✅ KioskApp - Authentification réussie`

2. **Catégories** :
   - `🔄 kioskService.getCategories - Appel API /kiosk/categories`
   - `📦 kioskService.getCategories - Réponse: {...}`
   - `✅ kioskService.getCategories - X catégories récupérées depuis la BDD`

3. **Produits** :
   - `🔄 kioskService.getProductsByCategory - Appel API /kiosk/products`
   - `📦 kioskService.getProductsByCategory - Réponse: {...}`
   - `✅ kioskService.getProductsByCategory - X produits récupérés depuis la BDD`

### Console Backend

Vérifiez les logs du serveur Node.js :

1. **Catégories** :
   - `✅ Kiosk - X catégories récupérées depuis la BDD`

2. **Produits** :
   - `📦 Kiosk - Récupération produits (tous)`
   - `✅ Kiosk - X produits récupérés depuis la BDD`

## 🚨 Problèmes Possibles

### 1. Authentification échoue
- Vérifier que l'utilisateur kiosk existe en BDD
- Vérifier les identifiants dans `KioskApp.jsx`
- Vérifier le cookie `kiosk_token` dans DevTools

### 2. Aucune catégorie/produit
- Vérifier que `is_active = TRUE` pour les catégories
- Vérifier que `is_available = TRUE` pour les produits
- Vérifier la connexion MySQL

### 3. Erreur 401/403
- Vérifier que le middleware `requireKiosk` fonctionne
- Vérifier que le token kiosk est valide
- Vérifier que le cookie est envoyé (credentials: 'include')

## ✅ Vérifications

1. **Backend** : Les routes exécutent bien les requêtes SQL
2. **Frontend** : Les services appellent les bonnes routes
3. **Authentification** : Login automatique au démarrage
4. **Logs** : Tous les logs sont affichés pour debug

---

**Statut** : ✅ Configuration complète pour récupérer catégories et produits depuis la BDD

