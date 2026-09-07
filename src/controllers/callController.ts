import { Request, Response } from "express";
import { pool } from "../config/db";
import { resolvePreferredLanguage, translationService, normalizeLanguageCode } from "../services/translationService";
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
      const preferredLanguage = await resolvePreferredLanguage(req);
      const {
        callerName = "Emma Johnson",
        callerUsername = "@emma_johnson",
        callerAvatar = null,
        callerLanguage = preferredLanguage.language,
        callerLanguageFlag = preferredLanguage.flag,
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
        participantsCount,
        participants = [],
      } = req.body;

      if (!calleeName || !calleeName.trim()) {
        res.status(400).json({ error: "Callee/Recipient name is required." });
        return;
      }

      const cleanCallee = calleeName.trim();
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const numParticipants = Number(participantsCount) || (isGroup ? Math.max(3, (participants?.length || 0) + 1) : 2);

      // 1. Create active call session
      const sessionResult = await pool.query(
        `INSERT INTO call_sessions (
          caller_name, caller_username, caller_avatar, caller_language, caller_language_flag, caller_location,
          callee_name, callee_username, callee_avatar, callee_language, callee_language_flag, callee_location,
          call_type, status, room_id, is_group, group_name, participants_count, active_participants, started_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, 'ringing', $14, $15, $16, $17, $18, NOW()
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
          Boolean(isGroup),
          groupName || null,
          numParticipants,
          JSON.stringify(participants || []),
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

      // 1. Auto-expire any ringing call sessions older than 40 seconds into 'missed'
      await pool.query(
        `UPDATE call_sessions
         SET status = 'missed', ended_at = NOW()
         WHERE status = 'ringing'
           AND started_at < NOW() - interval '40 seconds'`
      );

      // 2. Find any ringing session created within last 40 seconds
      const result = await pool.query(
        `SELECT * FROM call_sessions
         WHERE status = 'ringing'
           AND LOWER(callee_name) = LOWER($1)
           AND started_at >= NOW() - interval '40 seconds'
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

      try {
        const cleanCallee = (row.callee_username || "").replace(/^@/, "").trim();
        const calleeLookup = await pool.query(
          "SELECT email FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1",
          [cleanCallee]
        );
        const calleeEmail = calleeLookup.rows[0]?.email;
        if (calleeEmail) {
          await pool.query(
            `INSERT INTO notifications (user_email, category, title, description, is_unread, created_at)
             VALUES ($1, 'system', 'Missed Call', $2, true, NOW())`,
            [calleeEmail, `You missed a call from ${row.caller_name || "Someone"}.`]
          );
          await sendExpoPushNotification(
            calleeEmail,
            "Missed Call",
            `You missed a call from ${row.caller_name || "Someone"}.`,
            { type: "missed_call" }
          );
        }
      } catch (notifErr) {
        console.warn("Could not send missed call push notification:", notifErr);
      }

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
      const { durationSeconds = 0, remainingCount } = req.body;

      if (!sessionId || !isUuid(sessionId)) {
        res.status(200).json({
          success: true,
          message: "Call ended successfully.",
          status: "ended",
        });
        return;
      }

      // Check current session
      const sessionQuery = await pool.query(
        "SELECT * FROM call_sessions WHERE id = $1",
        [sessionId]
      );

      if (sessionQuery.rows.length === 0) {
        res.status(200).json({
          success: true,
          message: "Call ended successfully.",
          status: "ended",
        });
        return;
      }

      const session = sessionQuery.rows[0];
      const isGroupCall = session.is_group === true || (session.participants_count && Number(session.participants_count) > 2);

      // Requirement 1: If there are more than two people on the call,
      // until the last person drops the call, the call should still continue/count!
      if (isGroupCall && remainingCount !== undefined) {
        const remaining = Number(remainingCount);
        if (remaining > 1) {
          // One person dropped out of group call; group call stays active for remaining participants
          await pool.query(
            `UPDATE call_sessions
             SET participants_count = $2
             WHERE id = $1`,
            [sessionId, remaining]
          );

          res.status(200).json({
            success: true,
            status: "connected",
            callContinues: true,
            remainingParticipants: remaining,
            message: "Participant left group call. Call remains active for remaining participants.",
          });
          return;
        }
      }

      // Requirement 1: For two people on a call (or the last person dropping group call),
      // the entire call terminates completely for all participants!
      const formatted = formatDuration(Number(durationSeconds) || 0);

      const updateResult = await pool.query(
        `UPDATE call_sessions
         SET status = 'ended', ended_at = NOW(), duration_seconds = $2, participants_count = 0
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

      // Ephemeral isolation: Prune in-call messages & audio chunks as soon as the call ends
      pool.query("DELETE FROM call_messages WHERE session_id = $1", [sessionId]).catch(() => {});
      pool.query("DELETE FROM call_audio_chunks WHERE session_id = $1", [sessionId]).catch(() => {});

      res.status(200).json({
        success: true,
        message: "Call ended completely.",
        status: "ended",
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
        `SELECT id, status, room_id, is_group, participants_count, started_at, connected_at, ended_at, duration_seconds,
                is_screen_sharing, screen_sharer_name, screen_sharer_username, screen_sharer_avatar,
                screen_share_content_type, screen_share_title, screen_share_frame, screen_share_started_at
         FROM call_sessions WHERE id = $1`,
        [sessionId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "Session not found." });
        return;
      }

      const row = result.rows[0];

      // Auto-expire to 'missed' if ringing for 40+ seconds without response
      if (row.status === "ringing" && row.started_at) {
        const startTime = new Date(row.started_at).getTime();
        const elapsedSecs = (Date.now() - startTime) / 1000;
        if (elapsedSecs >= 40) {
          await pool.query(
            "UPDATE call_sessions SET status = 'missed', ended_at = NOW() WHERE id = $1",
            [sessionId]
          );
          row.status = "missed";
        }
      }

      res.status(200).json({
        success: true,
        session: {
          id: row.id,
          status: row.status,
          roomId: row.room_id,
          isGroup: row.is_group,
          participantsCount: row.participants_count,
          startedAt: row.started_at,
          connectedAt: row.connected_at,
          endedAt: row.ended_at,
          durationSeconds: row.duration_seconds,
          isScreenSharing: Boolean(row.is_screen_sharing),
          screenSharerName: row.screen_sharer_name || null,
          screenSharerUsername: row.screen_sharer_username || null,
          screenSharerAvatar: row.screen_sharer_avatar || null,
          screenShareContentType: row.screen_share_content_type || "screen",
          screenShareTitle: row.screen_share_title || null,
          screenShareFrame: row.screen_share_frame || null,
          screenShareStartedAt: row.screen_share_started_at || null,
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
      const preferredLanguage = await resolvePreferredLanguage(req);
      const {
        text,
        audioBase64,
        sourceLanguage = "en",
        targetLanguage = preferredLanguage.language
      } = req.body;

      if (!text && !audioBase64) {
        res.status(400).json({ error: "Speech transcript text or audio data is required." });
        return;
      }

      let originalText = text?.trim() || "";
      let translatedText = originalText;
      let audioUrl = null;

      if (audioBase64) {
        // Genesia Speech-to-Speech Integration
        try {
          const audioBuffer = Buffer.from(audioBase64, "base64");
          const s2sResult = await translationService.translateSpeech(
            audioBuffer,
            sourceLanguage,
            targetLanguage
          );

          if (s2sResult) {
            originalText = s2sResult.transcription;
            translatedText = s2sResult.translation;
            audioUrl = s2sResult.audio_url;
          }
        } catch (audioErr) {
          console.warn("Call speech audio translation error:", audioErr);
        }
      } else if (originalText && normalizeLanguageCode(sourceLanguage) !== normalizeLanguageCode(targetLanguage)) {
        const transResult = await translationService.translateText(
          originalText,
          targetLanguage,
          sourceLanguage
        );
        translatedText = transResult.translatedText;
      }

      res.status(200).json({
        success: true,
        originalText,
        sourceLanguage,
        translatedText,
        targetLanguage,
        audioUrl,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("CallController.translateCallSpeech error:", error);
      res.status(500).json({ error: "Failed to translate speech transcript." });
    }
  },

  /**
   * 7b. Send In-Call Audio Chunk (Real-Time Audio Stream from participant)
   * POST /api/calls/:sessionId/audio
   */
  async sendCallAudio(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.params.sessionId as string;
      const {
        senderName = "Caller",
        senderUserId,
        audioBase64,
        sequenceId = 1,
        sourceLanguage,
        targetLanguage,
        isDubbingActive = true,
      } = req.body;

      if (!sessionId || !audioBase64) {
        res.status(400).json({ error: "Session ID and audioBase64 are required." });
        return;
      }

      let playAudioBase64 = audioBase64;
      let originalText: string | null = null;
      let translatedText: string | null = null;

      if (isUuid(sessionId)) {
        // Resolve source and target language if not explicitly provided
        let resolvedSourceLang = sourceLanguage;
        let resolvedTargetLang = targetLanguage;

        if (!resolvedSourceLang || !resolvedTargetLang) {
          try {
            const sessRes = await pool.query(
              "SELECT caller_name, caller_language, callee_name, callee_language FROM call_sessions WHERE id = $1",
              [sessionId]
            );
            if (sessRes.rows.length > 0) {
              const sess = sessRes.rows[0];
              const isCaller = !sess.caller_name || sess.caller_name.toLowerCase() === senderName.toLowerCase();
              resolvedSourceLang = resolvedSourceLang || (isCaller ? sess.caller_language : sess.callee_language) || "English";
              resolvedTargetLang = resolvedTargetLang || (isCaller ? sess.callee_language : sess.caller_language) || "Spanish";
            }
          } catch {}
        }

        resolvedSourceLang = resolvedSourceLang || "English";
        resolvedTargetLang = resolvedTargetLang || "Spanish";

        // If dubbing is active and languages differ, perform real-time Speech-to-Speech translation
        if (isDubbingActive && normalizeLanguageCode(resolvedSourceLang) !== normalizeLanguageCode(resolvedTargetLang)) {
          try {
            const cleanB64 = audioBase64.replace(/^data:[^;]+;base64,/, "");
            const audioBuffer = Buffer.from(cleanB64, "base64");
            if (audioBuffer.length > 100) {
              const s2s = await translationService.translateSpeech(
                audioBuffer,
                resolvedSourceLang,
                resolvedTargetLang
              );
              if (s2s && s2s.audio_url) {
                playAudioBase64 = s2s.audio_url;
                originalText = s2s.transcription || null;
                translatedText = s2s.translation || null;
              }
            }
          } catch (dubErr) {
            console.warn("Speech dubbing synthesis error, keeping original audio:", dubErr);
          }
        }

        await pool.query(
          `INSERT INTO call_audio_chunks (session_id, sender_name, sender_user_id, audio_base64, sequence_id, original_text, translated_text, target_language, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
          [
            sessionId,
            senderName,
            senderUserId || null,
            playAudioBase64,
            Number(sequenceId) || 1,
            originalText,
            translatedText,
            resolvedTargetLang,
          ]
        );

        // Prune older audio chunks (> 60 seconds) so DB stays tiny and fast
        pool.query(
          "DELETE FROM call_audio_chunks WHERE session_id = $1 AND created_at < NOW() - interval '60 seconds'",
          [sessionId]
        ).catch(() => {});
      }

      res.status(200).json({
        success: true,
        sequenceId,
        originalText,
        translatedText,
        audioBase64: playAudioBase64,
      });
    } catch (error: any) {
      console.warn("CallController.sendCallAudio error:", error?.message || error);
      res.status(200).json({ success: false, error: error?.message });
    }
  },

  /**
   * 7c. Get In-Call Audio Chunks (Incoming Audio from the other participant)
   * GET /api/calls/:sessionId/audio
   */
  async getCallAudio(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.params.sessionId as string;
      const afterSeq = Number(req.query.afterSeq) || 0;
      const excludeSender = (req.query.excludeSender as string) || "";

      if (!sessionId || !isUuid(sessionId)) {
        res.status(200).json({ success: true, chunks: [] });
        return;
      }

      let queryText = `
        SELECT id, sender_name, sender_user_id, audio_base64, sequence_id, original_text, translated_text, target_language, created_at
        FROM call_audio_chunks
        WHERE session_id = $1
          AND sequence_id > $2
      `;
      const params: any[] = [sessionId, afterSeq];

      if (excludeSender && excludeSender.trim()) {
        params.push(excludeSender.trim());
        queryText += ` AND LOWER(sender_name) != LOWER($${params.length})`;
      }

      queryText += " ORDER BY sequence_id ASC LIMIT 10";

      const result = await pool.query(queryText, params);

      res.status(200).json({
        success: true,
        chunks: result.rows.map((r) => ({
          id: r.id,
          senderName: r.sender_name,
          senderUserId: r.sender_user_id,
          audioBase64: r.audio_base64,
          sequenceId: r.sequence_id,
          originalText: r.original_text,
          translatedText: r.translated_text,
          targetLanguage: r.target_language,
          createdAt: r.created_at,
        })),
      });
    } catch (error: any) {
      console.warn("CallController.getCallAudio error:", error?.message || error);
      res.status(200).json({ success: false, chunks: [] });
    }
  },

  /**
   * 7d. Send Ephemeral In-Call Chat Message (Active during call only)
   * POST /api/calls/:sessionId/chat
   */
  async sendInCallMessage(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.params.sessionId as string;
      const {
        senderName = "You",
        senderUserId = null,
        text,
        sourceLanguage = "en",
        targetLanguage = "en",
      } = req.body;

      if (!sessionId || !text || !text.trim()) {
        res.status(400).json({ error: "sessionId and message text are required." });
        return;
      }

      const cleanText = text.trim();
      let translatedText = cleanText;

      // Auto-translate if languages differ
      if (
        sourceLanguage &&
        targetLanguage &&
        normalizeLanguageCode(sourceLanguage) !== normalizeLanguageCode(targetLanguage)
      ) {
        try {
          const transResult = await translationService.translateText(
            cleanText,
            targetLanguage,
            sourceLanguage
          );
          if (transResult?.translatedText) {
            translatedText = transResult.translatedText;
          }
        } catch (transErr) {
          console.warn("In-call message auto-translation error:", transErr);
        }
      }

      let nextSeq = 1;
      if (isUuid(sessionId)) {
        const seqResult = await pool.query(
          "SELECT COALESCE(MAX(sequence_id), 0) + 1 AS next_seq FROM call_messages WHERE session_id = $1",
          [sessionId]
        );
        nextSeq = Number(seqResult.rows[0]?.next_seq) || 1;

        const insertRes = await pool.query(
          `INSERT INTO call_messages (session_id, sender_name, sender_user_id, original_text, translated_text, target_language, sequence_id, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           RETURNING *`,
          [sessionId, senderName, senderUserId, cleanText, translatedText, targetLanguage, nextSeq]
        );

        const row = insertRes.rows[0];
        res.status(201).json({
          success: true,
          message: {
            id: row.id,
            sessionId: row.session_id,
            sender: senderName,
            original: row.original_text,
            translated: row.translated_text,
            sequenceId: row.sequence_id,
            createdAt: row.created_at,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: {
          id: Date.now().toString(),
          sessionId,
          sender: senderName,
          original: cleanText,
          translated: translatedText,
          sequenceId: 1,
          createdAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error("CallController.sendInCallMessage error:", error);
      res.status(500).json({ error: "Failed to send in-call message." });
    }
  },

  /**
   * 7e. Get Ephemeral In-Call Chat Messages (Active during call only)
   * GET /api/calls/:sessionId/chat
   */
  async getInCallMessages(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.params.sessionId as string;
      const afterSeq = Number(req.query.afterSeq) || 0;

      if (!sessionId || !isUuid(sessionId)) {
        res.status(200).json({ success: true, messages: [] });
        return;
      }

      const result = await pool.query(
        `SELECT id, session_id, sender_name, sender_user_id, original_text, translated_text, sequence_id, created_at
         FROM call_messages
         WHERE session_id = $1 AND sequence_id > $2
         ORDER BY sequence_id ASC LIMIT 50`,
        [sessionId, afterSeq]
      );

      res.status(200).json({
        success: true,
        messages: result.rows.map((r) => ({
          id: r.id,
          sessionId: r.session_id,
          sender: r.sender_name,
          original: r.original_text,
          translated: r.translated_text,
          sequenceId: r.sequence_id,
          createdAt: r.created_at,
        })),
      });
    } catch (error: any) {
      console.warn("CallController.getInCallMessages error:", error);
      res.status(200).json({ success: false, messages: [] });
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

      let query = `
        SELECT c.*, COALESCE(NULLIF(u.avatar_url, ''), c.contact_avatar) AS dynamic_avatar_url
        FROM calls c
        LEFT JOIN users u ON (
          LOWER(TRIM(u.name)) = LOWER(TRIM(c.contact_name))
          OR LOWER(TRIM(REPLACE(u.username, '@', ''))) = LOWER(TRIM(REPLACE(c.contact_username, '@', '')))
        )
        WHERE c.user_id = $1
      `;
      const params: any[] = [userId];

      if (direction && typeof direction === "string" && direction !== "all") {
        if (direction.toLowerCase() === "missed") {
          query += ` AND (LOWER(c.call_direction) = 'missed' OR LOWER(c.call_status) = 'missed')`;
        } else {
          params.push(direction.toLowerCase());
          query += ` AND LOWER(c.call_direction) = $${params.length}`;
        }
      }

      if (search && typeof search === "string" && search.trim()) {
        params.push(`%${search.trim().toLowerCase()}%`);
        query += ` AND (LOWER(c.contact_name) LIKE $${params.length} OR LOWER(c.contact_username) LIKE $${params.length} OR LOWER(c.contact_language) LIKE $${params.length})`;
      }

      query += " ORDER BY c.started_at DESC";

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
   * 10b. Start Screen Share in Call Session
   * POST /api/calls/:sessionId/screen-share/start
   */
  async startScreenShare(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.params.sessionId as string;
      const {
        sharerName = "Presenter",
        sharerUsername = "@user",
        sharerAvatar = null,
        contentType = "screen", // 'screen' | 'presentation' | 'document' | 'window'
        title = "Screen Sharing Presentation",
        initialFrame = null,
      } = req.body;

      if (!sessionId || !isUuid(sessionId)) {
        res.status(200).json({
          success: true,
          message: "Screen share active.",
          screenShare: {
            isScreenSharing: true,
            screenSharerName: sharerName,
            screenSharerUsername: sharerUsername,
            screenSharerAvatar: sharerAvatar,
            screenShareContentType: contentType,
            screenShareTitle: title,
            screenShareFrame: initialFrame,
          },
        });
        return;
      }

      const result = await pool.query(
        `UPDATE call_sessions
         SET is_screen_sharing = true,
             screen_sharer_name = $1,
             screen_sharer_username = $2,
             screen_sharer_avatar = $3,
             screen_share_content_type = $4,
             screen_share_title = $5,
             screen_share_frame = $6,
             screen_share_started_at = NOW()
         WHERE id = $7
         RETURNING *`,
        [sharerName, sharerUsername, sharerAvatar, contentType, title, initialFrame, sessionId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "Call session not found." });
        return;
      }

      const row = result.rows[0];

      res.status(200).json({
        success: true,
        message: "Screen sharing started.",
        screenShare: {
          isScreenSharing: true,
          screenSharerName: row.screen_sharer_name,
          screenSharerUsername: row.screen_sharer_username,
          screenSharerAvatar: row.screen_sharer_avatar,
          screenShareContentType: row.screen_share_content_type,
          screenShareTitle: row.screen_share_title,
          screenShareFrame: row.screen_share_frame,
          screenShareStartedAt: row.screen_share_started_at,
        },
      });
    } catch (error: any) {
      console.error("CallController.startScreenShare error:", error);
      res.status(500).json({ error: "Failed to start screen share." });
    }
  },

  /**
   * 10c. Stop Screen Share in Call Session
   * POST /api/calls/:sessionId/screen-share/stop
   */
  async stopScreenShare(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.params.sessionId as string;

      if (!sessionId || !isUuid(sessionId)) {
        res.status(200).json({
          success: true,
          message: "Screen share stopped.",
        });
        return;
      }

      await pool.query(
        `UPDATE call_sessions
         SET is_screen_sharing = false,
             screen_sharer_name = NULL,
             screen_sharer_username = NULL,
             screen_sharer_avatar = NULL,
             screen_share_frame = NULL,
             screen_share_title = NULL,
             screen_share_started_at = NULL
         WHERE id = $1`,
        [sessionId]
      );

      res.status(200).json({
        success: true,
        message: "Screen sharing stopped.",
      });
    } catch (error: any) {
      console.error("CallController.stopScreenShare error:", error);
      res.status(500).json({ error: "Failed to stop screen share." });
    }
  },

  /**
   * 10d. Get Screen Share State & Active Frame
   * GET /api/calls/:sessionId/screen-share
   */
  async getScreenShare(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.params.sessionId as string;

      if (!sessionId || !isUuid(sessionId)) {
        res.status(200).json({
          success: true,
          screenShare: {
            isScreenSharing: false,
          },
        });
        return;
      }

      const result = await pool.query(
        `SELECT is_screen_sharing, screen_sharer_name, screen_sharer_username, screen_sharer_avatar,
                screen_share_content_type, screen_share_title, screen_share_frame, screen_share_started_at
         FROM call_sessions WHERE id = $1`,
        [sessionId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "Session not found." });
        return;
      }

      const row = result.rows[0];

      res.status(200).json({
        success: true,
        screenShare: {
          isScreenSharing: Boolean(row.is_screen_sharing),
          screenSharerName: row.screen_sharer_name,
          screenSharerUsername: row.screen_sharer_username,
          screenSharerAvatar: row.screen_sharer_avatar,
          screenShareContentType: row.screen_share_content_type,
          screenShareTitle: row.screen_share_title,
          screenShareFrame: row.screen_share_frame,
          screenShareStartedAt: row.screen_share_started_at,
        },
      });
    } catch (error: any) {
      console.error("CallController.getScreenShare error:", error);
      res.status(500).json({ error: "Failed to get screen share state." });
    }
  },

  /**
   * 10e. Update Screen Share Frame / Slide
   * POST /api/calls/:sessionId/screen-share/frame
   */
  async updateScreenShareFrame(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.params.sessionId as string;
      const { frame, title, contentType } = req.body;

      if (!sessionId || !isUuid(sessionId)) {
        res.status(200).json({ success: true });
        return;
      }

      await pool.query(
        `UPDATE call_sessions
         SET screen_share_frame = $1,
             screen_share_title = COALESCE($2, screen_share_title),
             screen_share_content_type = COALESCE($3, screen_share_content_type)
         WHERE id = $4 AND is_screen_sharing = true`,
        [frame || null, title || null, contentType || null, sessionId]
      );

      res.status(200).json({
        success: true,
        message: "Frame updated successfully.",
      });
    } catch (error: any) {
      console.error("CallController.updateScreenShareFrame error:", error);
      res.status(500).json({ error: "Failed to update screen share frame." });
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

    const isMissed = row.call_direction === "missed" || row.call_status === "missed";
    const typeKey = isMissed ? `missed_${row.call_type}` : `${row.call_direction}_${row.call_type}`;

    return {
      id: row.id,
      name: row.contact_name,
      username: row.contact_username || `@${row.contact_name.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
      avatarUrl: row.dynamic_avatar_url || row.contact_avatar,
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
