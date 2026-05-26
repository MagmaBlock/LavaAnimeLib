import { Router } from "express";
import { getSiteSetting, setSiteSetting } from "../../controllers/v2/site/setting.js";
import { requireLogin } from "../../middleware/auth/require-auth.js";

const router = Router();

router.get("/setting/get", getSiteSetting);
router.post("/setting/set", requireLogin, setSiteSetting);

export default router;
