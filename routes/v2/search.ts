import { Router } from "express";
import { searchAnimes } from "../../controllers/v2/search/search.js";
import { quickSearch } from "../../controllers/v2/search/quick.js";
import { getHotAnimes } from "../../controllers/v2/search/hot.js";
import { requireLogin } from "../../middleware/auth/require-auth.js";
import { validateQuery } from "../../middleware/validate.js";
import { searchAnimesQuerySchema } from "../../schemas/v2/search/search.js";
import { quickSearchQuerySchema } from "../../schemas/v2/search/quick.js";

const router = Router();

router.get("/hot", getHotAnimes);
router.get("/", requireLogin, validateQuery(searchAnimesQuerySchema), searchAnimes);
router.get("/quick", requireLogin, validateQuery(quickSearchQuerySchema), quickSearch);

export default router;
