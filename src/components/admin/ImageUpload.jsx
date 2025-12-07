import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import Button from '../common/Button';
import logger from '../../utils/logger';
import { apiCall } from '../../services/api';

/**
 * Composant ImageUpload - Gestion moderne d'images
 * Upload, aperçu et suppression d'images produits
 */
const ImageUpload = ({ 
  currentImage, 
  onImageChange, 
  onImageRemove,
  productId,
  disabled = false 
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(currentImage);
  const fileInputRef = useRef(null);

  // Synchroniser le preview avec currentImage
  useEffect(() => {
    setPreview(currentImage);
  }, [currentImage]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation du fichier
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Format non supporté. Utilisez JPG, PNG, WEBP ou GIF.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Fichier trop volumineux. Maximum 5MB.');
      return;
    }

    setError('');
    setUploading(true);

    try {
      // Créer l'aperçu local
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload vers le serveur via apiCall
      const formData = new FormData();
      formData.append('image', file);

      logger.debug('📤 Upload image produit - Début');
      
      // Utiliser apiCall pour bénéficier de la gestion d'URL et d'authentification
      const response = await apiCall('/admin/products/upload-image', {
        method: 'POST',
        body: formData,
        // Ne pas mettre Content-Type, le navigateur le définit automatiquement avec FormData
        headers: {}
      });

      logger.debug('📥 Réponse upload:', response);

      if (response.success && response.imageUrl) {
        onImageChange(response.imageUrl);
        logger.debug('✅ Image uploadée:', response.imageUrl);
        setError(''); // Effacer toute erreur précédente
      } else {
        const errorMsg = response.error || response.message || 'Erreur lors de l\'upload';
        logger.error('❌ Erreur upload:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      logger.error('❌ Erreur upload:', err);
      logger.error('  - Message:', err.message);
      logger.error('  - Stack:', err.stack);
      
      // Message d'erreur plus détaillé
      let errorMessage = 'Erreur lors de l\'upload. Réessayez.';
      
      if (err.message) {
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          errorMessage = 'Authentification requise. Veuillez vous reconnecter.';
        } else if (err.message.includes('403') || err.message.includes('Forbidden')) {
          errorMessage = 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
        } else if (err.message.includes('CSRF')) {
          errorMessage = 'Erreur de sécurité. Veuillez rafraîchir la page.';
        } else if (err.message.includes('Network') || err.message.includes('fetch')) {
          errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setPreview(currentImage);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Supprimer cette image ?')) return;

    setUploading(true);
    setError('');

    try {
      if (productId) {
        logger.debug('🗑️ Suppression image produit:', productId);
        
        const response = await apiCall(`/admin/products/${productId}/image`, {
          method: 'DELETE'
        });

        if (!response.success) {
          throw new Error(response.error || response.message || 'Erreur suppression');
        }
        
        logger.debug('✅ Image supprimée avec succès');
      }

      setPreview(null);
      if (onImageRemove) onImageRemove();
      logger.debug('🗑️ Image supprimée');
      setError(''); // Effacer toute erreur
    } catch (err) {
      logger.error('❌ Erreur suppression:', err);
      logger.error('  - Message:', err.message);
      
      let errorMessage = 'Erreur lors de la suppression.';
      if (err.message) {
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          errorMessage = 'Authentification requise. Veuillez vous reconnecter.';
        } else if (err.message.includes('403') || err.message.includes('Forbidden')) {
          errorMessage = 'Accès refusé.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-heading font-semibold text-black">
        Image du produit
      </label>

      {/* Zone d'aperçu - Centrée et taille adaptée */}
      <div className="flex justify-center">
        <div className="relative w-full sm:w-64 md:w-72 lg:w-80 aspect-square rounded-2xl overflow-hidden border-2 border-neutral-200 bg-neutral-50 shadow-sm">
          {preview ? (
            <>
              <img
                src={preview.startsWith('/') ? `http://localhost:5000${preview}` : preview}
                alt="Aperçu produit"
                className="w-full h-full object-cover"
              />
              {!disabled && (
                <button
                  onClick={handleRemove}
                  disabled={uploading}
                  className="absolute top-3 right-3 p-2 bg-black/70 hover:bg-black text-white rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
                  title="Supprimer l'image"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400">
              <ImageIcon className="w-16 h-16 mb-3" />
              <p className="text-sm font-sans">Aucune image</p>
            </div>
          )}
        </div>
      </div>

      {/* Bouton upload */}
      {!disabled && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            loading={uploading}
            icon={<Upload className="w-5 h-5" />}
            fullWidth
          >
            {preview ? 'Changer l\'image' : 'Ajouter une image'}
          </Button>
        </>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm animate-slide-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-sans">{error}</span>
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-neutral-600 font-sans">
        Formats acceptés: JPG, PNG, WEBP, GIF • Taille max: 5MB
      </p>
    </div>
  );
};

export default ImageUpload;

