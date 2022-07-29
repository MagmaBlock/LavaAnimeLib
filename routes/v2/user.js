import { Router } from 'express';
const router = Router();

import { userRegister } from '../../controllers/v2/user/userRegister.js';
import { userLogin } from '../../controllers/v2/user/userLogin.js';

router.post('/register', userRegister);
router.post('/login', userLogin);

export default router;