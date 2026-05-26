import { Router } from "express";
import getIndexInfo from "../../controllers/v2/index/info.js";
import { queryAnimeByIndex } from "../../controllers/v2/index/query.js";

const router = Router();

router.get("/info", getIndexInfo);
router.post("/query", queryAnimeByIndex);

export default router;
