import { Router } from "express";
import { getHeader, updateHeader } from "../../controllers/v2/home/header.js";
import { requireAdmin } from "../../middleware/auth/require-auth.js";

const router = Router();

router.get("/header/get", getHeader);
router.post("/header/update", requireAdmin, updateHeader);

export default router;
