import { Router } from "express";
import {
  getAnimeByIDAPI,
  getAnimesByBgmIDAPI,
  getAnimesByIDAPI,
  getFilesByIDAPI,
} from "../../controllers/v2/anime/api.js";
import { editAnimeFollowAPI } from "../../controllers/v2/anime/follow/edit.js";
import { getAnimeFollowInfoAPI } from "../../controllers/v2/anime/follow/info.js";
import { getAnimeFollowListAPI } from "../../controllers/v2/anime/follow/list.js";
import { getAnimeFollowTotalAPI } from "../../controllers/v2/anime/follow/total.js";
import {
  getMyViewHistoryAPI,
  reportViewHistoryAPI,
} from "../../controllers/v2/anime/viewHistory/api.js";
import { loginRequire } from "../../controllers/v2/globalAuth/auth.js";

const router = Router();

router.get(`/get`, getAnimeByIDAPI);
router.post(`/get`, getAnimesByIDAPI);
router.get(`/bangumi/get`, getAnimesByBgmIDAPI);

router.get("/file", [loginRequire, getFilesByIDAPI]); // 使用多个中间件

router.post("/follow/list", [loginRequire, getAnimeFollowListAPI]);
router.post("/follow/edit", [loginRequire, editAnimeFollowAPI]);
router.get("/follow/total", [loginRequire, getAnimeFollowTotalAPI]);
router.get("/follow/info", [loginRequire, getAnimeFollowInfoAPI]);

router.post("/history/report", [loginRequire, reportViewHistoryAPI]);
router.post("/history/my", [loginRequire, getMyViewHistoryAPI]);

export default router;
