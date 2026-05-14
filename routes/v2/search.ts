import { Router } from "express";
import { searchAnimes } from "../../controllers/v2/search/search.js";
import { quickSearch } from "../../controllers/v2/search/quick.js";
import { getHotAnimes } from "../../controllers/v2/search/hot.js";
import { requireLogin } from "../../middleware/auth/require-auth.js";

const router = Router();

router.get("/hot", getHotAnimes);
router.get("/", requireLogin, searchAnimes);
router.get("/quick", requireLogin, quickSearch);

export default router;
