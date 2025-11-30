import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Sparkles,
  Gift,
  Mail,
  ShoppingBag
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import useAuth from '../../hooks/useAuth';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useProducts from '../../hooks/useProducts';
import newsService from '../../services/newsService';
import NewsEditor from '../../components/news/NewsEditor';
import useNotifications from '../../hooks/useNotifications';
import useUIStore from '../../store/uiStore';
import settingsService from '../../services/settingsService';
import { apiCall } from '../../services/api';
import logger from '../../utils/logger';

/**
 * 🎨 Page d'Accueil Ultra-Moderne avec Effets Visuels Avancés
 * Design futuriste avec gradients animés, glassmorphism et micro-interactions
 */
const HomeView = () => {
  const { user, isAdmin, isManager } = useAuth();
  const userFromStore = useAuthStore(state => state.user);
  const { applyLoyaltyReward } = useCartStore();
  const { setShowCart } = useUIStore();
  const { refresh: refreshProducts } = useProducts();
  const [loading, setLoading] = useState(true);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [contactEmail, setContactEmail] = useState(null);
  const [news, setNews] = useState([]);
  const [showNewsEditor, setShowNewsEditor] = useState(false);
  const [loyaltyRewards, setLoyaltyRewards] = useState([]);
  const [usedRewards, setUsedRewards] = useState([]); // Récompenses déjà utilisées
  const [showRewardConfirmModal, setShowRewardConfirmModal] = useState(false);
  const [rewardToConfirm, setRewardToConfirm] = useState(null);
  const { success, error: showError } = useNotifications();
  const { setCurrentView } = useUIStore();
  
  // Charger les récompenses utilisées depuis localStorage
  useEffect(() => {
    if (!user?.id) {
      setUsedRewards([]);
      return;
    }
    
    // Référence pour comparer les valeurs et éviter les re-renders inutiles
    let lastUsedRewardsValue = null;
    
    const loadUsedRewards = () => {
      if (!user?.id) return;
      
      const stored = localStorage.getItem(`usedRewards_${user.id}`);
      const currentValue = stored || null;
      
      // Ne mettre à jour que si la valeur a vraiment changé
      if (currentValue !== lastUsedRewardsValue) {
        lastUsedRewardsValue = currentValue;
        
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setUsedRewards(prev => {
              // Comparer avec l'état précédent pour éviter les re-renders inutiles
              const prevStr = JSON.stringify(prev);
              const newStr = JSON.stringify(parsed);
              if (prevStr === newStr) return prev;
              return parsed;
            });
          } catch (e) {
            logger.error('❌ HomeView - Erreur parsing usedRewards:', e);
            setUsedRewards(prev => prev.length === 0 ? prev : []);
          }
        } else {
          setUsedRewards(prev => prev.length === 0 ? prev : []);
        }
      }
    };
    
    // Charger au montage
    loadUsedRewards();
    
    // Écouter les changements de localStorage (quand une récompense est retirée dans le panier)
    const handleStorageChange = (e) => {
      if (e.key === `usedRewards_${user?.id}`) {
        loadUsedRewards();
      }
    };
    
    // Écouter les événements personnalisés pour une mise à jour immédiate
    const handleRewardRemoved = () => {
      // Recharger immédiatement les récompenses utilisées
      setTimeout(() => {
        loadUsedRewards();
      }, 100);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('rewardRemoved', handleRewardRemoved);
    
    // ✅ OPTIMISATION: Vérifier localStorage toutes les 10 secondes (au lieu de 2 secondes)
    // Réduit la charge CPU et améliore les performances
    const intervalId = setInterval(() => {
      loadUsedRewards();
    }, 10000);
    
    // ✅ OPTIMISATION: Nettoyage correct de tous les event listeners et intervales
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('rewardRemoved', handleRewardRemoved);
      clearInterval(intervalId);
    };
  }, [user?.id]);
  
  // ✅ OPTIMISATION: Mémoriser les fonctions de chargement pour éviter les re-créations
  const loadBusinessInfo = useCallback(async () => {
    try {
      const res = await settingsService.getBusinessInfo();
      if (res?.success && res.data) {
        setBusinessInfo(res.data);
      }
    } catch (error) {
      logger.error('❌ Erreur chargement infos business:', error);
    }
  }, []);
  
  // Charger l'adresse mail de contact
  const loadContactEmail = useCallback(async () => {
    try {
      const res = await settingsService.getSetting('contact_email');
      if (res?.success && res.data?.value) {
        setContactEmail(res.data.value);
      }
    } catch (error) {
      logger.error('❌ Erreur chargement adresse mail contact:', error);
    }
  }, []);
  
  // ✅ OPTIMISATION: Mémoriser les fonctions de chargement pour éviter les re-créations
  const loadNews = useCallback(async () => {
    try {
      const response = await newsService.getNews();
      if (response.success && response.data) {
        setNews(response.data.sort((a, b) => (a.display_order || a.order || 0) - (b.display_order || b.order || 0)));
      } else {
        setNews([]);
      }
    } catch (error) {
      logger.error('❌ Erreur chargement actualités:', error);
      setNews([]);
    }
  }, []);

  // ✅ OPTIMISATION: Mémoriser les fonctions de chargement pour éviter les re-créations
  const loadLoyaltyRewards = useCallback(async () => {
    try {
      const response = await apiCall('/loyalty-rewards');
      if (response.success && response.data) {
        // Convertir les données de la BDD au format attendu par le frontend
        const rewardsList = response.data.map(reward => ({
          name: reward.name || '',
          description: reward.description || '',
          pointsRequired: reward.points_required || 0,
          type: reward.reward_type || 'percentage',
          discountValue: reward.discount_value || 0,
          productId: reward.product_id || null,
          icon: reward.icon || '🎁'
        }));
        setLoyaltyRewards(Array.isArray(rewardsList) ? rewardsList : []);
      } else {
        setLoyaltyRewards([]);
      }
    } catch (error) {
      logger.error('❌ Erreur chargement récompenses fidélité:', error);
      // Fallback : essayer de charger depuis les settings si l'API échoue
      try {
        const rewardsResponse = await settingsService.getSetting('loyalty_rewards');
        if (rewardsResponse.success && rewardsResponse.data?.value) {
          let rewards = [];
          try {
            rewards = typeof rewardsResponse.data.value === 'string' 
              ? JSON.parse(rewardsResponse.data.value) 
              : rewardsResponse.data.value;
          } catch {
            rewards = [];
          }
          setLoyaltyRewards(Array.isArray(rewards) ? rewards : []);
        } else {
          setLoyaltyRewards([]);
        }
      } catch (fallbackError) {
        logger.error('❌ Erreur fallback settings:', fallbackError);
        setLoyaltyRewards([]);
      }
    }
  }, []);

  // Charger les données de la page d'accueil
  useEffect(() => {
    const loadHomeData = async () => {
      // Timeout de sécurité : toujours désactiver le loading après 2 secondes max
      const safetyTimeout = setTimeout(() => {
        logger.warn('⚠️ HomeView - Timeout de sécurité, désactivation du loading');
        setLoading(false);
      }, 2000);
      
      try {
        logger.debug('📊 HomeView - Chargement des données...');
        
        const businessPromise = loadBusinessInfo().catch(err => {
          logger.warn('⚠️ HomeView - Erreur business info (non bloquant):', err);
        });
        
        const contactEmailPromise = loadContactEmail().catch(err => {
          logger.warn('⚠️ HomeView - Erreur adresse mail contact (non bloquant):', err);
        });
        
        const newsPromise = loadNews().catch(err => {
          logger.warn('⚠️ HomeView - Erreur news (non bloquant):', err);
        });
        
        const rewardsPromise = loadLoyaltyRewards().catch(err => {
          logger.warn('⚠️ HomeView - Erreur récompenses fidélité (non bloquant):', err);
        });
        
        // Charger les autres données en parallèle (sans bloquer)
        await Promise.allSettled([businessPromise, contactEmailPromise, newsPromise, rewardsPromise]);
        
        // Désactiver le loading rapidement
        clearTimeout(safetyTimeout);
        setLoading(false);
        logger.debug('✅ HomeView - Chargement terminé');
      } catch (error) {
        logger.error('❌ HomeView - Erreur chargement données:', error);
        // Désactiver le loading même en cas d'erreur
        clearTimeout(safetyTimeout);
        setLoading(false);
      }
    };
    
    loadHomeData();
  }, [user?.id, loadBusinessInfo, loadContactEmail, loadNews, loadLoyaltyRewards]); // ✅ Toutes les dépendances
  
  // Rafraîchir les points séparément pour éviter les boucles infinies
  useEffect(() => {
    const userId = user?.id;
    const isGuest = user?.isGuest;
    
    if (!userId || isGuest) {
      return;
    }
    
    // Utiliser un ref pour éviter les appels multiples
    let isMounted = true;
    let hasCalled = false;
    
    const refreshPointsOnce = async () => {
      if (hasCalled) return;
      hasCalled = true;
      
      try {
        logger.debug('🔄 HomeView - Rafraîchissement des points pour user:', userId);
        const { refreshPoints: refreshPointsFromStore } = useAuthStore.getState();
        if (refreshPointsFromStore && isMounted) {
          const result = await refreshPointsFromStore();
          if (result && isMounted) {
            // ✅ SÉCURITÉ: Ne pas logger les points de fidélité (données sensibles)
            logger.debug('✅ HomeView - Points rafraîchis depuis la BDD');
            // Ne pas forcer de re-render ici pour éviter les boucles
          }
        }
      } catch (err) {
        if (isMounted) {
          logger.error('❌ HomeView - Erreur rafraîchissement points:', err);
        }
      } finally {
        hasCalled = false;
      }
    };
    
    // Délai pour éviter les appels multiples rapides
    const timeoutId = setTimeout(refreshPointsOnce, 500);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [user?.id, user?.isGuest]); // ✅ Dépend uniquement de l'ID et du statut guest
  
  // ✅ OPTIMISATION: Mémoriser les handlers pour éviter les re-renders
  const handleRewardClick = useCallback((reward) => {
    const currentPoints = user?.loyalty_points || user?.points || 0;
    const rewardId = `${reward.pointsRequired}_${reward.name}`;
    
    // Vérifier si la récompense a déjà été utilisée
    if (usedRewards.includes(rewardId)) {
      showError('Cette récompense a déjà été utilisée');
      return;
    }
    
    // Vérifier si l'utilisateur a assez de points
    if (currentPoints < (reward.pointsRequired || 0)) {
      showError(`Vous n'avez pas assez de points. Il vous faut ${reward.pointsRequired || 0} points.`);
      return;
    }
    
    // Ouvrir la modale de confirmation
    setRewardToConfirm(reward);
    setShowRewardConfirmModal(true);
  }, [user?.loyalty_points, user?.points, usedRewards, showError]);
  
  // ✅ OPTIMISATION: Mémoriser les handlers pour éviter les re-renders
  const handleApplyReward = useCallback(async () => {
    if (!rewardToConfirm) return;
    
    try {
      const reward = rewardToConfirm;
      
      // NE PAS déduire les points maintenant - ils seront déduits uniquement après le paiement de la commande
      // Appliquer simplement la récompense au panier
      applyLoyaltyReward(reward);
      
      // Fermer la modale
      setShowRewardConfirmModal(false);
      setRewardToConfirm(null);
      
      // Ouvrir le panier
      setShowCart(true);
      
      success(`Récompense "${reward.name}" appliquée au panier ! Les points seront déduits uniquement après le paiement de la commande.`);
    } catch (error) {
      logger.error('❌ Erreur application récompense:', error);
      logger.error('   - Message:', error.message);
      logger.error('   - Stack:', error.stack);
      const errorMessage = error.message || 'Erreur lors de l\'application de la récompense. Veuillez réessayer.';
      showError(errorMessage);
    }
  }, [rewardToConfirm, applyLoyaltyReward, setShowCart, success, showError]);
  
  // Annuler la confirmation
  const handleCancelReward = () => {
    setShowRewardConfirmModal(false);
    setRewardToConfirm(null);
  };
  
  // Gestion des actualités (admin/manager)
  const handleNewsSave = async (newsData) => {
    try {
      logger.debug('💾 handleNewsSave appelé avec:', newsData);
      
      let response;
      if (newsData.id) {
        // Pour la modification, extraire l'ID et envoyer les autres données
        const { id, ...dataToUpdate } = newsData;
        logger.debug('📝 Mise à jour - ID:', id);
        response = await newsService.updateNews(id, dataToUpdate);
      } else {
        logger.debug('➕ Création - Données:', newsData);
        response = await newsService.createNews(newsData);
      }
      
      logger.debug('📡 Réponse reçue:', response);
      
      if (response && response.success) {
        success(newsData.id ? 'Actualité modifiée !' : 'Actualité ajoutée !');
        await loadNews();
      } else {
        const errorMsg = response?.error || response?.message || 'Erreur lors de la sauvegarde';
        logger.error('❌ Erreur dans la réponse:', errorMsg);
        showError(errorMsg);
      }
    } catch (error) {
      logger.error('❌ Exception dans handleNewsSave:', error);
      logger.error('  - Message:', error.message);
      logger.error('  - Stack:', error.stack);
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
          
          {/* Bouton Nos Produits */}
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => {
                if (isAdmin || isManager) {
                  setCurrentView('manager-pos');
                } else {
                  setCurrentView('products');
                }
              }}
              onMouseEnter={() => {
                // Précharger les produits au survol pour améliorer la fluidité
                if (!isAdmin && !isManager) {
                  // Précharger en arrière-plan sans bloquer
                  refreshProducts().catch(() => {
                    // Ignorer les erreurs de préchargement silencieusement
                  });
                }
              }}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-black text-white shadow-elegant transition-all duration-200 hover:scale-105 active:scale-95 font-heading font-semibold text-lg"
            >
              <ShoppingBag className="w-6 h-6" />
              <span>Nos Produits</span>
            </button>
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
        
        {/* 💎 Programme fidélité avec design luxueux */}
        {user && !user?.isGuest && (user?.points !== undefined || user?.loyalty_points !== undefined) && (
          <section className="section-container">
            <Card padding="xl" variant="glass" hover={true} className="animate-fade-in-up backdrop-blur-2xl bg-gradient-to-br from-purple-50/90 via-white/90 to-blue-50/90 border border-white/50 shadow-2xl overflow-hidden relative">
              {/* Fond décoratif animé */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-pink-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
              
              {(() => {
                // Utiliser loyalty_points depuis la BDD ou points du store
                // userFromStore est déjà récupéré au niveau du composant
                const currentPoints = userFromStore?.loyalty_points || userFromStore?.points || user?.loyalty_points || user?.points || 0;
                
                // Trier les récompenses par points requis
                const sortedRewards = [...loyaltyRewards].sort((a, b) => (a.pointsRequired || 0) - (b.pointsRequired || 0));
                const nextReward = sortedRewards.find(reward => currentPoints < (reward.pointsRequired || 0));
                const lastReward = sortedRewards[sortedRewards.length - 1];
                
                // Calculer la progression vers les récompenses
                const maxRewardPoints = lastReward ? (lastReward.pointsRequired || 0) : currentPoints || 1;
                const pointsToNextReward = nextReward ? (nextReward.pointsRequired || 0) - currentPoints : 0;
                const progressToRewards = maxRewardPoints > 0 ? Math.min((currentPoints / maxRewardPoints) * 100, 100) : 0;
                
                // Calculer les points pour une récompense exclusive (dernière récompense)
                const exclusiveRewardPoints = lastReward ? (lastReward.pointsRequired || 0) : 500;
                const pointsToExclusive = Math.max(0, exclusiveRewardPoints - currentPoints);
                
                return (
                  <>
                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                      <div className="flex-1 text-center lg:text-left">
                        <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-xl animate-float">
                            <Gift className="w-7 h-7 text-white" />
                          </div>
                          <h3 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Programme Fidélité
                          </h3>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="inline-flex items-center gap-3 px-6 py-4 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-purple-200/50">
                            <span className="text-lg text-slate-700">Vous avez actuellement</span>
                            <span className="text-4xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                              {currentPoints}
                            </span>
                            <span className="text-lg font-bold text-purple-600">points</span>
                          </div>
                          
                          {nextReward && pointsToNextReward > 0 ? (
                            <p className="text-lg text-slate-600">
                              Plus que <span className="font-black text-2xl text-emerald-600">{pointsToNextReward}</span> points pour : <span className="font-bold text-purple-600">{nextReward.name || 'Prochaine récompense'}</span> !
                            </p>
                          ) : sortedRewards.length > 0 && pointsToExclusive === 0 ? (
                            <p className="text-lg text-slate-600 font-semibold">
                              ✨ Toutes les récompenses sont débloquées !
                            </p>
                          ) : sortedRewards.length === 0 ? (
                            <p className="text-lg text-slate-600">
                              Plus que <span className="font-black text-2xl text-emerald-600">{pointsToExclusive}</span> points pour une récompense exclusive !
                            </p>
                          ) : null}
                        </div>
                      </div>
                      
                      <div className="relative">
                        <div className="text-9xl animate-float">🎁</div>
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl animate-pulse"></div>
                      </div>
                    </div>
                    
                    {/* Barre de progression ultra-moderne avec récompenses */}
                    <div className="relative z-10 mt-12">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Progression vers la récompense</span>
                        <span className="text-2xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                          {Math.round(progressToRewards)}%
                        </span>
                      </div>
                      
                      <div className="relative">
                        {/* Fond de la barre */}
                        <div className="bg-slate-200 rounded-full h-8 overflow-visible shadow-inner relative">
                          {/* Barre de progression avec gradient animé */}
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 transition-all duration-1000 ease-out shadow-2xl relative overflow-hidden animate-gradient-shift rounded-full"
                            style={{ width: `${Math.min(progressToRewards, 100)}%` }}
                          >
                            {/* Effet de brillance animée */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                          </div>
                          
                          {/* Marqueurs des récompenses - Style minimaliste intégré */}
                          {sortedRewards.length > 0 && sortedRewards.map((reward, index) => {
                            const rewardPosition = maxRewardPoints > 0 ? ((reward.pointsRequired || 0) / maxRewardPoints) * 100 : 0;
                            const isReached = currentPoints >= (reward.pointsRequired || 0);
                            
                            return (
                              <div
                                key={index}
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
                                style={{ left: `${Math.min(rewardPosition, 100)}%` }}
                              >
                                {/* Marqueur simple sur la barre */}
                                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                  isReached
                                    ? 'bg-emerald-500 ring-2 ring-emerald-300 ring-offset-2 ring-offset-slate-200'
                                    : 'bg-slate-400'
                                }`} />
                              </div>
                            );
                          })}
                          
                        </div>
                        
                        {/* Effet de lueur sous la barre */}
                        <div 
                          className="absolute -bottom-2 left-0 h-4 bg-gradient-to-r from-purple-500/50 to-blue-500/50 blur-xl transition-all duration-1000"
                          style={{ width: `${Math.min(progressToRewards, 100)}%` }}
                        ></div>
                      </div>
                      
                      {/* Liste des récompenses dans la Card */}
                      {sortedRewards.length > 0 && (
                        <div className="relative z-10 mt-12">
                          <div className="mb-6">
                            <h4 className="text-xl font-black text-slate-800 mb-2">Vos Récompenses</h4>
                            <p className="text-slate-500 text-sm">Découvrez toutes les récompenses disponibles</p>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sortedRewards.map((reward, index) => {
                              const isReached = currentPoints >= (reward.pointsRequired || 0);
                              const isNext = !isReached && index === sortedRewards.findIndex(r => currentPoints < (r.pointsRequired || 0));
                              const rewardId = `${reward.pointsRequired}_${reward.name}`;
                              const isUsed = usedRewards.includes(rewardId);
                              const canUse = isReached && !isUsed;
                              
                              return (
                                <button
                                  key={index}
                                  onClick={() => canUse && handleRewardClick(reward)}
                                  disabled={!canUse}
                                  className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 transform ${
                                    canUse
                                      ? 'hover:scale-105 hover:shadow-xl cursor-pointer active:scale-95'
                                      : 'cursor-not-allowed opacity-60'
                                  } ${
                                    isUsed
                                      ? 'bg-gradient-to-br from-slate-300 to-slate-400 border-slate-400'
                                      : isReached
                                      ? 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 border-emerald-300 shadow-lg shadow-emerald-500/30'
                                      : isNext
                                      ? 'bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 border-purple-300 shadow-md shadow-purple-500/20'
                                      : 'bg-gradient-to-br from-slate-100 to-slate-200 border-slate-300 shadow-sm'
                                  }`}
                                >
                                  {/* Effet de brillance pour les récompenses atteintes */}
                                  {isReached && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                                  )}
                                  
                                  {/* Badge "Débloqué" ou "Utilisé" en haut à droite */}
                                  {isUsed ? (
                                    <div className="absolute top-2 right-2 bg-slate-600/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg z-10">
                                      <span className="text-white text-[10px] font-bold flex items-center gap-1">
                                        <span>✗</span>
                                        <span>Utilisé</span>
                                      </span>
                                    </div>
                                  ) : isReached && (
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg z-10">
                                      <span className="text-emerald-600 text-[10px] font-bold flex items-center gap-1">
                                        <span>✓</span>
                                        <span>Disponible</span>
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Badge "Prochaine" pour la récompense suivante */}
                                  {isNext && (
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg z-10">
                                      <span className="text-purple-600 text-[10px] font-bold flex items-center gap-1">
                                        <span>🎯</span>
                                        <span>Prochaine</span>
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Contenu de la carte */}
                                  <div className="relative p-4 min-h-[220px] flex flex-col">
                                    {/* Icône principale */}
                                    <div className={`text-4xl mb-3 transition-transform duration-300 flex justify-center ${
                                      isReached ? 'animate-bounce' : isNext ? 'animate-pulse' : 'group-hover:scale-110'
                                    }`}>
                                      {isReached ? '🎁' : isNext ? '🎯' : '🎁'}
                                    </div>
                                    
                                    {/* Nom de la récompense */}
                                    <h5 className={`text-base font-bold mb-2 text-center ${
                                      isReached 
                                        ? 'text-white drop-shadow-md' 
                                        : isNext 
                                        ? 'text-white drop-shadow-md' 
                                        : 'text-slate-700'
                                    }`}>
                                      {reward.name || 'Récompense'}
                                    </h5>
                                    
                                    {/* Description si disponible */}
                                    {reward.description && (
                                      <p className={`text-xs mb-3 line-clamp-2 flex-grow ${
                                        isReached 
                                          ? 'text-emerald-50' 
                                          : isNext 
                                          ? 'text-purple-50' 
                                          : 'text-slate-600'
                                      }`}>
                                        {reward.description}
                                      </p>
                                    )}
                                    
                                    {/* Type de récompense */}
                                    {reward.type && (
                                      <div className="mb-3 flex justify-center">
                                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                                          reward.type === 'percentage'
                                            ? isReached 
                                              ? 'bg-white/30 text-white border border-white/50' 
                                              : isNext
                                              ? 'bg-white/30 text-white border border-white/50'
                                              : 'bg-slate-200 text-slate-700 border border-slate-300'
                                            : isReached 
                                              ? 'bg-white/30 text-white border border-white/50' 
                                              : isNext
                                              ? 'bg-white/30 text-white border border-white/50'
                                              : 'bg-slate-200 text-slate-700 border border-slate-300'
                                        }`}>
                                          {reward.type === 'percentage' 
                                            ? `Réduction ${reward.discountValue || 0}%` 
                                            : 'Produit gratuit'}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {/* Points requis */}
                                    <div className={`flex items-center justify-between mt-auto pt-3 border-t ${
                                      isReached 
                                        ? 'border-emerald-300/50' 
                                        : isNext 
                                        ? 'border-purple-300/50' 
                                        : 'border-slate-300'
                                    }`}>
                                      <span className={`text-xs font-semibold ${
                                        isReached 
                                          ? 'text-emerald-50' 
                                          : isNext 
                                          ? 'text-purple-50' 
                                          : 'text-slate-600'
                                      }`}>
                                        Points
                                      </span>
                                      <span className={`text-lg font-black ${
                                        isReached 
                                          ? 'text-white' 
                                          : isNext 
                                          ? 'text-white' 
                                          : 'text-slate-800'
                                      }`}>
                                        {reward.pointsRequired || 0}
                                      </span>
                                    </div>
                                    
                                    {/* Bouton d'action */}
                                    {canUse && (
                                      <div className="mt-3">
                                        <div className={`w-full py-2 px-4 rounded-lg font-bold text-sm text-center transition-all ${
                                          isReached
                                            ? 'bg-white/20 text-white border-2 border-white/50 hover:bg-white/30'
                                            : ''
                                        }`}>
                                          Cliquer pour appliquer
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Effet de lueur au survol */}
                                  {canUse && (
                                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                                      isReached 
                                        ? 'bg-gradient-to-r from-transparent via-white/10 to-transparent' 
                                        : isNext 
                                        ? 'bg-gradient-to-r from-transparent via-white/10 to-transparent' 
                                        : 'bg-gradient-to-r from-transparent via-slate-100/50 to-transparent'
                                    }`}></div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </Card>
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
                  onClick={() => window.open(`mailto:${contactEmail || businessInfo?.email || 'contact@blossom-cafe.fr'}`, '_blank')}
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
      
        {/* Loader ultra-moderne - seulement si vraiment en chargement (non bloquant) */}
        {loading && (
          <div className="fixed top-4 right-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-4 z-[9999] border-2 border-purple-200">
            <div className="flex items-center gap-3">
              {/* Spinner compact */}
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 rounded-full border-2 border-slate-200"></div>
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-600 border-r-blue-600 animate-spin"></div>
              </div>
              <p className="text-sm font-semibold text-slate-700">Chargement...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Modale de confirmation pour l'utilisation de la récompense */}
      <Modal
        isOpen={showRewardConfirmModal}
        onClose={handleCancelReward}
        title="Confirmer l'utilisation de la récompense"
        size="md"
        closeOnOverlayClick={false}
      >
        {rewardToConfirm && (
          <div className="space-y-6">
            {/* Informations de la récompense */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl">
                  🎁
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                    {rewardToConfirm.name || 'Récompense'}
                  </h3>
                  {rewardToConfirm.description && (
                    <p className="text-sm text-slate-600">
                      {rewardToConfirm.description}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white/60 rounded-lg p-3 border border-purple-200">
                  <div className="text-xs text-slate-600 mb-1">Type de récompense</div>
                  <div className="font-bold text-slate-900">
                    {rewardToConfirm.type === 'percentage' 
                      ? `Réduction ${rewardToConfirm.discountValue || 0}%`
                      : 'Produit gratuit'}
                  </div>
                </div>
                <div className="bg-white/60 rounded-lg p-3 border border-purple-200">
                  <div className="text-xs text-slate-600 mb-1">Coût en points</div>
                  <div className="font-bold text-purple-600 text-lg">
                    {rewardToConfirm.pointsRequired || 0} pts
                  </div>
                </div>
              </div>
            </div>
            
            {/* Avertissement */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚠️</div>
                <div className="flex-1">
                  <div className="font-semibold text-amber-900 mb-1">
                    Important
                  </div>
                  <p className="text-sm text-amber-800">
                    Cette récompense ne peut être utilisée qu&apos;une seule fois. 
                    Les points seront déduits immédiatement de votre solde.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Points actuels */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Vos points actuels</span>
                <span className="text-2xl font-bold text-slate-900">
                  {user?.loyalty_points || user?.points || 0} pts
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                <span className="text-sm text-slate-600">Points après utilisation</span>
                <span className="text-xl font-bold text-purple-600">
                  {(user?.loyalty_points || user?.points || 0) - (rewardToConfirm.pointsRequired || 0)} pts
                </span>
              </div>
            </div>
            
            {/* Boutons d'action */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCancelReward}
                variant="outline"
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleApplyReward}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                Confirmer et appliquer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HomeView;