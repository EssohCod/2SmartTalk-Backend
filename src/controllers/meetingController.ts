import { Request, Response } from "express";
import { query } from "../config/db";
import { resolvePreferredLanguage } from "../services/translationService";
import { sendExpoPushNotification } from "./notificationController";

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

const mapMeetingRowToDto = (row: MeetingDbRow, currentUserId?: string | null, currentUserEmail?: string | null) => {
  let parsedParticipants: any[] = [];
  if (typeof row.participants === "string") {
    try {
      parsedParticipants = JSON.parse(row.participants);
    } catch {
      parsedParticipants = [];
    }
  } else if (Array.isArray(row.participants)) {
    parsedParticipants = row.participants;
  }

  const isHost = Boolean(
    (currentUserId && row.host_id === currentUserId) ||
    (currentUserEmail && row.host_email && row.host_email.toLowerCase() === currentUserEmail.toLowerCase()) ||
    (!currentUserId && !currentUserEmail && row.is_host)
  );

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
    isHost,
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
   * 1. Get All Upcoming Meetings (Host + Accepted Attendee Meetings)
   */
  async getUpcomingMeetings(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const userId = user?.userId || user?.id || (req.headers["x-user-id"] as string) || (req.query.userId as string);
      const email = user?.email || (req.headers["x-user-email"] as string) || (req.query.email as string);
      const userName = user?.name || (req.query.name as string) || "";

      if (!userId && !email && !userName) {
        res.status(200).json({
          success: true,
          count: 0,
          meetings: [],
        });
        return;
      }

      const cleanEmail = email ? email.toLowerCase().trim() : "";
      const cleanUserId = userId ? String(userId).trim() : "";
      const cleanName = userName ? userName.toLowerCase().trim() : "";

      const result = await query<MeetingDbRow>(
        `SELECT * FROM meetings 
         WHERE (status = 'upcoming' OR status = 'live')
           AND (
             host_id = $1 
             OR (host_email IS NOT NULL AND LOWER(host_email) = $2)
             OR (participants::text ILIKE $3 AND (participants::text ILIKE '%accepted%' OR participants::text ILIKE '%"status":"accepted"%'))
             OR (participants::text ILIKE $4 AND (participants::text ILIKE '%accepted%' OR participants::text ILIKE '%"status":"accepted"%'))
             OR (participants::text ILIKE $5 AND (participants::text ILIKE '%accepted%' OR participants::text ILIKE '%"status":"accepted"%'))
           )
         ORDER BY created_at DESC`,
        [
          cleanUserId || "00000000-0000-0000-0000-000000000000",
          cleanEmail || "no-match@email.local",
          `%${cleanEmail || "no-match-email"}%`,
          `%${cleanUserId || "no-match-id"}%`,
          `%${cleanName || "no-match-name"}%`,
        ]
      );

      const meetings = result.rows.map((row) => mapMeetingRowToDto(row, cleanUserId, cleanEmail));

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
   * 2. Schedule New Meeting (With Automatic Invite Notifications to Contacts)
   */
  async scheduleMeeting(req: Request, res: Response): Promise<void> {
    try {
      const preferredLanguage = await resolvePreferredLanguage(req);
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
        speakLanguage = preferredLanguage.language,
        speakLanguageFlag = preferredLanguage.flag,
        hostEmail,
      } = req.body;
      const requestUser = (req as any).user;
      const resolvedHostEmail =
        requestUser?.email ||
        (req.headers["x-user-email"] as string) ||
        hostEmail ||
        null;
      const resolvedHostId =
        requestUser?.userId ||
        requestUser?.id ||
        (req.headers["x-user-id"] as string) ||
        null;

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
          host_id, title, meeting_type, meeting_date, start_time, end_time, timezone, 
          duration, shareable_link, participants, dubbing_enabled, is_host, 
          mute_all_allowed, allow_unmute, waiting_room_enabled, reminder_10min, 
          speak_language, speak_language_flag, status, host_email
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'upcoming', $19
        ) RETURNING *`,
        [
          resolvedHostId,
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
          resolvedHostEmail,
        ]
      );

      const createdMeeting = mapMeetingRowToDto(insertResult.rows[0], resolvedHostId, resolvedHostEmail);

      // Resolve Host profile info for invite notifications
      let hostName = "Your contact";
      let hostAvatarUrl: string | null = null;
      if (resolvedHostId) {
        const hostUser = await query("SELECT name, avatar_url, email FROM users WHERE id = $1 LIMIT 1", [resolvedHostId]);
        if (hostUser.rows.length > 0) {
          hostName = hostUser.rows[0].name;
          hostAvatarUrl = hostUser.rows[0].avatar_url;
        }
      } else if (resolvedHostEmail) {
        const hostUser = await query("SELECT name, avatar_url, email FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1", [resolvedHostEmail]);
        if (hostUser.rows.length > 0) {
          hostName = hostUser.rows[0].name;
          hostAvatarUrl = hostUser.rows[0].avatar_url;
        }
      }

      // Create invite notification for each invited participant
      if (Array.isArray(participants) && participants.length > 0) {
        for (const p of participants) {
          let targetUserId: string | null = p.id || p.userId || null;
          let targetUserEmail: string | null = p.email || null;

          // Lookup target user from contacts or users table if needed
          if (targetUserId) {
            const userLookup = await query(
              `SELECT id, email, name FROM users WHERE id = $1
               UNION ALL
               SELECT contact_user_id as id, email, name FROM contacts WHERE id = $1 AND contact_user_id IS NOT NULL
               LIMIT 1`,
              [targetUserId]
            );
            if (userLookup.rows.length > 0) {
              targetUserId = userLookup.rows[0].id;
              targetUserEmail = targetUserEmail || userLookup.rows[0].email;
            }
          }

          if (!targetUserEmail && (p.username || p.name)) {
            const userByName = await query(
              `SELECT id, email FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(name) = LOWER($2) LIMIT 1`,
              [(p.username || "").replace(/^@/, ""), p.name || ""]
            );
            if (userByName.rows.length > 0) {
              targetUserId = targetUserId || userByName.rows[0].id;
              targetUserEmail = userByName.rows[0].email;
            }
          }

          // Avoid creating self-invitation for the host
          if (
            (targetUserId && targetUserId === resolvedHostId) ||
            (targetUserEmail && resolvedHostEmail && targetUserEmail.toLowerCase() === resolvedHostEmail.toLowerCase())
          ) {
            continue;
          }

          if (targetUserId || targetUserEmail) {
            const desc = `${hostName} invited you to "${cleanTitle}" on ${date} at ${startTime} (${timezone || "UTC"}).`;
            const contactDataObj = {
              name: hostName,
              avatar: hostAvatarUrl,
              email: resolvedHostEmail,
              meetingId: createdMeeting.id,
              meetingTitle: cleanTitle,
              meetingDate: date,
              meetingTime: startTime,
              meetingType: meetingType,
              meetingLink: generatedLink,
              status: "pending",
            };

            await query(
              `INSERT INTO notifications (
                user_id, user_email, category, title, description,
                avatar_url, icon_name, icon_bg_color, icon_color,
                action_type, action_label, contact_data, meeting_id,
                is_unread, created_at, updated_at
              ) VALUES (
                $1, $2, 'meetings', 'Meeting Invitation', $3,
                $4, 'video', '#EDFAF3', '#10B981',
                'accept_meeting_invite', 'Accept Invite', $5, $6,
                true, NOW(), NOW()
              )`,
              [
                targetUserId,
                targetUserEmail ? targetUserEmail.toLowerCase().trim() : null,
                desc,
                hostAvatarUrl,
                JSON.stringify(contactDataObj),
                createdMeeting.id,
              ]
            );

            try {
              if (targetUserEmail) {
                await sendExpoPushNotification(targetUserEmail, "Meeting Invitation", desc, {
                  meetingId: createdMeeting.id,
                  actionType: "accept_meeting_invite",
                });
              }
            } catch (pushErr) {
              console.warn("Push notification error on meeting invite:", pushErr);
            }
          }
        }
      }

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
   * 3. Accept Meeting Invitation
   * POST /api/meetings/:id/accept
   */
  async acceptInvite(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const userId = user?.userId || user?.id || (req.headers["x-user-id"] as string) || (req.body?.userId as string);
      const userEmail = user?.email || (req.headers["x-user-email"] as string) || (req.body?.userEmail as string);
      const userName = user?.name || (req.body?.userName as string) || "Participant";

      if (!id) {
        res.status(400).json({ error: "Meeting ID is required." });
        return;
      }

      const meetingRes = await query<MeetingDbRow>("SELECT * FROM meetings WHERE id = $1", [id]);
      if (meetingRes.rows.length === 0) {
        res.status(404).json({ error: "Meeting not found." });
        return;
      }

      const meeting = meetingRes.rows[0];
      let participants: any[] = [];
      if (typeof meeting.participants === "string") {
        try {
          participants = JSON.parse(meeting.participants);
        } catch {
          participants = [];
        }
      } else if (Array.isArray(meeting.participants)) {
        participants = meeting.participants;
      }

      // Update participant status to "accepted"
      let found = false;
      const updatedParticipants = participants.map((p: any) => {
        const isMatch =
          (userId && (p.id === userId || p.userId === userId)) ||
          (userEmail && p.email && p.email.toLowerCase() === userEmail.toLowerCase()) ||
          (userName && p.name && p.name.toLowerCase() === userName.toLowerCase());

        if (isMatch) {
          found = true;
          return {
            ...p,
            id: userId || p.id,
            userId: userId || p.userId,
            email: userEmail || p.email,
            name: userName || p.name,
            status: "accepted",
          };
        }
        return p;
      });

      if (!found) {
        updatedParticipants.push({
          id: userId,
          userId: userId,
          name: userName,
          email: userEmail,
          status: "accepted",
        });
      }

      // Save updated participants into meetings table
      await query(
        `UPDATE meetings SET participants = $1, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(updatedParticipants), id]
      );

      // Update corresponding notification in notifications table
      if (userId || userEmail) {
        await query(
          `UPDATE notifications
           SET action_type = 'join_meeting',
               action_label = 'Join Meeting',
               is_unread = false,
               description = REPLACE(description, 'invited you to', 'You accepted the invitation to'),
               updated_at = NOW()
           WHERE meeting_id = $1 AND (
             (user_id IS NOT NULL AND user_id = $2) OR
             (user_email IS NOT NULL AND LOWER(user_email) = LOWER($3))
           )`,
          [id, userId || "00000000-0000-0000-0000-000000000000", userEmail || ""]
        );
      }

      const updatedMeeting = mapMeetingRowToDto(
        { ...meeting, participants: updatedParticipants },
        userId,
        userEmail
      );

      res.status(200).json({
        success: true,
        message: "Meeting invitation accepted successfully!",
        meeting: updatedMeeting,
      });
    } catch (error: any) {
      console.error("AcceptMeetingInvite error:", error);
      res.status(500).json({ error: "Failed to accept meeting invitation." });
    }
  },

  /**
   * 4. Decline Meeting Invitation
   * POST /api/meetings/:id/decline
   */
  async declineInvite(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const userId = user?.userId || user?.id || (req.headers["x-user-id"] as string) || (req.body?.userId as string);
      const userEmail = user?.email || (req.headers["x-user-email"] as string) || (req.body?.userEmail as string);

      if (!id) {
        res.status(400).json({ error: "Meeting ID is required." });
        return;
      }

      const meetingRes = await query<MeetingDbRow>("SELECT * FROM meetings WHERE id = $1", [id]);
      if (meetingRes.rows.length > 0) {
        const meeting = meetingRes.rows[0];
        let participants: any[] = [];
        if (typeof meeting.participants === "string") {
          try {
            participants = JSON.parse(meeting.participants);
          } catch {
            participants = [];
          }
        } else if (Array.isArray(meeting.participants)) {
          participants = meeting.participants;
        }

        const updatedParticipants = participants.map((p: any) => {
          const isMatch =
            (userId && (p.id === userId || p.userId === userId)) ||
            (userEmail && p.email && p.email.toLowerCase() === userEmail.toLowerCase());

          if (isMatch) {
            return { ...p, status: "declined" };
          }
          return p;
        });

        await query(
          `UPDATE meetings SET participants = $1, updated_at = NOW() WHERE id = $2`,
          [JSON.stringify(updatedParticipants), id]
        );
      }

      if (userId || userEmail) {
        await query(
          `UPDATE notifications
           SET action_type = 'view_info',
               action_label = 'Declined',
               is_unread = false,
               updated_at = NOW()
           WHERE meeting_id = $1 AND (
             (user_id IS NOT NULL AND user_id = $2) OR
             (user_email IS NOT NULL AND LOWER(user_email) = LOWER($3))
           )`,
          [id, userId || "00000000-0000-0000-0000-000000000000", userEmail || ""]
        );
      }

      res.status(200).json({
        success: true,
        message: "Meeting invitation declined.",
      });
    } catch (error: any) {
      console.error("DeclineMeetingInvite error:", error);
      res.status(500).json({ error: "Failed to decline meeting invitation." });
    }
  },

  /**
   * 5. Delete / Cancel Meeting
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
   * 6. Get Meeting By ID
   */
  async getMeetingById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const userId = user?.userId || user?.id || (req.headers["x-user-id"] as string);
      const email = user?.email || (req.headers["x-user-email"] as string);

      const result = await query<MeetingDbRow>(
        `SELECT * FROM meetings WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "Meeting not found." });
        return;
      }

      const meeting = mapMeetingRowToDto(result.rows[0], userId, email);

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
