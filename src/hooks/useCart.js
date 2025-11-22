import { useCallback } from 'react';
import useCartStore from '../store/cartStore';

/**
 * Hook personnalisé pour le panier
 */
const useCart = () => {
  const {
    items,
    orderType,
    promoCode,
    discount,
    discountPercentage,
    promoData,
    loyaltyReward,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    setOrderType,
    applyPromoCode,
    removePromoCode,
    applyLoyaltyReward,
    removeLoyaltyReward,
    getTotalItems,
    getSubtotal,
    getSubtotalTTC,
    getDiscountAmount,
    getPromoDiscountAmount,
    getLoyaltyDiscountAmount,
    getTotal
  } = useCartStore();
  
  const add = useCallback((product) => {
    addItem(product);
  }, [addItem]);
  
  const increment = useCallback((productId) => {
    updateQuantity(productId, 1);
  }, [updateQuantity]);
  
  const decrement = useCallback((productId) => {
    updateQuantity(productId, -1);
  }, [updateQuantity]);
  
  const remove = useCallback((productId) => {
    removeItem(productId);
  }, [removeItem]);
  
  const clear = useCallback(() => {
    if (window.confirm('Êtes-vous sûr de vouloir vider le panier ?')) {
      clearCart();
    }
  }, [clearCart]);
  
  const applyPromo = useCallback((code) => {
    return applyPromoCode(code);
  }, [applyPromoCode]);
  
  const removePromo = useCallback(() => {
    removePromoCode();
  }, [removePromoCode]);
  
  const selectOrderType = useCallback((type) => {
    setOrderType(type);
  }, [setOrderType]);
  
  // Vérifier si un produit est dans le panier
  const isInCart = useCallback((productId) => {
    return items.some(item => item.id === productId);
  }, [items]);
  
  // Obtenir la quantité d'un produit
  const getItemQuantity = useCallback((productId) => {
    const item = items.find(item => item.id === productId);
    return item ? item.quantity : 0;
  }, [items]);
  
  return {
    items,
    orderType,
    promoCode,
    discount,
    discountPercentage,
    promoData,
    loyaltyReward,
    totalItems: getTotalItems(),
    subtotal: getSubtotal(),
    subtotalTTC: getSubtotalTTC(),
    discountAmount: getDiscountAmount(),
    promoDiscountAmount: getPromoDiscountAmount(),
    loyaltyDiscountAmount: getLoyaltyDiscountAmount(),
    total: getTotal(),
    isEmpty: items.length === 0,
    add,
    increment,
    decrement,
    remove,
    clear,
    selectOrderType,
    applyPromo,
    removePromo,
    applyLoyaltyReward,
    removeLoyaltyReward,
    isInCart,
    getItemQuantity
  };
};

export default useCart;

