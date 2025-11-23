import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Gift, Edit2, Save, Trash2, LogOut } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import useAuth from '../../hooks/useAuth';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useUIStore from '../../store/uiStore';
import useNotifications from '../../hooks/useNotifications';
import { apiCall } from '../../services/api';
import logger from '../../utils/logger';

/**
 * Vue Profil utilisateur
 */
const ProfileView = () => {
  const { user, update, logout } = useAuth();
  const { refreshPoints } = useAuthStore();
  const userFromStore = useAuthStore(state => state.user);
  const { applyLoyaltyReward } = useCartStore();
  const { setShowCart, setShowLogoutConfirm } = useUIStore();
  const { success, error: showError } = useNotifications();
  const [isEditing, setIsEditing] = useState(false);
  const [loyaltyRewards, setLoyaltyRewards] = useState([]);
  const [usedRewards, setUsedRewards] = useState([]); // Récompenses déjà utilisées
  const [showRewardConfirmModal, setShowRewardConfirmModal] = useState(false);
  const [rewardToConfirm, setRewardToConfirm] = useState(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  // État simplifié pour le formulaire
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Initialiser les valeurs depuis l'utilisateur
  useEffect(() => {
    if (user && !isEditing) {
      const currentUser = userFromStore || user;
      setFirstName(currentUser?.first_name || currentUser?.name?.split(' ')[0] || '');
      setLastName(currentUser?.last_name || currentUser?.name?.split(' ')[1] || '');
      setPhone(currentUser?.phone || '');
    }
  }, [user, userFromStore, isEditing]);
  
  // Charger les récompenses utilisées depuis localStorage
  useEffect(() => {
    const loadUsedRewards = () => {
      if (user?.id) {
        const stored = localStorage.getItem(`usedRewards_${user.id}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setUsedRewards(parsed);
          } catch (e) {
            logger.error('❌ ProfileView - Erreur parsing usedRewards:', e);
            setUsedRewards([]);
          }
        } else {
          setUsedRewards([]);
        }
      }
    };
    
    loadUsedRewards();
    
    // Écouter les changements de localStorage
    const handleStorageChange = (e) => {
      if (e.key === `usedRewards_${user?.id}`) {
        loadUsedRewards();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Écouter les événements personnalisés
    const handleRewardRemoved = () => {
      setTimeout(() => {
        loadUsedRewards();
      }, 100);
    };
    window.addEventListener('rewardRemoved', handleRewardRemoved);
    
    // ✅ OPTIMISATION: Vérifier périodiquement les changements dans le même onglet (intervalle optimisé)
    const intervalId = setInterval(() => {
      loadUsedRewards();
    }, 10000); // ✅ Optimisé à 10 secondes pour réduire la charge CPU et améliorer les performances
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('rewardRemoved', handleRewardRemoved);
      clearInterval(intervalId);
    };
  }, [user?.id]);
  
  // Charger les récompenses depuis la base de données
  const loadLoyaltyRewards = async () => {
    try {
      logger.log('🔄 ProfileView - Chargement des récompenses...');
      logger.log('   - Endpoint: /api/loyalty-rewards');
      const response = await apiCall('/loyalty-rewards');
      // ✅ SÉCURITÉ: Ne pas logger la réponse complète (contient données personnelles)
      logger.debug('📦 ProfileView - Réponse API reçue');
      logger.debug('   - success:', response?.success);
      logger.debug('   - data présent:', !!response?.data);
      logger.debug('   - data length:', response?.data?.length || 0);
      
      if (response && response.success && response.data) {
        // ✅ SÉCURITÉ: Ne pas logger les données brutes (contiennent données personnelles)
        logger.debug('   - Données brutes reçues (masquées)');
        const rewardsList = response.data.map(reward => ({
          name: reward.name || '',
          description: reward.description || '',
          pointsRequired: reward.points_required || 0,
          type: reward.reward_type || 'percentage',
          discountValue: reward.discount_value || 0,
          productId: reward.product_id || null,
          icon: reward.icon || '🎁'
        }));
        logger.log('✅ ProfileView - Récompenses transformées:', rewardsList.length);
        logger.log('   - Liste:', rewardsList);
        setLoyaltyRewards(Array.isArray(rewardsList) ? rewardsList : []);
        return { success: true, data: rewardsList };
      } else {
        logger.warn('⚠️ ProfileView - Aucune récompense dans la réponse');
        logger.warn('   - response:', response);
        logger.warn('   - response.success:', response?.success);
        logger.warn('   - response.data:', response?.data);
        setLoyaltyRewards([]);
        return { success: false, data: [] };
      }
    } catch (error) {
      logger.error('❌ ProfileView - Erreur chargement récompenses fidélité:', error);
      logger.error('   - Message:', error.message);
      logger.error('   - Stack:', error.stack);
      setLoyaltyRewards([]);
      return { success: false, data: [] };
    }
  };
  
  useEffect(() => {
    loadLoyaltyRewards();
  }, []);
  
  // Rafraîchir les points depuis la BDD au montage (une seule fois)
  // ✅ Aussi rafraîchir pour générer/récupérer l'identifiant client s'il manque
  useEffect(() => {
    if (user && !user.isGuest && user.id) {
      // Utiliser un flag pour éviter les appels multiples
      let isMounted = true;
      
      // ✅ Vérifier si l'identifiant client manque (pour les clients uniquement)
      const isClient = user.role === 'client' || userFromStore?.role === 'client';
      const hasClientIdentifier = userFromStore?.client_identifier || user?.client_identifier;
      
      // Rafraîchir les données (points + identifiant client si nécessaire)
      refreshPoints().then((updatedUser) => {
        if (isMounted) {
          logger.log('✅ ProfileView - Données utilisateur rafraîchies');
          
          // Si l'identifiant client manque toujours après rafraîchissement, attendre un peu et réessayer
          if (isClient && !hasClientIdentifier && updatedUser) {
            const stillMissing = !updatedUser.client_identifier && !userFromStore?.client_identifier;
            if (stillMissing) {
              logger.log('🔄 ProfileView - Identifiant client en cours de génération, nouvelle tentative...');
              setTimeout(() => {
                refreshPoints().catch(err => {
                  logger.error('❌ Erreur rafraîchissement profil (2e tentative):', err);
                });
              }, 1000);
            }
          }
        }
      }).catch(err => {
        if (isMounted) {
          logger.error('❌ Erreur rafraîchissement points:', err);
        }
      });
      
      return () => {
        isMounted = false;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Seulement dépendre de user.id pour éviter les boucles
  
  // Ouvrir la modale de confirmation pour une récompense
  const handleRewardClick = (reward) => {
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
  };
  
  // Appliquer une récompense de fidélité après confirmation
  const handleApplyReward = async () => {
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
      const errorMessage = error.message || 'Erreur lors de l\'application de la récompense. Veuillez réessayer.';
      showError(errorMessage);
    }
  };
  
  // Annuler la confirmation
  const handleCancelReward = () => {
    setShowRewardConfirmModal(false);
    setRewardToConfirm(null);
  };

  // Gérer la suppression/désactivation du compte
  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const response = await apiCall('/profile/deactivate', {
        method: 'POST'
      });

      if (response.success) {
        success('Votre compte a été désactivé avec succès. Vous allez être déconnecté...');
        setShowDeleteAccountModal(false);
        
        // Déconnecter l'utilisateur après un court délai
        setTimeout(async () => {
          await logout();
          window.location.reload();
        }, 2000);
      } else {
        showError(response.error || 'Erreur lors de la désactivation du compte');
      }
    } catch (error) {
      logger.error('❌ Erreur désactivation compte:', error);
      showError('Erreur lors de la désactivation du compte. Veuillez réessayer.');
    } finally {
      setIsDeletingAccount(false);
    }
  };
  
  const handleSave = async () => {
    try {
      // Valider que first_name et last_name ne sont pas vides
      const trimmedFirstName = firstName.trim();
      const trimmedLastName = lastName.trim();
      const trimmedPhone = phone.trim();
      
      if (!trimmedFirstName) {
        showError('Le prénom est obligatoire');
        return;
      }
      
      if (!trimmedLastName) {
        showError('Le nom est obligatoire');
        return;
      }
      
      // Préparer les données à envoyer
      const dataToUpdate = {
        first_name: trimmedFirstName,
        last_name: trimmedLastName,
        phone: trimmedPhone || null
      };
      
      logger.log('💾 ProfileView.handleSave - Envoi des données:', dataToUpdate);
      
      // Appeler l'API de mise à jour
      const result = await update(dataToUpdate);
      
      logger.log('📊 ProfileView.handleSave - Résultat:', result);
      
      if (result.success && result.user) {
        logger.debug('✅ ProfileView.handleSave - Mise à jour réussie');
        // ✅ SÉCURITÉ: Ne pas logger les données personnelles (first_name, last_name, phone)
        
        // Mettre à jour les états locaux avec les valeurs du serveur
        setFirstName(result.user.first_name || '');
        setLastName(result.user.last_name || '');
        setPhone(result.user.phone || '');
        
        success('Profil mis à jour avec succès !');
        setIsEditing(false);
        
        // Rafraîchir les points après la mise à jour du profil
        if (user && !user.isGuest) {
          refreshPoints().catch(err => {
            logger.error('❌ Erreur rafraîchissement points après mise à jour:', err);
          });
        }
      } else {
        logger.error('❌ ProfileView.handleSave - Échec de la mise à jour:', result);
        showError(result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      logger.error('❌ ProfileView.handleSave - Erreur:', error);
      showError(error?.message || 'Erreur lors de la mise à jour');
    }
  };
  
  // Utiliser les points depuis la BDD
  const currentPoints = userFromStore?.loyalty_points || userFromStore?.points || user?.loyalty_points || user?.points || 0;
  
  // Calculer la progression vers la prochaine récompense
  const sortedRewards = [...loyaltyRewards].sort((a, b) => (a.pointsRequired || 0) - (b.pointsRequired || 0));
  const nextReward = sortedRewards.find(reward => currentPoints < (reward.pointsRequired || 0));
  const pointsToNextReward = nextReward ? (nextReward.pointsRequired || 0) - currentPoints : 0;
  const maxRewardPoints = sortedRewards.length > 0 ? (sortedRewards[sortedRewards.length - 1].pointsRequired || 0) : currentPoints || 1;
  const progress = maxRewardPoints > 0 ? Math.min((currentPoints / maxRewardPoints) * 100, 100) : 0;
  
  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  return (
    <div className="space-y-5 pl-5 sm:pl-5 md:pl-10 pr-5 sm:pr-5 md:pr-10 pt-6 md:pt-8">
      <h1 className="text-4xl font-serif font-bold">👤 Mon Profil</h1>
      
      <div className="space-y-6">
        {/* Bouton Déconnexion */}
        <Card padding="lg">
          <Button
            variant="danger"
            icon={<LogOut className="w-5 h-5" />}
            onClick={handleLogout}
            fullWidth
            className="!bg-gradient-to-r !from-red-600 !to-red-700 !text-white !hover:from-red-700 !hover:to-red-800 shadow-lg hover:shadow-xl"
          >
            Déconnexion
          </Button>
        </Card>

        {/* Informations principales */}
        <div className="space-y-6">
          <Card padding="lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold">Informations personnelles</h2>
              {!isEditing ? (
                <Button
                  variant="outline"
                  icon={<Edit2 className="w-4 h-4" />}
                  onClick={() => setIsEditing(true)}
                  className="w-full sm:w-auto"
                >
                  Modifier
                </Button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      // Réinitialiser avec les valeurs actuelles du store
                      const currentUser = userFromStore || user;
                      setFirstName(currentUser?.first_name || currentUser?.name?.split(' ')[0] || '');
                      setLastName(currentUser?.last_name || currentUser?.name?.split(' ')[1] || '');
                      setPhone(currentUser?.phone || '');
                      setIsEditing(false);
                    }}
                    className="w-full sm:w-auto"
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="success"
                    icon={<Save className="w-4 h-4" />}
                    onClick={handleSave}
                    className="w-full sm:w-auto"
                  >
                    Enregistrer
                  </Button>
                </div>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Prénom"
                    value={firstName}
                    onChange={(e) => setFirstName(e?.target?.value || '')}
                    icon={<User className="w-5 h-5" />}
                    required
                    placeholder="Votre prénom"
                  />
                  <Input
                    label="Nom"
                    value={lastName}
                    onChange={(e) => setLastName(e?.target?.value || '')}
                    icon={<User className="w-5 h-5" />}
                    required
                    placeholder="Votre nom"
                  />
                </div>
                <Input
                  label="Email"
                  type="email"
                  value={user?.email || ''}
                  icon={<Mail className="w-5 h-5" />}
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
                <Input
                  label="Téléphone"
                  type="tel"
                  placeholder="+33 6 12 34 56 78"
                  value={phone}
                  onChange={(e) => setPhone(e?.target?.value || '')}
                  icon={<Phone className="w-5 h-5" />}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Nom complet en en-tête */}
                <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-6 border-2 border-violet-200">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-violet-600 font-semibold uppercase tracking-wider mb-1">
                        Nom complet
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {(() => {
                          const currentUser = userFromStore || user;
                          if (currentUser?.first_name && currentUser?.last_name) {
                            return `${currentUser.first_name} ${currentUser.last_name}`;
                          }
                          return currentUser?.name || 'Non renseigné';
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grille d'informations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Prénom */}
                  <div className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-violet-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">
                          Prénom
                        </div>
                        <div className="text-lg font-semibold text-gray-900 truncate">
                          {userFromStore?.first_name || user?.first_name || user?.name?.split(' ')[0] || 'Non renseigné'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nom */}
                  <div className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-violet-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">
                          Nom
                        </div>
                        <div className="text-lg font-semibold text-gray-900 truncate">
                          {userFromStore?.last_name || user?.last_name || user?.name?.split(' ')[1] || 'Non renseigné'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-violet-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">
                          Email
                        </div>
                        <div className="text-lg font-semibold text-gray-900 truncate">
                          {user?.email || 'Non renseigné'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Téléphone */}
                  <div className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-violet-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">
                          Téléphone
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          {userFromStore?.phone || user?.phone || 'Non renseigné'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Identifiant Client - Uniquement pour les clients */}
                  {userFromStore?.role === 'client' || user?.role === 'client' ? (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-blue-600 font-medium mb-1 uppercase tracking-wide">
                            Identifiant 
                          </div>
                          <div className="text-xl font-bold text-blue-900 font-mono tracking-wider">
                            {userFromStore?.client_identifier || user?.client_identifier || 'Génération en cours...'}
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </Card>
          
          {/* Programme Fidélité */}
          <Card padding="lg" className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">💎</div>
              <h3 className="text-2xl font-bold mb-2">Programme Fidélité</h3>
            </div>
            
            <div className="space-y-4">
              {/* Section mise en valeur des points */}
              <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 rounded-2xl p-6 shadow-xl border-2 border-violet-400 relative overflow-hidden">
                {/* Effet de brillance animé */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                
                <div className="relative z-10">
                  <div className="text-center mb-4">
                    <div className="text-sm font-semibold text-white/90 mb-2 uppercase tracking-wider">
                      Vos Points de Fidélité
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <div className="text-6xl md:text-7xl font-black text-white drop-shadow-2xl">
                        {currentPoints}
                      </div>
                      <div className="text-2xl md:text-3xl font-bold text-white/80">
                        pts
                      </div>
                    </div>
                </div>
                  
                  {/* Barre de progression améliorée avec indicateurs de récompenses */}
                  <div className="relative">
                    <div className="bg-white/20 rounded-full h-4 backdrop-blur-sm border border-white/30 relative overflow-visible">
                  <div 
                        className="h-full bg-gradient-to-r from-white via-white/90 to-white transition-all duration-700 shadow-lg rounded-full"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                    
                    {/* Indicateurs pour chaque récompense - positionnés au-dessus de la barre */}
                    <div className="absolute top-0 left-0 right-0 h-full flex items-center">
                      {sortedRewards.length > 0 && sortedRewards.map((reward, index) => {
                        const rewardProgress = maxRewardPoints > 0 
                          ? ((reward.pointsRequired || 0) / maxRewardPoints) * 100 
                          : 0;
                        const isReached = currentPoints >= (reward.pointsRequired || 0);
                        const isNext = !isReached && index === sortedRewards.findIndex(r => currentPoints < (r.pointsRequired || 0));
                        
                        return (
                          <div
                            key={index}
                            className="absolute flex items-center z-10"
                            style={{ left: `${Math.min(rewardProgress, 100)}%`, transform: 'translateX(-50%)' }}
                          >
                            <div className="relative group">
                              {/* Marqueur sur la barre - toujours visible au-dessus */}
                              <div className={`w-4 h-4 rounded-full border-2 transition-all relative z-20 ${
                                isReached
                                  ? 'bg-white border-white shadow-lg scale-125 ring-2 ring-white/50'
                                  : isNext
                                  ? 'bg-yellow-300 border-yellow-400 shadow-md scale-110 ring-2 ring-yellow-300/50'
                                  : 'bg-white/60 border-white/80 shadow-sm'
                              }`} 
                              style={{ 
                                marginTop: '-2px' // Légèrement au-dessus de la barre pour être toujours visible
                              }} />
                              
                              {/* Tooltip avec informations de la récompense */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30">
                                <div className="bg-white rounded-lg shadow-xl p-2 min-w-[150px] border border-gray-200">
                                  <div className="text-xs font-bold text-gray-900 mb-1">
                                    {reward.name || 'Récompense'}
                                  </div>
                                  <div className="text-[10px] text-gray-600">
                                    {reward.pointsRequired || 0} points
                                  </div>
                                  {reward.type === 'percentage' && (
                                    <div className="text-[10px] text-purple-600 font-semibold mt-1">
                                      -{reward.discountValue || 0}%
                                    </div>
                                  )}
                                  <div className={`text-[10px] font-semibold mt-1 ${
                                    isReached ? 'text-green-600' : 'text-gray-500'
                                  }`}>
                                    {isReached ? '✓ Débloquée' : '🔒 Verrouillée'}
                                  </div>
                                  {/* Flèche du tooltip */}
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                    <div className="w-2 h-2 bg-white border-r border-b border-gray-200 transform rotate-45"></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Légende des points sous la barre */}
                    <div className="flex justify-between items-center mt-2 text-[10px] text-white/80">
                      <span>0 pts</span>
                      {sortedRewards.length > 0 && (
                        <span className="font-semibold">{maxRewardPoints} pts</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-center text-white/90 text-sm font-medium mt-3">
                    {pointsToNextReward > 0 
                      ? `✨ Plus que ${pointsToNextReward} points pour la prochaine récompense !`
                      : sortedRewards.length > 0
                      ? '🎉 Toutes les récompenses sont débloquées !'
                      : 'Aucune récompense disponible'}
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-violet-200">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Récompenses disponibles
                </h4>
                {sortedRewards.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          <div className="relative p-4 min-h-[180px] flex flex-col">
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
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <p className="mb-2">Aucune récompense disponible pour le moment</p>
                    <p className="text-xs text-gray-400">
                      {loyaltyRewards.length === 0 
                        ? 'Les récompenses sont en cours de chargement...'
                        : 'Aucune récompense active dans la base de données'}
                    </p>
                    <Button
                      onClick={async () => {
                        logger.log('🔄 ProfileView - Rechargement manuel des récompenses...');
                        const result = await loadLoyaltyRewards();
                        if (result.success && result.data.length > 0) {
                          success('Récompenses rechargées !');
                        } else {
                          showError('Aucune récompense active trouvée dans la base de données. Vérifiez que les récompenses sont bien créées et actives dans l\'administration.');
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="mt-3"
                    >
                      Recharger les récompenses
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Bouton supprimer le compte - Tout en bas */}
          <Card padding="lg">
            <div className="flex justify-center">
              <Button
                variant="danger"
                onClick={() => setShowDeleteAccountModal(true)}
                icon={<Trash2 className="w-4 h-4" />}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Supprimer mon compte
              </Button>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Modale de confirmation pour la suppression du compte */}
      <Modal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        title="Confirmer la suppression"
        size="md"
        closeOnOverlayClick={false}
      >
        <div className="space-y-6">
          {/* Message de confirmation */}
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900 mb-4">
              Êtes-vous vraiment sûr de vouloir nous quitter ?
            </p>
            <p className="text-sm text-gray-700">
              Toutes vos données seront supprimées et vos points seront également perdus...
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => setShowDeleteAccountModal(false)}
              variant="outline"
              className="flex-1"
              disabled={isDeletingAccount}
            >
              Annuler
            </Button>
            <Button
              onClick={handleDeleteAccount}
              variant="danger"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              loading={isDeletingAccount}
              icon={<Trash2 className="w-4 h-4" />}
            >
              {isDeletingAccount ? 'Suppression...' : 'Confirmer'}
            </Button>
          </div>
        </div>
      </Modal>
      
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
                    Les points seront déduits uniquement après le paiement de la commande.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Points actuels */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Vos points actuels</span>
                <span className="text-2xl font-bold text-slate-900">
                  {currentPoints} pts
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                <span className="text-sm text-slate-600">Points après utilisation</span>
                <span className="text-xl font-bold text-purple-600">
                  {currentPoints - (rewardToConfirm.pointsRequired || 0)} pts
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

export default ProfileView;

