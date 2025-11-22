# 🔄 Plan de Migration MySQL → Supabase

## ⚠️ Important : L'API seule ne suffit pas !

Pour migrer vers Supabase, il faut :

1. ✅ **Créer les services Supabase** (déjà fait : `supabaseService.js`)
2. ⏳ **Adapter toutes les requêtes SQL** (MySQL → PostgreSQL)
3. ⏳ **Remplacer le backend MySQL** (`admin-api.js`)
4. ⏳ **Mettre à jour les services frontend**
5. ⏳ **Migrer les données**

---

## 📋 Étape 1 : Préparation

### Fichiers créés ✅
- ✅ `.env.local` - Variables d'environnement Supabase
- ✅ `src/utils/supabase/server.ts` - Client serveur
- ✅ `src/utils/supabase/client.ts` - Client navigateur
- ✅ `src/utils/supabase/middleware.ts` - Client middleware
- ✅ `src/services/supabaseService.js` - Service Supabase de base

### À installer
```bash
npm install @supabase/ssr @supabase/supabase-js
```

---

## 📋 Étape 2 : Migration du Schéma

### Déjà fait ✅
- ✅ `database/schema_supabase_blossom_cafe_*.sql` - Schéma SQL PostgreSQL
- ✅ `database/export_supabase_csv_*/` - Données en CSV

### Actions requises
1. **Importer le schéma dans Supabase** :
   - Ouvrir Supabase Dashboard → SQL Editor
   - Copier le contenu de `database/schema_supabase_blossom_cafe_*.sql`
   - Exécuter le script SQL

2. **Importer les données** :
   - Supabase Dashboard → Table Editor
   - Pour chaque table, utiliser "Import data"
   - Sélectionner le fichier CSV correspondant depuis `database/export_supabase_csv_*/`

---

## 📋 Étape 3 : Adapter le Backend

### Fichier principal : `database/admin-api.js`

**Problème actuel** :
- Utilise `mysql2` avec pool de connexions
- 157+ requêtes SQL directes
- Syntaxe MySQL spécifique

**Solution** :
Créer un nouveau backend qui utilise Supabase au lieu de MySQL.

### Options

#### Option A : Backend Next.js API Routes (Recommandé)
Créer des routes API dans Next.js qui utilisent Supabase :

```
src/app/api/
├── users/
│   ├── route.js          # GET, POST /api/users
│   └── [id]/
│       └── route.js      # GET, PUT, DELETE /api/users/:id
├── products/
│   └── route.js
├── orders/
│   └── route.js
└── auth/
    └── route.js
```

#### Option B : Adapter `admin-api.js`
Remplacer toutes les requêtes MySQL par des appels Supabase.

---

## 📋 Étape 4 : Différences MySQL → PostgreSQL/Supabase

### Syntaxe SQL

| MySQL | PostgreSQL/Supabase |
|-------|---------------------|
| `SELECT * FROM users WHERE email = ?` | `SELECT * FROM users WHERE email = $1` |
| `LIMIT 10 OFFSET 20` | `LIMIT 10 OFFSET 20` (identique) |
| `NOW()` | `NOW()` (identique) |
| `AUTO_INCREMENT` | `SERIAL` ou `BIGSERIAL` |
| `JSON_ARRAYAGG()` | `json_agg()` ou `array_agg()` |
| Backticks `` ` `` | Guillemets doubles `"` |
| `IFNULL()` | `COALESCE()` |

### Types de données

| MySQL | PostgreSQL |
|-------|------------|
| `INT` | `INTEGER` |
| `VARCHAR(255)` | `VARCHAR(255)` |
| `TEXT` | `TEXT` |
| `DATETIME` | `TIMESTAMP` |
| `JSON` | `JSONB` |
| `ENUM` | `VARCHAR` + `CHECK` constraint |

---

## 📋 Étape 5 : Mettre à jour les Services Frontend

### Fichiers à modifier

1. **`src/services/api.js`**
   - Remplacer `API_BASE_URL = 'http://localhost:5000/api'`
   - Par des appels directs à Supabase ou nouvelles routes API

2. **Services spécifiques** :
   - `src/services/authService.js` → Utiliser Supabase Auth
   - `src/services/productService.js` → Utiliser `supabaseService`
   - `src/services/orderService.js` → Utiliser `supabaseService`
   - `src/services/kioskService.js` → Utiliser `supabaseService`

---

## 📋 Étape 6 : Authentification

### Option A : Supabase Auth (Recommandé)
Utiliser l'authentification intégrée de Supabase :
- Email/Password
- OAuth (Google, Facebook, etc.)
- Magic Links

### Option B : Authentification personnalisée
Garder votre système actuel mais stocker les sessions dans Supabase.

---

## 📋 Étape 7 : Migration des Données

### Ordre recommandé
1. **Tables de référence** (sans dépendances) :
   - `categories`
   - `ingredients`
   - `settings`

2. **Tables utilisateurs** :
   - `users`
   - `refresh_tokens`

3. **Tables produits** :
   - `products`
   - `inventory`

4. **Tables commandes** :
   - `orders`
   - `order_items`
   - `order_payments`

5. **Tables relationnelles** :
   - `favorites`
   - `notifications`
   - `loyalty_transactions`

---

## 🚀 Plan d'Action Recommandé

### Phase 1 : Préparation (1-2 jours)
- [x] Créer les fichiers Supabase de base
- [ ] Installer les dépendances
- [ ] Importer le schéma dans Supabase
- [ ] Importer les données

### Phase 2 : Backend (3-5 jours)
- [ ] Créer les routes API Next.js
- [ ] Adapter les requêtes SQL
- [ ] Tester chaque endpoint

### Phase 3 : Frontend (2-3 jours)
- [ ] Mettre à jour les services
- [ ] Adapter l'authentification
- [ ] Tester toutes les fonctionnalités

### Phase 4 : Tests & Déploiement (1-2 jours)
- [ ] Tests complets
- [ ] Migration en production
- [ ] Vérification post-migration

---

## ⚠️ Points d'Attention

1. **Row Level Security (RLS)** : Configurer les politiques de sécurité dans Supabase
2. **Performance** : Supabase a des limites de requêtes (plan gratuit : 500 MB, 2 GB bandwidth)
3. **Transactions** : Adapter les transactions MySQL vers Supabase
4. **Stored Procedures** : Convertir en fonctions PostgreSQL
5. **Triggers** : Adapter les triggers MySQL vers PostgreSQL

---

## 📞 Besoin d'aide ?

Pour chaque étape, je peux vous aider à :
- Créer les fichiers nécessaires
- Adapter le code
- Résoudre les problèmes de migration

**Dites-moi par quelle étape vous voulez commencer !**

