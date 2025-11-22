import { useEffect, useState } from 'react';
import useKioskStore from '../../store/kioskStore';
import kioskService from '../../services/kioskService';
import logger from '../../utils/logger';

/**
 * Vue des catégories
 * Affichage en grille ou carrousel horizontal
 * Inspiré des bornes de restauration rapide
 */
function CategoryView() {
  const { setCurrentStep, updateActivity, language } = useKioskStore();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    updateActivity();
    loadCategories();
  }, [updateActivity]);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      logger.log('🔄 Kiosk - Chargement catégories...');
      
      // Vérifier l'authentification avant de charger
      const { isAuthenticated } = useKioskStore.getState();
      if (!isAuthenticated) {
        logger.warn('⚠️ Kiosk - Non authentifié, tentative d\'authentification...');
        // Essayer de s'authentifier automatiquement
        try {
          const kioskService = (await import('../../services/kioskService')).default;
          const kioskId = 'kiosk-001@blossom-cafe.local';
          const kioskSecret = 'kiosk-secret-2025';
          const loginResponse = await kioskService.login(kioskId, kioskSecret);
          if (loginResponse.success) {
            const { setKioskAuth } = useKioskStore.getState();
            setKioskAuth(loginResponse.token, loginResponse.kiosk?.id);
            logger.log('✅ Kiosk - Authentification réussie, rechargement catégories...');
          }
        } catch (authError) {
          logger.error('❌ Kiosk - Erreur authentification:', authError);
        }
      }
      
      // ✅ UTILISER kioskService (route /api/kiosk/categories) - ISOLÉ de l'app principale
      // Récupère toutes les catégories actives depuis la BDD MySQL
      const response = await kioskService.getCategories();
      
      logger.log('📦 Kiosk - Réponse API catégories:', {
        success: response?.success,
        hasData: !!response?.data,
        dataLength: response?.data?.length || 0,
        error: response?.error,
        fullResponse: response
      });
      
      if (response.success && response.data) {
        // Les catégories sont déjà filtrées côté backend (is_active = TRUE)
        setCategories(response.data);
        logger.log(`✅ Kiosk - ${response.data.length} catégories chargées depuis la BDD`);
        
        // Afficher les catégories pour debug
        if (response.data.length > 0) {
          logger.log('📋 Kiosk - Catégories:', response.data.map(c => ({
            id: c.id,
            name: c.name,
            is_active: c.is_active
          })));
        } else {
          logger.warn('⚠️ Kiosk - Aucune catégorie trouvée dans la BDD (is_active = TRUE)');
        }
      } else {
        const errorMsg = response.error || 'Réponse API invalide';
        logger.error(`❌ Kiosk - ${errorMsg}:`, response);
        setCategories([]);
      }
    } catch (error) {
      logger.error('❌ Kiosk - Erreur chargement catégories:', error);
      logger.error('   Détails:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Si erreur 401/403, c'est un problème d'authentification
      if (error.message?.includes('401') || error.message?.includes('403') || error.message?.includes('Authentification')) {
        logger.error('🔐 Kiosk - Problème d\'authentification. Vérifiez que l\'utilisateur kiosk existe en BDD.');
      }
      
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = (categoryId) => {
    logger.log(`📂 Kiosk - Catégorie sélectionnée: ${categoryId}`);
    setCurrentStep('products');
    // Stocker la catégorie sélectionnée dans le store si nécessaire
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-6xl font-bold text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="category-view h-full w-full bg-gradient-to-br from-orange-50 to-red-50 p-12">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* En-tête */}
        <div className="mb-8">
          <h2 className="text-6xl font-bold text-gray-800 mb-4">
            Choisissez une catégorie
          </h2>
          <button
            onClick={() => setCurrentStep('welcome')}
            className="text-3xl text-gray-600 hover:text-gray-800 underline"
          >
            ← Retour
          </button>
        </div>

        {/* Grille de catégories - Grandes zones tactiles */}
        {categories.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-9xl mb-8">📂</div>
              <p className="text-4xl font-bold text-gray-600 mb-4">
                Aucune catégorie disponible
              </p>
              <p className="text-2xl text-gray-500">
                Vérifiez la connexion à la base de données
              </p>
            </div>
          </div>
        ) : (
          <div className="categories-grid grid grid-cols-3 gap-8 flex-1 overflow-y-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className="category-card bg-white rounded-3xl p-12 shadow-2xl hover:shadow-3xl hover:scale-105 active:scale-95 transition-all duration-200 flex flex-col items-center justify-center min-h-[400px] touch-manipulation"
              >
                {category.icon && (
                  <div className="text-9xl mb-6">{category.icon}</div>
                )}
                <h3 className="text-5xl font-bold text-gray-800 text-center">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-2xl text-gray-600 mt-4 text-center">
                    {category.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Panier flottant (si articles) */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => setCurrentStep('cart')}
            className="cart-button bg-orange-500 hover:bg-orange-600 text-white px-12 py-6 rounded-2xl text-4xl font-bold shadow-xl touch-manipulation"
          >
            🛒 Voir le panier
          </button>
        </div>
      </div>
    </div>
  );
}

export default CategoryView;

