import { Router } from "express";
import { reportUploadMessage } from "../../controllers/v2/report/upload-message.js";
import { validateBody } from "../../middleware/validate.js";
import { reportUploadMessageBodySchema } from "../../schemas/v2/report/upload-message.js";

const router = Router();

router.post("/upload-message", validateBody(reportUploadMessageBodySchema), reportUploadMessage);

export default router;
