# 🧾 Génération de Tickets de Caisse - Guide Rapide

## 🚀 Démarrage Rapide

### 1. Installation (Déjà fait ✅)

```bash
npm install pdfmake
```

### 2. Mise à jour de la base de données

**⚠️ IMPORTANT** : Exécutez cette commande une seule fois :

```bash
cd database
node add-client-type.js
```

Cela ajoute les champs nécessaires pour stocker les informations client (type, nom, email, société, SIRET).

### 3. Utilisation

#### Pour les clients :
1. Allez dans **"Mes Commandes"**
2. Ouvrez une commande en cliquant sur "Détails"
3. Cliquez sur **"🧾 Générer le ticket"**
4. Choisissez le type de client (Particulier ou Professionnel)
5. Remplissez les informations (optionnel)
6. Cliquez sur **"Télécharger PDF"** ou **"Imprimer"**

#### Pour les administrateurs :
1. Allez dans **"Gestion des Commandes"**
2. Ouvrez une commande
3. En bas, cliquez sur **"Générer le ticket de caisse"**
4. Suivez les mêmes étapes

## 📝 Personnalisation

Pour modifier les informations de votre établissement, éditez :

**Fichier** : `src/services/receiptService.js`

```javascript
const ESTABLISHMENT_INFO = {
  name: '☕ Blossom Café',           // ← Modifiez ici
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

## 🎯 Fonctionnalités

### ✅ Disponibles maintenant
- ✅ Génération de tickets PDF
- ✅ Deux types de tickets (Particulier / Professionnel)
- ✅ Téléchargement direct
- ✅ Impression
- ✅ Stockage des informations client
- ✅ Calcul automatique HT/TVA/TTC

### 🚧 En développement
- 📧 Envoi par email
- 🔗 QR Code sur le ticket
- 📊 Statistiques d'utilisation

## 🐛 Résolution de problèmes

### Le PDF ne se télécharge pas
- Autorisez les pop-ups dans votre navigateur
- Vérifiez la console (F12) pour les erreurs

### Migration base de données échoue
- Vérifiez que MySQL est démarré
- Vérifiez les identifiants dans `.env`

### Les prix sont incorrects
- Assurez-vous que les commandes ont des données valides
- Vérifiez le format des prix dans la base de données

## 📞 Aide

Consultez le guide complet : `GUIDE_TICKETS_CAISSE.md`

---

**🌸 Blossom Café - Tickets de caisse professionnels en quelques clics 🌸**

