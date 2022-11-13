import { Router } from 'express';
import { getDriveListAPI } from '../../controllers/v2/drive/api.js';
const router = Router();

router.get(`/all`, getDriveListAPI);

export default router;