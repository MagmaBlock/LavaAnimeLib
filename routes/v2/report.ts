import { Router } from "express";
import { reportUploadMessage } from "../../controllers/v2/report/upload-message.js";

const router = Router();

router.post("/upload-message", reportUploadMessage);

export default router;
