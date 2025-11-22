# Guide de Migration MySQL → Supabase

## État de la migration

✅ **Service Supabase créé** : `database/supabase-backend-service.js`
✅ **Imports modifiés** : `admin-api.js` utilise maintenant `supabaseService` au lieu de `pool`
⚠️ **Routes à adapter** : 170 occurrences de `pool.query` à remplacer

## Patterns de migration

### 1. SELECT simple
**Avant (MySQL):**
```javascript
const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
```

**Après (Supabase):**
```javascript
const [rows] = await supabaseService.select('users', {
  where: { id: userId }
});
```

### 2. SELECT avec JOIN
**Avant (MySQL):**
```javascript
const [rows] = await pool.query(`
  SELECT o.*, u.email 
  FROM orders o
  LEFT JOIN users u ON o.user_id = u.id
  WHERE o.id = ?
`, [orderId]);
```

**Après (Supabase):**
```javascript
const { data: orders } = await supabaseService.getClient()
  .from('orders')
  .select('*, users(email)')
  .eq('id', orderId);
const rows = [orders];
```

### 3. INSERT
**Avant (MySQL):**
```javascript
const [result] = await pool.query(
  'INSERT INTO users (email, password_hash) VALUES (?, ?)',
  [email, passwordHash]
);
const userId = result.insertId;
```

**Après (Supabase):**
```javascript
const [result] = await supabaseService.insert('users', {
  email,
  password_hash: passwordHash
});
const userId = result[0].id;
```

### 4. UPDATE
**Avant (MySQL):**
```javascript
await pool.query(
  'UPDATE users SET email = ? WHERE id = ?',
  [newEmail, userId]
);
```

**Après (Supabase):**
```javascript
await supabaseService.update('users', { id: userId }, { email: newEmail });
```

### 5. DELETE
**Avant (MySQL):**
```javascript
await pool.query('DELETE FROM users WHERE id = ?', [userId]);
```

**Après (Supabase):**
```javascript
await supabaseService.delete('users', { id: userId });
```

### 6. COUNT
**Avant (MySQL):**
```javascript
const [[countRow]] = await pool.query('SELECT COUNT(*) AS count FROM users');
const count = countRow.count;
```

**Après (Supabase):**
```javascript
const [countRow] = await supabaseService.count('users');
const count = countRow.count;
```

### 7. JSON_ARRAYAGG (PostgreSQL)
**Avant (MySQL):**
```sql
SELECT JSON_ARRAYAGG(JSON_OBJECT('id', id, 'name', name)) AS items
FROM products
```

**Après (PostgreSQL/Supabase):**
```javascript
// Récupérer les données puis les formater en JavaScript
const [products] = await supabaseService.select('products');
const items = products.map(p => ({ id: p.id, name: p.name }));
```

## Routes prioritaires à migrer

1. ✅ Authentification (`/api/auth/login`, `/api/auth/register`)
2. ✅ Kiosk (`/api/kiosk/*`)
3. ⚠️ Produits (`/api/products/*`)
4. ⚠️ Commandes (`/api/orders/*`, `/api/admin/orders/*`)
5. ⚠️ Utilisateurs (`/api/admin/users/*`)
6. ⚠️ Dashboard (`/api/admin/dashboard/*`)

## Notes importantes

- **RLS (Row Level Security)** : Supabase utilise RLS. Assurez-vous d'utiliser la `SERVICE_ROLE_KEY` pour bypass RLS dans le backend.
- **Transactions** : Supabase supporte les transactions via `rpc()` ou plusieurs appels séquentiels.
- **JSON** : PostgreSQL utilise `JSONB` au lieu de `JSON` de MySQL.
- **Dates** : Utiliser `TIMESTAMP` au lieu de `DATETIME`.

## Prochaines étapes

1. Adapter les routes d'authentification
2. Adapter les routes kiosk
3. Adapter les routes produits
4. Adapter les routes commandes
5. Adapter les routes admin
6. Tester toutes les fonctionnalités
7. Supprimer les dépendances MySQL

