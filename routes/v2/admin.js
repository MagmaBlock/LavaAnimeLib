import { Router } from 'express';
import { allVaildCodes } from '../../controllers/v2/admin/invite/allValidCodes.js';
import { adminRequire } from '../../controllers/v2/globalAuth/auth.js';
const router = Router();

router.get('/invite/all-valid-codes', [adminRequire, allVaildCodes])

export default router;