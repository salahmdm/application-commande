import express from 'express';
import { gatewayController } from '../controllers/gatewayController.js';

const router = express.Router();

router.get('/info', (req, res) => gatewayController.getSystemInfo(req, res));
router.get('/network', (req, res) => gatewayController.getNetworkConfig(req, res));
router.get('/config', (req, res) => gatewayController.getConfig(req, res));
router.put('/config', (req, res) => gatewayController.updateConfig(req, res));
router.post('/connect', (req, res) => gatewayController.connect(req, res));
router.post('/disconnect', (req, res) => gatewayController.disconnect(req, res));
router.get('/status', (req, res) => gatewayController.getStatus(req, res));
router.get('/ports', (req, res) => gatewayController.listSerialPorts(req, res));
router.post('/ports/detect', (req, res) => gatewayController.detectGateway(req, res));

export default router;

