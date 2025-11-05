import { useCallback } from 'react';
import useUIStore from '../store/uiStore';

/**
 * Hook personnalisé pour les notifications
 */
const useNotifications = () => {
  const { notifications, addNotification, removeNotification, clearNotifications } = useUIStore();
  
  const success = useCallback((message, title = 'Succès') => {
    return addNotification({
      type: 'success',
      title,
      message
    });
  }, [addNotification]);
  
  const error = useCallback((message, title = 'Erreur') => {
    return addNotification({
      type: 'error',
      title,
      message
    });
  }, [addNotification]);
  
  const warning = useCallback((message, title = 'Attention') => {
    return addNotification({
      type: 'warning',
      title,
      message
    });
  }, [addNotification]);
  
  const info = useCallback((message, title = 'Information') => {
    return addNotification({
      type: 'info',
      title,
      message
    });
  }, [addNotification]);
  
  const dismiss = useCallback((id) => {
    removeNotification(id);
  }, [removeNotification]);
  
  const dismissAll = useCallback(() => {
    clearNotifications();
  }, [clearNotifications]);
  
  return {
    notifications,
    success,
    error,
    warning,
    info,
    dismiss,
    dismissAll
  };
};

export default useNotifications;

