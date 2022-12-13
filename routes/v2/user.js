import { Router } from 'express';
const router = Router();

import { userRegisterAPI } from '../../controllers/v2/user/userRegister.js';
import { userLoginAPI } from '../../controllers/v2/user/userLogin.js';
import { userLogoutAPI } from '../../controllers/v2/user/userLogout.js';

router.post('/register', userRegisterAPI);
router.post('/login', userLoginAPI);
router.post('/logout', userLogoutAPI);

export default router;