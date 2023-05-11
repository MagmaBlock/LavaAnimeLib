import { Router } from "express";
const router = Router();

import { userRegisterAPI } from "../../controllers/v2/user/userRegister.js";
import { userLoginAPI } from "../../controllers/v2/user/userLogin.js";
import { userLogoutAPI } from "../../controllers/v2/user/userLogout.js";
import { updatePermissionAPI } from "../../controllers/v2/user/info/updatePermissionAPI.js";
import { getUserInfoAPI } from "../../controllers/v2/user/info/userInfoAPI.js";
import {
  userInviteCodeGetAPI,
  userInviteCodeNewAPI,
} from "../../controllers/v2/user/inviteCode/userInviteCode.js";
import { updateAvatarAPI } from "../../controllers/v2/user/info/updateAvatarAPI.js";
import { loginRequire } from "../../controllers/v2/globalAuth/auth.js";
import { updateNameAPI } from "../../controllers/v2/user/info/updateNameAPI.js";
import { changePasswordAPI } from "../../controllers/v2/user/password/changePasswordAPI.js";

// basic
router.post("/register", userRegisterAPI);
router.post("/login", userLoginAPI);
router.post("/logout", userLogoutAPI);
router.post("/changepassword", [loginRequire, changePasswordAPI]);
// invite
router.get("/invite/get", userInviteCodeGetAPI);
router.post("/invite/new", userInviteCodeNewAPI);
// info
router.get("/info", getUserInfoAPI);
router.post("/info/avatar", [loginRequire, updateAvatarAPI]);
router.post("/info/name", [loginRequire, updateNameAPI]);
router.post("/info/permission", updatePermissionAPI);

export default router;
