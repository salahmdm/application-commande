/**
 * Design System Burger King
 * Palette de couleurs et variables pour le mode kiosk
 */

export const BKColors = {
  // Palette noir et blanc
  white: '#FFFFFF',
  black: '#000000',
  
  // Nuances de gris
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Couleurs système
  greenSuccess: '#10B981',
  
  // Couleurs texte
  textDark: '#1F2937',
  textGray: '#6B7280',
  textLight: '#9CA3AF',
  
  // Dégradés noir et blanc
  gradients: {
    sidebar: 'linear-gradient(180deg, #1F2937 0%, #374151 50%, #4B5563 100%)',
    headerNouveautes: 'linear-gradient(90deg, #1F2937 0%, #374151 100%)',
    headerBurgers: 'linear-gradient(90deg, #374151 0%, #4B5563 100%)',
    headerMenus: 'linear-gradient(90deg, #4B5563 0%, #6B7280 100%)',
    headerChicken: 'linear-gradient(90deg, #374151 0%, #1F2937 100%)',
    headerSalades: 'linear-gradient(90deg, #6B7280 0%, #4B5563 100%)',
    headerDesserts: 'linear-gradient(90deg, #4B5563 0%, #374151 100%)',
    headerBoissons: 'linear-gradient(90deg, #374151 0%, #6B7280 100%)',
    buttonPrimary: 'linear-gradient(135deg, #1F2937 0%, #000000 100%)',
    cardImage: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
    cartFooter: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
  }
};

export const BKTypography = {
  // Tailles
  logo: '36px',
  categoryTitle: '40px',
  productName: '20px',
  productDescription: '14px',
  price: '32px',
  button: '20px',
  cartTitle: '24px',
  cartTotal: '40px',
  
  // Poids
  extraBold: 900,
  bold: 700,
  
  // Transformation
  uppercase: 'uppercase',
  
  // Letter spacing
  tight: '-0.02em',
  normal: '0.03em',
  wide: '0.05em',
  wider: '0.08em',
};

export const BKSizes = {
  sidebarWidth: '300px',
  headerHeight: '140px',
  cardWidth: '360px',
  cardBorder: '4px',
  cardRadius: '24px',
  buttonRadius: '16px',
  cartSidebarWidth: '420px',
  cartButtonSize: '80px',
  cartBadgeSize: '40px',
};

export const BKAnimations = {
  duration: '0.3s',
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  hoverScale: '1.05',
  activeScale: '0.95',
};

// Catégories avec couleurs dédiées
export const BKCategories = [
  { 
    id: 'nouveautes', 
    name: 'NOUVEAUTÉS', 
    gradient: 'from-red-600 to-orange-500',
    headerGradient: BKColors.gradients.headerNouveautes,
    icon: '🔥'
  },
  { 
    id: 'burgers', 
    name: 'BURGERS', 
    gradient: 'from-orange-500 to-yellow-500',
    headerGradient: BKColors.gradients.headerBurgers,
    icon: '🍔'
  },
  { 
    id: 'menus', 
    name: 'MENUS', 
    gradient: 'from-yellow-500 to-orange-400',
    headerGradient: BKColors.gradients.headerMenus,
    icon: '🍟'
  },
  { 
    id: 'chicken', 
    name: 'CHICKEN', 
    gradient: 'from-orange-400 to-red-500',
    headerGradient: BKColors.gradients.headerChicken,
    icon: '🍗'
  },
  { 
    id: 'salades', 
    name: 'SALADES', 
    gradient: 'from-green-500 to-green-600',
    headerGradient: BKColors.gradients.headerSalades,
    icon: '🥗'
  },
  { 
    id: 'desserts', 
    name: 'DESSERTS', 
    gradient: 'from-pink-500 to-purple-500',
    headerGradient: BKColors.gradients.headerDesserts,
    icon: '🍰'
  },
  { 
    id: 'boissons', 
    name: 'BOISSONS', 
    gradient: 'from-blue-500 to-cyan-500',
    headerGradient: BKColors.gradients.headerBoissons,
    icon: '🥤'
  }
];

export default {
  colors: BKColors,
  typography: BKTypography,
  sizes: BKSizes,
  animations: BKAnimations,
  categories: BKCategories,
};

