import { Router } from 'express';
import { addAnimeViewAPI, getAnimeByIDAPI, getAnimesByIDAPI, getAnimeViewAPI, getFilesByIDAPI } from '../../controllers/v2/anime/api.js';
const router = Router();

router.get(`/get`, getAnimeByIDAPI);
router.post(`/get`, getAnimesByIDAPI);
router.get('/file', getFilesByIDAPI);
router.get('/view/get', getAnimeViewAPI);
router.post('/view/add', addAnimeViewAPI);

export default router;