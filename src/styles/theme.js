/**
 * Système de design Blossom Café
 * Palette Noir & Blanc Moderne et Classe
 */

export const theme = {
  // Palette de couleurs élégante
  colors: {
    // Noir principal (remplace le brun café)
    primary: {
      50: '#f8f9fa',
      100: '#f1f3f5',
      200: '#e9ecef',
      300: '#dee2e6',
      400: '#ced4da',
      500: '#1a1a1a', // Noir principal
      600: '#141414',
      700: '#0f0f0f',
      800: '#0a0a0a',
      900: '#000000',
    },
    
    // Accent doré élégant (pour les touches de luxe)
    accent: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#d4af37', // Or élégant
      600: '#b8930f',
      700: '#92700a',
      800: '#6b5108',
      900: '#4a3606',
    },
    
    // Gris modernes
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
  },
  
  // Typographie
  fonts: {
    heading: '"Poppins", "Montserrat", "Inter", -apple-system, sans-serif',
    body: '"Nunito", "Open Sans", -apple-system, sans-serif',
    accent: '"Playfair Display", "Georgia", serif',
  },
  
  // Espacements
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
  },
  
  // Rayons de bordure
  radius: {
    sm: '0.5rem',    // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },
  
  // Ombres
  shadows: {
    soft: '0 2px 8px rgba(0, 0, 0, 0.08)',
    medium: '0 4px 16px rgba(0, 0, 0, 0.12)',
    strong: '0 8px 24px rgba(0, 0, 0, 0.16)',
    elegant: '0 10px 40px rgba(0, 0, 0, 0.1)',
    glow: '0 0 30px rgba(212, 175, 55, 0.3)', // Glow doré
    glowWhite: '0 0 30px rgba(255, 255, 255, 0.5)',
  },
  
  // Animations
  transitions: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },
};

export default theme;
