import { Router } from "express";
import { groupController } from "../controllers/groupController";

const router = Router();

// GET /api/groups - List all groups
router.get("/", groupController.getGroups);

// POST /api/groups - Create a new group
router.post("/", groupController.createGroup);

// GET /api/groups/:id - Get group by ID
router.get("/:id", groupController.getGroupById);

// DELETE /api/groups/:id - Delete group
router.delete("/:id", groupController.deleteGroup);

export default router;
