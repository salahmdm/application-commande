# 📊 Rapport Système - Application Blossom Café

## Vue d'ensemble

**Blossom Café** est une application complète de gestion de restaurant/café avec trois interfaces distinctes :
- **Application principale** (Port 3000) : Interface web complète pour clients, managers et administrateurs
- **Borne Kiosk** (Port 3010) : Interface tactile optimisée pour bornes en restaurant
- **Écran Cuisine** (Port 3050) : Interface dédiée à la gestion des commandes en cuisine

---

## 🏗️ Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API (Port 5000)                  │
│  - Node.js + Express                                        │
│  - MySQL Database                                           │
│  - WebSocket (Socket.io) pour temps réel                   │
│  - Authentification JWT                                     │
│  - API REST complète                                        │
└─────────────────────────────────────────────────────────────┘
                            ↕
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Application  │  │   Kiosk     │  │   Cuisine    │
│  Principale  │  │  (Borne)    │  │   (Écran)    │
│  Port 3000   │  │  Port 3010  │  │  Port 3050   │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Technologies Utilisées

- **Frontend** : React 18, Vite, Tailwind CSS, Zustand (state management)
- **Backend** : Node.js, Express, MySQL
- **Temps réel** : Socket.io (WebSocket)
- **Authentification** : JWT (JSON Web Tokens)
- **Sécurité** : CSRF protection, Rate limiting, Validation

---

## 1️⃣ APPLICATION PRINCIPALE (Port 3000)

### Description
Interface web complète accessible depuis n'importe quel navigateur, destinée aux clients, managers et administrateurs.

### Fonctionnalités Détaillées

#### 👤 Interface Client

**1. Page d'Accueil**
- Affichage des produits par catégories
- Bannières promotionnelles
- Section "Actualités & Événements" avec images
- Programme de fidélité avec points et récompenses
- Informations du restaurant

**2. Catalogue Produits**
- Affichage des produits avec images
- Filtrage par catégories
- Recherche de produits
- Détails produits (prix, description, disponibilité)
- Badges "Nouveau" et "Promo"

**3. Panier d'Achat**
- Ajout/retrait de produits
- Modification des quantités
- Sélection type de commande (Sur place / À emporter)
- Application de codes promo
- Calcul automatique des totaux
- Système de fidélité intégré (utilisation de points)

**4. Commande**
- Création de commande
- Paiement (carte, espèces)
- Confirmation de commande
- Suivi de commande en temps réel
- Historique des commandes

**5. Programme de Fidélité**
- Affichage des points accumulés
- Liste des récompenses disponibles
- Progression vers les prochaines récompenses
- Utilisation des points pour des réductions

**6. Compte Utilisateur**
- Inscription / Connexion
- Profil utilisateur
- Historique des commandes
- Gestion des points de fidélité

#### 👨‍💼 Interface Manager

**1. Tableau de Bord**
- Vue d'ensemble des ventes
- Statistiques en temps réel
- Graphiques de performance
- Commandes en cours
- Alertes de stock

**2. Gestion des Commandes**
- Liste de toutes les commandes
- Filtrage par statut, date, client
- Modification des statuts
- Annulation de commandes
- Impression de tickets
- Export des données

**3. Point de Vente (POS)**
- Interface de caisse
- Création de commandes manuelles
- Gestion des paiements
- Impression de reçus
- Gestion des tables (si applicable)

**4. Gestion des Produits**
- Création / Modification / Suppression
- Gestion des catégories
- Upload d'images
- Gestion des prix
- Gestion de la disponibilité
- Badges "Nouveau" et "Promo"

**5. Gestion de l'Inventaire**
- Suivi des stocks
- Alertes de stock faible
- Ajustements de stock
- Historique des mouvements
- Liste de courses automatique

**6. Codes Promo**
- Création de codes promo
- Définition de réductions (pourcentage ou montant fixe)
- Dates de validité
- Limites d'utilisation

**7. Récompenses Fidélité**
- Création de récompenses
- Définition des points requis
- Gestion des récompenses actives

#### 👨‍💻 Interface Administrateur

**1. Toutes les fonctionnalités Manager +**

**2. Gestion des Utilisateurs**
- Création / Modification / Suppression
- Attribution des rôles (Admin, Manager, Client)
- Gestion des permissions
- Historique des connexions

**3. Paramètres du Restaurant**
- Informations du restaurant
- Horaires d'ouverture
- Coordonnées de contact
- Configuration générale

**4. Gestion de la Page d'Accueil**
- Édition des actualités
- Upload d'images pour actualités
- Gestion de l'ordre d'affichage
- Badges "Nouveau"

**5. Tableau de Bord Avancé**
- Statistiques détaillées
- Export de rapports
- Analyse des ventes
- Performance des produits

**6. Configuration Système**
- Variables d'environnement
- Paramètres de sécurité
- Configuration de la base de données

---

## 2️⃣ BORNE KIOSK (Port 3010)

### Description
Interface tactile optimisée pour bornes interactives en restaurant, inspirée des bornes McDonald's, KFC et Burger King.

### Caractéristiques Techniques
- **Design** : Interface tactile avec gros boutons
- **Navigation** : Workflow simplifié et intuitif
- **Multi-langue** : Support FR/EN/AR
- **Reset automatique** : Retour à l'accueil après inactivité (configurable)
- **Authentification** : Automatique avec rôle "kiosk"

### Workflow de Commande

#### Étape 1 : Écran d'Accueil (WelcomeScreen)
- Animation d'accueil
- Logo du restaurant
- Bouton "Commencer" grand et visible
- Design attractif avec gradients

#### Étape 2 : Sélection de Langue (LanguageSelection)
- Choix entre Français, Anglais, Arabe
- Interface visuelle avec drapeaux
- Sauvegarde de la préférence

#### Étape 3 : Type de Commande (OrderTypeSelection)
- **Sur place** : Commande à consommer dans le restaurant
- **À emporter** : Commande à emporter
- Sélection visuelle avec grandes zones tactiles

#### Étape 4 : Écran Principal (HomeScreen)
**Style Burger King avec :**
- **Sidebar latérale** : Liste des catégories avec dégradé marron/rouge
- **Header de catégorie** : Dégradé dynamique selon la catégorie
- **Grille de produits** : Cards style BK avec :
  - Image du produit
  - Nom et prix
  - Badge "Nouveau" si applicable
  - Badge "Promo" si applicable
  - Bouton d'ajout au panier
- **Bouton panier flottant** : Affiche le nombre d'articles
- **Sidebar panier** : Panier latéral avec :
  - Liste des articles
  - Quantités modifiables
  - Total
  - Bouton "Passer au paiement"

#### Étape 5 : Vue Panier (CartView)
- Liste complète des articles
- Modification des quantités (+/-)
- Suppression d'articles
- Changement de type de commande (Sur place / À emporter)
- Total calculé automatiquement
- Bouton "Passer au paiement"

#### Étape 6 : Vue Paiement (PaymentView)
**Fonctionnalités :**
- **Récapitulatif de commande** :
  - Liste des articles avec quantités
  - Sous-total
  - Réduction (code promo)
  - Total final
- **Modification du panier** :
  - Possibilité de modifier les quantités
  - Suppression d'articles
- **Codes promo** :
  - Saisie de code promo
  - Validation en temps réel
  - Affichage de la réduction
  - Suppression du code promo
- **Méthodes de paiement** :
  - Carte bancaire
  - Espèces
- **Bouton "Valider le paiement"** : Création de la commande

#### Étape 7 : Confirmation (OrderConfirmation)
- Numéro de commande
- Récapitulatif
- Message de confirmation
- Bouton "Nouvelle commande" (reset)

### Fonctionnalités Spécifiques Kiosk

**1. Gestion du Panier**
- Stockage local (Zustand store)
- Persistance entre les étapes
- Calcul automatique des totaux
- Gestion des quantités

**2. Codes Promo**
- Validation côté serveur
- Calcul automatique de la réduction
- Affichage du montant économisé
- Support pourcentage et montant fixe

**3. Authentification Automatique**
- Authentification automatique au démarrage
- Rôle "kiosk" spécial
- Pas de connexion utilisateur requise

**4. Reset Automatique**
- Retour à l'accueil après inactivité (configurable, actuellement désactivé)
- Nettoyage du panier
- Réinitialisation de l'état

**5. Design Responsive**
- Optimisé pour écrans tactiles
- Tailles de boutons adaptées
- Navigation intuitive
- Animations fluides

**6. Gestion des Erreurs**
- Messages d'erreur clairs
- Retry automatique en cas d'échec
- Fallback si le backend est indisponible

---

## 3️⃣ ÉCRAN CUISINE (Port 3050)

### Description
Interface dédiée à la gestion des commandes en cuisine, affichant les commandes en temps réel avec possibilité de changer leur statut.

### Caractéristiques Techniques
- **Temps réel** : WebSocket pour mises à jour instantanées
- **Affichage horizontal** : Commandes en ligne avec scroll horizontal
- **Auto-refresh** : Rafraîchissement automatique toutes les 5 secondes
- **Filtrage** : Affichage des commandes actives ou terminées
- **Tri** : Par temps écoulé (plus anciennes à gauche)

### Interface Utilisateur

#### En-tête
- **Horloge** : Heure actuelle mise à jour chaque seconde
- **Bouton "Archives"** : Afficher/masquer les commandes terminées
  - Style : Rectangle avec coins arrondis
  - Ombre portée
  - Taille augmentée (30% plus large)
  - Police en majuscules
- **Indicateurs de scroll** : Flèches gauche/droite fixes en bas pour navigation

#### Zone de Commandes
- **Affichage horizontal** : Toutes les commandes en une seule ligne
- **Scroll horizontal** : Navigation avec flèches ou scroll de souris
- **Espacement** : Légère marge entre les tickets et les bords de l'écran

### Carte de Commande (KitchenOrderCard)

Chaque commande est affichée dans une carte avec :

#### En-tête
- **Numéro de commande** : Format simplifié (ex: "1" au lieu de "0001")
- **Heure de création** : Format HH:MM
- **Badge type de commande** :
  - "Sur place" : Badge vert
  - "À emporter" : Badge orange
- **Statut** : Badge coloré selon le statut

#### Corps de la Carte
- **Liste des articles** :
  - Nom du produit
  - Quantité (badge)
  - Notes spéciales (si présentes) avec icône d'alerte
  - Allergènes (si présents)
- **Taille des articles** : Augmentée pour meilleure lisibilité
- **Espacement** : Optimisé pour la lecture rapide

#### Pied de Carte
- **Total** : Montant total de la commande (en bas à droite)
- **Bouton d'action** : Change selon le statut :
  - **"COMMENCER"** : Si statut "En attente" → Passe à "En cours"
  - **"COMMANDE TERMINÉE"** : Si statut "En cours" → Passe à "Terminée"
  - **"Marquer comme servie"** : Si statut "Terminée" → Passe à "Remise"

#### Chronomètre
- **Temps écoulé** : Affiché en haut à droite (format HH:MM:SS)
- **Mise à jour** : Chaque seconde
- **Temps de traitement** : Pour les commandes terminées, affiche le temps total de traitement en minutes

### Statuts de Commande

#### 1. En attente (PENDING)
- **Couleur** : Rouge
- **Action** : Bouton "COMMENCER"
- **Transition** : → "En cours"

#### 2. En cours (PREPARING)
- **Couleur** : Bleu
- **Action** : Bouton "COMMANDE TERMINÉE"
- **Transition** : → "Terminée"
- **Chronomètre** : Démarre au passage en "En cours"

#### 3. Terminée (READY)
- **Couleur** : Vert émeraude
- **Action** : Bouton "Marquer comme servie"
- **Transition** : → "Remise"
- **Temps de traitement** : Affiche le temps total en minutes

#### 4. Remise (SERVED)
- **Couleur** : Gris
- **Action** : Aucune (statut final)
- **Affichage** : Visible uniquement dans les archives

#### 5. Annulée (CANCELLED)
- **Couleur** : Rouge foncé
- **Action** : Aucune (statut final)
- **Affichage** : Visible uniquement dans les archives

### Fonctionnalités Spécifiques Cuisine

**1. Mises à Jour en Temps Réel**
- **WebSocket** : Connexion automatique au serveur
- **Nouvelles commandes** : Apparaissent automatiquement
- **Changements de statut** : Synchronisés en temps réel
- **Reconnexion automatique** : En cas de déconnexion

**2. Rafraîchissement Automatique**
- **Intervalle** : Toutes les 5 secondes
- **Silencieux** : Pas de rechargement visible
- **Cache désactivé** : Toujours les données les plus récentes

**3. Filtrage des Commandes**
- **Mode actif** (par défaut) : Affiche uniquement "En attente" et "En cours"
- **Mode archives** : Affiche uniquement les commandes "Terminées"
- **Toggle** : Bouton "Archives" pour basculer

**4. Tri des Commandes**
- **Par temps écoulé** : Plus anciennes à gauche
- **Priorité** : Commandes "En attente" en premier
- **Ordre chronologique** : Respect de l'ordre d'arrivée

**5. Division des Tickets**
- **Grandes commandes** : Si une commande a beaucoup d'articles, elle peut être divisée en plusieurs tickets
- **Continuation** : Les tickets suivants affichent "Suite" en en-tête
- **Dernier ticket** : Affiche le bouton d'action

**6. Gestion des Erreurs**
- **Indicateur de connexion** : Affiche l'état de la connexion
- **Retry automatique** : Tentative de reconnexion en cas d'échec
- **Messages d'erreur** : Affichage clair des problèmes

**7. Design Optimisé**
- **Taille des tickets** : 20% plus grands que l'original
- **Hauteur adaptative** : S'adapte au nombre d'articles
- **Bordures** : Réduites pour plus d'espace
- **Espacement** : Optimisé pour la lisibilité

---

## 🔄 Flux de Commande Complet

### 1. Création de Commande

#### Via Application Principale
1. Client sélectionne des produits
2. Ajoute au panier
3. Choisit type de commande (Sur place / À emporter)
4. Applique un code promo (optionnel)
5. Valide la commande
6. Paiement
7. Commande créée avec statut "En attente"

#### Via Kiosk
1. Sélection de la langue
2. Choix du type de commande
3. Navigation dans les catégories
4. Ajout de produits au panier
5. Application d'un code promo (optionnel)
6. Paiement
7. Commande créée avec statut "En attente"

### 2. Traitement en Cuisine

1. **Commande apparaît sur l'écran cuisine** (statut "En attente")
2. **Cuisinier clique sur "COMMENCER"**
   - Statut passe à "En cours"
   - Chronomètre démarre
3. **Préparation de la commande**
4. **Cuisinier clique sur "COMMANDE TERMINÉE"**
   - Statut passe à "Terminée"
   - Temps de traitement calculé et affiché
5. **Service**
   - Statut passe à "Remise" (via application principale ou automatique)
   - Commande archivée

### 3. Synchronisation Temps Réel

- **WebSocket** : Toutes les interfaces reçoivent les mises à jour instantanément
- **Application principale** : Le client voit le statut de sa commande en temps réel
- **Kiosk** : Peut afficher le statut si nécessaire
- **Cuisine** : Voit les nouvelles commandes immédiatement

---

## 🔐 Système d'Authentification

### Rôles Utilisateurs

1. **Client** : Accès à l'interface client uniquement
2. **Manager** : Accès client + gestion (commandes, produits, inventaire)
3. **Admin** : Accès complet à toutes les fonctionnalités
4. **Kiosk** : Rôle spécial pour les bornes (authentification automatique)

### Sécurité

- **JWT Tokens** : Authentification par tokens
- **Cookies HTTP-only** : Stockage sécurisé des tokens
- **CSRF Protection** : Protection contre les attaques CSRF
- **Rate Limiting** : Limitation des requêtes
- **Validation** : Validation de toutes les entrées
- **HTTPS** : En production, toutes les communications sont chiffrées

---

## 📊 Base de Données

### Tables Principales

- **users** : Utilisateurs (clients, managers, admins)
- **products** : Produits du menu
- **categories** : Catégories de produits
- **orders** : Commandes
- **order_items** : Articles des commandes
- **promo_codes** : Codes promo
- **loyalty_rewards** : Récompenses de fidélité
- **inventory** : Inventaire et stocks
- **news** : Actualités et événements

---

## 🚀 Déploiement

### Frontend (Vercel)
- **Application principale** : Déployée sur Vercel
- **Kiosk** : Déployée séparément (si nécessaire)
- **Cuisine** : Déployée séparément (si nécessaire)

### Backend
- **API** : Déployée sur Railway, Render, Heroku ou VPS
- **Base de données** : MySQL (hébergée séparément)

### Variables d'Environnement

**Frontend (Vercel)** :
- `VITE_API_URL` : URL du backend (ex: `https://backend.railway.app`)

**Backend** :
- `CORS_ORIGINS` : Domaines autorisés
- `JWT_SECRET` : Secret pour les tokens JWT
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` : Configuration MySQL
- `NODE_ENV` : `production`

---

## 📱 Responsive Design

Toutes les interfaces sont responsive et s'adaptent à différentes tailles d'écran :
- **Desktop** : Interface complète
- **Tablette** : Adaptation des layouts
- **Mobile** : Navigation optimisée
- **Kiosk** : Optimisé pour écrans tactiles grands formats
- **Cuisine** : Optimisé pour écrans larges horizontaux

---

## 🎨 Design System

### Couleurs
- **Principal** : Violet/Pourpre (#9333ea, #7c3aed)
- **Secondaire** : Bleu (#3b82f6)
- **Accent** : Rose (#ec4899)
- **Succès** : Vert émeraude (#10b981)
- **Alerte** : Orange (#f59e0b)
- **Erreur** : Rouge (#ef4444)

### Typographie
- **Titres** : Font bold/black
- **Corps** : Font regular
- **Tailles** : Responsive selon l'interface

### Composants
- **Boutons** : Styles cohérents avec variants (primary, outline, etc.)
- **Cards** : Design moderne avec ombres et bordures arrondies
- **Modals** : Overlay avec animations
- **Notifications** : Toast notifications

---

## 🔧 Maintenance et Support

### Logs
- **Frontend** : Logs dans la console navigateur
- **Backend** : Logs structurés avec niveaux (info, warn, error)
- **Production** : Logs centralisés

### Monitoring
- **Santé du serveur** : Endpoint `/api/health`
- **Diagnostics** : Panel de diagnostic intégré
- **Métriques** : Suivi des performances

### Mises à Jour
- **Déploiement continu** : Via Git (GitHub → Vercel)
- **Rollback** : Possibilité de revenir à une version précédente
- **Tests** : Tests avant déploiement en production

---

## 📝 Conclusion

L'application **Blossom Café** est un système complet et moderne de gestion de restaurant avec :

✅ **3 interfaces distinctes** optimisées pour leurs usages spécifiques
✅ **Temps réel** avec WebSocket pour synchronisation instantanée
✅ **Sécurité** robuste avec authentification JWT et protection CSRF
✅ **Design moderne** et responsive
✅ **Fonctionnalités complètes** : commandes, paiements, fidélité, inventaire, etc.
✅ **Scalable** : Architecture modulaire et extensible

Le système est prêt pour la production et peut être déployé sur différentes plateformes (Vercel, Railway, Render, etc.).

---

**Version du document** : 1.0  
**Date** : 2024  
**Auteur** : Système Blossom Café

