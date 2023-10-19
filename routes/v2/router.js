import { Router } from "express";
import { allVaildCodesAPI } from "../../controllers/v2/admin/invite/allValidCodes.js";
import { deleteCodesAPI } from "../../controllers/v2/admin/invite/deleteCodes.js";
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
import { getDriveListAPI } from "../../controllers/v2/drive/api.js";
import {
  adminRequire,
  loginRequire,
} from "../../controllers/v2/globalAuth/auth.js";
import {
  getHeaderAPI,
  updateHeaderAPI,
} from "../../controllers/v2/home/headerAPI.js";
import getIndexInfo from "../../controllers/v2/index/info.js";
import queryAnimeByIndex from "../../controllers/v2/index/query.js";
import { sendMiraiMessageAPI } from "../../controllers/v2/notifier/api.js";
import {
  quickSearchAPI,
  searchAnimesAPI,
} from "../../controllers/v2/search/api.js";
import { getHotAnimesAPI } from "../../controllers/v2/search/getHotAnimesAPI.js";
import {
  getSiteSetting,
  setSiteSetting,
} from "../../controllers/v2/site/setting.js";
import { updateAvatarAPI } from "../../controllers/v2/user/info/updateAvatarAPI.js";
import { updateNameAPI } from "../../controllers/v2/user/info/updateNameAPI.js";
import { updatePermissionAPI } from "../../controllers/v2/user/info/updatePermissionAPI.js";
import { getUserInfoAPI } from "../../controllers/v2/user/info/userInfoAPI.js";
import {
  userInviteCodeGetAPI,
  userInviteCodeNewAPI,
} from "../../controllers/v2/user/inviteCode/userInviteCode.js";
import { changePasswordAPI } from "../../controllers/v2/user/password/changePasswordAPI.js";
import { userLoginAPI } from "../../controllers/v2/user/userLogin.js";
import { userLogoutAPI } from "../../controllers/v2/user/userLogout.js";
import { userRegisterAPI } from "../../controllers/v2/user/userRegister.js";

const router = Router();

/**
 * index 索引相关
 */

// 获取全部索引信息
router.get("/v2/index/info", getIndexInfo);
// 根据索引查询番剧
router.post("/v2/index/query", queryAnimeByIndex);

/**
 * user 用户相关
 */

// 基础
router.post("/v2/user/register", userRegisterAPI);
router.post("/v2/user/login", userLoginAPI);
router.post("/v2/user/logout", userLogoutAPI);
router.post("/v2/user/changepassword", [loginRequire, changePasswordAPI]);
// 邀请码
router.get("/v2/user/invite/get", userInviteCodeGetAPI);
router.post("/v2/user/invite/new", userInviteCodeNewAPI);
// 用户信息
router.get("/v2/user/info", getUserInfoAPI);
router.post("/v2/user/info/avatar", [loginRequire, updateAvatarAPI]);
router.post("/v2/user/info/name", [loginRequire, updateNameAPI]);
router.post("/v2/user/info/permission", updatePermissionAPI);

/**
 * anime 作品相关
 */

// 基础信息
router.get(`/v2/anime/get`, getAnimeByIDAPI);
router.post(`/v2/anime/get`, getAnimesByIDAPI);
router.get(`/v2/anime/bangumi/get`, getAnimesByBgmIDAPI);
// 文件列表
router.get("/v2/anime/file", [loginRequire, getFilesByIDAPI]);
// 追番
router.post("/v2/anime/follow/list", [loginRequire, getAnimeFollowListAPI]);
router.post("/v2/anime/follow/edit", [loginRequire, editAnimeFollowAPI]);
router.get("/v2/anime/follow/total", [loginRequire, getAnimeFollowTotalAPI]);
router.get("/v2/anime/follow/info", [loginRequire, getAnimeFollowInfoAPI]);
// 历史记录
router.post("/v2/anime/history/report", [loginRequire, reportViewHistoryAPI]);
router.post("/v2/anime/history/my", [loginRequire, getMyViewHistoryAPI]);

/**
 * search 搜索相关
 */

// 最近热门
router.get("/v2/search/hot", getHotAnimesAPI);
// 搜索相关
router.get(`/v2/search/`, [loginRequire, searchAnimesAPI]); // 搜索
router.get("/v2/search/quick", [loginRequire, quickSearchAPI]); // 预搜索关键词显示

/**
 * home 主页相关
 */

router.get(`/v2/home/header/get`, getHeaderAPI);
router.post("/v2/home/header/update", [adminRequire, updateHeaderAPI]);

/**
 * drive 存储节点
 */

router.get(`/v2/drive/all`, getDriveListAPI);

/**
 * admin 管理员相关
 */

router.get("/v2/admin/invite/all-valid-codes", [
  adminRequire,
  allVaildCodesAPI,
]);
router.post("/v2/admin/invite/delete-codes", [adminRequire, deleteCodesAPI]);

/**
 * site 站点信息相关
 */

router.get("/v2/site/setting/get", getSiteSetting); // 获取站点某一配置
router.post("/v2/site/setting/set", [loginRequire, setSiteSetting]); // 设定站点某一配置

/**
 * notifier 通知相关
 */
router.post("/v2/notifier/message", sendMiraiMessageAPI);

export default router;
