/**
 * Service pour scanner les ports série USB et détecter les périphériques connectés
 */

class SerialPortScanner {
  /**
   * Liste tous les ports série disponibles
   */
  async listPorts() {
    try {
      const serialportModule = await import('serialport');
      
      let ports;
      if (serialportModule.SerialPort && typeof serialportModule.SerialPort.list === 'function') {
        ports = await serialportModule.SerialPort.list();
      } else if (typeof serialportModule.list === 'function') {
        ports = await serialportModule.list();
      } else if (serialportModule.default && typeof serialportModule.default.list === 'function') {
        ports = await serialportModule.default.list();
      } else {
        throw new Error('Impossible de trouver la méthode list() dans serialport');
      }
      
      if (!ports || ports.length === 0) {
        console.log('[SerialPortScanner] Aucun port série détecté');
        return [];
      }

      return ports.map(port => ({
        path: port.path,
        manufacturer: port.manufacturer || 'Non spécifié',
        vendorId: port.vendorId || 'Non spécifié',
        productId: port.productId || 'Non spécifié',
        description: port.description || port.name || 'Port série',
        serialNumber: port.serialNumber || 'Non spécifié',
        pnpId: port.pnpId || 'Non spécifié',
      }));
    } catch (error) {
      console.error('[SerialPortScanner] Erreur:', error);
      throw new Error(`Impossible de lister les ports série: ${error.message}`);
    }
  }

  /**
   * Détecte automatiquement le port probable de la passerelle GT01-ZG
   */
  async detectGT01ZG() {
    try {
      const ports = await this.listPorts();
      
      if (ports.length === 0) {
        return {
          detected: false,
          ports: [],
          message: 'Aucun port série détecté. Assurez-vous que la passerelle GT01-ZG est connectée en USB.',
        };
      }
      
      const gt01Ports = ports.filter(port => {
        const manufacturer = (port.manufacturer || '').toLowerCase();
        const description = (port.description || '').toLowerCase();
        const vendorId = (port.vendorId || '').toLowerCase();
        const productId = (port.productId || '').toLowerCase();
        
        return (
          manufacturer.includes('geniatech') ||
          manufacturer.includes('gt01') ||
          description.includes('gt01') ||
          description.includes('zigbee') ||
          description.includes('gateway') ||
          vendorId.includes('gt01') ||
          productId.includes('gt01')
        );
      });

      if (gt01Ports.length > 0) {
        return {
          detected: true,
          port: gt01Ports[0],
          confidence: 'high',
          message: `Passerelle GT01-ZG détectée sur ${gt01Ports[0].path}`,
        };
      }

      if (ports.length === 1) {
        return {
          detected: true,
          port: ports[0],
          confidence: 'medium',
          message: `Un seul port détecté: ${ports[0].path}. Probablement la passerelle GT01-ZG.`,
        };
      }

      return {
        detected: false,
        ports: ports,
        message: `${ports.length} port(s) détecté(s). Sélection manuelle nécessaire.`,
      };
    } catch (error) {
      console.error('[SerialPortScanner] Erreur lors de la détection:', error);
      return {
        detected: false,
        error: true,
        message: `Erreur lors de la détection: ${error.message}`,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    }
  }
}

export const serialPortScanner = new SerialPortScanner();

