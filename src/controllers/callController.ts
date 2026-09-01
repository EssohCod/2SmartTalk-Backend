import { Request, Response } from "express";
import { pool } from "../config/db";
import { translationService, normalizeLanguageCode } from "../services/translationService";
import { sendExpoPushNotification } from "./notificationController";

function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
  const secsStr = secs < 10 ? `0${secs}` : `${secs}`;
  return `${minsStr} mins ${secsStr} secs`;
}

export const callController = {
  /**
   * 1. Initiate Audio or Video Call Session
   * POST /api/calls/initiate
   */
  async initiateCall(req: Request, res: Response): Promise<void> {
    try {
      const {
        callerName = "Emma Johnson",
        callerUsername = "@emma_johnson",
        callerAvatar = null,
        callerLanguage = "English",
        callerLanguageFlag = "🇺🇸",
        callerLocation = "San Francisco, CA",
        calleeName,
        calleeUsername,
        calleeAvatar = null,
        calleeLanguage = "French",
        calleeLanguageFlag = "🇫🇷",
        calleeLocation = "Paris, France",
        callType = "audio", // 'audio' | 'video'
        isGroup = false,
        groupName = null,
      } = req.body;

      if (!calleeName || !calleeName.trim()) {
        res.status(400).json({ error: "Callee/Recipient name is required." });
        return;
      }

      const cleanCallee = calleeName.trim();
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // 1. Create active call session
      const sessionResult = await pool.query(
        `INSERT INTO call_sessions (
          caller_name, caller_username, caller_avatar, caller_language, caller_language_flag, caller_location,
          callee_name, callee_username, callee_avatar, callee_language, callee_language_flag, callee_location,
          call_type, status, room_id, started_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, 'ringing', $14, NOW()
        ) RETURNING *`,
        [
          callerName,
          callerUsername,
          callerAvatar,
          callerLanguage,
          callerLanguageFlag,
          callerLocation,
          cleanCallee,
          calleeUsername || `@${cleanCallee.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
          calleeAvatar,
          calleeLanguage,
          calleeLanguageFlag,
          calleeLocation,
          callType,
          roomId,
        ]
      );

      const sessionRow = sessionResult.rows[0];

      const calleeUserResult = await pool.query(
        `SELECT id, email FROM users
         WHERE ($1::text IS NOT NULL AND (
           LOWER(username) = LOWER($1) OR LOWER(username) = LOWER(REPLACE($1, '@', ''))
         ))
            OR LOWER(name) = LOWER($2)
         LIMIT 1`,
        [calleeUsername || null, cleanCallee]
      );
      const calleeUser = calleeUserResult.rows[0];
      if (calleeUser?.email) {
        try {
          await sendExpoPushNotification(
            calleeUser.email,
            `Incoming ${callType === "video" ? "video" : "audio"} call`,
            `${callerName} is calling you`,
            { sessionId: sessionRow.id, callType, type: "incoming_call" }
          );
        } catch (pushError) {
          console.error("CallController push delivery error:", pushError);
        }
      }

      // 2. Log initial outgoing call entry in calls history
      const callerUserId = (req as any).user?.userId || (req as any).user?.id || (req.headers["x-user-id"] as string) || null;
      await pool.query(
        `INSERT INTO calls (
          user_id, contact_name, contact_username, contact_avatar,
          contact_language, contact_language_flag, call_type, call_direction,
          call_status, duration, is_group, group_name, started_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 'outgoing',
          'completed', 'Calling...', $8, $9, NOW()
        )`,
        [
          callerUserId,
          cleanCallee,
          calleeUsername || `@${cleanCallee.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
          calleeAvatar,
          calleeLanguage,
          calleeLanguageFlag,
          callType,
          isGroup,
          groupName,
        ]
      );

      res.status(201).json({
        success: true,
        message: `${callType === "video" ? "Video" : "Audio"} call initiated successfully.`,
        session: {
          id: sessionRow.id,
          roomId: sessionRow.room_id,
          callerName: sessionRow.caller_name,
          callerUsername: sessionRow.caller_username,
          callerAvatar: sessionRow.caller_avatar,
          callerLanguage: sessionRow.caller_language,
          callerLanguageFlag: sessionRow.caller_language_flag,
          callerLocation: sessionRow.caller_location,
          calleeName: sessionRow.callee_name,
          calleeUsername: sessionRow.callee_username,
          calleeAvatar: sessionRow.callee_avatar,
          calleeLanguage: sessionRow.callee_language,
          calleeLanguageFlag: sessionRow.callee_language_flag,
          calleeLocation: sessionRow.callee_location,
          callType: sessionRow.call_type,
          status: sessionRow.status,
          startedAt: sessionRow.started_at,
        },
      });
    } catch (error: any) {
      console.error("CallController.initiateCall error:", error);
      res.status(500).json({ error: "Failed to initiate call." });
    }
  },

  /**
   * 2. Check for Incoming Active Call (Polling / Push Trigger)
   * GET /api/calls/incoming
   */
  async getIncomingCall(req: Request, res: Response): Promise<void> {
    try {
      const callee = (req.query.callee as string) || "Emma Johnson";

      // Find any ringing session created within last 45 seconds
      const result = await pool.query(
        `SELECT * FROM call_sessions
         WHERE status = 'ringing'
           AND LOWER(callee_name) = LOWER($1)
           AND started_at >= NOW() - interval '45 seconds'
         ORDER BY started_at DESC
         LIMIT 1`,
        [callee]
      );

      if (result.rows.length === 0) {
        res.status(200).json({
          hasIncomingCall: false,
          session: null,
        });
        return;
      }

      const row = result.rows[0];

      res.status(200).json({
        hasIncomingCall: true,
        session: {
          id: row.id,
          roomId: row.room_id,
          callerName: row.caller_name,
          callerUsername: row.caller_username,
          callerAvatar: row.caller_avatar,
          callerLanguage: row.caller_language,
          callerLanguageFlag: row.caller_language_flag,
          callerLocation: row.caller_location,
          calleeName: row.callee_name,
          calleeUsername: row.callee_username,
          calleeAvatar: row.callee_avatar,
          calleeLanguage: row.callee_language,
          calleeLanguageFlag: row.callee_language_flag,
          calleeLocation: row.callee_location,
          callType: row.call_type,
          status: row.status,
          startedAt: row.started_at,
        },
      });
    } catch (error: any) {
      console.warn("CallController.getIncomingCall error:", error?.message || error);
      res.status(200).json({
        hasIncomingCall: false,
        session: null,
      });
    }
  },

  /**
   * 3. Accept Incoming Call
   * POST /api/calls/:sessionId/accept
   */
  async acceptCall(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.params.sessionId as string;

      if (!sessionId || !isUuid(sessionId)) {
        res.status(200).json({
          success: true,
          message: "Call accepted.",
          status: "connected",
        });
        return;
      }

      const updateResult = await pool.query(
        `UPDATE call_sessions
         SET status = 'connected', connected_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [sessionId]
      );

      if (updateResult.rows.length === 0) {
        res.status(404).json({ error: "Call session not found." });
        return;
      }

      const row = updateResult.rows[0];

      // Log incoming connected call in calls history
      await pool.query(
        `INSERT INTO calls (
          contact_name, contact_username, contact_avatar,
          contact_language, contact_language_flag, call_type, call_direction,
          call_status, duration, started_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'incoming',
          'completed', '00 mins 00 secs', NOW()
        )`,
        [
          row.caller_name,
          row.caller_username,
          row.caller_avatar,
          row.caller_language,
          row.caller_language_flag,
          row.call_type,
        ]
      );

      res.status(200).json({
        success: true,
        message: "Call accepted and connected.",
        session: {
          id: row.id,
          status: row.status,
          connectedAt: row.connected_at,
          roomId: row.room_id,
        },
      });
    } catch (error: any) {
      console.error("CallController.acceptCall error:", error);
      res.status(500).json({ error: "Failed to accept call." });
    }
  },

  /**
   * 4. Decline Incoming Call
   * POST /api/calls/:sessionId/decline
   */
  async declineCall(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.params.sessionId as string;
      const { quickReply } = req.body;

      if (!sessionId || !isUuid(sessionId)) {
        res.status(200).json({
          success: true,
          message: "Call declined.",
          status: "declined",
        });
        return;
      }

      const updateResult = await pool.query(
        `UPDATE call_sessions
         SET status = 'declined', ended_at = NOW(), quick_reply = $2
         WHERE id = $1
         RETURNING *`,
        [sessionId, quickReply || null]
      );

      if (updateResult.rows.length === 0) {
        res.status(404).json({ error: "Call session not found." });
        return;
      }

      const row = updateResult.rows[0];

      // Log missed call in calls history
      await pool.query(
        `INSERT INTO calls (
          contact_name, contact_username, contact_avatar,
          contact_language, contact_language_flag, call_type, call_direction,
          call_status, duration, started_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'missed',
          'declined', 'Declined (0s)', NOW()
        )`,
        [
          row.caller_name,
          row.caller_username,
          row.caller_avatar,
          row.caller_language,
          row.caller_language_flag,
          row.call_type,
        ]
      );

      res.status(200).json({
        success: true,
        message: "Call declined.",
        session: {
          id: row.id,
          status: row.status,
        },
      });
    } catch (error: any) {
      console.error("CallController.declineCall error:", error);
      res.status(500).json({ error: "Failed to decline call." });
    }
  },

  /**
   * 5. End Active Call Session
   * POST /api/calls/:sessionId/end
   */
  async endCall(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.params.sessionId as string;
      const { durationSeconds = 0 } = req.body;

      if (!sessionId || !isUuid(sessionId)) {
        res.status(200).json({
          success: true,
          message: "Call ended successfully.",
          status: "ended",
        });
        return;
      }

      const formatted = formatDuration(Number(durationSeconds) || 0);

      const updateResult = await pool.query(
        `UPDATE call_sessions
         SET status = 'ended', ended_at = NOW(), duration_seconds = $2
         WHERE id = $1
         RETURNING *`,
        [sessionId, Number(durationSeconds) || 0]
      );

      if (updateResult.rows.length > 0) {
        const row = updateResult.rows[0];
        // Update matching call log duration
        await pool.query(
          `UPDATE calls
           SET duration = $1, ended_at = NOW()
           WHERE (contact_name = $2 OR contact_name = $3)
             AND started_at >= NOW() - interval '2 hours'`,
          [formatted, row.callee_name, row.caller_name]
        );
      }

      res.status(200).json({
        success: true,
        message: "Call ended successfully.",
        duration: formatted,
      });
    } catch (error: any) {
      console.error("CallController.endCall error:", error);
      res.status(500).json({ error: "Failed to end call." });
    }
  },

  /**
   * 6. Get Real-Time Session Status (Signaling state check)
   * GET /api/calls/:sessionId/status
   */
  async getSessionStatus(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.params.sessionId as string;

      if (!sessionId || !isUuid(sessionId)) {
        res.status(200).json({
          success: true,
          status: "connected",
        });
        return;
      }

      const result = await pool.query(
        "SELECT id, status, room_id, started_at, connected_at, ended_at, duration_seconds FROM call_sessions WHERE id = $1",
        [sessionId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "Session not found." });
        return;
      }

      const row = result.rows[0];

      res.status(200).json({
        success: true,
        session: {
          id: row.id,
          status: row.status,
          roomId: row.room_id,
          startedAt: row.started_at,
          connectedAt: row.connected_at,
          endedAt: row.ended_at,
          durationSeconds: row.duration_seconds,
        },
      });
    } catch (error: any) {
      console.error("CallController.getSessionStatus error:", error);
      res.status(500).json({ error: "Failed to get session status." });
    }
  },

  /**
   * 7. Real-Time Speech Translation & Live Dubbing for Audio/Video Calls
   * POST /api/calls/:sessionId/translate-speech
   */
  async translateCallSpeech(req: Request, res: Response): Promise<void> {
    try {
      const { text, sourceLanguage = "English", targetLanguage = "French" } = req.body;

      if (!text || !text.trim()) {
        res.status(400).json({ error: "Speech transcript text is required." });
        return;
      }

      const cleanText = text.trim();
      let translatedText = cleanText;

      if (normalizeLanguageCode(sourceLanguage) !== normalizeLanguageCode(targetLanguage)) {
        const transResult = await translationService.translateText(
          cleanText,
          targetLanguage,
          sourceLanguage
        );
        translatedText = transResult.translatedText;
      }

      res.status(200).json({
        success: true,
        originalText: cleanText,
        sourceLanguage,
        translatedText,
        targetLanguage,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("CallController.translateCallSpeech error:", error);
      res.status(500).json({ error: "Failed to translate speech transcript." });
    }
  },

  /**
   * 8. Get All Call History
   * GET /api/calls
   */
  async getCalls(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const userId = user?.userId || user?.id || (req.headers["x-user-id"] as string) || (req.query.userId as string);
      const { direction, search } = req.query;

      if (!userId) {
        res.status(200).json({
          success: true,
          count: 0,
          calls: [],
        });
        return;
      }

      let query = "SELECT * FROM calls WHERE user_id = $1";
      const params: any[] = [userId];

      if (direction && typeof direction === "string" && direction !== "all") {
        params.push(direction.toLowerCase());
        query += ` AND LOWER(call_direction) = $${params.length}`;
      }

      if (search && typeof search === "string" && search.trim()) {
        params.push(`%${search.trim().toLowerCase()}%`);
        query += ` AND (LOWER(contact_name) LIKE $${params.length} OR LOWER(contact_username) LIKE $${params.length} OR LOWER(contact_language) LIKE $${params.length})`;
      }

      query += " ORDER BY started_at DESC";

      const result = await pool.query(query, params);
      const formatted = formatCallRows(result.rows);

      res.status(200).json({
        success: true,
        count: formatted.length,
        calls: formatted,
      });
    } catch (error: any) {
      console.error("CallController.getCalls error:", error);
      res.status(500).json({ error: "Failed to retrieve call history." });
    }
  },

  /**
   * 9. Manually Log Call Entry
   * POST /api/calls
   */
  async logCall(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const callerUserId = user?.userId || user?.id || (req.headers["x-user-id"] as string) || null;
      const {
        contactName,
        contactUsername = `@${contactName?.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
        contactAvatar = null,
        contactLanguage = "English",
        contactLanguageFlag = "🇺🇸",
        callType = "audio",
        callDirection = "outgoing",
        duration = "0 mins 0 secs",
        isGroup = false,
        groupName = null,
      } = req.body;

      if (!contactName || !contactName.trim()) {
        res.status(400).json({ error: "Contact name is required." });
        return;
      }

      const insertResult = await pool.query(
        `INSERT INTO calls (
          user_id, contact_name, contact_username, contact_avatar,
          contact_language, contact_language_flag, call_type, call_direction,
          duration, is_group, group_name, started_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
        ) RETURNING *`,
        [
          callerUserId,
          contactName.trim(),
          contactUsername.trim(),
          contactAvatar,
          contactLanguage,
          contactLanguageFlag,
          callType,
          callDirection,
          duration,
          isGroup,
          groupName,
        ]
      );

      const row = insertResult.rows[0];

      res.status(201).json({
        success: true,
        message: "Call logged successfully.",
        call: formatCallRows([row])[0],
      });
    } catch (error: any) {
      console.error("CallController.logCall error:", error);
      res.status(500).json({ error: "Failed to record call." });
    }
  },

  /**
   * 10. Delete Single Call
   */
  async deleteCall(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      if (!id || !isUuid(id)) {
        res.status(200).json({
          success: true,
          message: "Call log deleted successfully.",
          deletedId: id,
        });
        return;
      }

      const deleteResult = await pool.query("DELETE FROM calls WHERE id = $1 RETURNING id", [id]);

      if (deleteResult.rowCount === 0) {
        res.status(404).json({ error: "Call log entry not found." });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Call log deleted successfully.",
        deletedId: id,
      });
    } catch (error: any) {
      console.error("CallController.deleteCall error:", error);
      res.status(500).json({ error: "Failed to delete call log." });
    }
  },

  /**
   * 11. Clear All Calls
   */
  async clearCallHistory(req: Request, res: Response): Promise<void> {
    try {
      await pool.query("DELETE FROM calls");

      res.status(200).json({
        success: true,
        message: "Call history cleared successfully.",
      });
    } catch (error: any) {
      console.error("CallController.clearCallHistory error:", error);
      res.status(500).json({ error: "Failed to clear call history." });
    }
  },
};

function formatCallRows(rows: any[]) {
  return rows.map((row) => {
    const started = new Date(row.started_at);
    const now = new Date();
    const isToday = started.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = started.toDateString() === yesterday.toDateString();

    let dateGroup: "Today" | "Yesterday" | "This Week" = "This Week";
    if (isToday) dateGroup = "Today";
    else if (isYesterday) dateGroup = "Yesterday";

    const typeKey = `${row.call_direction}_${row.call_type}`;

    return {
      id: row.id,
      name: row.contact_name,
      username: row.contact_username || `@${row.contact_name.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
      avatarUrl: row.contact_avatar,
      isGroup: row.is_group || false,
      isOnline: true,
      type: typeKey,
      callType: row.call_type,
      callDirection: row.call_direction,
      timeLabel: started.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      fullDate: `${dateGroup}, ${started.toLocaleDateString([], { month: "short", day: "numeric" })} at ${started.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      duration: row.duration || "0 mins 0 secs",
      language: row.contact_language || "English",
      flag: row.contact_language_flag || "🇺🇸",
      dateGroup,
      startedAt: row.started_at,
    };
  });
}

export default callController;
