import { Router } from "express";
import getIndexInfo from "../../controllers/v2/index/info.js";
import { queryAnimeByIndex } from "../../controllers/v2/index/query.js";
import { validateBody } from "../../middleware/validate.js";
import { queryAnimeByIndexBodySchema } from "../../schemas/v2/index/query.js";

const router = Router();

router.get("/info", getIndexInfo);
router.post("/query", validateBody(queryAnimeByIndexBodySchema), queryAnimeByIndex);

export default router;
