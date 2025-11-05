import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import Button from '../common/Button';
import { ENV } from '../../config/env';
import useAuth from '../../hooks/useAuth';

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

      // Récupérer le token depuis localStorage
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      console.log('📤 Upload image actualité:', {
        isAuthenticated,
        hasToken: !!token,
        hasUser: !!user,
        userRole: user?.role,
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'aucun'
      });

      if (!token) {
        console.error('❌ Token manquant dans localStorage');
        throw new Error('Token d\'authentification manquant. Veuillez vous reconnecter.');
      }

      const uploadUrl = `${ENV.BACKEND_URL}/api/admin/news/upload-image`;
      console.log('📤 URL d\'upload:', uploadUrl);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('📡 Réponse upload:', {
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
        
        console.error('❌ Erreur upload - Réponse serveur:', errorData);
        throw new Error(errorData.error || errorData.message || `Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        onImageChange(data.imageUrl);
        console.log('✅ Image actualité uploadée:', data.imageUrl);
      } else {
        throw new Error(data.error || 'Erreur upload');
      }
    } catch (err) {
      console.error('❌ Erreur upload actualité:', err);
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
      console.log('🗑️ Image actualité supprimée');
    } catch (err) {
      console.error('❌ Erreur suppression:', err);
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

