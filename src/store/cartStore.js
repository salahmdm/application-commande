import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import orderService from '../services/orderService';
import { calculateTTC } from '../constants/pricing';

/**
 * Store du panier
 * Gère les articles, quantités, type de commande et calculs
 */
const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      orderType: '', // 'dine-in' | 'takeaway' | 'delivery' (valeurs MySQL ENUM)
      promoCode: null,
      discount: 0,
      
      // Migration automatique des anciennes valeurs
      _hasHydrated: false,
      _migrateOldValues: () => {
        const state = get();
        let needsMigration = false;
        const updates = {};
        
        // Migrer orderType
        if (state.orderType === 'sur place') {
          updates.orderType = 'dine-in';
          needsMigration = true;
          console.log('🔄 Migration: "sur place" → "dine-in"');
        } else if (state.orderType === 'à emporter') {
          updates.orderType = 'takeaway';
          needsMigration = true;
          console.log('🔄 Migration: "à emporter" → "takeaway"');
        } else if (state.orderType === 'livraison') {
          updates.orderType = 'delivery';
          needsMigration = true;
          console.log('🔄 Migration: "livraison" → "delivery"');
        }
        
        if (needsMigration) {
          console.log('✅ Migration appliquée, nouvelles valeurs:', updates);
          set(updates);
        }
        
        set({ _hasHydrated: true });
      },
      
      // Actions
      addItem: (product) => {
        const { items } = get();
        const existingItem = items.find(item => item.id === product.id);
        
        if (existingItem) {
          set({
            items: items.map(item =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          });
        } else {
          set({ items: [...items, { ...product, quantity: 1 }] });
        }
      },
      
      updateQuantity: (productId, change) => {
        const { items } = get();
        set({
          items: items
            .map(item => {
              if (item.id === productId) {
                const newQuantity = item.quantity + change;
                return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
              }
              return item;
            })
            .filter(Boolean)
        });
      },
      
      removeItem: (productId) => {
        set(state => ({
          items: state.items.filter(item => item.id !== productId)
        }));
      },
      
      clearCart: () => {
        set({ items: [], promoCode: null, discount: 0 });
      },
      
      setOrderType: (type) => {
        // Normaliser les anciennes valeurs vers les nouvelles
        let normalizedType = type;
        if (type === 'sur place') normalizedType = 'dine-in';
        if (type === 'à emporter') normalizedType = 'takeaway';
        if (type === 'livraison') normalizedType = 'delivery';
        
        console.log('📍 setOrderType - Migration:', type, '→', normalizedType);
        set({ orderType: normalizedType });
      },
      
      applyPromoCode: async (code) => {
        try {
          // Calculer le total actuel pour validation
          const subtotal = get().getSubtotal();
          
          // Valider le code via API MySQL
          const result = await orderService.validatePromoCode(code, subtotal);
          
          if (result.success && result.data) {
            const promo = result.data;
            let discountAmount = 0;
            
            if (promo.discount_type === 'percentage') {
              discountAmount = (subtotal * parseFloat(promo.discount_value)) / 100;
            } else {
              discountAmount = parseFloat(promo.discount_value);
            }
            
            set({ 
              promoCode: code.toUpperCase(), 
              discount: discountAmount,
              promoData: promo 
            });
            
            return { success: true, discount: discountAmount };
          }
          
          return { success: false, error: 'Code promo invalide' };
        } catch (error) {
          console.error('Erreur applyPromoCode:', error);
          // En cas d'erreur API, utiliser les codes par défaut
          const promoCodes = {
            'WELCOME10': 10,
            'SUMMER20': 20,
            'VIP30': 30,
          };
          
          const discount = promoCodes[code.toUpperCase()];
          if (discount) {
            const subtotal = get().getSubtotal();
            const discountAmount = (subtotal * discount) / 100;
            set({ promoCode: code.toUpperCase(), discount: discountAmount });
            return { success: true, discount: discountAmount };
          }
          
          return { success: false, error: error.message || 'Code promo invalide' };
        }
      },
      
      removePromoCode: () => {
        set({ promoCode: null, discount: 0 });
      },
      
      // Getters
      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      
      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + calculateTTC(item.price) * item.quantity, 0);
      },
      
      getDiscountAmount: () => {
        const { discount } = get();
        const subtotal = get().getSubtotal();
        return (subtotal * discount) / 100;
      },
      
      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discountAmount = get().getDiscountAmount();
        return subtotal - discountAmount;
      }
    }),
    {
      name: 'blossom-cart-storage',
      onRehydrateStorage: () => (state) => {
        // Migrer les anciennes valeurs après la réhydratation
        if (state && state._migrateOldValues) {
          console.log('🔄 Réhydratation du cart - Vérification des migrations...');
          state._migrateOldValues();
        }
      }
    }
  )
);

export default useCartStore;

