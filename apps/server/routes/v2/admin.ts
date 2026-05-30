import { Router } from "express";
import { getAllValidCodes } from "../../controllers/v2/admin/invite/valid-codes.js";
import { deleteCodes } from "../../controllers/v2/admin/invite/delete-codes.js";
import { getAdminStats } from "../../controllers/v2/admin/stats.js";
import { getAllDrives } from "../../controllers/v2/admin/drive/all.js";
import { newDrive } from "../../controllers/v2/admin/drive/new.js";
import { updateDriveInfo } from "../../controllers/v2/admin/drive/update.js";
import { removeDrive } from "../../controllers/v2/admin/drive/delete.js";
import { setDefaultDriveController } from "../../controllers/v2/admin/drive/set-default.js";
import { listEndpoints } from "../../controllers/v2/admin/drive-endpoint/list.js";
import { newEndpoint } from "../../controllers/v2/admin/drive-endpoint/new.js";
import { updateEndpointInfo } from "../../controllers/v2/admin/drive-endpoint/update.js";
import { removeEndpoint } from "../../controllers/v2/admin/drive-endpoint/delete.js";
import { adminListIndex } from "../../controllers/v2/admin/file-index/list.js";
import { adminSearchIndex } from "../../controllers/v2/admin/file-index/search.js";
import { adminRefreshDir } from "../../controllers/v2/admin/file-index/refresh-dir.js";
import { adminRefreshDrive } from "../../controllers/v2/admin/file-index/refresh-drive.js";
import { adminIndexStats } from "../../controllers/v2/admin/file-index/stats.js";
import { listBangumiCache } from "../../controllers/v2/admin/bangumi-cache/list.js";
import {
  refreshBangumiCacheController,
  refreshExpiredBangumiCacheController,
} from "../../controllers/v2/admin/bangumi-cache/refresh.js";
import {
  getBangumiCacheSettingsController,
  updateBangumiCacheSettingsController,
} from "../../controllers/v2/admin/bangumi-cache/settings.js";
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
router.get("/drive/endpoint/list", requireAdmin, listEndpoints);
router.post("/drive/endpoint/new", requireAdmin, newEndpoint);
router.post("/drive/endpoint/update", requireAdmin, updateEndpointInfo);
router.post("/drive/endpoint/delete", requireAdmin, removeEndpoint);
router.get("/file-index/list", requireAdmin, adminListIndex);
router.get("/file-index/search", requireAdmin, adminSearchIndex);
router.post("/file-index/refresh-dir", requireAdmin, adminRefreshDir);
router.post("/file-index/refresh-drive", requireAdmin, adminRefreshDrive);
router.get("/file-index/stats", requireAdmin, adminIndexStats);
router.get(
  "/bangumi-cache/list",
  requireAdmin,
  listBangumiCache
);
router.get("/bangumi-cache/settings", requireAdmin, getBangumiCacheSettingsController);
router.post(
  "/bangumi-cache/settings",
  requireAdmin,
  updateBangumiCacheSettingsController
);
router.post(
  "/bangumi-cache/refresh",
  requireAdmin,
  refreshBangumiCacheController
);
router.post("/bangumi-cache/refresh-expired", requireAdmin, refreshExpiredBangumiCacheController);

export default router;
