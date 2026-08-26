import { Router } from "express";
import todoController from "../controllers/todo.controller.js";
import { authenticate } from "../authorization/authorization.js";

const router = Router();

router.put("/:id", [authenticate], todoController.update);
router.delete("/:id", [authenticate], todoController.remove);

export default router;
