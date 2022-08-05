import { Router } from 'express';
import { getAnimeByID } from '../../controllers/v2/anime/get.js';
const router = Router();

router.get(`/get`, getAnimeByID);

export default router;