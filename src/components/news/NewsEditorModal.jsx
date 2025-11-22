import React, { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Calendar, Edit } from 'lucide-react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import ImageUploadNews from '../news/ImageUploadNews';
import logger from '../../utils/logger';

/**
 * Modal d'édition d'une actualité
 */
const NewsEditorModal = ({ isOpen, onClose, newsItem, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    image_url: null,
    icon: '🍃',
    gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
    bgPattern: 'bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.15),transparent_50%)]',
    order: 0
  });

  useEffect(() => {
    if (newsItem) {
      setFormData({
        title: newsItem.title || '',
        description: newsItem.description || '',
        date: newsItem.date || '',
        image_url: newsItem.image_url || null,
        icon: newsItem.icon || '🍃',
        gradient: newsItem.gradient || 'from-emerald-400 via-teal-500 to-cyan-600',
        bgPattern: newsItem.bgPattern || 'bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.15),transparent_50%)]',
        display_order: newsItem.display_order || newsItem.order || 0,
        order: newsItem.order || 0 // Fallback pour compatibilité
      });
    } else {
      // Reset pour nouvelle actualité
      setFormData({
        title: '',
        description: '',
        date: '',
        image_url: null,
        icon: '🍃',
        gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
        bgPattern: 'bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.15),transparent_50%)]',
        display_order: 0,
        order: 0 // Fallback pour compatibilité
      });
    }
  }, [newsItem, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (imageUrl) => {
    setFormData(prev => ({
      ...prev,
      image_url: imageUrl
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      return;
    }
    // S'assurer que l'ID est inclus si on modifie une actualité existante
    const dataToSave = newsItem ? { ...formData, id: newsItem.id } : formData;
    logger.log('💾 NewsEditorModal.handleSubmit:', {
      newsItem: newsItem?.id,
      dataToSave
    });
    onSave(dataToSave);
    onClose();
  };

  const gradients = [
    { value: 'from-emerald-400 via-teal-500 to-cyan-600', label: 'Vert/Teal' },
    { value: 'from-pink-400 via-rose-500 to-purple-600', label: 'Rose/Violet' },
    { value: 'from-violet-400 via-purple-500 to-indigo-600', label: 'Violet/Indigo' },
    { value: 'from-amber-400 via-orange-500 to-red-600', label: 'Ambre/Orange' },
    { value: 'from-blue-400 via-cyan-500 to-teal-600', label: 'Bleu/Cyan' }
  ];

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseButton={false}>
      <div className="p-4 sm:p-6">
        {/* Header amélioré et compact */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 pb-4 border-b-2 border-purple-200">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex-shrink-0">
              <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                {newsItem ? 'Modifier l\'actualité' : 'Nouvelle actualité'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">
                {newsItem ? 'Modifiez les informations' : 'Créez une nouvelle actualité'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all flex-shrink-0 ml-2"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <Input
            label="Titre"
            type="text"
            placeholder="Titre de l'actualité"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            required
          />

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
              Description
            </label>
            <textarea
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-neutral-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none text-sm sm:text-base"
              rows="3"
              placeholder="Description de l'actualité..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              required
            />
          </div>

          {/* Ligne avec Date et Icône côte à côte sur desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date (optionnel)"
              type="text"
              placeholder="Ex: Samedi 24 Octobre"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              icon={<Calendar className="w-4 h-4 sm:w-5 sm:h-5" />}
            />

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                Icône emoji
              </label>
              <Input
                type="text"
                placeholder="🍃"
                value={formData.icon}
                onChange={(e) => handleChange('icon', e.target.value)}
                maxLength={2}
              />
            </div>
          </div>

          {/* Ligne avec Dégradé et Ordre côte à côte sur desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                Dégradé de couleur
              </label>
              <select
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-neutral-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm sm:text-base"
                value={formData.gradient}
                onChange={(e) => handleChange('gradient', e.target.value)}
              >
                {gradients.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                Ordre d'affichage
              </label>
              <Input
                type="number"
                min="0"
                value={formData.display_order || formData.order || 0}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  handleChange('display_order', value);
                  handleChange('order', value); // Fallback pour compatibilité
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">
              Image (optionnel)
            </label>
            {formData.image_url ? (
              <div className="relative group">
                <div className="overflow-hidden rounded-lg border-2 border-neutral-200">
                  <img
                    src={formData.image_url.startsWith('http') ? formData.image_url : `http://localhost:5000${formData.image_url}`}
                    alt="Aperçu"
                    className="w-full h-24 sm:h-32 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('image_url', null)}
                  className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-red-500 text-white rounded-full p-1 sm:p-1.5 hover:bg-red-600 shadow-lg transition-all hover:scale-110"
                >
                  <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-neutral-300 rounded-lg p-2 sm:p-3 hover:border-purple-400 transition-colors">
                <ImageUploadNews
                  currentImage={formData.image_url}
                  onImageChange={handleImageUpload}
                  onImageRemove={() => handleChange('image_url', null)}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-5 border-t-2 border-neutral-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              fullWidth
              className="border-neutral-300 text-slate-700 hover:bg-neutral-50"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl"
            >
              {newsItem ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default NewsEditorModal;
