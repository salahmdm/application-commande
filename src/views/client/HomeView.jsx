import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart,
  Calendar,
  Star,
  Sparkles,
  Clock,
  Gift,
  Mail
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ContactInfoEditor from '../../components/admin/ContactInfoEditor';
import useProducts from '../../hooks/useProducts';
import useCart from '../../hooks/useCart';
import useAuth from '../../hooks/useAuth';
import homeService from '../../services/homeService';
import { apiCall } from '../../services/api';
import newsService from '../../services/newsService';
import NewsEditor from '../../components/news/NewsEditor';
import { calculateTTC, formatPrice } from '../../constants/pricing';
import useNotifications from '../../hooks/useNotifications';
import useUIStore from '../../store/uiStore';

/**
 * 🎨 Page d'Accueil Ultra-Moderne avec Effets Visuels Avancés
 * Design futuriste avec gradients animés, glassmorphism et micro-interactions
 */
const HomeView = () => {
  const { popularProducts } = useProducts();
  const { add } = useCart();
  const { user, isAdmin, isManager } = useAuth();
  const [homeStats, setHomeStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [hoveredNews, setHoveredNews] = useState(null);
  const [news, setNews] = useState([]);
  const [showNewsEditor, setShowNewsEditor] = useState(false);
  const { success, error: showError } = useNotifications();
  const { setCurrentView } = useUIStore();
  
  // Charger les informations business depuis la base (table app_settings)
  const loadBusinessInfo = async () => {
    try {
      const res = await apiCall('/admin/settings');
      if (res?.success && Array.isArray(res.data)) {
        const map = Object.fromEntries(res.data.map(s => [s.setting_key, s.setting_value]));
        const hours = (() => {
          try { return map.opening_hours ? JSON.parse(map.opening_hours) : {}; } catch { return {}; }
        })();
        setBusinessInfo({
          name: map.app_name || 'Blossom Café',
          slogan: map.welcome_message || "L'art du thé et de la douceur",
          address: map.restaurant_address || '',
          phone: map.contact_phone || '',
          email: map.contact_email || '',
          hours,
          isOpen: true,
          nextOpenTime: null
        });
      }
    } catch (error) {
      console.error('❌ Erreur chargement infos business:', error);
    }
  };
  
  // Charger les actualités
  const loadNews = async () => {
    try {
      const response = await newsService.getNews();
      if (response.success && response.data) {
        setNews(response.data.sort((a, b) => (a.order || 0) - (b.order || 0)));
      }
    } catch (error) {
      console.error('❌ Erreur chargement actualités:', error);
      // Utiliser les données par défaut en cas d'erreur
      setNews([
        {
          id: 1,
          title: "Atelier dégustation de thés",
          date: "Samedi 24 Octobre",
          description: "Découvrez nos thés rares lors de notre atelier dégustation",
          icon: "🍃",
          gradient: "from-emerald-400 via-teal-500 to-cyan-600",
          bgPattern: "bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.15),transparent_50%)]"
        },
        {
          id: 2,
          title: "Nouveau gâteau Matcha et Yuzu",
          description: "Notre nouvelle création est maintenant disponible !",
          icon: "🍰",
          gradient: "from-pink-400 via-rose-500 to-purple-600",
          bgPattern: "bg-[radial-gradient(circle_at_70%_30%,rgba(236,72,153,0.15),transparent_50%)]"
        },
        {
          id: 3,
          title: "Happy Hour spécial",
          description: "Réductions sur tous nos desserts de 15h à 17h",
          icon: "🎉",
          gradient: "from-violet-400 via-purple-500 to-indigo-600",
          bgPattern: "bg-[radial-gradient(circle_at_50%_70%,rgba(139,92,246,0.15),transparent_50%)]"
        }
      ]);
    }
  };

  // Charger les données de la page d'accueil
  useEffect(() => {
    const loadHomeData = async () => {
      try {
        console.log('📊 HomeView - Chargement des données...');
        const response = await homeService.getHomeStats();
        
        if (response.success && response.data) {
          console.log('✅ HomeView - Données reçues:', response.data);
          setHomeStats(response.data);
        }
        
        await loadBusinessInfo();
        await loadNews();
      } catch (error) {
        console.error('❌ HomeView - Erreur chargement données:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadHomeData();
  }, []);

  // Mettre à jour les informations business
  const updateBusinessInfo = async (newInfo) => {
    // Mise à jour UI immédiate
    setBusinessInfo(prev => ({ ...prev, ...newInfo }));
    console.log('✅ Informations business mises à jour (UI):', newInfo);

    // Persistance dans app_settings
    try {
      const tasks = [];
      if (newInfo.name !== undefined) tasks.push(apiCall('/admin/settings/app_name', { method: 'PUT', body: JSON.stringify({ value: String(newInfo.name) }) }));
      if (newInfo.email !== undefined) tasks.push(apiCall('/admin/settings/contact_email', { method: 'PUT', body: JSON.stringify({ value: String(newInfo.email) }) }));
      if (newInfo.phone !== undefined) tasks.push(apiCall('/admin/settings/contact_phone', { method: 'PUT', body: JSON.stringify({ value: String(newInfo.phone) }) }));
      if (newInfo.address !== undefined) tasks.push(apiCall('/admin/settings/restaurant_address', { method: 'PUT', body: JSON.stringify({ value: String(newInfo.address) }) }));
      if (newInfo.hours !== undefined) {
        // Sauvegarder les horaires en JSON (chaîne)
        const hoursJson = JSON.stringify(newInfo.hours || {});
        tasks.push(apiCall('/admin/settings/opening_hours', { method: 'PUT', body: JSON.stringify({ value: hoursJson }) }));
      }
      await Promise.all(tasks);
      success('Informations enregistrées.');
    } catch (err) {
      console.error('❌ Erreur sauvegarde Horaires & Contact:', err);
      showError('Impossible d\'enregistrer les informations.');
    }
  };
  
  // Charger les produits vedettes depuis la base de données
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        setLoadingProducts(true);
        
        // Essayer d'abord avec homeStats.topProducts (produits les plus vendus)
        if (homeStats?.topProducts?.length > 0) {
          // Récupérer les détails complets des produits depuis la base
          const productIds = homeStats.topProducts.map(p => p.id);
          const productsResponse = await apiCall('/api/products');
          
          if (productsResponse?.success && productsResponse.data) {
            // Filtrer les produits qui sont dans topProducts et disponibles
            const availableProducts = productsResponse.data.filter(p => 
              productIds.includes(p.id) && p.is_available === 1
            );
            
            // Trier selon l'ordre de topProducts
            const sortedProducts = productIds
              .map(id => availableProducts.find(p => p.id === id))
              .filter(Boolean)
              .slice(0, 6);
            
            setFeaturedProducts(sortedProducts);
          }
        } else {
          // Fallback : utiliser les produits avec is_featured = 1
          const productsResponse = await apiCall('/api/products');
          
          if (productsResponse?.success && productsResponse.data) {
            const featured = productsResponse.data
              .filter(p => p.is_featured === 1 && p.is_available === 1)
              .slice(0, 6);
            
            // Si aucun produit featured, utiliser les produits disponibles
            if (featured.length === 0) {
              const available = productsResponse.data
                .filter(p => p.is_available === 1)
                .slice(0, 6);
              setFeaturedProducts(available);
            } else {
              setFeaturedProducts(featured);
            }
          }
        }
      } catch (error) {
        console.error('❌ Erreur chargement produits vedettes:', error);
        // Fallback vers popularProducts si erreur
        setFeaturedProducts(popularProducts.filter(p => p.is_available === 1).slice(0, 6));
      } finally {
        setLoadingProducts(false);
      }
    };
    
    loadFeaturedProducts();
  }, [homeStats, popularProducts]);
  
  // Gestion des actualités (admin/manager)
  const handleNewsSave = async (newsData) => {
    try {
      console.log('💾 handleNewsSave appelé avec:', newsData);
      console.log('  - ID présent:', !!newsData.id);
      console.log('  - ID valeur:', newsData.id);
      
      let response;
      if (newsData.id) {
        // Pour la modification, extraire l'ID et envoyer les autres données
        const { id, ...dataToUpdate } = newsData;
        console.log('📝 Mise à jour - ID:', id);
        console.log('📝 Mise à jour - Données:', dataToUpdate);
        response = await newsService.updateNews(id, dataToUpdate);
      } else {
        console.log('➕ Création - Données:', newsData);
        response = await newsService.createNews(newsData);
      }
      
      console.log('📡 Réponse reçue:', response);
      
      if (response && response.success) {
        success(newsData.id ? 'Actualité modifiée !' : 'Actualité ajoutée !');
        await loadNews();
      } else {
        const errorMsg = response?.error || response?.message || 'Erreur lors de la sauvegarde';
        console.error('❌ Erreur dans la réponse:', errorMsg);
        showError(errorMsg);
      }
    } catch (error) {
      console.error('❌ Exception dans handleNewsSave:', error);
      console.error('  - Message:', error.message);
      console.error('  - Stack:', error.stack);
      showError(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleNewsDelete = async (id) => {
    try {
      const response = await newsService.deleteNews(id);
      if (response.success) {
        success('Actualité supprimée !');
        await loadNews();
      } else {
        showError(response.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      showError(error.message || 'Erreur lors de la suppression');
    }
  };

  
  return (
    <div className="app-container relative overflow-hidden">
      {/* Fond animé avec particules */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl animate-pulse animation-delay-500"></div>
      </div>

      {/* Hero Section - Style chaleureux et élégant */}
      <section className="relative py-24 sm:py-32 lg:py-40 overflow-hidden">
        {/* Fond avec dégradé chaleureux */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50"></div>
        
        {/* Motifs organiques subtils */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-rose-200/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Titre élégant et centré */}
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-serif font-light text-amber-900 mb-4 leading-none" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {businessInfo?.name || 'Blossom Café'}
          </h1>
          
          {/* Ligne décorative sous le titre */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <div className="w-16 h-px bg-amber-700/30"></div>
            <div className="w-2 h-2 rounded-full bg-amber-700/40"></div>
            <div className="w-16 h-px bg-amber-700/30"></div>
          </div>
          
          {/* Bouton Commandez */}
          <div className="mt-10">
            <Button
              variant="primary"
              size="xl"
              onClick={() => setCurrentView('products')}
              className="bg-black hover:bg-neutral-800 text-white border-none transition-colors duration-200"
            >
              Commandez
            </Button>
          </div>
        </div>
        
        {/* Transition douce */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-b from-transparent to-white"></div>
      </section>
      
      <div className="page-container relative z-10 animate-fade-in-up">

        {/* Actualités - Bandeaux larges améliorés avec design premium */}
        {news.length > 0 && (
          <section className="section-container relative">
            {/* Fond décoratif avec gradients */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
            
            <div className="relative z-10">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-100 via-blue-100 to-purple-100 rounded-full mb-6 animate-fade-in shadow-lg border border-purple-200/50">
                  <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
                  <span className="text-sm font-bold text-purple-900 uppercase tracking-wider">Nouveautés</span>
                </div>
                <h2 className="section-title text-5xl sm:text-6xl font-black bg-gradient-to-r from-slate-900 via-purple-800 to-slate-900 bg-clip-text text-transparent mb-4">
                  Actualités & Événements
                </h2>
                <p className="page-subtitle text-lg mt-4 text-slate-600 max-w-2xl mx-auto">
                  Découvrez les dernières nouveautés et événements à ne pas manquer
                </p>
              </div>

              {/* Bouton Modifier pour admin/manager */}
              {(isAdmin || isManager) && (
                <div className="mb-8 flex justify-end">
                  <Button
                    onClick={() => setShowNewsEditor(!showNewsEditor)}
                    variant="outline"
                    size="md"
                    icon={<Sparkles className="w-4 h-4" />}
                    className="shadow-md hover:shadow-lg transition-shadow"
                  >
                    {showNewsEditor ? 'Masquer l\'éditeur' : 'Modifier les actualités'}
                  </Button>
                </div>
              )}

              {/* Éditeur d'actualités */}
              {(isAdmin || isManager) && showNewsEditor && (
                <div className="mb-10 p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-purple-200">
                  <NewsEditor
                    news={news}
                    onSave={handleNewsSave}
                    onDelete={handleNewsDelete}
                  />
                </div>
              )}
            
              {/* Bandeaux larges empilés avec design premium */}
              <div className="space-y-8" style={{ position: 'relative', zIndex: 1 }}>
                {news.map((item, index) => (
                  <div
                    key={item.id}
                    className="group relative overflow-hidden bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-700 border-2 border-neutral-200 hover:border-purple-400 transform hover:-translate-y-1"
                    style={{ animationDelay: `${index * 100}ms`, position: 'relative', zIndex: 1 }}
                    onMouseEnter={() => setHoveredNews(item.id)}
                    onMouseLeave={() => setHoveredNews(null)}
                  >
                    {/* Barre colorée en haut */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="flex flex-col md:flex-row">
                      {/* Image à gauche avec overlay */}
                      <div className="relative w-full md:w-2/5 h-72 md:h-auto overflow-hidden bg-gradient-to-br from-purple-100 via-blue-100 to-purple-100">
                        {item.image_url ? (
                          <>
                            <img
                              src={item.image_url.startsWith('http') ? item.image_url : `http://localhost:5000${item.image_url}`}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            {/* Overlay gradient au survol */}
                            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          </>
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center text-7xl bg-gradient-to-br ${item.gradient || 'from-purple-200 via-blue-200 to-purple-200'} group-hover:scale-110 transition-transform duration-500`}>
                            {item.icon || '📰'}
                          </div>
                        )}
                        
                        {/* Badge décoratif en coin - Affiché seulement si is_new est true */}
                        {item.is_new && (
                          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border border-white/50">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Nouveau</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Contenu à droite avec padding amélioré */}
                      <div className="flex-1 p-8 md:p-10 flex flex-col justify-center bg-gradient-to-br from-white to-neutral-50/50">
                        {/* Date avec style amélioré */}
                        {item.date && (
                          <div className="flex items-center gap-2 mb-5">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Calendar className="w-4 h-4 text-purple-600" />
                            </div>
                            <span className="text-sm font-bold text-purple-700 uppercase tracking-wider">
                              {item.date}
                            </span>
                          </div>
                        )}
                        
                        {/* Titre avec gradient au survol */}
                        <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-5 group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-blue-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-500 leading-tight">
                          {item.title}
                        </h3>
                        
                        {/* Description avec meilleure lisibilité */}
                        <p className="text-slate-600 leading-relaxed mb-0 text-base sm:text-lg">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Effet de brillance animé au survol */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-100/30 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-1000 pointer-events-none"></div>
                    
                    {/* Lueur au survol */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10"></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
        
        {/* 🍰 Grille de produits vedettes avec design moderne */}
        {loadingProducts ? (
          <section className="section-container">
            <div className="text-center py-20">
              <div className="inline-block w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-slate-600">Chargement des produits...</p>
            </div>
          </section>
        ) : featuredProducts.length > 0 ? (
          <section className="section-container">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full mb-4 animate-fade-in">
                <Star className="w-5 h-5 text-amber-600 animate-pulse" />
                <span className="text-sm font-bold text-amber-900 uppercase tracking-wider">Bestsellers</span>
              </div>
              <h2 className="section-title text-5xl font-black bg-gradient-to-r from-slate-900 via-amber-900 to-slate-900 bg-clip-text text-transparent">
                Nos Produits Vedettes
              </h2>
              <p className="page-subtitle text-lg mt-4">
                Découvrez nos créations les plus appréciées par nos clients
              </p>
            </div>
            
            {/* Grille de produits moderne */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product, index) => (
                <Card
                  key={product.id || index}
                  padding="lg"
                  variant="glass"
                  hover={true}
                  className="group relative overflow-hidden backdrop-blur-xl bg-white/90 border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Badge "Vedette" */}
                  <div className="absolute top-4 right-4 z-20">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full shadow-lg">
                      <Star className="w-3.5 h-3.5 text-white fill-white" />
                      <span className="text-xs font-bold text-white">Vedette</span>
                    </div>
                  </div>
                  
                  {/* Image du produit */}
                  <div className="relative w-full h-48 mb-4 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="absolute inset-0 flex items-center justify-center text-6xl" style={{ display: product.image_url ? 'none' : 'flex' }}>
                      🍰
                    </div>
                    {/* Overlay gradient au survol */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  
                  {/* Informations du produit */}
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-amber-600 transition-colors duration-300 line-clamp-2">
                      {product.name}
                    </h3>
                    
                    {product.description && (
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    
                    {/* Prix et bouton */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-2xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                          {formatPrice(calculateTTC(product.price))}
                        </div>
                      </div>
                      
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => {
                          add(product);
                          success(`${product.name} ajouté au panier !`);
                        }}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        icon={<ShoppingCart className="w-4 h-4" />}
                      >
                        Ajouter
                      </Button>
                    </div>
                  </div>
                  
                  {/* Effet de brillance au survol */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 -translate-x-full group-hover:translate-x-full"></div>
                </Card>
              ))}
            </div>
          </section>
        ) : null}
        
        {/* 💎 Programme fidélité avec design luxueux */}
        {user?.points !== undefined && !user?.isGuest && (
          <section className="section-container">
            <Card padding="xl" variant="glass" hover={true} className="animate-fade-in-up backdrop-blur-2xl bg-gradient-to-br from-purple-50/90 via-white/90 to-blue-50/90 border border-white/50 shadow-2xl overflow-hidden relative">
              {/* Fond décoratif animé */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-pink-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
              
              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="flex-1 text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-xl animate-float">
                      <Gift className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Programme Fidélité Premium
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-3 px-6 py-4 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-purple-200/50">
                      <span className="text-lg text-slate-700">Vous avez actuellement</span>
                      <span className="text-4xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        {user.points}
                      </span>
                      <span className="text-lg font-bold text-purple-600">points</span>
                    </div>
                    
                    <p className="text-lg text-slate-600">
                      Plus que <span className="font-black text-2xl text-emerald-600">{Math.max(0, 500 - user.points)}</span> points pour une récompense exclusive !
                    </p>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="text-9xl animate-float">🎁</div>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl animate-pulse"></div>
                </div>
              </div>
              
              {/* Barre de progression ultra-moderne */}
              <div className="relative z-10 mt-10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Progression vers la récompense</span>
                  <span className="text-2xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    {Math.round((user.points / 500) * 100)}%
                  </span>
                </div>
                
                <div className="relative">
                  {/* Fond de la barre */}
                  <div className="bg-slate-200 rounded-full
                  h-6 overflow-hidden shadow-inner relative">
                    {/* Barre de progression avec gradient animé */}
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 transition-all duration-1000 ease-out shadow-2xl relative overflow-hidden animate-gradient-shift"
                      style={{ width: `${Math.min((user.points / 500) * 100, 100)}%` }}
                    >
                      {/* Effet de brillance animée */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                    </div>
                    
                    {/* Points de milestone */}
                    <div className="absolute top-0 left-0 right-0 bottom-0 flex justify-between items-center px-2">
                      {[0, 25, 50, 75, 100].map((milestone) => (
                        <div 
                          key={milestone}
                          className={`w-3 h-3 rounded-full border-2 transition-all duration-500 ${
                            (user.points / 500) * 100 >= milestone
                              ? 'bg-white border-white shadow-lg scale-125'
                              : 'bg-slate-300 border-slate-400'
                          }`}
                        ></div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Effet de lueur sous la barre */}
                  <div 
                    className="absolute -bottom-2 left-0 h-4 bg-gradient-to-r from-purple-500/50 to-blue-500/50 blur-xl transition-all duration-1000"
                    style={{ width: `${Math.min((user.points / 500) * 100, 100)}%` }}
                  ></div>
                </div>

                {/* Badges de récompenses */}
                <div className="flex justify-center gap-4 mt-8">
                  <div className={`flex flex-col items-center gap-2 transition-all duration-500 ${user.points >= 100 ? 'scale-100 opacity-100' : 'scale-75 opacity-40'}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${user.points >= 100 ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-xl' : 'bg-slate-200'}`}>
                      🥉
                    </div>
                    <span className="text-xs font-semibold text-slate-600">Bronze</span>
                  </div>
                  <div className={`flex flex-col items-center gap-2 transition-all duration-500 ${user.points >= 250 ? 'scale-100 opacity-100' : 'scale-75 opacity-40'}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${user.points >= 250 ? 'bg-gradient-to-br from-slate-300 to-slate-500 shadow-xl' : 'bg-slate-200'}`}>
                      🥈
                    </div>
                    <span className="text-xs font-semibold text-slate-600">Argent</span>
                  </div>
                  <div className={`flex flex-col items-center gap-2 transition-all duration-500 ${user.points >= 500 ? 'scale-100 opacity-100' : 'scale-75 opacity-40'}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${user.points >= 500 ? 'bg-gradient-to-br from-amber-300 to-yellow-500 shadow-xl' : 'bg-slate-200'}`}>
                      🥇
                    </div>
                    <span className="text-xs font-semibold text-slate-600">Or</span>
                  </div>
                </div>
              </div>
            </Card>
          </section>
        )}
        
        {/* 🕒 Section Horaires et Contact avec design moderne */}
        {businessInfo && (
          <section className="section-container">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full mb-4 animate-fade-in">
                <Clock className="w-5 h-5 text-blue-600 animate-pulse" />
                <span className="text-sm font-bold text-blue-900 uppercase tracking-wider">Informations</span>
              </div>
              <h2 className="section-title text-5xl font-black bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">
                Horaires & Contact
              </h2>
              <p className="page-subtitle text-lg mt-4">
                Retrouvez toutes nos informations pratiques
              </p>
            </div>

            <ContactInfoEditor 
              businessInfo={businessInfo} 
              onUpdate={updateBusinessInfo}
            />
          </section>
        )}

        {/* 💬 Section Contact avec design moderne */}
        <section className="section-container">
          <Card padding="xl" variant="glass" className="relative overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-purple-500/90 via-blue-600/90 to-emerald-500/90 border-none shadow-2xl">
            {/* Effets décoratifs */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float animation-delay-1000"></div>
            
            <div className="relative z-10 text-center py-12">
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 drop-shadow-2xl">
                Une question ? Contactez-nous !
              </h2>
              <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
                Notre équipe est là pour vous accompagner et répondre à toutes vos questions
              </p>
              
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="xl"
                  onClick={() => window.open(`mailto:${businessInfo?.email || 'contact@blossom-cafe.fr'}`, '_blank')}
                  className="group relative overflow-hidden border-2 border-white text-white hover:bg-white/20 shadow-2xl"
                  icon={<Mail className="w-6 h-6" />}
                >
                  <span className="relative z-10 text-lg font-bold">Nous contacter par email</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </Button>
              </div>
            </div>
          </Card>
        </section>
      
        {/* Loader ultra-moderne */}
        {loading && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-xl flex justify-center items-center z-50">
            <div className="flex flex-col items-center gap-6">
              {/* Spinner avec gradient animé */}
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full border-8 border-slate-200"></div>
                <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-purple-600 border-r-blue-600 animate-spin"></div>
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 animate-pulse"></div>
              </div>
              
              <div className="text-center">
                <p className="text-xl font-bold text-slate-900 mb-2">Chargement...</p>
                <p className="text-slate-600">Préparation de votre expérience</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeView;