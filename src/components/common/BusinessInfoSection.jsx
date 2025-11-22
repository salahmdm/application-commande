import React from 'react';
import { Clock } from 'lucide-react';
import Card from './Card';
import ContactInfoEditor from '../admin/ContactInfoEditor';

const BusinessInfoSection = ({
  businessInfo,
  onUpdate = () => {},
  isLoading = false,
  title = 'Horaires & Contact',
  subtitle = 'Retrouvez toutes nos informations pratiques'
}) => {
  if (isLoading && !businessInfo) {
    return (
      <section className="section-container">
        <Card padding="lg" className="text-center">
          <div className="flex flex-col items-center gap-3">
            <Clock className="w-10 h-10 animate-spin text-blue-600" />
            <p className="text-neutral-600 font-sans">Chargement des informations...</p>
          </div>
        </Card>
      </section>
    );
  }

  if (!businessInfo) {
    return null;
  }

  return (
    <section className="section-container">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full mb-4 animate-fade-in">
          <Clock className="w-5 h-5 text-blue-600 animate-pulse" />
          <span className="text-sm font-bold text-blue-900 uppercase tracking-wider">
            Informations
          </span>
        </div>
        <h2 className="section-title text-5xl font-black bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">
          {title}
        </h2>
        {subtitle && (
          <p className="page-subtitle text-lg mt-4">
            {subtitle}
          </p>
        )}
      </div>

      <ContactInfoEditor
        businessInfo={businessInfo}
        onUpdate={onUpdate}
      />
    </section>
  );
};

export default BusinessInfoSection;

