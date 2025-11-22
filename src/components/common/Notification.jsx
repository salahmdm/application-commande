// Import React non nécessaire avec JSX transform automatique
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * Composant Notification (Toast)
 */
const Notification = ({ notification, onDismiss }) => {
  const { id, type = 'info', title, message } = notification;
  
  const icons = {
    success: <CheckCircle className="w-6 h-6" />,
    error: <AlertCircle className="w-6 h-6" />,
    warning: <AlertTriangle className="w-6 h-6" />,
    info: <Info className="w-6 h-6" />
  };
  
  const colors = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-sky-50 border-sky-200 text-sky-800'
  };
  
  return (
    <div 
      className={`
        flex items-start gap-3 p-4 rounded-xl border shadow-lg
        ${colors[type]}
        animate-slide-in-right
      `}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">
        {icons[type]}
      </div>
      
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-semibold text-sm mb-1">{title}</h4>
        )}
        {message && (
          <p className="text-sm opacity-90">{message}</p>
        )}
      </div>
      
      <button
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 p-1 rounded-full hover:bg-white/50 transition"
        aria-label="Fermer la notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

/**
 * Conteneur de notifications
 */
export const NotificationContainer = ({ notifications, onDismiss }) => {
  if (!notifications || notifications.length === 0) return null;
  
  return (
    <div 
      className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full"
      aria-live="polite"
      aria-atomic="true"
    >
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};

export default Notification;

