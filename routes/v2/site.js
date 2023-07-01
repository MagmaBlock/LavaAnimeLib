import { Router } from "express";
import {
  getSiteSetting,
  setSiteSetting,
} from "../../controllers/v2/site/setting.js";
import { loginRequire } from "../../controllers/v2/globalAuth/auth.js";
const router = Router();

router.get("/setting/get", getSiteSetting); // 获取全部索引信息
router.post("/setting/set", [loginRequire, setSiteSetting]); // 根据索引查询番剧

export default router;
