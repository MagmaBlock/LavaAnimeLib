import { Router } from "express";
import { getDriveList } from "../../controllers/v2/drive/list.js";

const router = Router();

router.get("/all", getDriveList);

export default router;
