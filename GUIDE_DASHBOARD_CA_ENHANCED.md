# 📊 Guide - Dashboard CA Amélioré

## 🎯 Vue d'ensemble

Le nouveau Dashboard CA offre une analyse complète et en temps réel de votre activité avec :

- ✅ **Chiffre d'affaires global** (TTC, HT, TVA, comparaison période précédente)
- ✅ **Top produits vendus** (graphique horizontal + détails)
- ✅ **Heures de pointe** (histogramme 24h + analyse par période)
- ✅ **Répartition par catégorie** (pie chart + pourcentages)
- ✅ **Stock critique** (alertes visuelles + barres de progression)
- ✅ **Graphique d'évolution** (barres/ligne/aires)
- ✅ **Design responsive** (mobile, tablette, PC)

## 🚀 Activation du nouveau Dashboard

### Option 1 : Remplacer l'ancien fichier

```bash
# Sauvegarder l'ancien (optionnel)
mv src/views/dashboard/DashboardCA.jsx src/views/dashboard/DashboardCA-Old.jsx

# Renommer le nouveau
mv src/views/dashboard/DashboardCA-Enhanced.jsx src/views/dashboard/DashboardCA.jsx
```

### Option 2 : Utiliser en parallèle

Modifier `src/App.jsx` pour ajouter une route vers le nouveau dashboard :

```jsx
import DashboardCAEnhanced from './views/dashboard/DashboardCA-Enhanced';

// Dans vos routes :
<Route path="/dashboard-ca-v2" element={<DashboardCAEnhanced />} />
```

## 📁 Fichiers créés

### Backend (API)
- ✅ Routes ajoutées dans `database/admin-api.js` :
  - `GET /api/admin/analytics/top-products-period` - Top produits
  - `GET /api/admin/analytics/peak-hours` - Heures de pointe
  - `GET /api/admin/analytics/category-distribution` - Répartition catégories
  - `GET /api/admin/analytics/critical-stock` - Stock critique

### Frontend (Composants)
- ✅ `src/components/dashboard/TopProducts.jsx` - Top produits vendus
- ✅ `src/components/dashboard/PeakHours.jsx` - Heures de pointe
- ✅ `src/components/dashboard/CategoryDistribution.jsx` - Répartition par catégorie
- ✅ `src/components/dashboard/CriticalStock.jsx` - Stock critique

### Frontend (Page principale)
- ✅ `src/views/dashboard/DashboardCA-Enhanced.jsx` - Dashboard complet

### Services
- ✅ `src/services/dashboardService.js` - Nouvelles fonctions ajoutées

## 🎨 Fonctionnalités principales

### 1️⃣ Filtres de période

**Périodes prédéfinies :**
- Aujourd'hui
- Cette semaine (lundi → aujourd'hui)
- Ce mois (1er jour → aujourd'hui)
- Période personnalisée (sélection dates)

**Navigation temporelle :**
- Boutons ← → pour naviguer entre les périodes
- Affichage de la période active

### 2️⃣ KPIs Globaux

**5 indicateurs principaux :**
1. **CA TTC Total** (avec variation vs période précédente)
2. **CA HT Total** (hors taxes)
3. **TVA Collectée** (10%)
4. **Nombre de commandes** (avec variation)
5. **Panier moyen** (avec variation)

**Calculs automatiques :**
- CA HT = CA TTC / 1.10
- TVA = CA TTC - CA HT
- Panier moyen = CA TTC / Nombre commandes
- Croissance = ((Actuel - Précédent) / Précédent) × 100

### 3️⃣ Top Produits Vendus

**Affichage :**
- Graphique horizontal avec couleurs distinctes
- Badges de classement (#1 Or, #2 Argent, #3 Bronze)
- Liste détaillée avec quantité vendue et CA généré

**Données affichées :**
- Nom du produit + catégorie
- Quantité totale vendue
- CA TTC généré
- Nombre de commandes

**Statistiques résumées :**
- CA total des top produits
- Produit #1
- Nombre total de commandes

### 4️⃣ Heures de Pointe

**Graphique histogramme 24h :**
- Barres colorées selon l'intensité (vert = pic, gris = faible)
- Icônes soleil/lune selon la période

**Analyse par période :**
- Matin (6h-12h)
- Midi (12h-14h)
- Après-midi (14h-18h)
- Soir (18h-22h)

**Top 3 heures :**
- Les 3 heures les plus actives
- Nombre de commandes + CA par heure

**Statistiques globales :**
- Total commandes
- CA total
- Moyenne commandes/heure

### 5️⃣ Répartition par Catégorie

**Graphique circulaire interactif :**
- Couleurs distinctes par catégorie
- Pourcentages affichés
- Hover pour mise en évidence

**Liste détaillée :**
- Nom + icône catégorie
- Pourcentage du CA total
- CA TTC généré
- Nombre d'articles vendus

**Barres de progression :**
- Visualisation graphique des pourcentages
- Animation fluide

**Statistiques :**
- Nombre de catégories
- Catégorie leader + pourcentage
- Total articles vendus

### 6️⃣ Stock Critique

**3 niveaux d'alerte :**
- 🔴 **Rupture** (stock = 0)
- 🟠 **Critique** (stock ≤ stock min)
- 🟡 **Bas** (stock ≤ stock min × 1.5)

**Affichage par produit :**
- Nom + catégorie
- Badge statut (couleur selon gravité)
- Barre de progression du stock
- Stock actuel, minimum et manquant

**Statistiques d'alerte :**
- Nombre de ruptures
- Nombre critiques
- Nombre stocks bas

**Action recommandée :**
- Message personnalisé selon les alertes
- Suggestion de réapprovisionnement

### 7️⃣ Graphique Évolution CA

**3 types de graphiques :**
- Barres (défaut)
- Ligne
- Aires

**Données affichées :**
- CA TTC par jour (ou par heure si "Aujourd'hui")
- Hover pour détails

**Adaptation automatique :**
- Mode "Aujourd'hui" → affichage par heure (8h, 9h, 10h...)
- Autres modes → affichage par jour

## 📱 Responsive Design

### Mobile (< 768px)
- Layout en 1 colonne
- Cards empilées verticalement
- Graphiques adaptés
- Boutons avec icônes uniquement

### Tablette (768px - 1024px)
- Layout en 2 colonnes
- Graphiques optimisés
- Textes lisibles

### Desktop (> 1024px)
- Grille 2 colonnes pour les sections
- KPIs en 5 colonnes
- Tous les détails visibles
- Graphiques pleine largeur

## 🎨 Couleurs et design

**Palette :**
- 🟢 Vert : CA, succès, disponible
- 🔵 Bleu : CA HT, informations
- 🟣 Violet : TVA, catégories
- 🟡 Jaune/Ambre : Commandes, avertissements
- 🔴 Rouge : Alertes, ruptures
- 🟠 Orange : Stock critique

**Animations :**
- Transitions douces (duration-200, duration-300)
- Hover effects sur toutes les cartes
- Barres de progression animées
- Graphiques interactifs

## 🔄 Actualisation des données

**Automatique :**
- Au chargement de la page
- Au changement de filtre
- Au changement de période

**Manuelle :**
- Bouton "Actualiser" dans l'en-tête
- Icône de chargement pendant la requête

## 💾 Export des données

**Bouton "Exporter" :**
- À implémenter selon vos besoins
- Suggestions : PDF, Excel, CSV

## ⚡ Performance

**Optimisations :**
- Chargement parallèle des données (Promise.all)
- Requêtes SQL optimisées
- Composants React optimisés
- Rendu conditionnel selon loading

**Temps de réponse typique :**
- < 500ms pour toutes les données combinées
- Affichage progressif si nécessaire

## 🐛 Dépannage

### Aucune donnée n'apparaît
1. Vérifiez que le backend est démarré
2. Vérifiez que vous avez des commandes dans la période sélectionnée
3. Ouvrez la console (F12) pour voir les erreurs

### Graphiques ne s'affichent pas
1. Vérifiez que Recharts est installé : `npm install recharts`
2. Vérifiez qu'il n'y a pas d'erreurs dans la console

### Stock critique vide
- C'est normal si tous vos produits ont un stock suffisant ! ✅

### Dates incorrectes
- Vérifiez le fuseau horaire de votre serveur MySQL
- Vérifiez le format des dates dans l'API

## 🔧 Personnalisation

### Changer les couleurs
Modifier les classes Tailwind dans les composants :
- `from-green-600` → votre couleur
- `bg-green-50` → votre couleur claire

### Changer le nombre de top produits
Dans `DashboardCA-Enhanced.jsx` :
```jsx
dashboardService.getTopProductsPeriod(startDate, endDate, 8) // Changer 8
```

### Ajouter des sections
Créez un nouveau composant dans `src/components/dashboard/` et ajoutez-le dans la grille.

## 📞 Support

En cas de problème, vérifiez :
1. Logs backend (console serveur)
2. Logs frontend (F12 → Console)
3. Requêtes réseau (F12 → Network)

---

**✨ Profitez de votre nouveau Dashboard CA !**

