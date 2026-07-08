import { Router } from "express";
import { importLeads } from "../controllers/importController";

const router = Router();

router.post("/import", importLeads);

export default router;
