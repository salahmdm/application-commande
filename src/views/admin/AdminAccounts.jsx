import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Trash2, Edit2, Search, Users, Shield, UserCheck, UserX, 
  Eye, Download, TrendingUp, Calendar, DollarSign, Award, 
  ChevronDown, ChevronUp, Filter, X as CloseIcon, Package, 
  MapPin, CreditCard, Clock
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { apiCall } from '../../services/api';
import adminService from '../../services/adminService';
import useNotifications from '../../hooks/useNotifications';
import useAuth from '../../hooks/useAuth';
import logger from '../../utils/logger';

/**
 * Vue Gestion des Comptes Admin - Version améliorée
 * - Statistiques complètes
 * - Historique de fidélité
 * - Filtres avancés
 * - Vue détaillée
 * - Export CSV
 */
const AdminAccounts = () => {
  const { success, error: showError } = useNotifications();
  const { user: currentUser } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterActivity, setFilterActivity] = useState(''); // all, active, inactive, recent
  const [filterPoints, setFilterPoints] = useState(''); // all, 0-50, 50-100, 100+
  const [sortBy, setSortBy] = useState('created_at'); // created_at, total_spent, total_orders
  const [sortOrder, setSortOrder] = useState('desc');
  
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'client',
    loyaltyPoints: 0,
    isActive: true
  });
  
  const [pointsAdjustment, setPointsAdjustment] = useState({
    points: 0,
    reason: ''
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllUsers();
      
      if (response && response.success) {
        setUsers(response.data || []);
      } else if (response && response.error) {
        showError(response.error);
      } else {
        showError('Format de réponse invalide de l\'API');
      }
    } catch (error) {
      logger.error('Erreur lors du chargement des utilisateurs:', error);
      showError(error.message || 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Charger les utilisateurs
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Charger les détails complets d'un utilisateur (utilisateur, commandes, historique de fidélité, statistiques)
  const fetchUserDetails = async (userId) => {
    try {
      setLoadingDetails(true);
      // ✅ SÉCURITÉ: Ne pas logger les IDs utilisateur et données complètes
      logger.debug('🔄 fetchUserDetails appelé');
      
      if (!userId || isNaN(parseInt(userId))) {
        logger.error('❌ ID utilisateur invalide');
        showError('ID utilisateur invalide');
        setLoadingDetails(false);
        return;
      }
      
      // Utiliser l'endpoint /details qui retourne toutes les informations
      const endpoint = `/admin/users/${userId}/details`;
      logger.debug('📡 Appel API détails utilisateur');
      const response = await apiCall(endpoint);
      // ✅ SÉCURITÉ: Ne pas logger la réponse complète (contient données personnelles)
      logger.debug('📡 Réponse API détails reçue');
      
      // Vérifier la réponse
      logger.debug('📋 ANALYSE DE LA RÉPONSE API');
      logger.debug('Response.success:', response?.success);
      // ✅ SÉCURITÉ: Ne pas logger response.data (contient données personnelles)
      
      if (response && response.success && response.data) {
        logger.debug('✅ Réponse valide reçue');
        // ✅ SÉCURITÉ: Ne pas logger les données personnelles (email, first_name, etc.)
        logger.debug('✅ Détails reçus:', {
          ordersCount: response.data.orders?.length || 0,
          loyaltyHistoryCount: response.data.loyaltyHistory?.length || 0
          // ✅ SÉCURITÉ: Ne pas logger user.email, user.first_name, stats (contiennent données personnelles)
        });
        
        // Vérifier que les données sont valides
        if (!response.data.user) {
          logger.error('❌ Données utilisateur manquantes dans la réponse');
          // ✅ SÉCURITÉ: Ne pas logger response.data (contient données personnelles)
          showError('Données utilisateur manquantes dans la réponse du serveur');
          setUserDetails(null);
          return;
        }
        
        // Vérifier que les commandes sont bien un tableau
        const orders = Array.isArray(response.data.orders) ? response.data.orders : [];
        const loyaltyHistory = Array.isArray(response.data.loyaltyHistory) ? response.data.loyaltyHistory : [];
        
        logger.log('✅ Données validées:', {
          user: response.data.user.email,
          ordersCount: orders.length,
          loyaltyHistoryCount: loyaltyHistory.length,
          stats: response.data.stats
        });
        
        // Mettre à jour userDetails avec toutes les données
        const userDetailsData = {
          user: response.data.user,
          orders: orders,
          loyaltyHistory: loyaltyHistory,
          stats: response.data.stats || {
            total_orders: orders.length,
            total_spent: orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0),
            average_order: orders.length > 0 
              ? orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0) / orders.length 
              : 0,
            last_order_date: orders[0]?.created_at || null
          }
        };
        
        logger.log('✅ userDetailsData créé:', {
          user: userDetailsData.user.email,
          ordersCount: userDetailsData.orders.length,
          loyaltyHistoryCount: userDetailsData.loyaltyHistory.length,
          stats: userDetailsData.stats
        });
        
        setUserDetails(userDetailsData);
        
        logger.log('✅ userDetails mis à jour dans le state');
      } else if (response && response.error) {
        logger.error('❌ Erreur dans la réponse API:', response.error);
        logger.error('Response complète:', response);
        showError(response.error || 'Erreur lors du chargement des détails');
        setUserDetails(null);
      } else {
        logger.error('❌ Format de réponse invalide');
        logger.error('Response reçue:', response);
        logger.error('Response type:', typeof response);
        logger.error('Response.success:', response?.success);
        logger.error('Response.data:', response?.data);
        showError('Format de réponse invalide de l\'API. Vérifiez la console pour plus de détails.');
        setUserDetails(null);
      }
    } catch (error) {
      logger.error('❌ Exception lors du chargement des détails:', error);
      logger.error('Détails de l\'erreur:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      showError(error.message || 'Erreur lors du chargement des détails utilisateur');
      setUserDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Ouvrir la vue détaillée
  const handleViewDetails = async (user) => {
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('🔍 handleViewDetails appelé');
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.log('User object:', user);
    logger.log('User ID:', user?.id);
    logger.log('User email:', user?.email);
    logger.log('User name:', user?.first_name, user?.last_name);
    logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!user || !user.id) {
      logger.error('❌ Utilisateur invalide ou ID manquant');
      showError('Erreur : Utilisateur invalide');
      return;
    }
    
    setSelectedUser(user);
    setShowDetailsModal(true);
    // Charger tous les détails (utilisateur, commandes, historique de fidélité, statistiques)
    await fetchUserDetails(user.id);
  };

  // Ouvrir le modal d'ajustement de points
  // eslint-disable-next-line no-unused-vars
  const _handleAdjustPoints = (user) => {
    setSelectedUser(user);
    setPointsAdjustment({ points: 0, reason: '' });
    setShowPointsModal(true);
  };

  // Ajuster les points
  const handleSavePointsAdjustment = async () => {
    try {
      if (!pointsAdjustment.points || pointsAdjustment.points === 0) {
        showError('Veuillez entrer un montant de points différent de 0');
        return;
      }

      const response = await apiCall(`/admin/users/${selectedUser.id}/adjust-points`, {
        method: 'POST',
        body: {
          points: parseInt(pointsAdjustment.points),
          reason: pointsAdjustment.reason || 'Ajustement manuel'
        }
      });

      if (response.success) {
        success('Points ajustés avec succès');
        setShowPointsModal(false);
        fetchUsers();
      }
    } catch (error) {
      logger.error('Erreur:', error);
      showError(error.message || 'Erreur lors de l\'ajustement des points');
    }
  };

  // Ouvrir le modal pour créer un nouvel utilisateur
  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'client',
      loyaltyPoints: 0,
      isActive: true
    });
    setShowModal(true);
  };

  // Ouvrir le modal pour modifier un utilisateur
  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      phone: user.phone || '',
      role: user.role || 'client',
      loyaltyPoints: user.loyalty_points || 0,
      isActive: user.is_active !== undefined ? user.is_active : true
    });
    setShowModal(true);
  };

  // Supprimer un utilisateur
  const handleDelete = async (userId) => {
    if (userId === currentUser?.id) {
      showError('Vous ne pouvez pas supprimer votre propre compte');
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      const response = await adminService.deleteUser(userId);

      if (response.success) {
        success('Utilisateur supprimé avec succès');
        fetchUsers();
      }
    } catch (error) {
      logger.error('Erreur:', error);
      showError(error.message || 'Erreur lors de la suppression');
    }
  };

  // Sauvegarder (créer ou modifier)
  const handleSave = async () => {
    try {
      // Validation
      if (!formData.email) {
        showError('L\'email est requis');
        return;
      }

      if (!editingUser && !formData.password) {
        showError('Le mot de passe est requis pour créer un compte');
        return;
      }

      if (formData.password && formData.password.length < 6) {
        showError('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }

      let response;
      if (editingUser) {
        // Modifier
        const updateData = {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          role: formData.role,
          loyaltyPoints: parseInt(formData.loyaltyPoints) || 0,
          isActive: formData.isActive
        };

        if (formData.password) {
          updateData.password = formData.password;
        }

        response = await adminService.updateUser(editingUser.id, updateData);
      } else {
        // Créer
        response = await adminService.createUser({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          role: formData.role,
          loyaltyPoints: parseInt(formData.loyaltyPoints) || 0
        });
      }

      if (response.success) {
        success(editingUser ? 'Utilisateur modifié avec succès' : 'Utilisateur créé avec succès');
        setShowModal(false);
        fetchUsers();
      }
    } catch (error) {
      logger.error('Erreur:', error);
      showError(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const csvHeaders = [
      'ID', 'Email', 'Prénom', 'Nom', 'Téléphone', 'Rôle', 
      'Points Fidélité', 'Commandes', 'CA Total', 'Statut', 'Date Inscription'
    ];
    
    const csvRows = filteredUsers.map(user => [
      user.id,
      user.email,
      user.first_name || '',
      user.last_name || '',
      user.phone || '',
      getRoleLabel(user.role),
      user.loyalty_points || 0,
      user.total_orders || 0,
      formatPrice(user.total_spent || 0),
      user.is_active ? 'Actif' : 'Inactif',
      new Date(user.created_at).toLocaleDateString('fr-FR')
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    success('Export CSV réussi');
  };

  // Filtrer et trier
  const filteredUsers = users.filter(user => {
    // Recherche
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery);
    
    // Filtre par rôle
    const matchesRole = !filterRole || user.role === filterRole;
    
    // Filtre par activité
    let matchesActivity = true;
    if (filterActivity === 'active') {
      matchesActivity = user.is_active === true || user.is_active === 1;
    } else if (filterActivity === 'inactive') {
      matchesActivity = user.is_active === false || user.is_active === 0;
    } else if (filterActivity === 'recent') {
      const lastOrder = user.last_order_date ? new Date(user.last_order_date) : null;
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      matchesActivity = lastOrder && lastOrder >= sevenDaysAgo;
    }
    
    // Filtre par points
    let matchesPoints = true;
    const points = user.loyalty_points || 0;
    if (filterPoints === '0-50') {
      matchesPoints = points >= 0 && points < 50;
    } else if (filterPoints === '50-100') {
      matchesPoints = points >= 50 && points < 100;
    } else if (filterPoints === '100+') {
      matchesPoints = points >= 100;
    }
    
    return matchesSearch && matchesRole && matchesActivity && matchesPoints;
  }).sort((a, b) => {
    let aVal, bVal;
    
    switch (sortBy) {
      case 'total_spent':
        aVal = a.total_spent || 0;
        bVal = b.total_spent || 0;
        break;
      case 'total_orders':
        aVal = a.total_orders || 0;
        bVal = b.total_orders || 0;
        break;
      case 'loyalty_points':
        aVal = a.loyalty_points || 0;
        bVal = b.loyalty_points || 0;
        break;
      default:
        aVal = new Date(a.created_at);
        bVal = new Date(b.created_at);
    }
    
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  // Helper functions
  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'manager': return <UserCheck className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700 border-red-300';
      case 'manager': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-green-100 text-green-700 border-green-300';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'manager': return 'Manager';
      default: return 'Client';
    }
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityBadge = (user) => {
    if (!user.last_order_date) {
      return <span className="text-xs text-neutral-500">Jamais commandé</span>;
    }
    
    const lastOrder = new Date(user.last_order_date);
    const daysAgo = Math.floor((Date.now() - lastOrder) / (1000 * 60 * 60 * 24));
    
    if (daysAgo < 7) {
      return <span className="text-xs text-green-600 font-semibold">Actif (il y a {daysAgo}j)</span>;
    } else if (daysAgo < 30) {
      return <span className="text-xs text-yellow-600">Inactif (il y a {daysAgo}j)</span>;
    } else {
      return <span className="text-xs text-red-600">Très inactif ({Math.floor(daysAgo / 30)} mois)</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-full mx-auto space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 lg:gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-black mb-1 sm:mb-2 lg:mb-3">
              Gestion des Comptes
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-neutral-600 font-sans">
              {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} 
              {users.length !== filteredUsers.length && ` sur ${users.length}`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 w-full sm:w-auto">
            <Button
              onClick={handleExportCSV}
              variant="secondary"
              className="flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto"
              disabled={filteredUsers.length === 0}
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </Button>
            <Button
              onClick={handleCreate}
              variant="primary"
              className="flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Créer un compte</span>
              <span className="sm:hidden">Créer</span>
            </Button>
          </div>
        </div>

        {/* Filtres et recherche - Responsive */}
        <Card padding="sm sm:md lg:lg" className="bg-white border-2 border-neutral-300">
          <div className="space-y-3 sm:space-y-4 lg:space-y-5">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-neutral-400 flex-shrink-0" />
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 sm:pl-10 w-full text-xs sm:text-sm md:text-base"
              />
            </div>
            
            {/* Filtres - Responsive */}
            <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="flex-1 xs:flex-none min-w-[140px] px-2.5 sm:px-3 md:px-4 py-2 rounded-xl border-2 border-neutral-300 bg-white text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-sans text-xs sm:text-sm"
              >
                <option value="">Tous les rôles</option>
                <option value="client">Client</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              
              <select
                value={filterActivity}
                onChange={(e) => setFilterActivity(e.target.value)}
                className="flex-1 xs:flex-none min-w-[140px] px-2.5 sm:px-3 md:px-4 py-2 rounded-xl border-2 border-neutral-300 bg-white text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-sans text-xs sm:text-sm"
              >
                <option value="">Toute activité</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="recent">Récent</option>
              </select>
              
              <select
                value={filterPoints}
                onChange={(e) => setFilterPoints(e.target.value)}
                className="flex-1 xs:flex-none min-w-[140px] px-2.5 sm:px-3 md:px-4 py-2 rounded-xl border-2 border-neutral-300 bg-white text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-sans text-xs sm:text-sm"
              >
                <option value="">Tous les points</option>
                <option value="0-50">0-50</option>
                <option value="50-100">50-100</option>
                <option value="100+">100+</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 xs:flex-none min-w-[120px] px-2.5 sm:px-3 md:px-4 py-2 rounded-xl border-2 border-neutral-300 bg-white text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-sans text-xs sm:text-sm"
              >
                <option value="created_at">Date</option>
                <option value="total_spent">CA</option>
                <option value="total_orders">Commandes</option>
                <option value="loyalty_points">Points</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-2.5 sm:px-3 md:px-4 py-2 rounded-xl border-2 border-neutral-300 bg-white text-black hover:bg-neutral-50 transition-colors flex-shrink-0 min-w-[44px]"
                title={sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}
              >
                {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 mx-auto" /> : <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 mx-auto" />}
              </button>
              
              {(searchQuery || filterRole || filterActivity || filterPoints) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterRole('');
                    setFilterActivity('');
                    setFilterPoints('');
                  }}
                  className="px-2.5 sm:px-3 md:px-4 py-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 font-heading font-semibold text-xs sm:text-sm flex-shrink-0"
                >
                  <CloseIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="hidden xs:inline">Réinitialiser</span>
                  <span className="xs:hidden">Reset</span>
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* Liste des utilisateurs */}
        <Card padding="none" className="bg-white border-2 border-neutral-300 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-neutral-600 font-sans">Chargement...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-600 font-sans mb-2">Aucun utilisateur dans la base de données</p>
              <p className="text-sm text-neutral-500 font-sans">Cliquez sur &quot;Créer un compte&quot; pour ajouter le premier utilisateur</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Filter className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-600 font-sans">Aucun utilisateur ne correspond aux filtres</p>
            </div>
          ) : (
            <>
              {/* Version Desktop - Tableau (≥1024px) - Optimisé PC */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-100 border-b-2 border-neutral-300">
                    <tr>
                      <th className="px-4 xl:px-6 py-4 xl:py-5 text-left font-heading font-semibold text-black text-sm xl:text-base">Nom</th>
                      <th className="px-4 xl:px-6 py-4 xl:py-5 text-left font-heading font-semibold text-black text-sm xl:text-base">Email</th>
                      <th className="px-4 xl:px-6 py-4 xl:py-5 text-left font-heading font-semibold text-black text-sm xl:text-base">Téléphone</th>
                      <th className="px-4 xl:px-6 py-4 xl:py-5 text-left font-heading font-semibold text-black text-sm xl:text-base">Rôle</th>
                      <th className="px-4 xl:px-6 py-4 xl:py-5 text-left font-heading font-semibold text-black text-sm xl:text-base">Statut</th>
                      <th className="px-4 xl:px-6 py-4 xl:py-5 text-left font-heading font-semibold text-black text-sm xl:text-base">Commandes</th>
                      <th className="px-4 xl:px-6 py-4 xl:py-5 text-left font-heading font-semibold text-black text-sm xl:text-base">CA Total</th>
                      <th className="px-4 xl:px-6 py-4 xl:py-5 text-left font-heading font-semibold text-black text-sm xl:text-base">Date inscription</th>
                      <th className="px-4 xl:px-6 py-4 xl:py-5 text-left font-heading font-semibold text-black text-sm xl:text-base">Dernière activité</th>
                      <th className="px-4 xl:px-6 py-4 xl:py-5 text-center font-heading font-semibold text-black text-sm xl:text-base">Voir</th>
                      <th className="px-4 xl:px-6 py-4 xl:py-5 text-center font-heading font-semibold text-black text-sm xl:text-base">Modifier</th>
                      <th className="px-4 xl:px-6 py-4 xl:py-5 text-center font-heading font-semibold text-black text-sm xl:text-base">Supprimer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-neutral-50 transition-colors">
                        {/* Nom */}
                        <td className="px-4 xl:px-6 py-4 xl:py-5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-heading font-bold text-xs flex-shrink-0">
                              {(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                            </div>
                            <div className="font-heading font-semibold text-black text-sm whitespace-nowrap">
                              {user.first_name} {user.last_name}
                            </div>
                          </div>
                        </td>
                        
                        {/* Email */}
                        <td className="px-4 xl:px-6 py-4 xl:py-5">
                          <div className="text-sm lg:text-base text-neutral-700 font-sans whitespace-nowrap">{user.email || '-'}</div>
                        </td>
                        
                        {/* Téléphone */}
                        <td className="px-4 xl:px-6 py-4 xl:py-5">
                          <div className="text-sm lg:text-base text-neutral-600 font-sans whitespace-nowrap">{user.phone || '-'}</div>
                        </td>
                        
                        {/* Rôle */}
                        <td className="px-4 xl:px-6 py-4 xl:py-5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs lg:text-sm font-heading font-semibold border ${getRoleColor(user.role)}`}>
                            {getRoleIcon(user.role)}
                            {getRoleLabel(user.role)}
                          </span>
                        </td>
                        
                        {/* Statut */}
                        <td className="px-4 xl:px-6 py-4 xl:py-5">
                          {user.is_active ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs lg:text-sm font-heading font-semibold bg-green-100 text-green-700 border border-green-300">
                              <UserCheck className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                              Actif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs lg:text-sm font-heading font-semibold bg-red-100 text-red-700 border border-red-300">
                              <UserX className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                              Inactif
                            </span>
                          )}
                        </td>
                        
                        {/* Commandes */}
                        <td className="px-4 xl:px-6 py-4 xl:py-5">
                          <div className="flex items-center gap-1.5 text-sm lg:text-base">
                            <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-green-600 flex-shrink-0" />
                            <span className="font-heading font-semibold text-black">{user.total_orders || 0}</span>
                          </div>
                        </td>
                        
                        {/* CA Total */}
                        <td className="px-4 xl:px-6 py-4 xl:py-5">
                          <div className="flex items-center gap-1.5 text-sm lg:text-base">
                            <DollarSign className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 flex-shrink-0" />
                            <span className="font-heading font-semibold text-black">{formatPrice(user.total_spent || 0)}</span>
                          </div>
                        </td>
                        
                        {/* Date inscription */}
                        <td className="px-4 xl:px-6 py-4 xl:py-5">
                          <div className="text-xs lg:text-sm text-neutral-600 font-sans whitespace-nowrap">
                            {formatDate(user.created_at)}
                          </div>
                        </td>
                        
                        {/* Dernière activité */}
                        <td className="px-4 xl:px-6 py-4 xl:py-5">
                          <div className="text-xs lg:text-sm">
                            {getActivityBadge(user)}
                          </div>
                        </td>
                        
                        {/* Action : Voir les détails */}
                        <td className="px-4 xl:px-6 py-4 xl:py-5">
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleViewDetails(user)}
                              className="p-2.5 lg:p-3 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                              title="Voir les détails"
                            >
                              <Eye className="w-4 h-4 lg:w-5 lg:h-5" />
                            </button>
                          </div>
                        </td>
                        
                        {/* Action : Modifier */}
                        <td className="px-4 xl:px-6 py-4 xl:py-5">
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleEdit(user)}
                              className="p-2.5 lg:p-3 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4 lg:w-5 lg:h-5" />
                            </button>
                          </div>
                        </td>
                        
                        {/* Action : Supprimer */}
                        <td className="px-4 xl:px-6 py-4 xl:py-5">
                          <div className="flex justify-center">
                            {user.id !== currentUser?.id ? (
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="p-2.5 lg:p-3 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4 lg:w-5 lg:h-5" />
                              </button>
                            ) : (
                              <span className="text-xs lg:text-sm text-neutral-400">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Version Tablette - Tableau compact (768px - 1023px) */}
              <div className="hidden md:block lg:hidden overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-neutral-100 border-b-2 border-neutral-300">
                    <tr>
                      <th className="px-2 py-2 text-left font-heading font-semibold text-black text-xs">Utilisateur</th>
                      <th className="px-2 py-2 text-left font-heading font-semibold text-black text-xs">Rôle</th>
                      <th className="px-2 py-2 text-left font-heading font-semibold text-black text-xs">Commandes</th>
                      <th className="px-2 py-2 text-left font-heading font-semibold text-black text-xs">CA</th>
                      <th className="px-2 py-2 text-center font-heading font-semibold text-black text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-heading font-bold text-xs flex-shrink-0">
                              {(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-heading font-semibold text-sm text-black truncate">
                                {user.first_name} {user.last_name}
                              </div>
                              <div className="text-xs text-neutral-600 font-sans truncate">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <div className="space-y-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-heading font-semibold border ${getRoleColor(user.role)}`}>
                              {getRoleIcon(user.role)}
                              {getRoleLabel(user.role)}
                            </span>
                            {user.is_active ? (
                              <div className="text-xs text-green-600 font-semibold">Actif</div>
                            ) : (
                              <div className="text-xs text-red-600 font-semibold">Inactif</div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-1 text-sm">
                            <TrendingUp className="w-3 h-3 text-green-600" />
                            <span className="font-heading font-semibold">{user.total_orders || 0}</span>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <div className="text-sm font-heading font-semibold">{formatPrice(user.total_spent || 0)}</div>
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleViewDetails(user)}
                              className="p-1.5 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                              title="Voir"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleEdit(user)}
                              className="p-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                              title="Modifier"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {user.id !== currentUser?.id && (
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Version Mobile - Cartes (<768px) - Responsive amélioré */}
              <div className="md:hidden space-y-3">
                {filteredUsers.map((user) => (
                  <Card key={user.id} padding="sm" className="bg-white border-2 border-neutral-300 hover:border-neutral-400 transition-colors">
                    {/* En-tête avec nom et avatar */}
                    <div className="flex items-start justify-between mb-2.5 sm:mb-3 pb-2.5 sm:pb-3 border-b-2 border-neutral-200 gap-2">
                      <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-black rounded-full flex items-center justify-center text-white font-heading font-bold text-sm sm:text-base flex-shrink-0">
                          {(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-heading font-bold text-sm sm:text-base text-black mb-0.5 truncate">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-[10px] sm:text-xs text-neutral-600 font-sans truncate">{user.email}</div>
                          {user.phone && (
                            <div className="text-[10px] sm:text-xs text-neutral-500 font-sans mt-0.5 truncate">{user.phone}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-heading font-semibold border ${getRoleColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          <span className="hidden xs:inline">{getRoleLabel(user.role)}</span>
                        </span>
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-heading font-semibold bg-green-100 text-green-700 border border-green-300">
                            <UserCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                            <span className="hidden xs:inline">Actif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-heading font-semibold bg-red-100 text-red-700 border border-red-300">
                            <UserX className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                            <span className="hidden xs:inline">Inactif</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Statistiques en grille responsive */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 mb-2.5 sm:mb-3">
                      <div className="bg-neutral-50 rounded-lg p-2 sm:p-2.5 border border-neutral-200">
                        <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
                          <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-600 flex-shrink-0" />
                          <span className="text-[10px] sm:text-xs text-neutral-600 font-sans">Commandes</span>
                        </div>
                        <div className="font-heading font-bold text-sm sm:text-base text-black">{user.total_orders || 0}</div>
                      </div>
                      <div className="bg-neutral-50 rounded-lg p-2 sm:p-2.5 border border-neutral-200">
                        <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
                          <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 flex-shrink-0" />
                          <span className="text-[10px] sm:text-xs text-neutral-600 font-sans">CA Total</span>
                        </div>
                        <div className="font-heading font-bold text-xs sm:text-sm text-black leading-tight">{formatPrice(user.total_spent || 0)}</div>
                      </div>
                      <div className="bg-neutral-50 rounded-lg p-2 sm:p-2.5 border border-neutral-200 col-span-2 sm:col-span-1">
                        <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
                          <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-600 flex-shrink-0" />
                          <span className="text-[10px] sm:text-xs text-neutral-600 font-sans">Inscrit</span>
                        </div>
                        <div className="font-heading font-semibold text-[10px] sm:text-xs text-black leading-tight">{formatDate(user.created_at)}</div>
                      </div>
                    </div>

                    {/* Dernière activité */}
                    <div className="mb-2.5 sm:mb-3 pb-2.5 sm:pb-3 border-b border-neutral-200">
                      <div className="text-[10px] sm:text-xs text-neutral-600 font-sans mb-1">Dernière activité</div>
                      <div className="text-[10px] sm:text-xs">{getActivityBadge(user)}</div>
                    </div>

                    {/* Actions en grille responsive */}
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                      <button
                        onClick={() => handleViewDetails(user)}
                        className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-2 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors font-heading font-semibold text-[10px] sm:text-xs min-h-[44px] sm:min-h-[48px] active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>Voir</span>
                      </button>
                      <button
                        onClick={() => handleEdit(user)}
                        className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors font-heading font-semibold text-[10px] sm:text-xs min-h-[44px] sm:min-h-[48px] active:scale-95"
                      >
                        <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>Modifier</span>
                      </button>
                      {user.id !== currentUser?.id ? (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors font-heading font-semibold text-[10px] sm:text-xs min-h-[44px] sm:min-h-[48px] active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span>Supprimer</span>
                        </button>
                      ) : (
                        <div className="flex flex-col items-center justify-center px-2 sm:px-3 py-2 rounded-lg bg-neutral-100 text-neutral-400 min-h-[44px] sm:min-h-[48px]">
                          <span className="text-[10px] sm:text-xs">-</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Modal de création/modification */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingUser ? 'Modifier le compte' : 'Créer un compte'}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-heading font-semibold text-black mb-2">
                  Prénom *
                </label>
                <Input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Prénom"
                />
              </div>
              <div>
                <label className="block text-sm font-heading font-semibold text-black mb-2">
                  Nom *
                </label>
                <Input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Nom"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-heading font-semibold text-black mb-2">
                Email *
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-heading font-semibold text-black mb-2">
                Téléphone
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="06 12 34 56 78"
              />
            </div>

            <div>
              <label className="block text-sm font-heading font-semibold text-black mb-2">
                Mot de passe {editingUser ? '(laisser vide pour ne pas modifier)' : '*'}
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingUser ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
              />
            </div>

            <div>
              <label className="block text-sm font-heading font-semibold text-black mb-2">
                Rôle *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border-2 border-neutral-300 bg-white text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-sans"
              >
                <option value="client">Client</option>
                <option value="manager">Manager</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-heading font-semibold text-black mb-2">
                Points de fidélité
              </label>
              <Input
                type="number"
                value={formData.loyaltyPoints}
                onChange={(e) => setFormData({ ...formData, loyaltyPoints: parseInt(e.target.value) || 0 })}
                placeholder="0"
                min="0"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 text-black border-2 border-neutral-300 rounded focus:ring-2 focus:ring-black"
              />
              <label htmlFor="isActive" className="text-sm font-heading font-semibold text-black">
                Compte actif
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                variant="primary"
                className="flex-1"
              >
                {editingUser ? 'Enregistrer' : 'Créer'}
              </Button>
              <Button
                onClick={() => setShowModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Annuler
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal d'ajustement des points */}
        <Modal
          isOpen={showPointsModal}
          onClose={() => setShowPointsModal(false)}
          title="Ajuster les points de fidélité"
        >
          <div className="space-y-4">
            <div className="bg-neutral-100 rounded-xl p-4 border-2 border-neutral-300">
              <div className="text-sm text-neutral-600 mb-1">Utilisateur</div>
              <div className="font-heading font-bold text-lg">{selectedUser?.first_name} {selectedUser?.last_name}</div>
              <div className="text-sm text-neutral-600">{selectedUser?.email}</div>
              <div className="mt-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-600" />
                <span className="font-heading font-bold text-xl">{selectedUser?.loyalty_points || 0}</span>
                <span className="text-sm text-neutral-600">points actuels</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-heading font-semibold text-black mb-2">
                Ajustement (positif pour ajouter, négatif pour retirer)
              </label>
              <Input
                type="number"
                value={pointsAdjustment.points}
                onChange={(e) => setPointsAdjustment({ ...pointsAdjustment, points: parseInt(e.target.value) || 0 })}
                placeholder="Ex: +50 ou -20"
              />
              <div className="mt-2 text-sm text-neutral-600">
                Nouveau total : <span className="font-heading font-bold">
                  {Math.max(0, (selectedUser?.loyalty_points || 0) + (pointsAdjustment.points || 0))} points
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-heading font-semibold text-black mb-2">
                Raison (optionnel)
              </label>
              <textarea
                value={pointsAdjustment.reason}
                onChange={(e) => setPointsAdjustment({ ...pointsAdjustment, reason: e.target.value })}
                placeholder="Ex: Cadeau de bienvenue, Compensation pour erreur..."
                className="w-full px-4 py-2 rounded-xl border-2 border-neutral-300 bg-white text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-sans resize-none"
                rows="3"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSavePointsAdjustment}
                variant="primary"
                className="flex-1"
              >
                Ajuster
              </Button>
              <Button
                onClick={() => setShowPointsModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Annuler
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal des détails utilisateur */}
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title={`Historique des commandes - ${selectedUser?.first_name} ${selectedUser?.last_name}`}
          size="large"
        >
          {loadingDetails ? (
            <div className="p-8 text-center">
              <div className="inline-block w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-neutral-600 font-sans">Chargement des détails...</p>
            </div>
          ) : userDetails && userDetails.user ? (
            <div className="space-y-6">
              {/* Debug Info */}
              {logger.log('🔍 RENDER - userDetails:', {
                user: userDetails.user?.email,
                ordersCount: userDetails.orders?.length,
                loyaltyHistoryCount: userDetails.loyaltyHistory?.length,
                stats: userDetails.stats
              })}
              
              {/* Statistiques générales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card padding="md" className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-heading font-bold text-black">
                        {userDetails.stats?.total_orders ?? userDetails.orders?.length ?? 0}
                      </div>
                      <div className="text-sm text-neutral-600">Commandes</div>
                    </div>
                  </div>
                </Card>

                <Card padding="md" className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-heading font-bold text-black">
                        {formatPrice(userDetails.stats?.total_spent ?? 0)}
                      </div>
                      <div className="text-sm text-neutral-600">CA Total</div>
                    </div>
                  </div>
                </Card>

                <Card padding="md" className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-600 rounded-xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-heading font-bold text-black">
                        {userDetails.user?.loyalty_points ?? 0}
                      </div>
                      <div className="text-sm text-neutral-600">Points</div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Panier moyen */}
              {(userDetails.stats?.total_orders ?? userDetails.orders?.length ?? 0) > 0 && (
                <div className="text-center p-4 bg-neutral-100 rounded-xl">
                  <div className="text-sm text-neutral-600 mb-1">Panier moyen</div>
                  <div className="text-2xl font-heading font-bold">
                    {formatPrice(userDetails.stats?.average_order ?? 0)}
                  </div>
                </div>
              )}

              {/* Historique des commandes */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-bold text-xl">Historique des commandes</h3>
                  <span className="text-sm text-neutral-600 font-sans">
                    {userDetails.orders?.length ?? 0} commande{(userDetails.orders?.length ?? 0) > 1 ? 's' : ''}
                  </span>
                </div>
                {!userDetails.orders || userDetails.orders.length === 0 ? (
                  <div className="text-center py-8 bg-neutral-50 rounded-xl border-2 border-neutral-200">
                    <Package className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <p className="text-neutral-600 font-sans">Aucune commande</p>
                    <p className="text-xs text-neutral-500 mt-2">
                      {userDetails.orders === undefined ? 'Chargement...' : 'Aucune commande trouvée pour cet utilisateur'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {userDetails.orders.map((order, orderIndex) => (
                      <Card 
                        key={order.id || orderIndex} 
                        padding="md" 
                        className="bg-white border-2 border-neutral-300 hover:border-neutral-400 transition-colors"
                      >
                        {/* En-tête de la commande */}
                        <div className="flex items-start justify-between mb-4 pb-4 border-b-2 border-neutral-200">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Package className="w-5 h-5 text-blue-600" />
                              <span className="font-heading font-bold text-lg">Commande #{order.order_number}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatDate(order.created_at)}</span>
                              </div>
                              {order.order_type && (
                                <div className="px-2 py-1 rounded-lg bg-neutral-100 text-xs font-heading font-semibold">
                                  {order.order_type === 'dine-in' ? 'Sur place' : 
                                   order.order_type === 'takeaway' ? 'À emporter' : 
                                   order.order_type === 'delivery' ? 'Livraison' : order.order_type}
                                </div>
                              )}
                              {order.table_number && (
                                <div className="text-xs">
                                  Table: {order.table_number}
                                </div>
                              )}
                              {order.delivery_address && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  <span className="truncate max-w-xs">{order.delivery_address}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="space-y-1 mb-2">
                              {order.subtotal && order.subtotal !== order.total_amount && (
                                <div className="text-xs text-neutral-500 line-through">
                                  {formatPrice(order.subtotal)}
                                </div>
                              )}
                              <div className="font-heading font-bold text-xl text-black">
                                {formatPrice(order.total_amount)}
                              </div>
                              {order.discount_amount > 0 && (
                                <div className="text-xs text-green-600 font-semibold">
                                  -{formatPrice(order.discount_amount)} remise
                                </div>
                              )}
                              {order.tax_amount > 0 && (
                                <div className="text-xs text-neutral-500">
                                  Dont TVA: {formatPrice(order.tax_amount)}
                                </div>
                              )}
                            </div>
                            <div className={`inline-block px-2 py-1 rounded-lg text-xs font-heading font-semibold mb-1 ${
                              order.status === 'completed' || order.status === 'served' 
                                ? 'bg-green-100 text-green-700' 
                                : order.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : order.status === 'preparing' || order.status === 'ready'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {order.status === 'pending' ? 'En attente' :
                               order.status === 'preparing' ? 'En préparation' :
                               order.status === 'ready' ? 'Prête' :
                               order.status === 'served' ? 'Servie' :
                               order.status === 'completed' ? 'Terminée' :
                               order.status === 'cancelled' ? 'Annulée' : order.status}
                            </div>
                            <div className={`mt-1 inline-block px-2 py-1 rounded-lg text-xs font-heading font-semibold ${
                              order.payment_status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : order.payment_status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              <CreditCard className="w-3 h-3 inline mr-1" />
                              {order.payment_status === 'completed' ? 'Payé' : 
                               order.payment_status === 'pending' ? 'En attente' :
                               order.payment_status === 'failed' ? 'Échoué' :
                               order.payment_status === 'refunded' ? 'Remboursé' : 'Non payé'}
                            </div>
                            {order.payment_method && (
                              <div className="mt-1 text-xs text-neutral-600">
                                {order.payment_method === 'cash' ? 'Espèces' :
                                 order.payment_method === 'card' ? 'Carte' :
                                 order.payment_method === 'stripe' ? 'Stripe' :
                                 order.payment_method === 'paypal' ? 'PayPal' :
                                 order.payment_method === 'mixed' ? 'Mixte' : order.payment_method}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Produits de la commande */}
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-2">
                            <div className="text-sm font-heading font-semibold text-neutral-700 mb-2">
                              Produits commandés ({order.items.length})
                            </div>
                            <div className="space-y-2">
                              {order.items.map((item, idx) => (
                                <div 
                                  key={idx} 
                                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200"
                                >
                                  <div className="flex-1">
                                    <div className="font-heading font-semibold text-black">
                                      {item.product_name || `Produit #${item.product_id}`}
                                    </div>
                                    <div className="text-xs text-neutral-600 mt-1">
                                      Prix unitaire: {formatPrice(item.unit_price)}
                                    </div>
                                    {item.special_instructions && (
                                      <div className="text-xs text-neutral-500 italic mt-1">
                                        Note: {item.special_instructions}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right ml-4">
                                    <div className="font-heading font-semibold text-black">
                                      {item.quantity} × {formatPrice(item.unit_price)}
                                    </div>
                                    <div className="font-heading font-bold text-black mt-1">
                                      {formatPrice(item.subtotal)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-neutral-500 italic py-2">
                            Aucun détail de produit disponible
                          </div>
                        )}

                        {/* Notes et instructions */}
                        {order.notes && (
                          <div className="mt-3 pt-3 border-t border-neutral-200">
                            <div className="text-xs text-neutral-600">
                              <span className="font-heading font-semibold">Notes: </span>
                              {order.notes}
                            </div>
                          </div>
                        )}
                        
                        {/* Informations de timing */}
                        {(order.estimated_ready_time || order.completed_at) && (
                          <div className="mt-2 pt-2 border-t border-neutral-200 text-xs text-neutral-500">
                            {order.estimated_ready_time && (
                              <div>Prévu pour: {formatDate(order.estimated_ready_time)}</div>
                            )}
                            {order.completed_at && (
                              <div>Terminée le: {formatDate(order.completed_at)}</div>
                            )}
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Historique de fidélité */}
              <div>
                <h3 className="font-heading font-bold text-xl mb-4">Historique de fidélité</h3>
                {!userDetails.loyaltyHistory || userDetails.loyaltyHistory.length === 0 ? (
                  <p className="text-neutral-600 text-center py-4">
                    {userDetails.loyaltyHistory === undefined ? 'Chargement...' : 'Aucune transaction'}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {userDetails.loyaltyHistory.map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                        <div className="flex-1">
                          <div className="font-heading font-semibold text-sm">
                            {transaction.description || 'Transaction de fidélité'}
                          </div>
                          <div className="text-xs text-neutral-600">
                            {transaction.created_at ? formatDate(transaction.created_at) : 'Date inconnue'}
                          </div>
                        </div>
                        <div className={`font-heading font-bold ${(transaction.points_change || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(transaction.points_change || 0) > 0 ? '+' : ''}{transaction.points_change || 0} pts
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : userDetails === null ? (
            <div className="text-center py-8">
              <p className="text-neutral-600 font-sans mb-2">Erreur lors du chargement des données</p>
              <p className="text-sm text-neutral-500 font-sans">Vérifiez la console pour plus de détails</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-neutral-600 font-sans">Aucune donnée disponible</p>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default AdminAccounts;
