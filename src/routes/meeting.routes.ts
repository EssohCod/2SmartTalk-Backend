import { Router } from "express";
import { meetingController } from "../controllers/meetingController";
import { optionalAuthenticate } from "../middlewares/authMiddleware";

const router = Router();

router.use(optionalAuthenticate);

// Get upcoming scheduled meetings
router.get("/upcoming", meetingController.getUpcomingMeetings);

// Schedule a new meeting
router.post("/schedule", meetingController.scheduleMeeting);

// Get meeting by ID
router.get("/:id", meetingController.getMeetingById);

// Accept meeting invitation
router.post("/:id/accept", meetingController.acceptInvite);

// Decline meeting invitation
router.post("/:id/decline", meetingController.declineInvite);

// Delete / cancel meeting
router.delete("/:id", meetingController.deleteMeeting);

export default router;
