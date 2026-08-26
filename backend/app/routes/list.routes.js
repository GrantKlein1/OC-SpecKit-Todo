import { Router } from "express";
import listController from "../controllers/list.controller.js";
import { authenticate } from "../authorization/authorization.js";

const router = Router();

router.get("/", [authenticate], listController.findAll);

export default router;
