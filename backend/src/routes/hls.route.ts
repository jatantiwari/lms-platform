import { Router } from 'express';
import { strictOptionalAuthenticate } from '../middleware/authenticate';
import { streamMasterPlaylist, streamVariantPlaylist } from '../controllers/hls.controller';

const router = Router();

// Strict-optional auth: no token → free lectures still accessible;
// present-but-expired token → 401 so clients can refresh and retry;
// valid token → enrollment/ownership checked in the controller.
router.use(strictOptionalAuthenticate);

router.get('/:lectureId/master.m3u8', streamMasterPlaylist);
router.get('/:lectureId/:filename', streamVariantPlaylist);

export default router;
