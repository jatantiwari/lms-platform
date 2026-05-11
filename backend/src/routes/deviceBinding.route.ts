import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  registerDeviceBinding,
  getUserDevices,
  revokeDevice,
  confirmDeviceVerification,
} from '../controllers/deviceBinding.controller';

const router = Router();

// All device binding routes require authentication
router.use(authenticate);

/**
 * Register or validate device binding.
 * Call on every login after token is issued.
 */
router.post('/', registerDeviceBinding);

/**
 * List all registered devices for the current user.
 */
router.get('/', getUserDevices);

/**
 * Confirm device after phone OTP verification passes.
 */
router.post('/verify', confirmDeviceVerification);

/**
 * Revoke a specific device.
 */
router.delete('/:deviceBindingId', revokeDevice);

export default router;
