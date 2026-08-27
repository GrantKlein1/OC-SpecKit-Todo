import { Router } from "express";
import authRoutes from "./auth.routes.js";
import listRoutes from "./list.routes.js";
import todoRoutes from "./todo.routes.js";
import userRoutes from "./user.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/", authRoutes);
router.use("/lists", listRoutes);
router.use("/todos", todoRoutes);
router.use("/users", userRoutes);

export default router;
