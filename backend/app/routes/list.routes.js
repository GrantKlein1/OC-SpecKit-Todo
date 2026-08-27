import { Router } from "express";
import listController from "../controllers/list.controller.js";
import todoController from "../controllers/todo.controller.js";
import { authenticate } from "../authorization/authorization.js";

const router = Router();

router.get("/", [authenticate], listController.findAll);
router.post("/", [authenticate], listController.create);
router.get("/:listId/todos", [authenticate], todoController.findAll);
router.post("/:listId/todos", [authenticate], todoController.create);
router.put("/:listId", [authenticate], listController.update);
router.delete("/:listId", [authenticate], listController.delete);

export default router;
