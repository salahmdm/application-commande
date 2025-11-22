# 📋 Plan d'Implémentation - Mode Kiosk (Borne Tactile)

## ✅ État d'Avancement

Toutes les étapes principales sont **complétées** ! Le mode kiosk est maintenant intégré dans l'application.

---

## 🎯 Objectif

Mettre en place un mode borne ("Kiosk Mode") dans l'application, avec une interface dédiée pour les bornes tactiles en restaurant, inspirée des bornes McDonald's, KFC, Burger King.

---

## 📁 Structure Créée

### Frontend (`src/kiosk/`)

```
src/kiosk/
├── KioskApp.jsx                    # Application principale kiosk
├── hooks/
│   └── useInactivityReset.js       # Hook pour reset après inactivité
├── views/
│   ├── WelcomeScreen.jsx           # Écran d'accueil
│   ├── LanguageSelection.jsx       # Sélection langue
│   ├── CategoryView.jsx            # Vue catégories
│   ├── ProductView.jsx             # Vue produits
│   ├── CartView.jsx                # Vue panier
│   ├── PaymentView.jsx             # Vue paiement
│   └── OrderConfirmation.jsx       # Confirmation commande
```

### Store & Services

- `src/store/kioskStore.js` - Store Zustand pour l'état kiosk
- `src/services/kioskService.js` - Service API pour les appels kiosk

### Backend

- `database/migrations/sql/add-kiosk-role.sql` - Migration SQL pour ajouter le rôle 'kiosk'
- Routes ajoutées dans `database/admin-api.js` :
  - `POST /api/kiosk/login` - Authentification borne
  - `GET /api/kiosk/categories` - Catégories optimisées
  - `GET /api/kiosk/products` - Produits optimisés
  - `POST /api/kiosk/orders` - Création commande depuis borne
  - `GET /api/kiosk/orders/:orderNumber` - Statut commande

### Sécurité

- Middleware `requireKiosk` ajouté dans `database/security-middleware.js`
- Token long durée (30 jours) pour les bornes
- Cookie HTTP-only pour le token kiosk

---

## 🔧 Étapes d'Implémentation

### ✅ Étape 1 : Migration Base de Données

**Fichier :** `database/migrations/sql/add-kiosk-role.sql`

```sql
ALTER TABLE users 
MODIFY COLUMN role ENUM('client', 'manager', 'admin', 'kiosk') NOT NULL DEFAULT 'client';
```

**Action requise :** Exécuter cette migration SQL sur votre base de données MySQL.

---

### ✅ Étape 2 : Créer un Utilisateur Kiosk

Pour créer une borne, vous devez créer un utilisateur avec le rôle `kiosk` :

```sql
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
VALUES (
  'kiosk-001@blossom-cafe.local',
  '$2b$10$...', -- Hash bcrypt du secret (générer avec bcrypt)
  'Borne',
  'Kiosk 001',
  'kiosk',
  TRUE
);
```

**Note :** Le `email` servira de `kioskId` et le `password_hash` contiendra le hash du `kioskSecret`.

---

### ✅ Étape 3 : Configuration de la Borne

Chaque borne doit être configurée avec :
- **kioskId** : L'email de l'utilisateur kiosk (ex: `kiosk-001@blossom-cafe.local`)
- **kioskSecret** : Le secret en clair (sera hashé côté backend)

Ces valeurs peuvent être stockées en dur dans le code de la borne ou dans un fichier de configuration sécurisé.

---

### ✅ Étape 4 : Accès à l'Interface Kiosk

L'interface kiosk est accessible via l'URL :
```
http://localhost:5173/kiosk
```

L'application détecte automatiquement le mode kiosk et affiche `KioskApp` au lieu de l'application principale.

---

## 🎨 Caractéristiques de l'Interface

### Design
- **UI très grande** : Optimisée pour écrans 27"-32"
- **Zones tactiles** : Boutons minimum 120px de hauteur
- **Navigation simplifiée** : Workflow linéaire sans complexité
- **Images produits** : Mise en avant des visuels

### Workflow
1. **Écran d'accueil** → Bouton "Commencer votre commande"
2. **Choix langue** → Français, English, العربية
3. **Catégories** → Grille de catégories avec grandes zones tactiles
4. **Produits** → Grille de produits avec bouton + pour ajouter
5. **Panier** → Liste claire, modification quantités, type de commande
6. **Paiement** → Sélection mode de paiement (CB / Espèces)
7. **Confirmation** → Numéro de commande, retour auto après 20s

### Gestion Inactivité
- **Reset automatique** après 60 secondes d'inactivité
- Retour à l'écran d'accueil
- Panier vidé automatiquement

---

## 🔐 Sécurité

### Authentification
- Token JWT long durée (30 jours)
- Cookie HTTP-only pour le token
- Middleware `requireKiosk` pour protéger les routes
- Rate limiting sur `/api/kiosk/login`

### Isolation
- Interface complètement séparée de l'app principale
- Store Zustand isolé (sessionStorage)
- Pas d'accès aux vues client/manager/admin depuis kiosk

---

## 🚀 Prochaines Étapes (Optionnel)

### Améliorations Possibles

1. **Personnalisation Produits**
   - Ajouter une vue pour personnaliser les produits (suppléments, retirer ingrédients)
   - Intégrer dans le workflow

2. **Impression Ticket**
   - Intégration avec une imprimante de tickets
   - API pour déclencher l'impression

3. **Gestion Table**
   - Sélection du numéro de table pour "sur place"
   - Affichage sur l'écran de confirmation

4. **Multi-langue**
   - Traductions complètes pour toutes les vues
   - Fichiers de traduction i18n

5. **Mode Plein Écran**
   - Détection automatique du mode kiosk
   - Passage en plein écran automatique
   - Désactivation des raccourcis clavier

6. **Monitoring**
   - Dashboard admin pour voir l'état des bornes
   - Statistiques d'utilisation par borne

---

## 📝 Notes Importantes

1. **Migration SQL** : N'oubliez pas d'exécuter la migration `add-kiosk-role.sql` avant d'utiliser le mode kiosk.

2. **Création Utilisateur Kiosk** : Chaque borne doit avoir son propre utilisateur avec le rôle `kiosk`.

3. **Token Long Durée** : Les tokens kiosk durent 30 jours. En cas de compromission, révoquer l'utilisateur kiosk dans la base de données.

4. **Test** : Tester le workflow complet avant déploiement en production.

5. **Styles** : Les styles utilisent Tailwind CSS. Assurez-vous que Tailwind est bien configuré.

---

## 🐛 Dépannage

### La borne ne s'authentifie pas
- Vérifier que l'utilisateur kiosk existe en base
- Vérifier que le `kioskSecret` correspond au hash en base
- Vérifier les logs backend pour les erreurs

### L'interface ne s'affiche pas
- Vérifier que l'URL contient `/kiosk`
- Vérifier la console pour les erreurs React
- Vérifier que `KioskApp.jsx` est bien importé dans `App.jsx`

### Les produits ne se chargent pas
- Vérifier que le token kiosk est valide
- Vérifier les logs backend
- Vérifier que les routes `/api/kiosk/*` sont bien enregistrées

---

## ✅ Checklist de Déploiement

- [ ] Migration SQL exécutée
- [ ] Utilisateur(s) kiosk créé(s) en base
- [ ] Configuration kioskId/kioskSecret sur chaque borne
- [ ] Test du workflow complet
- [ ] Test de l'inactivité (reset après 60s)
- [ ] Test de création de commande
- [ ] Vérification sécurité (token, cookies)
- [ ] Test multi-langue (si applicable)

---

**Date de création :** 2025-01-XX  
**Version :** 1.0.0  
**Statut :** ✅ Implémentation complète

