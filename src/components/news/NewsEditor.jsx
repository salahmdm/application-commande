import React, { useState } from 'react';
import { Edit, Plus, Trash2, X, Save, Calendar } from 'lucide-react';
import Button from '../common/Button';
import ImageUploadNews from './ImageUploadNews';
import logger from '../../utils/logger';

/**
 * Composant pour gérer les actualités - Système inline sans modal
 * Visible uniquement pour les admins
 */
const NewsEditor = ({ news, onSave, onDelete }) => {
  const [editingNewsId, setEditingNewsId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    image_url: null,
    icon: '🍃',
    gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
    bgPattern: '',
    display_order: 0,
    order: 0, // Fallback pour compatibilité
    is_new: false
  });

  const gradients = [
    { value: 'from-emerald-400 via-teal-500 to-cyan-600', label: 'Vert/Teal' },
    { value: 'from-pink-400 via-rose-500 to-purple-600', label: 'Rose/Violet' },
    { value: 'from-violet-400 via-purple-500 to-indigo-600', label: 'Violet/Indigo' },
    { value: 'from-amber-400 via-orange-500 to-red-600', label: 'Ambre/Orange' },
    { value: 'from-blue-400 via-cyan-500 to-teal-600', label: 'Bleu/Cyan' }
  ];

  const handleAdd = () => {
    setIsAdding(true);
    setEditingNewsId(null);
    setFormData({
      title: '',
      description: '',
      date: '',
      image_url: null,
      icon: '🍃',
      gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
      bgPattern: '',
      display_order: news.length || 0,
      order: news.length || 0, // Fallback pour compatibilité
      is_new: false
    });
  };

  const handleEdit = (item) => {
    setEditingNewsId(item.id);
    setIsAdding(false);
    setFormData({
      title: item.title || '',
      description: item.description || '',
      date: item.date || '',
      image_url: item.image_url || null,
      icon: item.icon || '🍃',
      gradient: item.gradient || 'from-emerald-400 via-teal-500 to-cyan-600',
      bgPattern: item.bgPattern || item.bg_pattern || '',
      display_order: item.display_order || item.order || 0,
      order: item.order || 0, // Fallback pour compatibilité
      is_new: item.is_new || false
    });
  };

  const handleCancel = () => {
    setEditingNewsId(null);
    setIsAdding(false);
    setFormData({
      title: '',
      description: '',
      date: '',
      image_url: null,
      icon: '🍃',
      gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
      bgPattern: '',
      display_order: 0,
      order: 0, // Fallback pour compatibilité
      is_new: false
    });
  };

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

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('Le titre est requis');
      return;
    }

    try {
      const newsData = editingNewsId ? { ...formData, id: editingNewsId } : formData;
      // S'assurer que is_new est bien inclus (boolean)
      newsData.is_new = formData.is_new === true || formData.is_new === 1 || formData.is_new === 'true';
      logger.log('💾 Données à sauvegarder:', newsData);
      await onSave(newsData);
      handleCancel();
    } catch (error) {
      logger.error('❌ Erreur handleSave:', error);
      throw error;
    }
  };

  const handleDelete = (item) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${item.title}" ?`)) {
      onDelete(item.id);
    }
  };

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-purple-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg">
            <Edit className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Gérer les actualités</h3>
            <p className="text-sm text-slate-500">Modifiez et organisez vos actualités</p>
          </div>
        </div>
        {!isAdding && (
        <Button
          onClick={handleAdd}
          variant="primary"
            size="md"
          icon={<Plus className="w-4 h-4" />}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
        >
          Ajouter une actualité
        </Button>
        )}
      </div>

      {/* Formulaire d'ajout inline */}
      {isAdding && (
        <div className="mb-6 bg-white rounded-2xl border-2 border-purple-300 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-bold text-slate-900">Nouvelle actualité</h4>
            <button
              onClick={handleCancel}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Titre *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                placeholder="Titre de l'actualité"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date (optionnel)</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-600" />
                <input
                  type="text"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border-2 border-neutral-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  placeholder="Ex: Samedi 24 Octobre"
                />
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-sm"
              rows="3"
              placeholder="Description de l'actualité..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Dégradé</label>
              <select
                value={formData.gradient || 'from-emerald-400 via-teal-500 to-cyan-600'}
                onChange={(e) => handleChange('gradient', e.target.value)}
                className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              >
                {gradients.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ordre</label>
              <input
                type="number"
                value={formData.display_order || formData.order || 0}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  handleChange('display_order', value);
                  handleChange('order', value); // Fallback pour compatibilité
                }}
                className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                min="0"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_new || false}
                onChange={(e) => handleChange('is_new', e.target.checked)}
                className="w-5 h-5 rounded border-2 border-purple-300 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 cursor-pointer"
              />
              <span className="text-sm font-semibold text-slate-700">Afficher le badge "Nouveau"</span>
            </label>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Image (optionnel)</label>
            {formData.image_url ? (
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-neutral-200">
                  <img
                    src={formData.image_url.startsWith('http') ? formData.image_url : `http://localhost:5000${formData.image_url}`}
                    alt="Aperçu"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('image_url', null)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-neutral-300 rounded-lg p-2">
                <ImageUploadNews
                  currentImage={formData.image_url}
                  onImageChange={handleImageUpload}
                  onImageRemove={() => handleChange('image_url', null)}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-neutral-200">
            <Button
              onClick={handleCancel}
              variant="outline"
              size="sm"
              className="flex-1 border-neutral-300 text-slate-700 hover:bg-neutral-50"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              variant="primary"
              size="sm"
              icon={<Save className="w-4 h-4" />}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              Enregistrer
            </Button>
          </div>
        </div>
      )}

      {/* Liste des actualités avec édition inline */}
      {news && news.length > 0 ? (
        <div className="space-y-4">
          {news.map((item) => (
            <div key={item.id}>
              {editingNewsId === item.id ? (
                // Mode édition inline
                <div className="bg-white rounded-2xl border-2 border-purple-300 p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-bold text-slate-900">Modifier l'actualité</h4>
                    <button
                      onClick={handleCancel}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Titre *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-600" />
                        <input
                          type="text"
                          value={formData.date}
                          onChange={(e) => handleChange('date', e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border-2 border-neutral-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description *</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-sm"
                      rows="3"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Dégradé</label>
                      <select
                        value={formData.gradient || 'from-emerald-400 via-teal-500 to-cyan-600'}
                        onChange={(e) => handleChange('gradient', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                      >
                        {gradients.map(g => (
                          <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ordre</label>
                      <input
                        type="number"
                        value={formData.display_order || formData.order || 0}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          handleChange('display_order', value);
                          handleChange('order', value); // Fallback pour compatibilité
                        }}
                        className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_new || false}
                        onChange={(e) => handleChange('is_new', e.target.checked)}
                        className="w-5 h-5 rounded border-2 border-purple-300 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-slate-700">Afficher le badge "Nouveau"</span>
                    </label>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Image</label>
                    {formData.image_url ? (
                      <div className="relative inline-block">
                        <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-neutral-200">
                          <img
                            src={formData.image_url.startsWith('http') ? formData.image_url : `http://localhost:5000${formData.image_url}`}
                            alt="Aperçu"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleChange('image_url', null)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-neutral-300 rounded-lg p-2">
                        <ImageUploadNews
                          currentImage={formData.image_url}
                          onImageChange={handleImageUpload}
                          onImageRemove={() => handleChange('image_url', null)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-neutral-200">
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-neutral-300 text-slate-700 hover:bg-neutral-50"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleSave}
                      variant="primary"
                      size="sm"
                      icon={<Save className="w-4 h-4" />}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                      Enregistrer
                    </Button>
                  </div>
                </div>
              ) : (
                // Mode affichage
                <div className="group relative bg-white rounded-2xl border-2 border-neutral-200 hover:border-purple-300 p-6 hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500"></div>
                  
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-32 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 flex-shrink-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url.startsWith('http') ? item.image_url : `http://localhost:5000${item.image_url}`}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br ${item.gradient || 'from-purple-200 to-blue-200'}`}>
                          {item.icon || '📰'}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        {item.date && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider bg-purple-50 px-2 py-1 rounded">
                              {item.date}
                            </span>
                          </div>
                        )}
                        <h4 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-purple-600 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                          {item.description}
                        </p>
                      </div>
                      
                      <div className="flex gap-3">
                <Button
                  onClick={() => handleEdit(item)}
                  variant="outline"
                  size="sm"
                  icon={<Edit className="w-4 h-4" />}
                          className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400"
                >
                  Modifier
                </Button>
                <Button
                  onClick={() => handleDelete(item)}
                  variant="outline"
                  size="sm"
                  icon={<Trash2 className="w-4 h-4" />}
                          className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                >
                  Supprimer
                </Button>
              </div>
                    </div>
                  </div>
                  
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-50/30 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-1000 pointer-events-none"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : !isAdding && (
        <div className="text-center py-12 bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-300">
          <div className="text-5xl mb-4">📰</div>
          <p className="text-slate-600 font-medium mb-2">Aucune actualité pour le moment</p>
          <p className="text-sm text-slate-500 mb-6">Commencez par ajouter votre première actualité</p>
          <Button
            onClick={handleAdd}
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            Ajouter une actualité
          </Button>
        </div>
      )}
    </div>
  );
};

export default NewsEditor;
