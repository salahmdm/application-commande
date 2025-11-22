import { create } from 'zustand';
// ⚠️ PERSIST TEMPORAIREMENT DÉSACTIVÉ pour debug
// import { persist, createJSONStorage } from 'zustand/middleware';
import logger from '../utils/logger';

/**
 * Store Zustand pour le mode Kiosk
 * Gère l'état de la borne : panier, langue, étape actuelle, inactivité
 */
const useKioskStore = create(
  // persist(
    (set, get) => ({
      // État de l'authentification kiosk
      isAuthenticated: false,
      kioskToken: null,
      kioskId: null, // ID de la borne (peut être stocké en dur)

      // Étape actuelle du workflow
      currentStep: 'welcome', // 'welcome' | 'language' | 'order-type' | 'categories' | 'products' | 'cart' | 'payment' | 'confirmation'

      // Langue sélectionnée
      language: 'fr', // 'fr' | 'en' | 'ar'

      // Panier kiosk (simplifié, pas de fidélité)
      cart: [],
      orderType: 'dine-in', // 'dine-in' | 'takeaway' (pas de delivery pour kiosk)
      
      // Code promo
      promoCode: null,
      discount: 0,
      discountPercentage: 0,
      promoData: null,

      // Dernière activité (pour gestion inactivité)
      lastActivity: Date.now(),

      // Actions
      setCurrentStep: (step) => {
        logger.log(`🔄 Kiosk - Changement d'étape: ${step}`);
        set({ currentStep: step, lastActivity: Date.now() });
      },

      setLanguage: (lang) => {
        logger.log(`🌐 Kiosk - Changement de langue: ${lang}`);
        set({ language: lang, lastActivity: Date.now() });
      },

      addToCart: (product, quantity = 1, customizations = {}) => {
        const { cart } = get();
        const existingItemIndex = cart.findIndex(
          item => item.productId === product.id && 
          JSON.stringify(item.customizations) === JSON.stringify(customizations)
        );

        if (existingItemIndex >= 0) {
          // Mettre à jour la quantité
          const updatedCart = [...cart];
          updatedCart[existingItemIndex].quantity += quantity;
          set({ cart: updatedCart, lastActivity: Date.now() });
        } else {
          // Ajouter un nouvel article
          const newItem = {
            productId: product.id,
            product: product,
            quantity,
            price: product.price,
            customizations,
            notes: ''
          };
          set({ cart: [...cart, newItem], lastActivity: Date.now() });
        }
        logger.log(`🛒 Kiosk - Article ajouté au panier: ${product.name}`);
      },

      removeFromCart: (index) => {
        const { cart } = get();
        const updatedCart = cart.filter((_, i) => i !== index);
        set({ cart: updatedCart, lastActivity: Date.now() });
        logger.log(`🗑️ Kiosk - Article retiré du panier`);
      },

      updateCartItemQuantity: (index, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(index);
          return;
        }
        const { cart } = get();
        const updatedCart = [...cart];
        updatedCart[index].quantity = quantity;
        set({ cart: updatedCart, lastActivity: Date.now() });
      },

      clearCart: () => {
        set({ cart: [], lastActivity: Date.now() });
        logger.log('🧹 Kiosk - Panier vidé');
      },

      setOrderType: (type) => {
        set({ orderType: type, lastActivity: Date.now() });
      },

      // Gestion code promo
      applyPromoCode: async (code, subtotal) => {
        try {
          const kioskService = (await import('../services/kioskService')).default;
          const result = await kioskService.validatePromoCode(code, subtotal);
          
          if (result.success && result.data) {
            const promo = result.data;
            let discountAmount = 0;
            let discountPercentage = 0;
            
            if (promo.discount_type === 'percentage') {
              discountPercentage = parseFloat(promo.discount_value);
              discountAmount = (subtotal * discountPercentage) / 100;
            } else {
              discountAmount = parseFloat(promo.discount_value);
              discountPercentage = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0;
            }
            
            set({ 
              promoCode: code.toUpperCase(), 
              discount: discountAmount,
              discountPercentage: discountPercentage,
              promoData: promo,
              lastActivity: Date.now()
            });
            
            logger.log(`✅ Kiosk - Code promo appliqué: ${code.toUpperCase()} (-${discountPercentage.toFixed(1)}%)`);
            return { success: true, discount: discountAmount, discountPercentage: discountPercentage };
          }
          
          set({ 
            promoCode: null, 
            discount: 0, 
            discountPercentage: 0, 
            promoData: null,
            lastActivity: Date.now()
          });
          return { success: false, error: result.error || 'Code promo invalide' };
        } catch (error) {
          logger.error('❌ Kiosk - Erreur applyPromoCode:', error);
          set({ 
            promoCode: null, 
            discount: 0, 
            discountPercentage: 0, 
            promoData: null,
            lastActivity: Date.now()
          });
          return { success: false, error: error.message || 'Erreur validation code promo' };
        }
      },

      removePromoCode: () => {
        set({ 
          promoCode: null, 
          discount: 0, 
          discountPercentage: 0, 
          promoData: null,
          lastActivity: Date.now()
        });
        logger.log('🗑️ Kiosk - Code promo retiré');
      },

      // Authentification kiosk
      setKioskAuth: (token, kioskId) => {
        set({ 
          isAuthenticated: true, 
          kioskToken: token, 
          kioskId,
          lastActivity: Date.now() 
        });
        logger.log('✅ Kiosk - Authentification réussie');
      },

      logoutKiosk: () => {
        set({ 
          isAuthenticated: false, 
          kioskToken: null, 
          kioskId: null,
          lastActivity: Date.now() 
        });
        logger.log('🚪 Kiosk - Déconnexion');
      },

      // Reset complet de la borne
      resetKiosk: () => {
        set({
          currentStep: 'welcome',
          cart: [],
          orderType: 'dine-in',
          promoCode: null,
          discount: 0,
          discountPercentage: 0,
          promoData: null,
          lastActivity: Date.now()
          // Ne pas réinitialiser l'authentification ni la langue
        });
        logger.log('🔄 Kiosk - Reset complet');
      },

      // Mettre à jour la dernière activité
      updateActivity: () => {
        set({ lastActivity: Date.now() });
      }
    })
  // }),
  // {
  //   name: 'kiosk-storage',
  //   storage: createJSONStorage(() => sessionStorage), // Session storage pour isolation
  //   partialize: (state) => ({
  //     // Ne persister que certaines données
  //     language: state.language,
  //     kioskId: state.kioskId,
  //     isAuthenticated: state.isAuthenticated
  //     // Ne pas persister le panier ni l'étape (reset à chaque session)
  //   })
  // }
);

export default useKioskStore;

