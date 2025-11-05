import React, { useState, useEffect } from 'react';
import { Edit, Save, X, Clock, MapPin, Phone, Building, Mail } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import Input from '../common/Input';
import Modal from '../common/Modal';
import useAuth from '../../hooks/useAuth';

/**
 * Composant d'édition des informations de contact et horaires
 */
const ContactInfoEditor = ({ businessInfo, onUpdate }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slogan: '',
    address: '',
    phone: '',
    email: '',
    hours: {
      monday: { open: '08:00', close: '22:00', closed: false },
      tuesday: { open: '08:00', close: '22:00', closed: false },
      wednesday: { open: '08:00', close: '22:00', closed: false },
      thursday: { open: '08:00', close: '22:00', closed: false },
      friday: { open: '08:00', close: '23:00', closed: false },
      saturday: { open: '09:00', close: '23:00', closed: false },
      sunday: { open: '09:00', close: '21:00', closed: false }
    }
  });
  const [errors, setErrors] = useState({});

  const timeOptions = (() => {
    const out = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
    return out;
  })();

  function normalizeHours(hours) {
    const fallback = { open: '08:00', close: '22:00', closed: false };
    const src = hours || {};
    const out = {};
    for (const d of daysOfWeek) {
      const v = src[d.key];
      if (!v) { out[d.key] = { ...fallback }; continue; }
      if (typeof v === 'string') {
        out[d.key] = { ...fallback };
      } else {
        out[d.key] = {
          open: v.open || fallback.open,
          close: v.close || fallback.close,
          closed: !!v.closed
        };
      }
    }
    return out;
  }

  useEffect(() => {
    if (businessInfo) {
      setFormData(prev => ({
        ...prev,
        name: businessInfo.name || '',
        slogan: businessInfo.slogan || '',
        address: businessInfo.address || '',
        phone: businessInfo.phone || '',
        email: businessInfo.email || '',
        hours: normalizeHours(businessInfo.hours)
      }));
    }
  }, [businessInfo]);

  const handleInputChange = (field, value) => {
    if (field.startsWith('hours.')) {
      const day = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        hours: {
          ...prev.hours,
          [day]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Email invalide';
    }
    const phone = (formData.phone || '').replace(/\s/g, '');
    if (phone && !/^(\+33|0)[1-9](\d{2}){4}$/.test(phone)) {
      nextErrors.phone = 'Téléphone invalide (format FR)';
    }
    for (const d of daysOfWeek) {
      const h = formData.hours[d.key];
      if (!h?.closed) {
        if (h?.open && h?.close && h.close <= h.open) {
          nextErrors[`hours.${d.key}`] = `Fermeture après ouverture requise pour ${d.label}`;
          break;
        }
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onUpdate(formData);
    setIsEditing(false);
    setShowModal(false);
  };

  const handleCancel = () => {
    if (businessInfo) {
      setFormData({
        name: businessInfo.name || '',
        slogan: businessInfo.slogan || '',
        address: businessInfo.address || '',
        phone: businessInfo.phone || '',
        hours: businessInfo.hours || {}
      });
    }
    setIsEditing(false);
    setShowModal(false);
  };

  const daysOfWeek = [
    { key: 'monday', label: 'Lundi', icon: '📅' },
    { key: 'tuesday', label: 'Mardi', icon: '📅' },
    { key: 'wednesday', label: 'Mercredi', icon: '📅' },
    { key: 'thursday', label: 'Jeudi', icon: '📅' },
    { key: 'friday', label: 'Vendredi', icon: '📅' },
    { key: 'saturday', label: 'Samedi', icon: '📅' },
    { key: 'sunday', label: 'Dimanche', icon: '📅' }
  ];

  return (
    <div className="relative">
      {/* Bouton d'édition pour les admins */}
      {user?.role === 'admin' && (
        <div className="absolute -top-3 -right-3 z-20">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowModal(true)}
            className="shadow-lg"
            icon={<Edit className="w-4 h-4" />}
          >
            Modifier
          </Button>
        </div>
      )}

      {/* Affichage des informations dans le style original */}
      <Card padding="xl" variant="glass" hover={true} className="animate-fade-in-up backdrop-blur-2xl bg-white/90 border border-white/50 shadow-2xl overflow-hidden relative">
        {/* Fond décoratif */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-cyan-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl from-emerald-200/20 to-blue-200/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 grid md:grid-cols-2 gap-12">
          {/* Horaires */}
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-xl">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Nos Horaires
              </span>
            </h3>
            
            <div className="space-y-3">
              {daysOfWeek.map((day, index) => {
                const isToday = new Date().getDay() === index + 1; // +1 car getDay() commence à 0 (dimanche)
                const h = businessInfo?.hours?.[day.key];
                const label = h && typeof h === 'object'
                  ? (h.closed ? 'Fermé' : `${h.open || '08:00'} - ${h.close || '22:00'}`)
                  : (businessInfo?.hours?.[day.key] || 'Fermé');
                return (
                  <div 
                    key={day.key} 
                    className={`group flex justify-between items-center py-4 px-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                      isToday 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/30' 
                        : 'bg-gradient-to-r from-slate-50 to-blue-50 hover:from-blue-100 hover:to-cyan-100 border border-slate-200/50'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <span className={`font-bold flex items-center gap-3 ${isToday ? 'text-white' : 'text-slate-700'}`}>
                      {isToday && (
                        <span className="w-3 h-3 bg-white rounded-full animate-pulse shadow-lg"></span>
                      )}
                      {day.label}
                    </span>
                    <span className={`font-black text-lg ${isToday ? 'text-white' : 'text-slate-900'}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Informations de contact */}
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Nous Contacter
              </span>
            </h3>
            
            <div className="space-y-6">
              {/* Adresse */}
              <div className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                <div className="relative flex items-start gap-4 p-6 bg-gradient-to-r from-slate-50 to-emerald-50 rounded-2xl border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-600 mb-1">Notre Adresse</p>
                    <p className="text-slate-700 font-medium leading-relaxed">{businessInfo?.address || 'Non définie'}</p>
                  </div>
                </div>
              </div>
              
              {/* Téléphone */}
              <div className="group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                <div className="relative flex items-center gap-4 p-6 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-600 mb-1">Téléphone</p>
                    <p className="text-slate-700 font-bold text-xl">{businessInfo?.phone || 'Non défini'}</p>
                  </div>
                </div>
              </div>

              {/* Carte visuelle décorative */}
              <div className="relative h-48 rounded-2xl bg-gradient-to-br from-slate-200 to-blue-200 overflow-hidden shadow-xl group hover:shadow-2xl transition-all duration-500">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-6xl opacity-20">🗺️</div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(businessInfo?.address || '')}`, '_blank')}
                    className="w-full group-hover:scale-105 transition-transform duration-300"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Voir sur la carte
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal d'édition */}
      <Modal isOpen={showModal} onClose={handleCancel} title="Modifier les informations">
        <div className="space-y-6">
          {/* Informations générales */}
          <div>
            <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5" />
              Informations Générales
            </h4>
            <div className="space-y-4">
              <Input
                label="Nom du café"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nom de votre café"
                icon={<Building className="w-5 h-5 text-slate-400" />}
              />
              
              <Input
                label="Slogan"
                value={formData.slogan}
                onChange={(e) => handleInputChange('slogan', e.target.value)}
                placeholder="Votre slogan"
                textarea
              />
            </div>
          </div>

          {/* Horaires structurés */}
          <div>
            <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Horaires d&apos;Ouverture
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {daysOfWeek.map((day) => {
                const h = formData.hours[day.key] || { open: '08:00', close: '22:00', closed: false };
                return (
                  <div key={day.key} className="p-4 rounded-xl border-2 border-neutral-200 bg-neutral-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-black">{day.label}</span>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={!!h.closed}
                          onChange={(e) => handleInputChange(`hours.${day.key}`, { ...h, closed: e.target.checked })}
                        />
                        <span className="text-neutral-700">Fermé</span>
                      </label>
                    </div>
                    {!h.closed && (
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={h.open}
                          onChange={(e) => handleInputChange(`hours.${day.key}`, { ...h, open: e.target.value })}
                          className="px-3 py-2 rounded border-2 border-neutral-200 bg-white text-black"
                        >
                          {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select
                          value={h.close}
                          onChange={(e) => handleInputChange(`hours.${day.key}`, { ...h, close: e.target.value })}
                          className="px-3 py-2 rounded border-2 border-neutral-200 bg-white text-black"
                        >
                          {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    )}
                    {errors[`hours.${day.key}`] && (
                      <p className="text-red-600 text-xs mt-2">{errors[`hours.${day.key}`]}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Informations de Contact
            </h4>
            <div className="space-y-4">
              <Input
                label="Adresse"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Votre adresse complète"
                icon={<MapPin className="w-5 h-5 text-slate-400" />}
              />
              
              <Input
                label="Téléphone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Votre numéro de téléphone"
                icon={<Phone className="w-5 h-5 text-slate-400" />}
              />
              
              <Input
                label="Email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Votre adresse email"
                icon={<Mail className="w-5 h-5 text-slate-400" />}
              />
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={handleCancel} icon={<X className="w-4 h-4" />}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSave} icon={<Save className="w-4 h-4" />}>
              Sauvegarder
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ContactInfoEditor;
