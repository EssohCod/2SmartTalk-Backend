import { Router } from "express";
import { contactController } from "../controllers/contactController";

const router = Router();

// GET /api/contacts/search - Search registered users
router.get("/search", contactController.searchUsers);

// GET /api/contacts - List all contacts
router.get("/", contactController.getContacts);

// POST /api/contacts - Add a new contact
router.post("/", contactController.addContact);

// GET /api/contacts/:id - Get contact profile details
router.get("/:id", contactController.getContactById);

// DELETE /api/contacts/:id - Remove a contact
router.delete("/:id", contactController.deleteContact);

export default router;
