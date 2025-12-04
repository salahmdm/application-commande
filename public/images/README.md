# 📸 Dossier Images - Blossom Café

Ce dossier contient toutes les images statiques de l'application qui sont versionnées dans Git.

## 📁 Structure principale

```
public/images/
├── products/        # Images de produits (cafés, thés, pâtisseries, etc.)
├── homepage/       # Images pour la page d'accueil (bannières, hero, sections)
├── events/         # Images pour les événements et actualités
├── logos/          # Logos de l'application (logo principal, favicon, etc.)
├── icons/          # Icônes et pictogrammes
├── banners/        # Bannières générales (kiosk, etc.)
├── backgrounds/    # Images de fond et textures
└── avatars/        # Avatars par défaut pour les utilisateurs
```

## 🎯 Catégories principales

### 1. **Produits** (`products/`)
Images statiques pour les produits du menu (cafés, thés, pâtisseries, etc.)

### 2. **Accueil** (`homepage/`)
Images pour la page d'accueil : bannières hero, sections promotionnelles, carrousels, etc.

### 3. **Événements** (`events/`)
Images pour les événements, actualités, promotions, happy hours, etc.

## 🎯 Utilisation dans le code

### Exemple 1 : Image de produit
```jsx
// Fichier : public/images/products/cafe-noir.jpg
<img src="/images/products/cafe-noir.jpg" alt="Café noir" />
```

### Exemple 2 : Image page d'accueil
```jsx
// Fichier : public/images/homepage/hero-banner.jpg
<div style={{ backgroundImage: 'url(/images/homepage/hero-banner.jpg)' }}>
  <h1>Bienvenue chez Blossom Café</h1>
</div>
```

### Exemple 3 : Image événement
```jsx
// Fichier : public/images/events/happy-hour.jpg
<img src="/images/events/happy-hour.jpg" alt="Happy Hour" />
```

### Exemple 4 : Logo
```jsx
// Fichier : public/images/logos/logo.png
<img src="/images/logos/logo.png" alt="Blossom Café" />
```

## ✅ Avantages

- ✅ **Versionnées dans Git** : Toutes les images sont suivies dans le repository
- ✅ **Accessibles directement** : Pas besoin d'import, utilisez simplement `/images/...`
- ✅ **Servies par Vercel CDN** : Chargement rapide en production
- ✅ **Organisées** : Structure claire par type d'image

## 📝 Règles de nommage

- Utilisez des noms en **minuscules** avec des **tirets** : `logo-principal.png`
- Évitez les espaces et caractères spéciaux
- Utilisez des formats optimisés : **WebP** (recommandé), **PNG** (transparence), **JPG** (photos)

## ⚠️ Limitations

- **Taille totale recommandée** : < 50MB pour éviter de ralentir Git
- **Pour les images dynamiques** (produits uploadés par les admins) : Utilisez **Supabase Storage** (voir `GUIDE_IMAGES.md`)

## 🔄 Migration

Si vous avez des images ailleurs dans `public/`, vous pouvez les déplacer ici :

```bash
# Exemple : déplacer kiosk-blossom.jpg vers banners/
mv public/kiosk-blossom.jpg public/images/banners/kiosk-blossom.jpg
```

Puis mettre à jour le code :
```jsx
// Avant
<img src="/kiosk-blossom.jpg" />

// Après
<img src="/images/banners/kiosk-blossom.jpg" />
```

## 📚 Documentation

- Guide complet : `GUIDE_IMAGES.md`
- Guide Git : `GUIDE_IMAGES_GIT.md`
- Service Supabase Storage : `src/services/supabaseStorage.js`

