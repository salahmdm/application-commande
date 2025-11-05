# 🧾 Guide Complet - Tickets de Caisse

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Installation et Configuration](#installation-et-configuration)
3. [Utilisation](#utilisation)
4. [Architecture Technique](#architecture-technique)
5. [Personnalisation](#personnalisation)
6. [Dépannage](#dépannage)

---

## 🎯 Vue d'ensemble

La fonctionnalité de génération de tickets de caisse permet de créer des reçus professionnels en format PDF pour chaque commande. Les tickets peuvent être téléchargés, imprimés ou envoyés par email.

### Caractéristiques principales

✅ **Deux types de tickets**
- **Particulier** : Ticket simplifié avec prix TTC
- **Professionnel** : Ticket détaillé avec HT, TVA, SIRET, etc.

✅ **Informations complètes**
- En-tête personnalisé (logo, coordonnées du café)
- Détails de la commande (numéro, date, heure)
- Liste des produits avec quantités et prix
- Totaux (HT, TVA, TTC pour professionnels)
- Mode de paiement
- Mentions légales obligatoires

✅ **Actions disponibles**
- 📥 Télécharger en PDF
- 🖨️ Imprimer directement
- 📧 Envoyer par email (en cours de développement)

---

## ⚙️ Installation et Configuration

### 1. Dépendances installées

```bash
npm install pdfmake
```

### 2. Mise à jour de la base de données

**Important** : Exécutez le script de migration pour ajouter les champs client :

```bash
cd database
node add-client-type.js
```

Ce script ajoute les colonnes suivantes à la table `orders` :
- `client_type` : ENUM('particulier', 'professionnel')
- `client_name` : VARCHAR(255)
- `client_email` : VARCHAR(255)
- `client_company` : VARCHAR(255)
- `client_siret` : VARCHAR(14)

### 3. Configuration de l'établissement

Éditez le fichier `src/services/receiptService.js` pour personnaliser les informations de votre établissement :

```javascript
const ESTABLISHMENT_INFO = {
  name: '☕ Blossom Café',
  address: '123 Rue de la Gastronomie',
  postalCode: '75001',
  city: 'Paris',
  phone: '+33 1 23 45 67 89',
  email: 'contact@blossomcafe.fr',
  siret: '123 456 789 00012',
  tvaNumber: 'FR12 123456789',
  legalMention: 'SAS au capital de 10 000€ - RCS Paris B 123 456 789'
};
```

---

## 🚀 Utilisation

### Pour les Clients (Page "Mes Commandes")

1. Ouvrez la page **"Mes Commandes"**
2. Cliquez sur une commande pour afficher les détails
3. Cliquez sur le bouton **"🧾 Générer le ticket"**
4. Une modal s'ouvre avec deux options :
   - **Particulier** : Ticket simplifié
   - **Professionnel** : Ticket avec détails comptables
5. Remplissez les informations client (optionnel)
6. Choisissez l'action :
   - **Télécharger PDF** : Le fichier se télécharge automatiquement
   - **Imprimer** : S'ouvre dans un nouvel onglet pour impression
   - **Envoyer par email** : (Fonctionnalité à venir)

### Pour les Administrateurs/Managers (Page "Gestion des Commandes")

1. Ouvrez la page **"Gestion des Commandes"** (Admin)
2. Cliquez sur une commande pour afficher les détails
3. En bas de la section détaillée, cliquez sur **"Générer le ticket de caisse"**
4. Suivez les mêmes étapes que pour les clients

---

## 🏗️ Architecture Technique

### Fichiers créés et modifiés

#### **Nouveaux fichiers**

1. **`src/services/receiptService.js`**
   - Service de génération de PDF
   - Fonctions : `generateReceipt()`, `downloadReceipt()`, `printReceipt()`, `getReceiptBlob()`

2. **`src/components/common/ReceiptModal.jsx`**
   - Modal d'interface pour générer les tickets
   - Choix du type de client
   - Formulaire d'informations client
   - Boutons d'action (télécharger, imprimer, envoyer)

3. **`database/add-client-type.js`**
   - Script de migration de base de données
   - Ajoute les champs relatifs au type de client

4. **`database/add-client-type-to-orders.sql`**
   - Script SQL alternatif pour la migration

#### **Fichiers modifiés**

1. **`src/views/client/MyOrders.jsx`**
   - Ajout du bouton "Générer le ticket"
   - Intégration du `ReceiptModal`

2. **`src/views/admin/AdminOrders.jsx`**
   - Ajout du bouton "Générer le ticket de caisse"
   - Intégration du `ReceiptModal`

3. **`package.json`**
   - Ajout de la dépendance `pdfmake`

### Flux de données

```
┌─────────────────┐
│  User clique    │
│  "Générer"      │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  ReceiptModal   │
│  s'ouvre        │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  User choisit   │
│  type client    │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  receiptService │
│  .generateReceipt()│
└────────┬────────┘
         │
         v
┌─────────────────┐
│   pdfMake       │
│  crée le PDF    │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Téléchargement │
│  ou Impression  │
└─────────────────┘
```

### Structure du ticket PDF

#### Ticket Particulier
```
─────────────────────────────
☕ Blossom Café
123 Rue de la Gastronomie
75001 Paris
Tél: +33 1 23 45 67 89
Email: contact@blossomcafe.fr
─────────────────────────────

DÉTAILS DE LA COMMANDE

N° Commande: #42
Date: Lundi 18 octobre 2025, 14:30

Type: Sur place
Statut: Complété

─────────────────────────────
PRODUITS

Café Espresso × 2    5.00€
Croissant × 1        2.50€
─────────────────────────────

              TOTAL: 7.50€

─────────────────────────────
MODE DE PAIEMENT

Carte bancaire

─────────────────────────────
Merci de votre visite !
🌸 Blossom Café 🌸
```

#### Ticket Professionnel
```
─────────────────────────────
☕ Blossom Café
123 Rue de la Gastronomie
75001 Paris
Tél: +33 1 23 45 67 89
Email: contact@blossomcafe.fr

SIRET: 123 456 789 00012
TVA: FR12 123456789
SAS au capital de 10 000€
─────────────────────────────

INFORMATIONS CLIENT

• Société: ABC Corp
• SIRET: 987 654 321 00012
• Email: contact@abccorp.fr

─────────────────────────────
DÉTAILS DE LA COMMANDE

N° Commande: #42
Date: Lundi 18 octobre 2025, 14:30

─────────────────────────────
PRODUITS

Produit      Qté  PU HT   TVA    Total TTC
Espresso     2    2.27€   0.23€  5.00€
Croissant    1    2.27€   0.23€  2.50€
─────────────────────────────

Sous-total HT:  6.82€
TVA (10%):      0.68€
TOTAL TTC:      7.50€

─────────────────────────────
MODE DE PAIEMENT

Carte bancaire
```

---

## 🎨 Personnalisation

### Modifier l'apparence du ticket

Éditez `src/services/receiptService.js` :

```javascript
const docDefinition = {
  pageSize: 'A4',
  pageMargins: [40, 40, 40, 40],
  content: [...],
  styles: {
    header: {
      fontSize: 20,
      bold: true,
      alignment: 'center',
      color: '#10b981' // Couleur personnalisable
    },
    sectionHeader: {
      fontSize: 11,
      bold: true,
      color: '#374151',
      background: '#f3f4f6'
    },
    // ... autres styles
  }
};
```

### Ajouter un logo

Dans `receiptService.js`, ajoutez une image en base64 :

```javascript
const header = [
  {
    image: 'data:image/png;base64,iVBORw0KG...',
    width: 100,
    alignment: 'center',
    margin: [0, 0, 0, 10]
  },
  {
    text: ESTABLISHMENT_INFO.name,
    style: 'header'
  },
  // ... reste de l'en-tête
];
```

### Modifier le taux de TVA

Par défaut, la TVA est à 10%. Pour changer :

```javascript
// Dans generateReceipt()
const tva = subtotalHT * 0.20; // TVA à 20%

// Et dans le texte
{
  text: 'TVA (20%)', // Mettre à jour le label
  // ...
}
```

---

## 🔧 Dépannage

### Le PDF ne se télécharge pas

**Problème** : Bloqueur de pop-ups activé

**Solution** : Autorisez les pop-ups pour votre application

### Les polices ne s'affichent pas correctement

**Problème** : Polices pdfMake manquantes

**Solution** : Vérifiez que `pdfMake.vfs` est bien initialisé :

```javascript
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;
```

### Les prix sont incorrects

**Problème** : Format de données incompatible

**Solution** : Assurez-vous que les prix sont des nombres :

```javascript
const price = parseFloat(item.price || 0);
```

### La base de données ne contient pas les champs client

**Problème** : Migration non exécutée

**Solution** : Exécutez le script de migration :

```bash
cd database
node add-client-type.js
```

---

## 📧 Fonctionnalité Email (À venir)

### Configuration requise

1. Installer `nodemailer` dans le backend :
```bash
cd database
npm install nodemailer
```

2. Configurer les variables d'environnement :
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre-email@gmail.com
EMAIL_PASSWORD=votre-mot-de-passe-app
```

3. Créer l'endpoint backend `/api/send-receipt`

### Utilisation future

Une fois configuré, les utilisateurs pourront :
- Saisir une adresse email dans la modal
- Cliquer sur "📧 Envoyer par email"
- Recevoir le ticket en pièce jointe

---

## ✅ Checklist de déploiement

- [ ] Dépendances installées (`pdfmake`)
- [ ] Migration base de données exécutée
- [ ] Informations établissement personnalisées
- [ ] Tests sur différentes commandes
- [ ] Tests des deux types de tickets (particulier/professionnel)
- [ ] Tests sur mobile et desktop
- [ ] Vérification des calculs HT/TVA/TTC
- [ ] Configuration email (optionnel)

---

## 📞 Support

Pour toute question ou problème :
- Consultez les logs de la console navigateur (F12)
- Vérifiez la structure de la base de données
- Testez avec des données de commande simples d'abord

---

**🌸 Blossom Café - L'art de la pâtisserie française 🌸**

