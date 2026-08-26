import { Router } from "express";
import listController from "../controllers/list.controller.js";
import { authenticate } from "../authorization/authorization.js";

const router = Router();

router.get("/", [authenticate], listController.findAll);
router.post("/", [authenticate], listController.create);
router.put("/:listId", [authenticate], listController.update);
router.delete("/:listId", [authenticate], listController.delete);

export default router;
