import React, { useState, useEffect, useRef } from 'react';
import { Settings, Wifi, Activity, Database, RefreshCw, Save, AlertCircle, Search, Usb } from 'lucide-react';
import { gatewayService } from '../../services/gatewayService';
import { io } from 'socket.io-client';

const GATEWAY_WS_URL = import.meta.env.VITE_GATEWAY_WS_URL || 'http://localhost:3001';

export default function GatewayManager() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);
  
  const [gatewayData, setGatewayData] = useState({
    serialNumber: 'GT01-ZG',
    firmwareVersion: '2.4.1',
    ipAddress: '192.168.1.100',
    subnetMask: '255.255.255.0',
    gateway: '192.168.1.1',
    macAddress: 'A4:CF:12:34:56:78',
    status: 'Hors ligne',
    uptime: '0j 0h 0m',
    temperature: 'N/A',
    memoryUsage: 0,
    cpuUsage: 0
  });

  const [configData, setConfigData] = useState({
    deviceName: 'Passerelle-GT01',
    pollInterval: 5000,
    protocol: 'Modbus TCP',
    port: 502,
    timeout: 3000,
    retries: 3,
    dataLogging: true,
    autoReconnect: true
  });

  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [serialPorts, setSerialPorts] = useState([]);
  const [scanningPorts, setScanningPorts] = useState(false);
  const [selectedPort, setSelectedPort] = useState('');
  const [detectedGateway, setDetectedGateway] = useState(null);

  useEffect(() => {
    const newSocket = io(GATEWAY_WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('[WebSocket] Connecté');
    });

    newSocket.on('gateway-status', (status) => {
      console.log('[WebSocket] Statut reçu:', status);
      setConnected(status.connected || false);
    });

    newSocket.on('gateway-data', (data) => {
      console.log('[WebSocket] Données reçues:', data);
      setGatewayData(prev => ({ ...prev, ...data }));
    });

    newSocket.on('disconnect', () => {
      console.log('[WebSocket] Déconnecté');
    });

    newSocket.on('error', (error) => {
      console.error('[WebSocket] Erreur:', error);
    });

    socketRef.current = newSocket;

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    checkStatus();
  }, []);

  useEffect(() => {
    scanSerialPorts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scanSerialPorts = async () => {
    setScanningPorts(true);
    try {
      const response = await gatewayService.listSerialPorts();
      if (response.success) {
        setSerialPorts(response.data || []);
        const count = response.count || response.data?.length || 0;
        console.log(`[GatewayManager] ${count} port(s) série détecté(s)`);
        
        if (count === 0) {
          showNotification('Aucun port USB détecté. Assurez-vous que la passerelle est connectée.', 'info');
        } else {
          showNotification(`${count} port(s) USB détecté(s)`, 'success');
        }
      } else {
        const errorMsg = response.error || response.message || 'Erreur lors du scan des ports USB';
        showNotification(errorMsg, 'error');
        console.error('[GatewayManager] Erreur API:', response);
      }
    } catch (error) {
      console.error('[GatewayManager] Erreur lors du scan des ports:', error);
      let errorMsg = error.message || 'Erreur lors du scan des ports USB';
      
      if (error.message && error.message.includes('429')) {
        errorMsg = 'Trop de requêtes. Attendez quelques secondes et réessayez.';
      } else if (error.message && error.message.includes('fetch')) {
        errorMsg = 'Impossible de contacter le backend. Vérifiez que le serveur est démarré sur le port 3001.';
      } else if (error.message && error.message.includes('Failed to fetch')) {
        errorMsg = 'Connexion au backend échouée. Vérifiez que le backend est démarré.';
      }
      
      showNotification(errorMsg, 'error');
    } finally {
      setScanningPorts(false);
    }
  };

  const detectGatewayPort = async () => {
    setScanningPorts(true);
    try {
      const response = await gatewayService.detectGateway();
      if (response.success) {
        if (response.detected && response.port) {
          setDetectedGateway(response);
          setSelectedPort(response.port.path);
          showNotification(
            `Passerelle GT01-ZG détectée sur ${response.port.path} (${response.confidence === 'high' ? 'Haute' : 'Moyenne'} confiance)`,
            'success'
          );
        } else if (response.error) {
          showNotification(response.message || 'Erreur lors de la détection', 'error');
        } else {
          showNotification(
            response.message || 'Plusieurs ports détectés. Sélectionnez manuellement.',
            'info'
          );
          await scanSerialPorts();
        }
      } else {
        const errorMsg = response.error || response.message || 'Erreur lors de la détection de la passerelle';
        showNotification(errorMsg, 'error');
        if (response.details) {
          console.error('[GatewayManager] Détails de l\'erreur:', response.details);
        }
      }
    } catch (error) {
      console.error('[GatewayManager] Erreur lors de la détection:', error);
      const errorMsg = error.message || 'Erreur lors de la détection de la passerelle. Vérifiez que le backend est démarré.';
      showNotification(errorMsg, 'error');
    } finally {
      setScanningPorts(false);
    }
  };

  const checkStatus = async () => {
    try {
      const response = await gatewayService.getStatus();
      if (response.success) {
        setConnected(response.data.connected || false);
      }
    } catch (error) {
      console.error('[GatewayManager] Erreur lors de la vérification du statut:', error);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await gatewayService.connect();
      if (response.success) {
        setConnected(true);
        showNotification('Connexion établie avec succès', 'success');
        await loadGatewayData();
      } else {
        throw new Error(response.error || 'Erreur de connexion');
      }
    } catch (error) {
      console.error('[GatewayManager] Erreur de connexion:', error);
      showNotification(
        error.message || 'Impossible de se connecter à la passerelle',
        'error'
      );
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const response = await gatewayService.disconnect();
      if (response.success) {
        setConnected(false);
        showNotification('Déconnecté de la passerelle', 'info');
      } else {
        throw new Error(response.error || 'Erreur de déconnexion');
      }
    } catch (error) {
      console.error('[GatewayManager] Erreur de déconnexion:', error);
      showNotification(
        error.message || 'Erreur lors de la déconnexion',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadGatewayData = async () => {
    try {
      const infoResponse = await gatewayService.getSystemInfo();
      if (infoResponse.success) {
        setGatewayData(prev => ({ ...prev, ...infoResponse.data }));
      }

      const networkResponse = await gatewayService.getNetworkConfig();
      if (networkResponse.success) {
        setGatewayData(prev => ({
          ...prev,
          ipAddress: networkResponse.data.ipAddress || prev.ipAddress,
          subnetMask: networkResponse.data.subnetMask || prev.subnetMask,
          gateway: networkResponse.data.gateway || prev.gateway,
        }));
      }

      const configResponse = await gatewayService.getConfig();
      if (configResponse.success) {
        setConfigData(prev => ({ ...prev, ...configResponse.data }));
      }
    } catch (error) {
      console.error('[GatewayManager] Erreur lors du chargement des données:', error);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await loadGatewayData();
      showNotification('Données actualisées', 'success');
    } catch (error) {
      console.error('[GatewayManager] Erreur lors de l\'actualisation:', error);
      showNotification('Erreur lors de l\'actualisation des données', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      const response = await gatewayService.updateConfig(configData);
      if (response.success) {
        showNotification('Configuration enregistrée avec succès', 'success');
      } else {
        throw new Error(response.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('[GatewayManager] Erreur lors de la sauvegarde:', error);
      showNotification(
        error.message || 'Erreur lors de l\'enregistrement de la configuration',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (field, value) => {
    setConfigData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-800 rounded-lg shadow-xl p-6 mb-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Gestionnaire de Passerelle</h1>
              <p className="text-slate-400">N° de série: {gatewayData.serialNumber}</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={scanSerialPorts}
                disabled={scanningPorts}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                title="Scanner les ports USB"
              >
                <Search className={`w-4 h-4 ${scanningPorts ? 'animate-spin' : ''}`} />
                Scanner USB
              </button>
              <button
                onClick={detectGatewayPort}
                disabled={scanningPorts}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                title="Détecter automatiquement GT01-ZG"
              >
                <Usb className={`w-4 h-4 ${scanningPorts ? 'animate-pulse' : ''}`} />
                Détecter
              </button>
              {connected ? (
                <>
                  <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Actualiser
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    Déconnecter
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Wifi className="w-4 h-4" />
                  {loading ? 'Connexion...' : 'Connecter'}
                </button>
              )}
            </div>
          </div>
        </div>

        {notification.show && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            notification.type === 'success' ? 'bg-green-900 text-green-200' :
            notification.type === 'error' ? 'bg-red-900 text-red-200' :
            'bg-blue-900 text-blue-200'
          }`}>
            <AlertCircle className="w-5 h-5" />
            {notification.message}
          </div>
        )}

        <div className="bg-slate-800 rounded-lg shadow-xl p-6 mb-6 border border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <Usb className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Ports USB Disponibles</h2>
            <button
              onClick={scanSerialPorts}
              disabled={scanningPorts}
              className="ml-auto px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {scanningPorts ? 'Scan en cours...' : 'Actualiser'}
            </button>
          </div>

          {serialPorts.length > 0 ? (
            <div className="space-y-2">
              {serialPorts.map((port, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedPort === port.path
                      ? 'border-green-500 bg-green-900/20'
                      : detectedGateway?.port?.path === port.path
                      ? 'border-purple-500 bg-purple-900/20'
                      : 'border-slate-600 bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-white text-lg">{port.path}</span>
                        {selectedPort === port.path && (
                          <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">Sélectionné</span>
                        )}
                        {detectedGateway?.port?.path === port.path && (
                          <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded">
                            GT01-ZG Détecté ({detectedGateway.confidence === 'high' ? 'Haute' : 'Moyenne'} confiance)
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-slate-400">Fabricant:</span>
                          <span className="text-white ml-2">{port.manufacturer}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Description:</span>
                          <span className="text-white ml-2">{port.description}</span>
                        </div>
                        {port.vendorId !== 'Non spécifié' && (
                          <div>
                            <span className="text-slate-400">Vendor ID:</span>
                            <span className="text-white ml-2">{port.vendorId}</span>
                          </div>
                        )}
                        {port.productId !== 'Non spécifié' && (
                          <div>
                            <span className="text-slate-400">Product ID:</span>
                            <span className="text-white ml-2">{port.productId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPort(port.path)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        selectedPort === port.path
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-600 text-white hover:bg-slate-500'
                      }`}
                    >
                      {selectedPort === port.path ? 'Sélectionné' : 'Sélectionner'}
                    </button>
                  </div>
                </div>
              ))}
              
              {selectedPort && (
                <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
                  <p className="text-blue-200">
                    <strong>Port sélectionné:</strong> {selectedPort}
                  </p>
                  <p className="text-blue-300 text-sm mt-1">
                    Configurez ce port dans backend/.env : MODBUS_SERIAL_PORT=&quot;{selectedPort}&quot;
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Usb className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Aucun port USB détecté</p>
              <p className="text-slate-500 text-sm mt-2">
                Assurez-vous que la passerelle GT01-ZG est connectée en USB
              </p>
            </div>
          )}
        </div>

        {connected && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">Informations Système</h2>
              </div>
              <div className="space-y-3">
                <InfoRow label="Statut" value={gatewayData.status} badge="success" />
                <InfoRow label="Version Firmware" value={gatewayData.firmwareVersion} />
                <InfoRow label="Temps de fonctionnement" value={gatewayData.uptime} />
                <InfoRow label="Température" value={gatewayData.temperature} />
                <InfoRow label="Adresse MAC" value={gatewayData.macAddress} />
              </div>
              <div className="mt-6">
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Utilisation CPU</span>
                    <span className="text-white font-semibold">{gatewayData.cpuUsage}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${gatewayData.cpuUsage}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Utilisation Mémoire</span>
                    <span className="text-white font-semibold">{gatewayData.memoryUsage}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${gatewayData.memoryUsage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700">
              <div className="flex items-center gap-2 mb-4">
                <Wifi className="w-5 h-5 text-green-400" />
                <h2 className="text-xl font-semibold text-white">Configuration Réseau</h2>
              </div>
              <div className="space-y-3">
                <InfoRow label="Adresse IP" value={gatewayData.ipAddress} />
                <InfoRow label="Masque de sous-réseau" value={gatewayData.subnetMask} />
                <InfoRow label="Passerelle" value={gatewayData.gateway} />
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-700 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-orange-400" />
                <h2 className="text-xl font-semibold text-white">Configuration</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Nom de l&apos;appareil</label>
                  <input
                    type="text"
                    value={configData.deviceName}
                    onChange={(e) => handleConfigChange('deviceName', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Intervalle de polling (ms)</label>
                  <input
                    type="number"
                    value={configData.pollInterval}
                    onChange={(e) => handleConfigChange('pollInterval', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Protocole</label>
                  <select
                    value={configData.protocol}
                    onChange={(e) => handleConfigChange('protocol', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                  >
                    <option>Modbus TCP</option>
                    <option>Modbus RTU</option>
                    <option>MQTT</option>
                    <option>OPC UA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Port</label>
                  <input
                    type="number"
                    value={configData.port}
                    onChange={(e) => handleConfigChange('port', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Timeout (ms)</label>
                  <input
                    type="number"
                    value={configData.timeout}
                    onChange={(e) => handleConfigChange('timeout', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Tentatives de reconnexion</label>
                  <input
                    type="number"
                    value={configData.retries}
                    onChange={(e) => handleConfigChange('retries', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="flex gap-4 mt-4">
                <label className="flex items-center gap-2 text-slate-300">
                  <input
                    type="checkbox"
                    checked={configData.dataLogging}
                    onChange={(e) => handleConfigChange('dataLogging', e.target.checked)}
                    className="w-4 h-4"
                  />
                  Journalisation des données
                </label>
                <label className="flex items-center gap-2 text-slate-300">
                  <input
                    type="checkbox"
                    checked={configData.autoReconnect}
                    onChange={(e) => handleConfigChange('autoReconnect', e.target.checked)}
                    className="w-4 h-4"
                  />
                  Reconnexion automatique
                </label>
              </div>
              <button
                onClick={handleSaveConfig}
                disabled={loading}
                className="mt-6 flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Enregistrer la configuration
              </button>
            </div>
          </div>
        )}

        {!connected && (
          <div className="bg-slate-800 rounded-lg shadow-xl p-12 border border-slate-700 text-center">
            <Database className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl text-slate-400 mb-2">Aucune connexion active</h3>
            <p className="text-slate-500 mb-4">Sélectionnez un port USB ci-dessus, puis cliquez sur &quot;Connecter&quot;</p>
            {selectedPort && (
              <p className="text-green-400 text-sm">Port sélectionné: {selectedPort}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, badge }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-700">
      <span className="text-slate-400">{label}</span>
      {badge ? (
        <span className="px-3 py-1 bg-green-900 text-green-200 rounded-full text-sm font-semibold">
          {value}
        </span>
      ) : (
        <span className="text-white font-semibold">{value}</span>
      )}
    </div>
  );
}

