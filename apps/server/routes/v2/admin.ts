import { Router } from "express";
import { getAllValidCodes } from "../../controllers/v2/admin/invite/valid-codes.js";
import { deleteCodes } from "../../controllers/v2/admin/invite/delete-codes.js";
import { getAdminStats } from "../../controllers/v2/admin/stats.js";
import { getAllDrives } from "../../controllers/v2/admin/drive/all.js";
import { newDrive } from "../../controllers/v2/admin/drive/new.js";
import { updateDriveInfo } from "../../controllers/v2/admin/drive/update.js";
import { removeDrive } from "../../controllers/v2/admin/drive/delete.js";
import { setDefaultDriveController } from "../../controllers/v2/admin/drive/set-default.js";
import { requireAdmin } from "../../middleware/auth/require-auth.js";

const router = Router();

router.get("/stats", requireAdmin, getAdminStats);
router.get("/invite/all-valid-codes", requireAdmin, getAllValidCodes);
router.post("/invite/delete-codes", requireAdmin, deleteCodes);
router.get("/drive/all", requireAdmin, getAllDrives);
router.post("/drive/new", requireAdmin, newDrive);
router.post("/drive/update", requireAdmin, updateDriveInfo);
router.post("/drive/delete", requireAdmin, removeDrive);
router.post(
  "/drive/set-default",
  requireAdmin,
  setDefaultDriveController
);

export default router;
