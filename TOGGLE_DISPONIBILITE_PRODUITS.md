# ⚡ SYSTÈME DE TOGGLE DISPONIBILITÉ PRODUITS

## ✅ IMPLÉMENTATION COMPLÈTE

### 1. Route Backend ✅
**Fichier:** `database/admin-api.js`

```javascript
PATCH /api/admin/products/:id/toggle
```

**Protection:**
- ✅ `authenticateToken` - Authentification requise
- ✅ `requireManager` - **Accessible aux managers ET admins**

**Fonctionnement:**
1. Récupère l'état actuel (`is_available`)
2. Inverse l'état (actif → inactif ou inactif → actif)
3. Met à jour en base de données
4. Retourne le nouveau statut

**Réponse:**
```json
{
  "success": true,
  "message": "Produit activé" ou "Produit désactivé",
  "is_available": 1 ou 0
}
```

---

### 2. Frontend AdminProducts ✅
**Fichier:** `src/views/admin/AdminProducts.jsx`

**Fonction ajoutée:**
```javascript
const handleToggleAvailability = async (product) => {
  const newStatus = !product.is_available;
  const response = await apiCall(`/admin/products/${product.id}/toggle`, {
    method: 'PATCH'
  });
  
  if (response.success) {
    success(newStatus ? 'Produit activé !' : 'Produit désactivé');
    refresh(); // Recharge la liste
  }
};
```

---

### 3. Bouton Toggle UI ✅

#### Dans la table (desktop)
```jsx
<button
  onClick={() => handleToggleAvailability(product)}
  className={`
    p-2 rounded-xl transition-all duration-200 
    hover:scale-110 active:scale-95
    ${product.is_available 
      ? 'bg-green-50 text-green-600 hover:bg-green-100' 
      : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
    }
  `}
  title={product.is_available ? 'Désactiver le produit' : 'Activer le produit'}
>
  <Power className="w-4 h-4" />
</button>
```

**États visuels:**
- ✅ **Actif** : Vert (bg-green-50 text-green-600)
- ✅ **Inactif** : Gris (bg-neutral-100 text-neutral-400)

#### Dans les cards (mobile/tablette)
```jsx
<button
  onClick={() => handleToggleAvailability(product)}
  className={`
    flex items-center justify-center gap-2 px-4 py-2 
    rounded-xl transition-all duration-200 
    font-heading font-semibold active:scale-95
    ${product.is_available
      ? 'bg-green-50 text-green-600 hover:bg-green-100'
      : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
    }
  `}
>
  <Power className="w-4 h-4" />
</button>
```

---

### 4. Badge Statut ✅

#### Colonne "Statut" - Table Desktop
```jsx
<span className={`
  px-3 py-1 rounded-full text-xs font-heading font-bold
  ${product.is_available
    ? 'bg-green-100 text-green-700'
    : 'bg-neutral-200 text-neutral-600'
  }
`}>
  {product.is_available ? 'Actif' : 'Inactif'}
</span>
```

#### Section "Statut" - Cards Mobile
```jsx
<span className={`
  inline-block px-2 py-1 rounded-lg text-xs font-heading font-bold
  ${product.is_available
    ? 'bg-green-100 text-green-700'
    : 'bg-neutral-200 text-neutral-600'
  }
`}>
  {product.is_available ? 'Actif' : 'Inactif'}
</span>
```

---

## 🎨 DESIGN

### Icône Power
```jsx
import { Power } from 'lucide-react';

<Power className="w-4 h-4" />
```

### Couleurs d'États
```
Actif   : bg-green-50 text-green-600 (vert clair)
Inactif : bg-neutral-100 text-neutral-400 (gris)
Hover   : hover:bg-green-100 ou hover:bg-neutral-200
```

### Animations
```
hover:scale-110   → Zoom au survol
active:scale-95   → Feedback au clic
transition-all duration-200
```

---

## 🔧 FONCTIONNEMENT

### Workflow Utilisateur
```
1. Admin/Manager voit un produit dans la liste
2. Regarde le badge "Actif" ou "Inactif"
3. Clique sur le bouton Power (⚡)
4. Le statut change instantanément
5. ✅ Message de confirmation
6. ✅ Liste rechargée
7. ✅ Badge mis à jour
```

### Exemple Concret
```
État Initial:
┌────────────────────────┐
│ Cappuccino            │
│ 3.80€ | Stock: 100    │
│ [Actif] ⚡[✏️][🗑️]    │
└────────────────────────┘

Après clic sur Power:
┌────────────────────────┐
│ Cappuccino            │
│ 3.80€ | Stock: 100    │
│ [Inactif] ⚡[✏️][🗑️]  │
└────────────────────────┘

→ Message: "Produit désactivé"
→ Le client ne voit plus ce produit
```

---

## 🔐 PERMISSIONS

### Qui peut activer/désactiver ?
- ✅ **Admin** - Accès complet
- ✅ **Manager** - Peut toggle la disponibilité
- ❌ **Client** - Aucun accès

### Qui peut supprimer ?
- ✅ **Admin** - Uniquement
- ❌ **Manager** - Non (sécurité)
- ❌ **Client** - Non

**Route backend:**
```javascript
// Toggle: requireManager (admin + manager)
app.patch('/api/admin/products/:id/toggle', authenticateToken, requireManager, ...)

// Delete: requireAdmin (admin uniquement)
app.delete('/api/admin/products/:id', authenticateToken, requireAdmin, ...)
```

---

## 🎯 AVANTAGES

### Pour le Manager
- ✅ Peut désactiver un produit en rupture de stock
- ✅ Peut réactiver un produit disponible
- ✅ Pas besoin de l'admin pour gérer la disponibilité
- ✅ Action rapide (1 clic)

### Pour l'Admin
- ✅ Contrôle total des produits
- ✅ Toggle rapide
- ✅ Peut aussi supprimer définitivement

### Pour le Client
- ✅ Ne voit que les produits actifs
- ✅ Pas de confusion avec produits indisponibles
- ✅ Catalogue toujours à jour

---

## 📱 RESPONSIVE

### Desktop (Table)
```
Actions: [⚡] [✏️] [🗑️]
Taille: p-2 (petits boutons icônes)
```

### Mobile (Cards)
```
Actions:
┌────────────────────────┐
│ [⚡] [Modifier] [🗑️]   │
└────────────────────────┘
Taille: px-4 py-2 (boutons plus grands)
```

---

## 🔄 SYNCHRONISATION

### Backend → MySQL
```sql
UPDATE products 
SET is_available = ?  -- 0 ou 1
WHERE id = ?
```

### Frontend → Affichage
```javascript
refresh();  // Recharge la liste depuis MySQL
```

### Impact Client
```
Produit désactivé → N'apparaît plus dans:
  - ProductsView (catalogue)
  - HomeView (featured)
  - ManagerPOS (point de vente)
  
Produit réactivé → Réapparaît partout immédiatement
```

---

## ✅ TESTING

### Tester le Toggle:

#### En tant qu'Admin:
1. Connexion admin
2. Gestion Produits
3. Clic sur ⚡ d'un produit actif
4. ✅ Badge passe à "Inactif" (gris)
5. ✅ Message "Produit désactivé"
6. Clic à nouveau
7. ✅ Badge redevient "Actif" (vert)
8. ✅ Message "Produit activé"

#### En tant que Manager:
1. Connexion manager
2. Gestion Produits (même interface)
3. ✅ Peut toggle disponibilité
4. ❌ Ne peut PAS supprimer (bouton rouge absent ou désactivé)

#### Vérifier côté Client:
1. Connexion client
2. ProductsView
3. ✅ Produits inactifs n'apparaissent pas
4. Admin réactive un produit
5. Client rafraîchit (F5)
6. ✅ Produit réapparaît

---

## 📊 RÉSUMÉ

**Route backend:** ✅ PATCH `/api/admin/products/:id/toggle`  
**Permissions:** ✅ Manager + Admin  
**Frontend:** ✅ Bouton Power dans AdminProducts  
**Badge statut:** ✅ Vert (actif) / Gris (inactif)  
**Synchronisation:** ✅ MySQL ↔ Backend ↔ Frontend  

**Temps d'implémentation:** 10 minutes  
**Fonctionnalité:** Opérationnelle  

---

**Le système de toggle est prêt ! Manager et Admin peuvent maintenant activer/désactiver les produits en 1 clic ! ⚡**

