import { Router } from 'express';
import {
  getUserProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
  listUsers,
  toggleUserActive,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { uploadImage } from '../middleware/upload';
import { validate } from '../middleware/validate';
import { updateProfileSchema } from '../validations/auth.validation';

const router = Router();

// Public
router.get('/:id/profile', getUserProfile);

// Authenticated
router.use(authenticate);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.put('/avatar', uploadImage.single('avatar'), uploadAvatar);
router.put('/change-password', changePassword);

// Admin only
router.get('/', authorize('ADMIN'), listUsers);
router.patch('/:id/toggle-active', authorize('ADMIN'), toggleUserActive);

export default router;
