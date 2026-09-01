import { Request, Response } from "express";
import { query } from "../config/db";

export interface MeetingDbRow {
  id: string;
  host_id: string | null;
  host_email: string | null;
  title: string;
  meeting_type: "video" | "audio";
  meeting_date: string;
  start_time: string;
  end_time: string;
  timezone: string;
  duration: string;
  shareable_link: string;
  participants: any;
  dubbing_enabled: boolean;
  is_host: boolean;
  mute_all_allowed: boolean;
  allow_unmute: boolean;
  waiting_room_enabled: boolean;
  reminder_10min: boolean;
  speak_language: string;
  speak_language_flag: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

const mapMeetingRowToDto = (row: MeetingDbRow) => {
  let parsedParticipants = [];
  if (typeof row.participants === "string") {
    try {
      parsedParticipants = JSON.parse(row.participants);
    } catch {
      parsedParticipants = [];
    }
  } else if (Array.isArray(row.participants)) {
    parsedParticipants = row.participants;
  }

  return {
    id: row.id,
    title: row.title,
    meetingType: row.meeting_type || "video",
    date: row.meeting_date,
    startTime: row.start_time,
    endTime: row.end_time,
    timezone: row.timezone,
    duration: row.duration || `${row.start_time} - ${row.end_time}`,
    link: row.shareable_link,
    participants: parsedParticipants,
    dubbingEnabled: row.dubbing_enabled,
    isHost: row.is_host,
    muteAllAllowed: row.mute_all_allowed,
    allowUnmute: row.allow_unmute,
    waitingRoomEnabled: row.waiting_room_enabled,
    reminder10Min: row.reminder_10min,
    speakLanguage: row.speak_language,
    speakLanguageFlag: row.speak_language_flag,
    status: row.status,
    createdAt: row.created_at,
  };
};

export const meetingController = {
  /**
   * 1. Get All Upcoming Meetings
   */
  async getUpcomingMeetings(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const userId = user?.userId || user?.id || (req.headers["x-user-id"] as string) || (req.query.userId as string);
      const email = user?.email || (req.headers["x-user-email"] as string) || (req.query.email as string);

      if (!userId && !email) {
        res.status(200).json({
          success: true,
          count: 0,
          meetings: [],
        });
        return;
      }

      const result = await query<MeetingDbRow>(
        `SELECT * FROM meetings 
         WHERE (status = 'upcoming' OR status = 'live')
           AND (host_id = $1 OR LOWER(host_email) = LOWER($2) OR participants::text ILIKE $3)
         ORDER BY created_at DESC`,
        [userId || "00000000-0000-0000-0000-000000000000", email || "", `%${email || userId}%`]
      );

      const meetings = result.rows.map(mapMeetingRowToDto);

      res.status(200).json({
        success: true,
        count: meetings.length,
        meetings,
      });
    } catch (error: any) {
      console.error("GetUpcomingMeetings error:", error);
      res.status(500).json({ error: "Failed to fetch upcoming meetings." });
    }
  },

  /**
   * 2. Schedule New Meeting
   */
  async scheduleMeeting(req: Request, res: Response): Promise<void> {
    try {
      const {
        title,
        meetingType = "video",
        date,
        startTime,
        endTime,
        timezone,
        duration,
        link,
        participants = [],
        dubbingEnabled = true,
        isHost = true,
        muteAllAllowed = true,
        allowUnmute = true,
        waitingRoomEnabled = false,
        reminder10Min = true,
        speakLanguage = "English",
        speakLanguageFlag = "🇺🇸",
        hostEmail = "user@2smarttalk.com",
      } = req.body;

      if (!title || typeof title !== "string" || !title.trim()) {
        res.status(400).json({ error: "Meeting title/topic is required." });
        return;
      }

      if (!date || !startTime || !endTime) {
        res.status(400).json({ error: "Meeting date, start time, and end time are required." });
        return;
      }

      const cleanTitle = title.trim();
      const generatedLink =
        link ||
        `https://2smarttalk.ai/m/${cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "meeting"}`;

      const calculatedDuration = duration || `${startTime} - ${endTime}`;

      const insertResult = await query<MeetingDbRow>(
        `INSERT INTO meetings (
          title, meeting_type, meeting_date, start_time, end_time, timezone, 
          duration, shareable_link, participants, dubbing_enabled, is_host, 
          mute_all_allowed, allow_unmute, waiting_room_enabled, reminder_10min, 
          speak_language, speak_language_flag, status, host_email
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'upcoming', $18
        ) RETURNING *`,
        [
          cleanTitle,
          meetingType,
          date,
          startTime,
          endTime,
          timezone || "UTC",
          calculatedDuration,
          generatedLink,
          JSON.stringify(participants),
          Boolean(dubbingEnabled),
          Boolean(isHost),
          Boolean(muteAllAllowed),
          Boolean(allowUnmute),
          Boolean(waitingRoomEnabled),
          Boolean(reminder10Min),
          speakLanguage,
          speakLanguageFlag,
          hostEmail,
        ]
      );

      const createdMeeting = mapMeetingRowToDto(insertResult.rows[0]);

      res.status(201).json({
        success: true,
        message: "Meeting scheduled successfully!",
        meeting: createdMeeting,
      });
    } catch (error: any) {
      console.error("ScheduleMeeting error:", error);
      res.status(500).json({ error: "Failed to schedule meeting. Please try again." });
    }
  },

  /**
   * 3. Delete / Cancel Meeting
   */
  async deleteMeeting(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: "Meeting ID is required." });
        return;
      }

      const deleteResult = await query(
        `DELETE FROM meetings WHERE id = $1 RETURNING id, title`,
        [id]
      );

      if ((deleteResult.rowCount ?? 0) === 0) {
        res.status(404).json({ error: "Meeting not found or already deleted." });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Meeting cancelled successfully.",
        deletedMeetingId: id,
      });
    } catch (error: any) {
      console.error("DeleteMeeting error:", error);
      res.status(500).json({ error: "Failed to delete meeting." });
    }
  },

  /**
   * 4. Get Meeting By ID
   */
  async getMeetingById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await query<MeetingDbRow>(
        `SELECT * FROM meetings WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "Meeting not found." });
        return;
      }

      const meeting = mapMeetingRowToDto(result.rows[0]);

      res.status(200).json({
        success: true,
        meeting,
      });
    } catch (error: any) {
      console.error("GetMeetingById error:", error);
      res.status(500).json({ error: "Failed to get meeting details." });
    }
  },
};

export default meetingController;
