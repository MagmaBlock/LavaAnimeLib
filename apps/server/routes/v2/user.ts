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
import { requireLogin, requireAdmin } from "../../middleware/auth/require-auth.js";
import { validateQuery, validateBody } from "../../middleware/validate.js";
import { userRegisterBodySchema } from "../../schemas/v2/user/register.js";
import { userLoginBodySchema } from "../../schemas/v2/user/login.js";
import { changePasswordBodySchema } from "../../schemas/v2/user/change-password.js";
import { getUserInfoQuerySchema } from "../../schemas/v2/user/info/get.js";
import { updateAvatarBodySchema } from "../../schemas/v2/user/info/update-avatar.js";
import { updateNameBodySchema } from "../../schemas/v2/user/info/update-name.js";
import { updatePermissionBodySchema } from "../../schemas/v2/user/info/update-permission.js";
import { createInviteCodeBodySchema } from "../../schemas/v2/user/invite-code/new.js";

const router = Router();

router.post("/register", validateBody(userRegisterBodySchema), userRegister);
router.post("/login", validateBody(userLoginBodySchema), userLogin);
router.post("/logout", userLogout);
router.post("/changepassword", requireLogin, validateBody(changePasswordBodySchema), changePassword);
router.get("/invite/get", getUserInviteCode);
router.post("/invite/new", requireLogin, validateBody(createInviteCodeBodySchema), createUserInviteCode);
router.get("/info", validateQuery(getUserInfoQuerySchema), getUserInfo);
router.post("/info/avatar", requireLogin, validateBody(updateAvatarBodySchema), updateAvatar);
router.post("/info/name", requireLogin, validateBody(updateNameBodySchema), updateName);
router.post("/info/permission", requireLogin, requireAdmin, validateBody(updatePermissionBodySchema), updatePermission);

export default router;
