import { Router } from "express";
import animeRouter from "./anime.js";
import userRouter from "./user.js";
import searchRouter from "./search.js";
import indexRouter from "./index-router.js";
import homeRouter from "./home.js";
import driveRouter from "./drive.js";
import adminRouter from "./admin.js";
import siteRouter from "./site.js";
import reportRouter from "./report.js";

const router = Router();

router.use("/v2/anime", animeRouter);
router.use("/v2/user", userRouter);
router.use("/v2/search", searchRouter);
router.use("/v2/index", indexRouter);
router.use("/v2/home", homeRouter);
router.use("/v2/drive", driveRouter);
router.use("/v2/admin", adminRouter);
router.use("/v2/site", siteRouter);
router.use("/v2/report", reportRouter);

export default router;
