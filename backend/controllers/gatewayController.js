import { gatewayService } from '../services/gatewayService.js';
import { serialPortScanner } from '../services/serialPortScanner.js';

export class GatewayController {
  async getSystemInfo(req, res) {
    try {
      const info = await gatewayService.getSystemInfo();
      res.json({ success: true, data: info });
    } catch (error) {
      console.error('[GatewayController] Erreur getSystemInfo:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de la récupération des informations système',
      });
    }
  }

  async getNetworkConfig(req, res) {
    try {
      const config = await gatewayService.getNetworkConfig();
      res.json({ success: true, data: config });
    } catch (error) {
      console.error('[GatewayController] Erreur getNetworkConfig:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de la récupération de la configuration réseau',
      });
    }
  }

  async getConfig(req, res) {
    try {
      const config = await gatewayService.getConfig();
      res.json({ success: true, data: config });
    } catch (error) {
      console.error('[GatewayController] Erreur getConfig:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de la récupération de la configuration',
      });
    }
  }

  async updateConfig(req, res) {
    try {
      const config = req.body;
      if (!config || typeof config !== 'object') {
        return res.status(400).json({ success: false, error: 'Configuration invalide' });
      }
      const result = await gatewayService.updateConfig(config);
      res.json({ success: true, message: result.message, data: result.config });
    } catch (error) {
      console.error('[GatewayController] Erreur updateConfig:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Erreur lors de la mise à jour de la configuration',
      });
    }
  }

  async connect(req, res) {
    try {
      const result = await gatewayService.connect();
      res.json({ success: true, message: result.message, data: gatewayService.getStatus() });
    } catch (error) {
      console.error('[GatewayController] Erreur connect:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de la connexion à la passerelle',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  async disconnect(req, res) {
    try {
      const result = await gatewayService.disconnect();
      res.json({ success: true, message: result.message });
    } catch (error) {
      console.error('[GatewayController] Erreur disconnect:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de la déconnexion',
      });
    }
  }

  async getStatus(req, res) {
    try {
      const status = gatewayService.getStatus();
      res.json({ success: true, data: status });
    } catch (error) {
      console.error('[GatewayController] Erreur getStatus:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de la récupération du statut',
      });
    }
  }

  async listSerialPorts(req, res) {
    try {
      const ports = await serialPortScanner.listPorts();
      res.json({ success: true, data: ports, count: ports.length });
    } catch (error) {
      console.error('[GatewayController] Erreur listSerialPorts:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de la liste des ports série',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        hint: 'Assurez-vous que serialport est installé: npm install serialport',
      });
    }
  }

  async detectGateway(req, res) {
    try {
      const detection = await serialPortScanner.detectGT01ZG();
      if (detection.error) {
        return res.status(500).json({
          success: false,
          error: detection.message,
          details: detection.details,
        });
      }
      res.json({ success: true, ...detection });
    } catch (error) {
      console.error('[GatewayController] Erreur detectGateway:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Erreur lors de la détection de la passerelle',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }
}

export const gatewayController = new GatewayController();

