import { Router } from "express";
import { getAllValidCodes } from "../../controllers/v2/admin/invite/valid-codes.js";
import { deleteCodes } from "../../controllers/v2/admin/invite/delete-codes.js";
import { getAdminStats } from "../../controllers/v2/admin/stats.js";
import { requireAdmin } from "../../middleware/auth/require-auth.js";
import { validateBody } from "../../middleware/validate.js";
import { deleteCodesBodySchema } from "../../schemas/v2/admin/invite/delete-codes.js";

const router = Router();

router.get("/stats", requireAdmin, getAdminStats);
router.get("/invite/all-valid-codes", requireAdmin, getAllValidCodes);
router.post("/invite/delete-codes", requireAdmin, validateBody(deleteCodesBodySchema), deleteCodes);

export default router;
