import { Router } from "express";
const router = Router();

import { sendUpdateMessageAPI } from "../../controllers/v2/notifier/api.js";

router.post("/report", sendUpdateMessageAPI);

export default router;
