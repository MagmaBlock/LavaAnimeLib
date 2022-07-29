import { Router } from 'express';
const router = Router();

import { userRegister } from '../controllers/user/userRegister.js';
import { userLogin } from '../controllers/user/userLogin.js';

router.post('/register', userRegister);
router.post('/login', userLogin);

export default router;