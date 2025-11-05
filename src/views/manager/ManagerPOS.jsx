import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, User, Image as ImageIcon, Search, Info, X } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import CategoryFilterPOS from '../../components/manager/CategoryFilterPOS';
import ProductModal from '../../components/manager/ProductModal';
import useProducts from '../../hooks/useProducts';
import useProductStore from '../../store/productStore';
import useNotifications from '../../hooks/useNotifications';
import useSettings from '../../hooks/useSettings';
import orderService from '../../services/orderService';
import { ORDER_STATUS } from '../../constants/orderStatuses';
import { calculateTTC, formatPrice, TAX_RATE } from '../../constants/pricing';

/**
 * Point de Vente (POS) - Manager
 * Interface pour créer des commandes directement
 */
const ManagerPOS = () => {
  const { allProducts, categories } = useProducts();
  const { fetchAllProductsAdmin } = useProductStore();
  const { success, error: showError } = useNotifications();
  const { tableNumberEnabled } = useSettings();
  
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState('dine-in');
  const [tableNumber, setTableNumber] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [productNotes, setProductNotes] = useState({}); // { productId: "note" }
  
  // Charger tous les produits (actifs ET inactifs) pour le POS
  useEffect(() => {
    const loadAllProducts = async () => {
      try {
        console.log('🔄 ManagerPOS - Chargement de tous les produits...');
        await fetchAllProductsAdmin();
        console.log('✅ ManagerPOS - Tous les produits chargés');
        
        // Debug : Afficher les produits chargés
        console.log('📊 ManagerPOS - Produits chargés:', allProducts.length);
        console.log('📊 ManagerPOS - Détail des produits:', allProducts.map(p => ({
          id: p.id,
          name: p.name,
          category_id: p.category_id,
          category_name: p.category_name,
          category_slug: p.category_slug,
          is_available: p.is_available,
          price: p.price
        })));
      } catch (error) {
        console.error('❌ ManagerPOS - Erreur chargement produits:', error);
      }
    };
    
    loadAllProducts();
  }, [fetchAllProductsAdmin, allProducts]);
  
  // Filtrer et trier les produits
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];
    
    // Filtre par catégorie
    if (selectedCategory) {
      filtered = filtered.filter(p => {
        const matchSlug = p.category_slug === selectedCategory;
        const matchId = p.category_id === parseInt(selectedCategory);
        const matchName = p.category_name === selectedCategory;
        const matchIdString = p.category_id?.toString() === selectedCategory;
        const matchSlugString = p.category_slug === selectedCategory;
        return matchSlug || matchId || matchName || matchIdString || matchSlugString;
      });
    }
    
    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.category_name && p.category_name.toLowerCase().includes(query))
      );
    }
    
    // Tri par nom (par défaut)
    filtered.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
    
    return filtered;
  }, [allProducts, selectedCategory, searchQuery]);
  
  // Ajouter au panier
  const addToCart = (product) => {
    if (!product.is_available) {
      showError('Ce produit n\'est pas disponible');
      return;
    }
    
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };
  
  // Modifier la quantité
  const updateQuantity = (productId, change) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(Boolean));
  };
  
  // Retirer du panier
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };
  
  // Vider le panier
  const clearCart = () => {
    if (window.confirm('Vider le panier ?')) {
      setCart([]);
      setCustomerName('');
      setTableNumber('');
    }
  };
  
  // Calculer les totaux
  const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price || 0) * item.quantity), 0);
  const discountAmount = promoDiscount;
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = subtotalAfterDiscount * TAX_RATE; // TVA
  const total = subtotalAfterDiscount + taxAmount;
  
  // Vérifier le code promo (à implémenter avec l'API)
  const handlePromoCodeCheck = async () => {
    if (!promoCode.trim()) {
      setPromoDiscount(0);
      return;
    }
    
    try {
      // TODO: Implémenter la vérification du code promo via API
      showError('Vérification des codes promo à implémenter');
    } catch (error) {
      showError('Erreur lors de la vérification du code promo');
    }
  };
  
  // Créer la commande
  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      showError('Le panier est vide');
      return;
    }
    
    if (!customerName.trim()) {
      showError('Veuillez entrer le nom du client');
      return;
    }
    
    setProcessing(true);
    try {
      const orderData = {
        orderType,
        customerName: customerName.trim(),
        tableNumber: orderType === 'dine-in' ? tableNumber : null,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          notes: productNotes[item.id] || null
        })),
        subtotal: subtotalAfterDiscount,
        discountAmount,
        taxAmount,
        totalAmount: total,
        status: ORDER_STATUS.PENDING,
        paymentMethod,
        promoCode: promoCode.trim() || null,
        notes: `Commande créée par le manager`
      };
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🚀 FRONTEND - ManagerPOS - Envoi commande');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📌 orderType:', orderType, `(type: ${typeof orderType})`);
      console.log('📌 Valeur exacte:', JSON.stringify(orderType));
      console.log('📌 tableNumber:', tableNumber);
      console.log('📌 Données complètes:', JSON.stringify(orderData, null, 2));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const response = await orderService.createOrder(orderData);
      
      if (response.success) {
        success(`Commande créée avec succès ! Total: ${formatPrice(total, true)}`);
        
        // Réinitialiser
        setCart([]);
        setCustomerName('');
        setTableNumber('');
        setPromoCode('');
        setPromoDiscount(0);
        setProductNotes({});
        
        console.log('✅ Commande créée:', response.data);
      }
    } catch (error) {
      console.error('❌ Erreur création commande:', error);
      console.error('   Type:', error.name);
      console.error('   Message:', error.message);
      console.error('   Détails:', error);
      
      // Message d'erreur plus détaillé
      const errorMessage = error.message || error.error || 'Erreur lors de la création de la commande';
      showError(`Erreur: ${errorMessage}`);
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <div className="space-y-5 pl-5 sm:pl-5 md:pl-10 pr-5 sm:pr-5 md:pr-10 pt-6 md:pt-8">
      {/* En-tête amélioré */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-heading font-bold text-black leading-tight">Point de Vente</h1>
        </div>
      </div>

      {/* Barre de recherche */}
      <Card padding="none" className="bg-gradient-to-br from-neutral-50 to-neutral-100 border-2 border-neutral-200 p-3 sm:p-4 md:p-6">
        <div className="relative">
          <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 rounded-xl border-2 border-neutral-200 bg-white text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 font-sans text-sm sm:text-base"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-neutral-200 hover:bg-neutral-300 flex items-center justify-center transition-all"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4 text-neutral-600" />
            </button>
          )}
        </div>
      </Card>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-1 gap-3 md:gap-4">
        {/* Catalogue Produits - Colonnes adaptées */}
        <div className="xl:col-span-2 lg:col-span-1 space-y-3">
          {/* Filtres de catégories POS */}
          <CategoryFilterPOS 
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
          
          {/* Grille de produits responsive, compacte */}
          <div className="grid gap-3 sm:gap-4 md:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                padding="sm"
                className="rounded-xl p-3 sm:p-2 md:p-3 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex flex-col h-full relative">
                  {/* Icône d'information en haut à droite - point d'exclamation */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProduct(product);
                    }}
                    className="absolute top-2 right-2 z-10 w-7 h-7 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
                    title="Voir les ingrédients"
                  >
                    <Info className="w-4 h-4 text-white" />
                  </button>

                  {/* Image produit */}
                  <div className="w-full aspect-square rounded-lg overflow-hidden mb-3 sm:mb-2">
                    {product.image_url ? (
                      <img 
                        src={`http://localhost:5000${product.image_url}`}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                        {product.image ? (
                          <span className="text-4xl">{product.image}</span>
                        ) : (
                          <ImageIcon className="w-12 h-12 text-neutral-400" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mb-3 sm:mb-2">
                    <div 
                      className="font-heading font-semibold text-xl sm:text-lg line-clamp-2 text-black leading-tight flex-1 pr-2 cursor-pointer hover:text-neutral-600 transition-colors"
                      onClick={() => setSelectedProduct(product)}
                    >
                      {product.name}
                    </div>
                    <div className="text-lg sm:text-base md:text-lg font-heading font-bold text-black flex-shrink-0">
                      {formatPrice(calculateTTC(product.price))}
                    </div>
                  </div>
                  
                  {/* Badges améliorés */}
                  {!product.is_available && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      <span className="inline-block px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-heading font-bold">
                        Inactif
                      </span>
                    </div>
                  )}
                  
                  {/* Bouton d'action */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    disabled={!product.is_available}
                    className={`w-full font-heading font-semibold py-4 sm:py-3 px-4 sm:px-3 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 text-lg sm:text-base mt-auto ${
                      product.is_available 
                        ? 'bg-black hover:bg-neutral-800 text-white' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {product.is_available ? 'Ajouter au panier' : 'Produit indisponible'}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Panier - 1 colonne (desktop uniquement), élargi */}
        <div className="space-y-4 hidden xl:block w-full xl:w-[28rem] lg:w-[26rem] md:w-80">
          {/* Informations client - Compact */}
          <Card padding="md" className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-heading font-bold text-black text-base">Informations Client</h3>
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                <label className="block text-xs font-heading font-semibold mb-1 text-blue-800">
                  Nom du client <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: Jean Dupont"
                  required
                  className="w-full px-3 py-2 rounded-lg border-2 border-blue-200 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 font-sans text-sm placeholder-blue-400"
                />
                {customerName && (
                  <div className="absolute right-2 top-6">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              
              {tableNumberEnabled && orderType === 'dine-in' && (
                <div className="relative">
                  <label className="block text-xs font-heading font-semibold mb-1 text-blue-800">
                    Numéro de table
                  </label>
                  <input
                    type="number"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Ex: 5"
                    className="w-full px-3 py-2 rounded-lg border-2 border-blue-200 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 font-sans text-sm placeholder-blue-400"
                  />
                  {tableNumber && (
                    <div className="absolute right-2 top-6">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Type de commande - Section compacte */}
          <Card padding="sm" className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 shadow-lg">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setOrderType('dine-in')}
                className={`py-3 px-4 rounded-lg font-heading font-semibold text-base transition-all duration-200 transform hover:scale-102 active:scale-95 ${
                  orderType === 'dine-in'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-200 border-2 border-amber-600'
                    : 'bg-white border-2 border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300'
                }`}
              >
                🍽️ Sur place
              </button>
              <button
                onClick={() => setOrderType('takeaway')}
                className={`py-3 px-4 rounded-lg font-heading font-semibold text-base transition-all duration-200 transform hover:scale-102 active:scale-95 ${
                  orderType === 'takeaway'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-200 border-2 border-amber-600'
                    : 'bg-white border-2 border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300'
                }`}
              >
                🥡 À emporter
              </button>
            </div>
          </Card>
          
          {/* Panier et Totaux - Section unifiée */}
          <Card padding="lg" className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-heading font-bold text-black text-lg">
                  Panier ({cart.length})
                </h3>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 text-sm font-semibold bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-all duration-200 active:scale-95"
                >
                  🗑️ Vider
                </button>
              )}
            </div>
            
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-10 h-10 text-green-500" />
                </div>
                <p className="text-sm text-green-700 font-sans font-medium">Panier vide</p>
                <p className="text-xs text-green-600 font-sans mt-1">Ajoutez des produits pour commencer</p>
              </div>
            ) : (
              <>
                {/* Liste des produits */}
                <div className="max-h-60 overflow-y-auto mb-4">
                  <div className="space-y-2">
                    {cart.map((item, index) => (
                      <div key={item.id}>
                        {/* Séparateur entre les éléments */}
                        {index > 0 && (
                          <div className="h-px bg-gradient-to-r from-transparent via-green-300 to-transparent mx-2 mb-2"></div>
                        )}
                        
                        {/* Carte produit compacte */}
                        <div className="bg-white rounded-lg border border-green-200 shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="px-3 py-2 flex items-center justify-between">
                            {/* Info produit */}
                            <div className="flex-1 min-w-0">
                              <div className="font-heading font-semibold text-lg text-black leading-tight truncate">{item.name}</div>
                              <div className="text-xs text-green-600 font-sans">
                                {formatPrice(calculateTTC(item.price))} × {item.quantity} = {formatPrice(calculateTTC(item.price) * item.quantity)}
                              </div>
                              {/* Notes du produit */}
                              {productNotes[item.id] && (
                                <div className="text-xs text-blue-600 font-sans italic mt-1">
                                  📝 {productNotes[item.id]}
                                </div>
                              )}
                              {/* Bouton pour ajouter une note */}
                              <button
                                onClick={() => {
                                  const note = prompt('Ajouter une note pour ce produit:', productNotes[item.id] || '');
                                  if (note !== null) {
                                    setProductNotes(prev => ({
                                      ...prev,
                                      [item.id]: note.trim() || undefined
                                    }));
                                  }
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 font-sans mt-1 underline"
                              >
                                {productNotes[item.id] ? 'Modifier la note' : 'Ajouter une note'}
                              </button>
                            </div>
                            
                            {/* Contrôles compacts */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-6 h-6 rounded-full bg-green-100 hover:bg-green-200 text-green-700 transition-all duration-200 active:scale-95 flex items-center justify-center"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center font-heading font-bold text-green-800 text-xs">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-6 h-6 rounded-full bg-green-600 text-white hover:bg-green-700 transition-all duration-200 active:scale-95 flex items-center justify-center"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            
                            {/* Zone poubelle séparée */}
                            <div className="flex items-center justify-center ml-3 pl-3 border-l border-green-200">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 active:scale-95 flex items-center justify-center shadow-sm"
                                title="Supprimer du panier"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Séparateur visuel */}
                <div className="h-px bg-gradient-to-r from-transparent via-green-400 to-transparent mx-4 mb-4"></div>

                {/* Code promo */}
                <Card padding="sm" className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 mb-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-heading font-semibold text-purple-800">
                      Code promo
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Ex: PROMO10"
                        className="flex-1 px-3 py-2 rounded-lg border-2 border-purple-200 bg-white text-black focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 transition-all font-sans text-sm"
                      />
                      <button
                        onClick={handlePromoCodeCheck}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all font-sans text-sm font-semibold"
                      >
                        Appliquer
                      </button>
                    </div>
                    {promoDiscount > 0 && (
                      <div className="text-sm text-green-700 font-semibold">
                        ✓ Réduction appliquée : -{formatPrice(promoDiscount, true)}
                      </div>
                    )}
                  </div>
                </Card>

                {/* Méthode de paiement */}
                <Card padding="sm" className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 mb-4">
                  <label className="block text-xs font-heading font-semibold text-indigo-800 mb-2">
                    Méthode de paiement
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['cash', 'card'].map((method) => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2 px-3 rounded-lg font-heading font-semibold text-sm transition-all ${
                          paymentMethod === method
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-white border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                        }`}
                      >
                        {method === 'cash' ? '💰 Espèces' : '💳 Carte'}
                      </button>
                    ))}
                  </div>
                </Card>

                {/* Section totaux intégrée */}
                <div className="bg-white rounded-xl border-2 border-green-200 p-4 mb-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-green-700 font-sans font-medium">Sous-total HT:</span>
                      <span className="font-heading font-bold text-green-800">{formatPrice(subtotal)}</span>
                    </div>
                    {promoDiscount > 0 && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-green-700 font-sans font-medium">Réduction:</span>
                        <span className="font-heading font-bold text-red-600">-{formatPrice(promoDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2">
                      <span className="text-green-700 font-sans font-medium">TVA (10%):</span>
                      <span className="font-heading font-bold text-green-800">{formatPrice(taxAmount)}</span>
                    </div>
                    <div className="border-t-2 border-green-200 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-heading font-bold text-green-900">Total TTC:</span>
                        <span className="text-2xl font-heading font-bold text-green-600">{formatPrice(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bouton de validation */}
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleCreateOrder}
                  loading={processing}
                  disabled={!customerName.trim()}
                  className="bg-black hover:bg-neutral-800 text-white font-heading font-bold py-4 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-102 active:scale-95"
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Création en cours...
                    </span>
                  ) : (
                    <span>Valider la commande</span>
                  )}
                </Button>
                
                {!customerName.trim() && (
                  <p className="text-xs text-green-600 text-center mt-2 font-sans">
                    ⚠️ Veuillez entrer le nom du client
                  </p>
                )}
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Bouton flottant Panier (mobile/tablette) */}
      <div className="fixed bottom-20 right-4 xl:hidden z-40">
        <button
          onClick={() => setShowMobileCart(true)}
          className="bg-black text-white rounded-full shadow-elegant px-5 py-3 flex items-center gap-2 active:scale-95"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="font-heading font-semibold">Panier ({cart.length})</span>
        </button>
      </div>

      {/* Modal Panier Mobile/Tablette */}
      {showMobileCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 xl:hidden">
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[90vh] overflow-hidden">
            {/* Header du modal */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-heading font-bold text-black text-lg">
                  Panier ({cart.length})
                </h3>
              </div>
              <button
                onClick={() => setShowMobileCart(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenu du modal */}
            <div className="p-4 space-y-4 max-h-[calc(90vh-140px)] overflow-y-auto">
              {/* Informations client */}
              <Card padding="md" className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="font-heading font-bold text-black text-base">Informations Client</h4>
                </div>
                
                <div className="space-y-3">
                  <div className="relative">
                    <label className="block text-xs font-heading font-semibold mb-1 text-blue-800">
                      Nom du client <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ex: Jean Dupont"
                      required
                      className="w-full px-3 py-2 rounded-lg border-2 border-blue-200 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 font-sans text-sm placeholder-blue-400"
                    />
                  </div>
                  
                  {tableNumberEnabled && orderType === 'dine-in' && (
                    <div className="relative">
                      <label className="block text-xs font-heading font-semibold mb-1 text-blue-800">
                        Numéro de table
                      </label>
                      <input
                        type="number"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        placeholder="Ex: 5"
                        className="w-full px-3 py-2 rounded-lg border-2 border-blue-200 bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 font-sans text-sm placeholder-blue-400"
                      />
                    </div>
                  )}
                </div>
              </Card>

              {/* Type de commande */}
              <Card padding="sm" className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 shadow-lg">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOrderType('dine-in')}
                    className={`py-3 px-4 rounded-lg font-heading font-semibold text-base transition-all duration-200 transform hover:scale-102 active:scale-95 ${
                      orderType === 'dine-in'
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-200 border-2 border-amber-600'
                        : 'bg-white border-2 border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300'
                    }`}
                  >
                    🍽️ Sur place
                  </button>
                  <button
                    onClick={() => setOrderType('takeaway')}
                    className={`py-3 px-4 rounded-lg font-heading font-semibold text-base transition-all duration-200 transform hover:scale-102 active:scale-95 ${
                      orderType === 'takeaway'
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-200 border-2 border-amber-600'
                        : 'bg-white border-2 border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300'
                    }`}
                  >
                    🥡 À emporter
                  </button>
                </div>
              </Card>

              {/* Liste des produits */}
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-sm text-green-700 font-sans font-medium">Panier vide</p>
                  <p className="text-xs text-green-600 font-sans mt-1">Ajoutez des produits pour commencer</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item, index) => (
                    <div key={item.id}>
                      {index > 0 && (
                        <div className="h-px bg-gradient-to-r from-transparent via-green-300 to-transparent mx-2 mb-2"></div>
                      )}
                      
                      <div className="bg-white rounded-lg border border-green-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="px-3 py-2 flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-heading font-semibold text-lg text-black leading-tight truncate">{item.name}</div>
                            <div className="text-xs text-green-600 font-sans">
                              {formatPrice(calculateTTC(item.price))} × {item.quantity} = {formatPrice(calculateTTC(item.price) * item.quantity)}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-6 h-6 rounded-full bg-green-100 hover:bg-green-200 text-green-700 transition-all duration-200 active:scale-95 flex items-center justify-center"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center font-heading font-bold text-green-800 text-xs">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-6 h-6 rounded-full bg-green-600 text-white hover:bg-green-700 transition-all duration-200 active:scale-95 flex items-center justify-center"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-center ml-3 pl-3 border-l border-green-200">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 active:scale-95 flex items-center justify-center shadow-sm"
                              title="Supprimer du panier"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Totaux */}
              {cart.length > 0 && (
                <Card padding="md" className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-green-700 font-sans font-medium">Sous-total HT:</span>
                      <span className="font-heading font-bold text-green-800">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-green-700 font-sans font-medium">TVA (10%):</span>
                      <span className="font-heading font-bold text-green-800">{formatPrice(taxAmount)}</span>
                    </div>
                    <div className="border-t-2 border-green-200 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-heading font-bold text-green-900">Total TTC:</span>
                        <span className="text-2xl font-heading font-bold text-green-600">{formatPrice(total)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Footer avec bouton de validation */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-200 bg-white">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleCreateOrder}
                  loading={processing}
                  disabled={!customerName.trim()}
                  className="bg-black hover:bg-neutral-800 text-white font-heading font-bold py-4 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-102 active:scale-95"
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Création en cours...
                    </span>
                  ) : (
                    <span>Valider la commande</span>
                  )}
                </Button>
                
                {!customerName.trim() && (
                  <p className="text-xs text-green-600 text-center mt-2 font-sans">
                    ⚠️ Veuillez entrer le nom du client
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal détails produit */}
      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />
    </div>
  );
};

export default ManagerPOS;
