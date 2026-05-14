import { Router } from "express";
import { getSiteSetting, setSiteSetting } from "../../controllers/v2/site/setting.js";
import { requireLogin } from "../../middleware/auth/require-auth.js";
import { validateQuery, validateBody } from "../../middleware/validate.js";
import { getSiteSettingQuerySchema, setSiteSettingBodySchema } from "../../schemas/v2/site/setting.js";

const router = Router();

router.get("/setting/get", validateQuery(getSiteSettingQuerySchema), getSiteSetting);
router.post("/setting/set", requireLogin, validateBody(setSiteSettingBodySchema), setSiteSetting);

export default router;
