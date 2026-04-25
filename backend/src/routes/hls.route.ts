import { Router } from 'express';
import { optionalAuthenticate } from '../middleware/authenticate';
import { streamMasterPlaylist, streamVariantPlaylist } from '../controllers/hls.controller';

const router = Router();

// Optional auth: free lectures are accessible without login;
// paid lectures require authentication + enrollment (enforced in the controller).
router.use(optionalAuthenticate);

router.get('/:lectureId/master.m3u8', streamMasterPlaylist);
router.get('/:lectureId/:filename', streamVariantPlaylist);

export default router;
