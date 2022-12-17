import { Router } from 'express';
const router = Router();

import { userRegisterAPI } from '../../controllers/v2/user/userRegister.js';
import { userLoginAPI } from '../../controllers/v2/user/userLogin.js';
import { userLogoutAPI } from '../../controllers/v2/user/userLogout.js';
import { updateUserPermissionAPI } from '../../controllers/v2/user/editUser.js';
import { getUserInfoAPI } from '../../controllers/v2/user/userInfo.js';
import { userInviteCodeGetAPI, userInviteCodeNewAPI } from '../../controllers/v2/user/inviteCode/userInviteCode.js';

router.post('/register', userRegisterAPI);
router.post('/login', userLoginAPI);
router.post('/logout', userLogoutAPI);
router.get('/info', getUserInfoAPI)
router.post('/update/permission', updateUserPermissionAPI)
router.get('/invite/get', userInviteCodeGetAPI)
router.post('/invite/new', userInviteCodeNewAPI)

export default router;