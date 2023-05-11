import { Router } from "express";
import { allVaildCodesAPI } from "../../controllers/v2/admin/invite/allValidCodes.js";
import { deleteCodesAPI } from "../../controllers/v2/admin/invite/deleteCodes.js";
import { adminRequire } from "../../controllers/v2/globalAuth/auth.js";
const router = Router();

router.get("/invite/all-valid-codes", [adminRequire, allVaildCodesAPI]);
router.post("/invite/delete-codes", [adminRequire, deleteCodesAPI]);

export default router;
