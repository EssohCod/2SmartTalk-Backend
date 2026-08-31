import { Router } from "express";
import { meetingController } from "../controllers/meetingController";

const router = Router();

// Get upcoming scheduled meetings
router.get("/upcoming", meetingController.getUpcomingMeetings);

// Schedule a new meeting
router.post("/schedule", meetingController.scheduleMeeting);

// Get meeting by ID
router.get("/:id", meetingController.getMeetingById);

// Delete / cancel meeting
router.delete("/:id", meetingController.deleteMeeting);

export default router;
