import { Router } from "express";
import { userRegister } from "../../controllers/v2/user/register.js";
import { userLogin } from "../../controllers/v2/user/login.js";
import { userLogout } from "../../controllers/v2/user/logout.js";
import { changePassword } from "../../controllers/v2/user/change-password.js";
import { getUserInviteCode } from "../../controllers/v2/user/invite-code/get.js";
import { createUserInviteCode } from "../../controllers/v2/user/invite-code/new.js";
import { getUserInfo } from "../../controllers/v2/user/info/get.js";
import { updateAvatar } from "../../controllers/v2/user/info/update-avatar.js";
import { updateName } from "../../controllers/v2/user/info/update-name.js";
import { updatePermission } from "../../controllers/v2/user/info/update-permission.js";
import { requireLogin } from "../../middleware/auth/require-auth.js";

const router = Router();

router.post("/register", userRegister);
router.post("/login", userLogin);
router.post("/logout", userLogout);
router.post("/changepassword", requireLogin, changePassword);
router.get("/invite/get", getUserInviteCode);
router.post("/invite/new", createUserInviteCode);
router.get("/info", getUserInfo);
router.post("/info/avatar", requireLogin, updateAvatar);
router.post("/info/name", requireLogin, updateName);
router.post("/info/permission", updatePermission);

export default router;
