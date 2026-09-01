import { Router } from "express";
import { contactController } from "../controllers/contactController";
import { optionalAuthenticate } from "../middlewares/authMiddleware";

const router = Router();

// Apply optional authentication so req.user is populated when Bearer token or headers are sent
router.use(optionalAuthenticate);

// GET /api/contacts/search - Search registered users by username/name
router.get("/search", contactController.searchUsers);

// GET /api/contacts/suggestions - "People You May Know" algorithm based on language
router.get("/suggestions", contactController.getSuggestions);

// GET /api/contacts - List all contacts for the current user
router.get("/", contactController.getContacts);

// POST /api/contacts - Add a new contact
router.post("/", contactController.addContact);

// GET /api/contacts/:id - Get contact profile details
router.get("/:id", contactController.getContactById);

// DELETE /api/contacts/:id - Remove a contact
router.delete("/:id", contactController.deleteContact);

export default router;
