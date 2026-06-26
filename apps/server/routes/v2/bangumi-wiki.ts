import { Router } from "express";
import { characterDetail } from "../../controllers/v2/bangumi-wiki/character.js";
import { personDetail } from "../../controllers/v2/bangumi-wiki/person.js";

const router = Router();

router.get("/character/:id", characterDetail);
router.get("/person/:id", personDetail);

export default router;
