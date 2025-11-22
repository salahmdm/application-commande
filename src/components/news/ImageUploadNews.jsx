import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import Button from '../common/Button';
import { ENV } from '../../config/env';
import useAuth from '../../hooks/useAuth';
import logger from '../../utils/logger';

/**
 * Composant ImageUpload pour les actualités
 * Upload, aperçu et suppression d'images actualités
 */
const ImageUploadNews = ({ 
  currentImage, 
  onImageChange, 
  onImageRemove,
  disabled = false 
}) => {
  const { isAuthenticated } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(currentImage);
  const fileInputRef = useRef(null);

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

      // Upload vers le serveur
      const formData = new FormData();
      formData.append('image', file);

      // Vérifier l'authentification
      if (!isAuthenticated) {
        throw new Error('Vous devez être connecté pour uploader une image');
      }

      // ✅ CORRECTION: Utiliser les cookies HTTP-only pour l'authentification
      // Le token peut être dans localStorage (fallback) ou dans les cookies (sécurisé)
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      logger.debug('📤 Upload image actualité:', {
        isAuthenticated,
        hasToken: !!token,
        hasUser: !!user,
        userRole: user?.role
      });

      const uploadUrl = `${ENV.BACKEND_URL}/api/admin/news/upload-image`;
      logger.debug('📤 URL d\'upload:', uploadUrl);

      // ✅ CORRECTION: Headers simplifiés - les cookies HTTP-only sont envoyés automatiquement avec credentials: 'include'
      const headers = {};
      // Ajouter le token dans l'Authorization seulement s'il existe (fallback pour compatibilité)
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: headers,
        body: formData,
        credentials: 'include' // ✅ CRITIQUE: Envoyer les cookies HTTP-only pour l'auth
      });

      logger.debug('📡 Réponse upload:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erreur inconnue');
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `Erreur ${response.status}` };
        }
        
        logger.error('❌ Erreur upload - Réponse serveur:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        });
        
        // ✅ AMÉLIORATION: Message d'erreur plus détaillé
        const errorMessage = errorData.message || errorData.error || `Erreur ${response.status}: ${response.statusText}`;
        
        // Messages spécifiques selon le code d'erreur
        if (response.status === 401 || response.status === 403) {
          throw new Error('Authentification requise. Veuillez vous reconnecter.');
        } else if (response.status === 400 && errorData.message) {
          throw new Error(errorData.message);
        } else {
          throw new Error(errorMessage);
        }
      }

      const data = await response.json();

      if (data.success) {
        onImageChange(data.imageUrl);
        logger.debug('✅ Image actualité uploadée:', data.imageUrl);
      } else {
        throw new Error(data.error || 'Erreur upload');
      }
    } catch (err) {
      logger.error('❌ Erreur upload actualité:', err);
      setError(err.message || 'Erreur lors de l\'upload. Réessayez.');
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
      setPreview(null);
      if (onImageRemove) onImageRemove();
      logger.debug('🗑️ Image actualité supprimée');
    } catch (err) {
      logger.error('❌ Erreur suppression:', err);
      setError('Erreur lors de la suppression.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Zone d'aperçu - Compacte */}
      <div className="flex justify-center">
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-lg overflow-hidden border-2 border-neutral-200 bg-neutral-50 shadow-sm">
          {preview ? (
            <>
              <img
                src={preview.startsWith('/') ? `${ENV.BACKEND_URL}${preview}` : preview}
                alt="Aperçu actualité"
                className="w-full h-full object-cover"
              />
              {!disabled && (
                <button
                  onClick={handleRemove}
                  disabled={uploading}
                  className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-black text-white rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                  title="Supprimer l'image"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400">
              <ImageIcon className="w-8 h-8 mb-1" />
              <p className="text-xs font-sans">Aucune image</p>
            </div>
          )}
        </div>
      </div>

      {/* Bouton upload - Compact */}
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
            icon={<Upload className="w-4 h-4" />}
            size="sm"
            fullWidth
            className="text-xs py-1.5"
          >
            {preview ? 'Changer' : 'Ajouter'}
          </Button>
        </>
      )}

      {/* Message d'erreur - Compact */}
      {error && (
        <div className="flex items-center gap-1.5 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs animate-slide-in">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="font-sans">{error}</span>
        </div>
      )}

      {/* Info - Compact */}
      <p className="text-xs text-neutral-500 font-sans text-center">
        JPG, PNG, WEBP, GIF • Max 5MB
      </p>
    </div>
  );
};

export default ImageUploadNews;

