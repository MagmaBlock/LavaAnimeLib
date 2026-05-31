import { Router } from "express";
import { getAnimeByID } from "../../controllers/v2/anime/get.js";
import { getAnimesByID } from "../../controllers/v2/anime/get-batch.js";
import { getAnimesByBgmID } from "../../controllers/v2/anime/get-by-bangumi.js";
import { getFilesByID } from "../../controllers/v2/anime/file.js";
import { getFileUrl } from "../../controllers/v2/anime/file-url.js";
import { refreshFileIndex } from "../../controllers/v2/anime/file-refresh.js";
import { editAnimeFollow } from "../../controllers/v2/anime/follow/edit.js";
import { getAnimeFollowInfo } from "../../controllers/v2/anime/follow/info.js";
import { getAnimeFollowList } from "../../controllers/v2/anime/follow/list.js";
import { getAnimeFollowTotal } from "../../controllers/v2/anime/follow/total.js";
import { reportViewHistory } from "../../controllers/v2/anime/history/report.js";
import { getMyViewHistory } from "../../controllers/v2/anime/history/my.js";
import { getRecentUpdates } from "../../controllers/v2/anime/recent-update/get.js";
import { requireLogin } from "../../middleware/auth/require-auth.js";

const router = Router();

router.get("/get", getAnimeByID);
router.post("/get", getAnimesByID);
router.get("/bangumi/get", getAnimesByBgmID);
router.get("/file", requireLogin, getFilesByID);
router.get("/file/url", requireLogin, getFileUrl);
router.post("/file/refresh", requireLogin, refreshFileIndex);
router.post("/follow/list", requireLogin, getAnimeFollowList);
router.post("/follow/edit", requireLogin, editAnimeFollow);
router.get("/follow/total", requireLogin, getAnimeFollowTotal);
router.get("/follow/info", requireLogin, getAnimeFollowInfo);
router.post("/history/report", requireLogin, reportViewHistory);
router.post("/history/my", requireLogin, getMyViewHistory);
router.get("/recent-update/get", getRecentUpdates);

export default router;
