import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Edit, Plus, Trash2, X, Save, Image as ImageIcon } from 'lucide-react';
import Button from '../common/Button';
import ImageUploadNews from './ImageUploadNews';
import newsService from '../../services/newsService';
import useAuth from '../../hooks/useAuth';
import useNotifications from '../../hooks/useNotifications';
import logger from '../../utils/logger';

/**
 * Section Actualités & Événements - Version complètement refaite
 * Design moderne avec toutes les fonctionnalités de modification
 */
const NewsSection = () => {
  const { isAdmin, isManager } = useAuth();
  const { success, error: showError } = useNotifications();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    image_url: null,
    icon: '🍃',
    gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
    bgPattern: '',
    display_order: 0,
    is_new: false,
    is_active: true
  });

  const gradients = [
    { value: 'from-emerald-400 via-teal-500 to-cyan-600', label: 'Vert/Teal' },
    { value: 'from-pink-400 via-rose-500 to-purple-600', label: 'Rose/Violet' },
    { value: 'from-violet-400 via-purple-500 to-indigo-600', label: 'Violet/Indigo' },
    { value: 'from-amber-400 via-orange-500 to-red-600', label: 'Ambre/Orange' },
    { value: 'from-blue-400 via-cyan-500 to-teal-600', label: 'Bleu/Cyan' },
    { value: 'from-purple-400 via-pink-500 to-rose-600', label: 'Violet/Rose' }
  ];

  // Charger les actualités
  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      setLoading(true);
      const response = await newsService.getNews();
      if (response.success && response.data) {
        const sorted = response.data
          .filter(item => item.is_active !== false)
          .sort((a, b) => (a.display_order || a.order || 0) - (b.display_order || b.order || 0));
        setNews(sorted);
      } else {
        setNews([]);
      }
    } catch (error) {
      logger.error('❌ Erreur chargement actualités:', error);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  // Gestion du formulaire
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (imageUrl) => {
    setFormData(prev => ({
      ...prev,
      image_url: imageUrl || null
    }));
  };

  const handleImageRemove = () => {
    setFormData(prev => ({
      ...prev,
      image_url: null
    }));
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      image_url: null,
      icon: '🍃',
      gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
      bgPattern: '',
      display_order: news.length || 0,
      is_new: false,
      is_active: true
    });
    setEditingId(null);
    setIsAdding(false);
  };

  // Ouvrir le formulaire d'ajout
  const handleAdd = () => {
    resetForm();
    setIsAdding(true);
    setShowEditor(true);
  };

  // Ouvrir le formulaire d'édition
  const handleEdit = (item) => {
    const imageUrl = item.image_url !== undefined && item.image_url !== null && item.image_url !== '' 
      ? item.image_url 
      : null;
    
    setFormData({
      title: item.title || '',
      description: item.description || '',
      date: item.date || '',
      image_url: imageUrl,
      icon: item.icon || '🍃',
      gradient: item.gradient || 'from-emerald-400 via-teal-500 to-cyan-600',
      bgPattern: item.bgPattern || item.bg_pattern || '',
      display_order: item.display_order || item.order || 0,
      is_new: item.is_new || false,
      is_active: item.is_active !== undefined ? item.is_active : true
    });
    setEditingId(item.id);
    setIsAdding(false);
    setShowEditor(true);
  };

  // Annuler l'édition
  const handleCancel = () => {
    resetForm();
    setShowEditor(false);
  };

  // Sauvegarder
  const handleSave = async () => {
    if (!formData.title.trim()) {
      showError('Le titre est requis');
      return;
    }

    try {
      // Construire l'objet newsData explicitement
      const newsData = {
        title: formData.title.trim(),
        description: formData.description || '',
        date: formData.date || null,
        image_url: formData.image_url === '' || formData.image_url === undefined ? null : formData.image_url,
        icon: formData.icon || '🍃',
        gradient: formData.gradient || 'from-emerald-400 via-teal-500 to-cyan-600',
        bgPattern: formData.bgPattern || '',
        display_order: formData.display_order || 0,
        order: formData.display_order || 0,
        is_new: formData.is_new === true || formData.is_new === 1 || formData.is_new === 'true',
        is_active: formData.is_active !== undefined ? formData.is_active : true
      };

      if (editingId) {
        newsData.id = editingId;
      }

      logger.log('💾 Sauvegarde actualité:', newsData);

      let response;
      if (editingId) {
        const { id, ...dataToUpdate } = newsData;
        response = await newsService.updateNews(id, dataToUpdate);
      } else {
        response = await newsService.createNews(newsData);
      }

      if (response && response.success) {
        success(editingId ? 'Actualité modifiée !' : 'Actualité ajoutée !');
        await loadNews();
        handleCancel();
      } else {
        const errorMsg = response?.error || response?.message || 'Erreur lors de la sauvegarde';
        showError(errorMsg);
      }
    } catch (error) {
      logger.error('❌ Erreur sauvegarde:', error);
      showError(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  // Supprimer
  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette actualité ?')) {
      return;
    }

    try {
      const response = await newsService.deleteNews(id);
      if (response.success) {
        success('Actualité supprimée !');
        await loadNews();
      } else {
        showError(response.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      logger.error('❌ Erreur suppression:', error);
      showError(error.message || 'Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <section className="section-container relative">
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-slate-600">Chargement des actualités...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section-container relative">
      {/* Fond décoratif avec gradients */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="relative z-10">
        {/* En-tête */}
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
              onClick={() => setShowEditor(!showEditor)}
              variant="outline"
              size="md"
              icon={<Sparkles className="w-4 h-4" />}
              className="shadow-md hover:shadow-lg transition-shadow"
            >
              {showEditor ? 'Masquer l\'éditeur' : 'Modifier les actualités'}
            </Button>
          </div>
        )}

        {/* Éditeur d'actualités */}
        {(isAdmin || isManager) && showEditor && (
          <div className="mb-10 p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-purple-200">
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
              {!isAdding && !editingId && (
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

            {/* Formulaire */}
            {(isAdding || editingId) && (
              <div className="bg-white rounded-2xl border-2 border-purple-300 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-bold text-slate-900">
                    {isAdding ? 'Nouvelle actualité' : 'Modifier l\'actualité'}
                  </h4>
                  <button
                    onClick={handleCancel}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Titre */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Titre *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                      placeholder="Titre de l'actualité"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-sm"
                      rows="4"
                      placeholder="Description de l'actualité..."
                    />
                  </div>

                  {/* Date et Ordre */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Date (optionnel)
                      </label>
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
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Ordre d'affichage
                      </label>
                      <input
                        type="number"
                        value={formData.display_order}
                        onChange={(e) => handleChange('display_order', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Dégradé et Icône */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Dégradé de couleur
                      </label>
                      <select
                        value={formData.gradient}
                        onChange={(e) => handleChange('gradient', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                      >
                        {gradients.map(g => (
                          <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Icône (emoji)
                      </label>
                      <input
                        type="text"
                        value={formData.icon}
                        onChange={(e) => handleChange('icon', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-neutral-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                        placeholder="🍃"
                        maxLength="2"
                      />
                    </div>
                  </div>

                  {/* Badge Nouveau */}
                  <div>
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

                  {/* Image */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Image (optionnel)
                    </label>
                    {formData.image_url ? (
                      <div className="relative inline-block">
                        <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-neutral-200">
                          <img
                            src={formData.image_url?.startsWith('http') ? formData.image_url : (formData.image_url ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${formData.image_url}` : '')}
                            alt="Aperçu"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleImageRemove}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all hover:scale-110"
                          title="Supprimer l'image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-neutral-300 rounded-lg p-2">
                        <ImageUploadNews
                          currentImage={formData.image_url}
                          onImageChange={handleImageUpload}
                          onImageRemove={handleImageRemove}
                        />
                      </div>
                    )}
                  </div>

                  {/* Boutons */}
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
              </div>
            )}

            {/* Liste des actualités */}
            {!isAdding && !editingId && (
              <div className="space-y-4">
                {news.length > 0 ? (
                  news.map((item) => (
                    <div
                      key={item.id}
                      className="group relative bg-white rounded-2xl border-2 border-neutral-200 hover:border-purple-300 p-6 hover:shadow-lg transition-all duration-300 overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500"></div>
                      
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-32 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100 flex-shrink-0">
                          {item.image_url ? (
                            <img
                              src={item.image_url?.startsWith('http') ? item.image_url : (item.image_url ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${item.image_url}` : '')}
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
                                {item.is_new && (
                                  <span className="text-xs font-semibold text-white bg-purple-600 uppercase tracking-wider px-2 py-1 rounded">
                                    Nouveau
                                  </span>
                                )}
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
                              onClick={() => handleDelete(item.id)}
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
                    </div>
                  ))
                ) : (
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
            )}
          </div>
        )}
        
        {/* Affichage public des actualités */}
        {(!isAdmin && !isManager) || !showEditor ? (
          <div className="space-y-8">
            {news.length > 0 ? (
              news.map((item, index) => (
                <div
                  key={item.id}
                  className="group relative overflow-hidden bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-700 border-2 border-neutral-200 hover:border-purple-400 transform hover:-translate-y-1"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Barre colorée en haut */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="flex flex-col md:flex-row">
                    {/* Image à gauche */}
                    <div className="relative w-full md:w-2/5 h-72 md:h-auto overflow-hidden bg-gradient-to-br from-purple-100 via-blue-100 to-purple-100">
                      {item.image_url ? (
                        <>
                          <img
                            src={item.image_url?.startsWith('http') ? item.image_url : (item.image_url ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${item.image_url}` : '')}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </>
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center text-7xl bg-gradient-to-br ${item.gradient || 'from-purple-200 via-blue-200 to-purple-200'} group-hover:scale-110 transition-transform duration-500`}>
                          {item.icon || '📰'}
                        </div>
                      )}
                      
                      {/* Badge Nouveau */}
                      {item.is_new && (
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border border-white/50">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Nouveau</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Contenu à droite */}
                    <div className="flex-1 p-8 md:p-10 flex flex-col justify-center bg-gradient-to-br from-white to-neutral-50/50">
                      {/* Date */}
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
                      
                      {/* Titre */}
                      <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-5 group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-blue-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-500 leading-tight">
                        {item.title}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-slate-600 leading-relaxed mb-0 text-base sm:text-lg">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Effet de brillance animé */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-100/30 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-1000 pointer-events-none"></div>
                  
                  {/* Lueur au survol */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10"></div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-neutral-300">
                <div className="text-6xl mb-4">📰</div>
                <p className="text-xl font-semibold text-slate-700 mb-2">Aucune actualité pour le moment</p>
                <p className="text-slate-500">Revenez bientôt pour découvrir nos nouveautés</p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default NewsSection;

