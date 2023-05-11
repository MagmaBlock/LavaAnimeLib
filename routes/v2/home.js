import { Router } from "express";
import { adminRequire } from "../../controllers/v2/globalAuth/auth.js";
const router = Router();

import {
  getHeaderAPI,
  updateHeaderAPI,
} from "../../controllers/v2/home/headerAPI.js";

router.get(`/header/get`, getHeaderAPI);
router.post("/header/update", [adminRequire, updateHeaderAPI]);

export default router;
