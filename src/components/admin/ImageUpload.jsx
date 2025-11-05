import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import Button from '../common/Button';

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

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/products/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        onImageChange(data.imageUrl);
        console.log('✅ Image uploadée:', data.imageUrl);
      } else {
        throw new Error(data.error || 'Erreur upload');
      }
    } catch (err) {
      console.error('❌ Erreur upload:', err);
      setError('Erreur lors de l\'upload. Réessayez.');
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
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/admin/products/${productId}/image`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Erreur suppression');
        }
      }

      setPreview(null);
      if (onImageRemove) onImageRemove();
      console.log('🗑️ Image supprimée');
    } catch (err) {
      console.error('❌ Erreur suppression:', err);
      setError('Erreur lors de la suppression.');
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

