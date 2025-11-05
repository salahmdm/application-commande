import React, { useEffect } from 'react';
import ErrorBoundary from './components/common/ErrorBoundary';
import BackendCheck from './components/common/BackendCheck';
import { NotificationContainer } from './components/common/Notification';
import MainLayout from './components/layout/MainLayout';
import AuthView from './views/auth/AuthView';
import useAuth from './hooks/useAuth';
import useNotifications from './hooks/useNotifications';
import useUIStore from './store/uiStore';

// Client views
import HomeView from './views/client/HomeView';
import ProductsView from './views/client/ProductsView';
import MyOrders from './views/client/MyOrders';
import ProfileView from './views/client/ProfileView';

// Manager views
import ManagerDashboard from './views/manager/ManagerDashboard';
import ManagerPOS from './views/manager/ManagerPOS';

// Admin views
import AdminProducts from './views/admin/AdminProducts';
import AdminOrders from './views/admin/AdminOrders';
import AdminInventory from './views/admin/AdminInventory';
import AdminSettings from './views/admin/AdminSettings';
// RestaurantSettings retiré (doublon). Utiliser l'éditeur sur la page d'accueil.
import AdminAppearance from './views/admin/AdminAppearance';
import DashboardCA from './views/dashboard/DashboardCA';
import GatewayManager from './views/gateway/GatewayManager';

function App() {
  const { user, isAuthenticated } = useAuth();
  const { notifications, dismiss } = useNotifications();
  const currentView = useUIStore((state) => state.currentView);
  const setCurrentView = useUIStore((state) => state.setCurrentView);
  
  // Synchroniser la vue par défaut au chargement
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentView('home');
    }
  }, [isAuthenticated, setCurrentView]);

  // Routes par rôle
  const getRoutes = () => {
    if (!isAuthenticated) {
      return { home: AuthView };
    }

    switch (user?.role) {
      case 'admin':
        return {
          home: HomeView,
          'admin-dashboard': DashboardCA,
          'admin-products': AdminProducts,
          'admin-orders': AdminOrders,
          'admin-inventory': AdminInventory,
          'admin-settings': AdminSettings,
          'admin-appearance': AdminAppearance,
          'gateway-manager': GatewayManager,
          'manager-pos': ManagerPOS,
          'manager-orders': ManagerDashboard,
          'manager-stats': DashboardCA,
        };
      case 'manager':
        return {
          home: HomeView,
          'manager-pos': ManagerPOS,
          'manager-orders': ManagerDashboard,
          'manager-stats': DashboardCA,
          'admin-products': AdminProducts,
          'admin-inventory': AdminInventory,
        };
      case 'client':
      default:
        return {
          home: HomeView,
          products: ProductsView,
          orders: MyOrders,
          profile: ProfileView,
        };
    }
  };

  const routes = getRoutes();
  const CurrentComponent = routes[currentView] || routes.home;

  return (
    <ErrorBoundary>
      <BackendCheck>
        <NotificationContainer notifications={notifications} onDismiss={dismiss} />
        {isAuthenticated ? (
          <MainLayout>
            <CurrentComponent />
          </MainLayout>
        ) : (
          <CurrentComponent />
        )}
      </BackendCheck>
    </ErrorBoundary>
  );
}

export default App;

