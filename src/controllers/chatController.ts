import { Request, Response } from "express";
import { pool } from "../config/db";
import { translationService, normalizeLanguageCode, resolvePreferredLanguage } from "../services/translationService";
import { dubbingService } from "../services/dubbingService";
import { sendExpoPushNotification } from "./notificationController";

function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export const chatController = {
  /**
   * 1. Get All Conversations (Direct & Groups)
   */
  async getConversations(req: Request, res: Response): Promise<void> {
    try {
      const typeFilter = req.query.type as string; // 'direct' | 'group' | 'all'
      const user = (req as any).user;
      const userId = user?.userId || user?.id || (req.headers["x-user-id"] as string);

      let query = "SELECT * FROM conversations";
      const params: any[] = [];

      if (typeFilter && (typeFilter === "direct" || typeFilter === "group")) {
        query += " WHERE type = $1";
        params.push(typeFilter);
      }

      query += " ORDER BY last_message_time DESC";

      const refreshedResult = await pool.query(query, params);

      // Also retrieve groups from `groups` table to ensure every group created shows up under the Groups tab
      let groupRows: any[] = [];
      if (!typeFilter || typeFilter === "group" || typeFilter === "all") {
        let groupQuery = "SELECT * FROM groups";
        const groupParams: any[] = [];
        if (userId) {
          groupQuery += " WHERE created_by = $1 OR members::text ILIKE $2";
          groupParams.push(userId, `%${userId}%`);
        }
        groupQuery += " ORDER BY created_at DESC";
        const groupsRes = await pool.query(groupQuery, groupParams);
        groupRows = groupsRes.rows;
      }

      const dbConversations = await Promise.all(refreshedResult.rows.map(async (row) => {
        let displayName = row.title;
        let displayAvatar = row.avatar_url;
        let recipientLang = row.recipient_lang || "English";
        let recipientLangFlag = row.recipient_lang_flag || "🇺🇸";

        // Direct-chat partner & language resolution relative to viewer
        if (row.type === "direct") {
          let partnerFound = false;

          // 1. Check participants array if available
          let participantsList: string[] = [];
          if (Array.isArray(row.participants)) {
            participantsList = row.participants
              .map((p: any) => (typeof p === "string" ? p : (p.id || p.userId || "")))
              .filter(Boolean);
          }

          const otherParticipantId = participantsList.find((pId: string) => userId && pId !== userId);
          if (otherParticipantId) {
            const partUser = await pool.query(
              "SELECT id, name, avatar_url, native_language, native_language_flag FROM users WHERE id = $1 LIMIT 1",
              [otherParticipantId]
            );
            if (partUser.rows.length > 0) {
              displayName = partUser.rows[0].name;
              displayAvatar = partUser.rows[0].avatar_url || displayAvatar;
              recipientLang = partUser.rows[0].native_language || recipientLang;
              recipientLangFlag = partUser.rows[0].native_language_flag || recipientLangFlag;
              partnerFound = true;
            }
          }

          // 2. Check messages in conversation for other sender
          if (!partnerFound && userId) {
            const msgSender = await pool.query(
              `SELECT sender_id, sender_name, sender_avatar, sender_language, sender_language_flag
               FROM messages
               WHERE conversation_id = $1 AND sender_id IS NOT NULL AND sender_id != $2
               ORDER BY created_at DESC LIMIT 1`,
              [row.id, userId]
            );
            if (msgSender.rows.length > 0) {
              const otherId = msgSender.rows[0].sender_id;
              const uRes = await pool.query(
                "SELECT id, name, avatar_url, native_language, native_language_flag FROM users WHERE id = $1 LIMIT 1",
                [otherId]
              );
              if (uRes.rows.length > 0) {
                displayName = uRes.rows[0].name;
                displayAvatar = uRes.rows[0].avatar_url || displayAvatar;
                recipientLang = uRes.rows[0].native_language || recipientLang;
                recipientLangFlag = uRes.rows[0].native_language_flag || recipientLangFlag;
                partnerFound = true;
              } else {
                displayName = msgSender.rows[0].sender_name;
                displayAvatar = msgSender.rows[0].sender_avatar || displayAvatar;
                recipientLang = msgSender.rows[0].sender_language || recipientLang;
                recipientLangFlag = msgSender.rows[0].sender_language_flag || recipientLangFlag;
                partnerFound = true;
              }
            }
          }

          // 3. Check contacts table
          if (!partnerFound && userId) {
            const cRes = await pool.query(
              `SELECT c.*, u.name as u_name, u.avatar_url as u_avatar, u.native_language as u_lang, u.native_language_flag as u_flag
               FROM contacts c
               LEFT JOIN users u ON u.id = c.user_id
               WHERE c.contact_user_id = $1
               LIMIT 1`,
              [userId]
            );
            if (cRes.rows.length > 0) {
              displayName = cRes.rows[0].u_name || cRes.rows[0].name;
              displayAvatar = cRes.rows[0].u_avatar || displayAvatar;
              recipientLang = cRes.rows[0].u_lang || recipientLang;
              recipientLangFlag = cRes.rows[0].u_flag || recipientLangFlag;
              partnerFound = true;
            }
          }

          // 4. Fallback if displayName matches current viewer's name
          if (user?.name && displayName.toLowerCase().trim() === user.name.toLowerCase().trim()) {
            const otherUser = await pool.query(
              "SELECT id, name, avatar_url, native_language, native_language_flag FROM users WHERE id != $1 LIMIT 1",
              [userId || "00000000-0000-0000-0000-000000000000"]
            );
            if (otherUser.rows.length > 0) {
              displayName = otherUser.rows[0].name;
              displayAvatar = otherUser.rows[0].avatar_url || displayAvatar;
              recipientLang = otherUser.rows[0].native_language || recipientLang;
              recipientLangFlag = otherUser.rows[0].native_language_flag || recipientLangFlag;
            }
          }
        }

        // 🛡️ FIX: Hide unread badge if the current user is the one who sent the last message
        const isMeTheSender = (userId && row.last_sender_id === userId);
        const unreadCount = isMeTheSender ? 0 : (row.unread_count || 0);

        return {
          id: row.id,
          name: displayName,
          avatarUrl: displayAvatar,
          category: row.type,
          isGroup: row.type === "group",
          lastMessage: row.last_message || "Start conversation",
          time: row.last_message_time ? new Date(row.last_message_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now",
          unreadCount,
          recipientLang,
          recipientLangFlag,
          participants: row.participants || [],
          createdAt: row.created_at,
        };
      }));

      // Combine and deduplicate
      const existingNames = new Set(dbConversations.map((c) => c.name.toLowerCase()));
      const extraGroupChats = groupRows
        .filter((g) => !existingNames.has(g.name.toLowerCase()))
        .map((g) => ({
          id: g.id,
          name: g.name,
          avatarUrl: g.avatar_url,
          category: "group",
          isGroup: true,
          lastMessage: `Group chat active. Link: ${g.invite_link}`,
          time: new Date(g.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          unreadCount: 0,
          recipientLang: (g.languages && g.languages.length > 0) ? g.languages[0] : "English",
          recipientLangFlag: "🌐",
          inviteLink: g.invite_link,
          participants: g.members || [],
          createdAt: g.created_at,
        }));

      const allChats = [...dbConversations, ...extraGroupChats];

      res.status(200).json({
        success: true,
        count: allChats.length,
        chats: allChats,
      });
    } catch (error: any) {
      console.error("ChatController.getConversations error:", error);
      res.status(500).json({ error: "Failed to retrieve conversations." });
    }
  },

  /**
   * 2. Create a Conversation
   */
  async createConversation(req: Request, res: Response): Promise<void> {
    try {
      const {
        title,
        type = "direct", // 'direct' | 'group'
        avatarUrl = null,
        recipientLang = "English",
        recipientLangFlag = "🇺🇸",
        participants = [],
        initialMessage = "",
      } = req.body;

      if (!title || !title.trim()) {
        res.status(400).json({ error: "Conversation title/name is required." });
        return;
      }

      const cleanTitle = title.trim();

      const insertResult = await pool.query(
        `INSERT INTO conversations (
          title, type, avatar_url, recipient_lang, recipient_lang_flag,
          participants, last_message, last_message_time
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, NOW()
        ) RETURNING *`,
        [
          cleanTitle,
          type === "group" ? "group" : "direct",
          avatarUrl,
          recipientLang,
          recipientLangFlag,
          JSON.stringify(participants),
          initialMessage || "Conversation started",
        ]
      );

      const row = insertResult.rows[0];

      res.status(201).json({
        success: true,
        conversation: {
          id: row.id,
          name: row.title,
          category: row.type,
          isGroup: row.type === "group",
          avatarUrl: row.avatar_url,
          lastMessage: row.last_message,
          time: "Just now",
          unreadCount: 0,
          recipientLang: row.recipient_lang,
          recipientLangFlag: row.recipient_lang_flag,
          participants: row.participants,
          createdAt: row.created_at,
        },
      });
    } catch (error: any) {
      console.error("ChatController.createConversation error:", error);
      res.status(500).json({ error: "Failed to create conversation." });
    }
  },

  /**
   * 3. Get Messages for a Conversation (With Dynamic Participant Language Translation)
   */
  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const preferredLanguage = await resolvePreferredLanguage(req);
      const authenticatedUser = (req as any).user;
      const viewerUserId = authenticatedUser?.userId || authenticatedUser?.id || (req.headers["x-user-id"] as string);

      const userLanguage =
        (req.query.userLanguage as string) ||
        (req.headers["x-user-language"] as string) ||
        authenticatedUser?.nativeLanguage ||
        authenticatedUser?.native_language ||
        preferredLanguage.language;
      const userLanguageFlag =
        (req.query.userLanguageFlag as string) ||
        (req.headers["x-user-language-flag"] as string) ||
        authenticatedUser?.nativeLanguageFlag ||
        authenticatedUser?.native_language_flag ||
        preferredLanguage.flag;

      if (!id || !isUuid(id)) {
        // Return clean empty message list for non-UUID mock ids
        res.status(200).json({
          success: true,
          count: 0,
          messages: [],
        });
        return;
      }

      let targetConvId = id;
      let result = await pool.query(
        "SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
        [targetConvId]
      );

      // If no messages found, check if `id` is a contact ID or participant ID belonging to an existing conversation
      if (result.rows.length === 0) {
        const linkedConv = await pool.query(
          `SELECT id FROM conversations
           WHERE id = $1
              OR participants::text ILIKE $2
              OR id IN (
                SELECT user_id FROM contacts WHERE id = $1 OR contact_user_id = $1
                UNION
                SELECT contact_user_id FROM contacts WHERE id = $1 OR user_id = $1
              )
           LIMIT 1`,
          [id, `%"${id}"%`]
        );
        if (linkedConv.rows.length > 0 && linkedConv.rows[0].id !== id) {
          targetConvId = linkedConv.rows[0].id;
          result = await pool.query(
            "SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
            [targetConvId]
          );
        }
      }

      const messages = await Promise.all(
        result.rows.map(async (row) => {
          let translatedText = row.translated_text || row.original_text;
          let targetLang = row.target_language || "English";
          let targetFlag = row.target_language_flag || "🇺🇸";

          // 🛡️ CRITICAL FIX: If the viewer IS the sender, we show them the original recipient's translation.
          // This avoids the "reverting to English" bug where the sender sees their own message translated back to their language.
          const isViewerSender =
            (viewerUserId && row.sender_id === viewerUserId) ||
            (authenticatedUser?.username && row.sender_username === authenticatedUser.username) ||
            (authenticatedUser?.name && row.sender_name === authenticatedUser.name);

          if (isViewerSender) {
            // SENDER PERSPECTIVE:
            // Primary = Original Text (Sender's native tongue)
            // Translated = What the RECIPIENT received (Confirming delivery)
            translatedText = row.translated_text || row.original_text;
            targetLang = row.target_language;
            targetFlag = row.target_language_flag;

            // 🛡️ RECIPIENT TRANSLATION RECOVERY:
            // If targetLang was mistakenly saved as the same as sender_language,
            // resolve the other participant's language and translate into their language.
            const isSenderSameAsTarget = normalizeLanguageCode(targetLang) === normalizeLanguageCode(row.sender_language);
            if (isSenderSameAsTarget && row.original_text && (!row.translated_text || row.translated_text === row.original_text)) {
              const otherUserRes = await pool.query(
                `SELECT native_language, native_language_flag FROM users WHERE id != $1 AND LOWER(native_language) != LOWER($2) LIMIT 1`,
                [row.sender_id || "00000000-0000-0000-0000-000000000000", row.sender_language]
              );
              if (otherUserRes.rows[0]?.native_language) {
                const partnerLang = otherUserRes.rows[0].native_language;
                const partnerFlag = otherUserRes.rows[0].native_language_flag || "🌐";
                try {
                  const transRes = await translationService.translateText(
                    row.original_text,
                    partnerLang,
                    row.sender_language
                  );
                  translatedText = transRes.translatedText;
                  targetLang = partnerLang;
                  targetFlag = partnerFlag;

                  // Heal DB row asynchronously
                  pool.query(
                    `UPDATE messages SET translated_text = $1, target_language = $2, target_language_flag = $3 WHERE id = $4`,
                    [translatedText, targetLang, targetFlag, row.id]
                  ).catch(() => {});
                } catch {}
              }
            }
          } else if (userLanguage && row.original_text) {
            // RECEIVER PERSPECTIVE:
            // We must ensure the PRIMARY text is translated into the viewer's language.
            const senderLang = row.sender_language || "English";

            const isTargetMatched = normalizeLanguageCode(row.target_language) === normalizeLanguageCode(userLanguage);
            const isSenderMatched = normalizeLanguageCode(senderLang) === normalizeLanguageCode(userLanguage);

            if (isTargetMatched && row.translated_text) {
              // DB already has the translation for this viewer
              translatedText = row.translated_text;
              targetLang = userLanguage;
              targetFlag = userLanguageFlag || row.target_language_flag || "🌐";
            } else if (!isSenderMatched) {
              // Viewer speaks a different language than the sender
              // Trigger on-the-fly translation into viewer's language
              try {
                const transRes = await translationService.translateText(
                  row.original_text,
                  userLanguage,
                  senderLang
                );
                translatedText = transRes.translatedText;
                targetLang = userLanguage;
                targetFlag = transRes.targetLanguageFlag || userLanguageFlag || "🌐";
              } catch {
                translatedText = row.translated_text || row.original_text;
              }
            } else {
              // Viewer and sender speak the same language
              translatedText = row.original_text;
              targetLang = userLanguage;
              targetFlag = userLanguageFlag || "🇺🇸";
            }
          } else if (userLanguage) {
            targetLang = userLanguage;
            targetFlag = userLanguageFlag || "🇺🇸";
          }

          const isAudioType =
            row.message_type === "audio" ||
            (row.original_text && row.original_text.startsWith("Voice Note")) ||
            (row.translated_text && row.translated_text.startsWith("Voice Note"));

          // Sender hears sender's voice/language, recipient hears translated voice/language
          let resolvedAudioUrl = isViewerSender
            ? (row.media_url || row.audio_url)
            : (row.audio_url || row.media_url);

          if (isAudioType && (!resolvedAudioUrl || !resolvedAudioUrl.trim())) {
            // Asynchronously generate audio in background without blocking message response
            setImmediate(async () => {
              try {
                const textToSpeak = isViewerSender
                  ? (row.original_text && !row.original_text.startsWith("Voice Note")
                      ? row.original_text
                      : `Voice note from ${row.sender_name || "sender"}.`)
                  : (translatedText && !translatedText.startsWith("Voice Note")
                      ? translatedText
                      : (row.original_text || "Voice note."));
                const speakLang = isViewerSender ? (row.sender_language || "en") : (targetLang || userLanguage || "en");
                const tts = await dubbingService.synthesizeSpeech(textToSpeak, speakLang);
                if (tts?.audioDataUri) {
                  pool.query("UPDATE messages SET audio_url = $1 WHERE id = $2", [tts.audioDataUri, row.id]).catch(() => {});
                }
              } catch (err) {
                // Background TTS fallback
              }
            });
          }

          return {
            id: row.id,
            conversationId: row.conversation_id,
            senderId: row.sender_id,
            senderName: row.sender_name,
            senderUsername: row.sender_username,
            senderAvatar: row.sender_avatar,
            senderLanguage: row.sender_language || "English",
            senderLanguageFlag: row.sender_language_flag || "🇺🇸",
            text: row.original_text,
            translatedText,
            targetLanguage: targetLang,
            targetLanguageFlag: targetFlag,
            messageType: isAudioType ? "audio" : (row.message_type || "text"),
            audioUrl: resolvedAudioUrl,
            audioDuration: row.audio_duration || "0:02",
            mediaUrl: row.media_url,
            timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            createdAt: row.created_at,
          };
        })
      );

      res.status(200).json({
        success: true,
        count: messages.length,
        messages,
      });
    } catch (error: any) {
      console.error("ChatController.getMessages error:", error);
      res.status(500).json({ error: "Failed to retrieve messages." });
    }
  },

  /**
   * 4. Send Message (With Automatic Neural Translation into Recipient Language)
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const preferredLanguage = await resolvePreferredLanguage(req);
      const {
        text,
        senderName = "Emma Johnson",
        senderUsername = "@emma_johnson",
        senderAvatar = null,
        senderLanguage = "English",
        senderLanguageFlag = "🇺🇸",
        recipientName = null,
        recipientAvatar = null,
        targetLanguage = preferredLanguage.language,
        targetLanguageFlag = preferredLanguage.flag,
        messageType = "text",
        audioUrl = null,
        audioDuration = null,
        mediaUrl = null,
      } = req.body;

      // 🛡️ RECIPIENT LANGUAGE RESOLUTION ENGINE
      // We must ensure the message is translated into the OTHER person's native language.
      let resolvedTargetLanguage = targetLanguage;
      let resolvedTargetLanguageFlag = targetLanguageFlag;

      const authenticatedUser = (req as any).user;
      const currentUserId = authenticatedUser?.userId || authenticatedUser?.id || (req.headers["x-user-id"] as string) || null;
      const currentUserEmail = authenticatedUser?.email || (req.headers["x-user-email"] as string) || null;

      // 1. If it's a direct chat (UUID), find the OTHER person's language from their profile
      if (isUuid(id)) {
        const conversationLookup = await pool.query(
          "SELECT type, participants FROM conversations WHERE id = $1 LIMIT 1",
          [id]
        );

        if (conversationLookup.rows.length > 0) {
          const conv = conversationLookup.rows[0];
          if (conv.type === "direct" && Array.isArray(conv.participants)) {
            // 🛡️ Robust Filtering: Find participant who is definitely NOT the sender
            const otherParticipant = conv.participants.find((p: any) => {
              const pId = typeof p === "string" ? p : (p.id || p.userId);
              const pEmail = typeof p === "object" ? p.email : null;

              const isMatchById = currentUserId && pId && String(pId) === String(currentUserId);
              const isMatchByEmail = currentUserEmail && pEmail && String(pEmail).toLowerCase() === String(currentUserEmail).toLowerCase();

              return !isMatchById && !isMatchByEmail;
            });

            if (otherParticipant) {
              const targetId = typeof otherParticipant === "string" ? otherParticipant : (otherParticipant.id || otherParticipant.userId || "00000000-0000-0000-0000-000000000000");
              const targetEmail = typeof otherParticipant === "object" ? (otherParticipant.email || "") : "";
              const profileLookup = await pool.query(
                `SELECT native_language, native_language_flag FROM users WHERE id = $1 OR (LOWER(email) = LOWER($2) AND $2 != '')
                 UNION ALL
                 SELECT native_language, native_language_flag FROM contacts WHERE id = $1 OR (LOWER(email) = LOWER($2) AND $2 != '')
                 LIMIT 1`,
                [targetId, targetEmail]
              );

              if (profileLookup.rows[0]?.native_language) {
                resolvedTargetLanguage = profileLookup.rows[0].native_language;
                resolvedTargetLanguageFlag = profileLookup.rows[0].native_language_flag || resolvedTargetLanguageFlag;
              }
            } else if (currentUserId) {
              // Participant array might not have had other user, check past messages
              const prevMsg = await pool.query(
                "SELECT sender_id, sender_language, sender_language_flag FROM messages WHERE conversation_id = $1 AND sender_id IS NOT NULL AND sender_id != $2 ORDER BY created_at DESC LIMIT 1",
                [id, currentUserId]
              );
              if (prevMsg.rows.length > 0) {
                resolvedTargetLanguage = prevMsg.rows[0].sender_language || resolvedTargetLanguage;
                resolvedTargetLanguageFlag = prevMsg.rows[0].sender_language_flag || resolvedTargetLanguageFlag;
              }
            }
          }
        } else {
          // Fallback: Check if the ID itself is a user/contact ID (common in new chats)
          const profileLookup = await pool.query(
            `SELECT native_language, native_language_flag FROM users WHERE id = $1 OR LOWER(name) = LOWER($2)
             UNION ALL
             SELECT native_language, native_language_flag FROM contacts WHERE id = $1 OR LOWER(name) = LOWER($2)
             LIMIT 1`,
            [id, recipientName || ""]
          );
          if (profileLookup.rows[0]?.native_language) {
            resolvedTargetLanguage = profileLookup.rows[0].native_language;
            resolvedTargetLanguageFlag = profileLookup.rows[0].native_language_flag || resolvedTargetLanguageFlag;
          }
        }

        // 🛡️ CRITICAL SAFEGUARD:
        // In direct 1-on-1 chat, targetLanguage must NEVER be identical to the sender's language!
        if (normalizeLanguageCode(resolvedTargetLanguage) === normalizeLanguageCode(senderLanguage)) {
          const diffUserRes = await pool.query(
            "SELECT native_language, native_language_flag FROM users WHERE id != $1 AND LOWER(native_language) != LOWER($2) LIMIT 1",
            [currentUserId || "00000000-0000-0000-0000-000000000000", senderLanguage]
          );
          if (diffUserRes.rows[0]?.native_language) {
            resolvedTargetLanguage = diffUserRes.rows[0].native_language;
            resolvedTargetLanguageFlag = diffUserRes.rows[0].native_language_flag || "🌐";
          }
        }
      }

      if (!text && !audioUrl && !mediaUrl && !req.body.audioBase64) {
        res.status(400).json({ error: "Message text or media is required." });
        return;
      }

      const cleanText = (text || "").trim();
      let resolvedOriginalText = cleanText;
      let translatedText = cleanText;
      let finalAudioUrl = audioUrl;
      let finalMediaUrl = mediaUrl || (messageType === "audio" && req.body.audioBase64 ? req.body.audioBase64 : null);

      if (messageType === "audio") {
        // 🎙️ VOICE NOTE PIPELINE
        let audioBuffer: Buffer | null = null;
        if (req.body.audioBase64) {
          const rawBase64 = req.body.audioBase64.replace(/^data:audio\/[^;]+;base64,/, "");
          try {
            audioBuffer = Buffer.from(rawBase64, "base64");
          } catch (e) {
            console.warn("Failed to parse audioBase64 buffer:", e);
          }
        } else if (audioUrl && audioUrl.startsWith("http")) {
          try {
            const audioRes = await fetch(audioUrl);
            if (audioRes.ok) {
              const arrayBuffer = await audioRes.arrayBuffer();
              audioBuffer = Buffer.from(arrayBuffer);
            }
          } catch (e) {
            console.warn("Failed to fetch audioUrl buffer:", e);
          }
        }

        if (audioBuffer) {
          try {
            const s2sResult = await translationService.translateSpeech(
              audioBuffer,
              senderLanguage,
              resolvedTargetLanguage
            );
            if (s2sResult) {
              if (s2sResult.translation) translatedText = s2sResult.translation;
              if (s2sResult.transcription) resolvedOriginalText = s2sResult.transcription;
              if (s2sResult.audio_url) finalAudioUrl = s2sResult.audio_url;
            }
          } catch (audioErr) {
            console.warn("Audio translation error:", audioErr);
          }
        }

        // Guarantee playable audio for recipient via TTS in target language
        if (!finalAudioUrl || !finalAudioUrl.trim()) {
          try {
            const speakText = translatedText && !translatedText.startsWith("Voice Note")
              ? translatedText
              : (cleanText && !cleanText.startsWith("Voice Note") ? cleanText : `Voice message from ${senderName || "user"}.`);
            const ttsRes = await dubbingService.synthesizeSpeech(speakText, resolvedTargetLanguage);
            if (ttsRes?.audioDataUri) {
              finalAudioUrl = ttsRes.audioDataUri;
            }
          } catch (ttsErr) {
            console.warn("Voice note recipient TTS fallback error:", ttsErr);
          }
        }
      } else if (cleanText && resolvedTargetLanguage) {
        // Perform real-time AI translation into recipient's language
        try {
          const transResult = await translationService.translateText(
            cleanText,
            resolvedTargetLanguage,
            senderLanguage
          );
          translatedText = transResult.translatedText;
          resolvedTargetLanguage = transResult.targetLanguage;
          resolvedTargetLanguageFlag = transResult.targetLanguageFlag;
        } catch (transErr) {
          console.warn("Real-time message translation error, using original text:", transErr);
        }
      }

      let convId = id;
      let convExists = false;

      let convTitle = recipientName;
      let convAvatar = recipientAvatar || null;
      let convLang = resolvedTargetLanguage;
      let convFlag = resolvedTargetLanguageFlag;

      if (isUuid(convId)) {
        // Look up in contacts table
        const cLookup = await pool.query(
          "SELECT name, avatar_url, native_language, native_language_flag FROM contacts WHERE id = $1 LIMIT 1",
          [convId]
        );
        if (cLookup.rows.length > 0) {
          if (!convTitle) convTitle = cLookup.rows[0].name;
          if (!convAvatar) convAvatar = cLookup.rows[0].avatar_url;
          if (!convLang) convLang = cLookup.rows[0].native_language;
          if (!convFlag) convFlag = cLookup.rows[0].native_language_flag;
        } else {
          // Look up in users table
          const uLookup = await pool.query(
            "SELECT name, avatar_url, native_language, native_language_flag FROM users WHERE id = $1 LIMIT 1",
            [convId]
          );
          if (uLookup.rows.length > 0) {
            if (!convTitle) convTitle = uLookup.rows[0].name;
            if (!convAvatar) convAvatar = uLookup.rows[0].avatar_url;
            if (!convLang) convLang = uLookup.rows[0].native_language;
            if (!convFlag) convFlag = uLookup.rows[0].native_language_flag;
          }
        }

        if (!convTitle) convTitle = senderName || "Direct Chat";

        const check = await pool.query("SELECT id FROM conversations WHERE id = $1", [convId]);
        if (check.rows.length > 0) {
          convExists = true;
          // Update conversation title, last message and track sender
          await pool.query(
            `UPDATE conversations
             SET title = COALESCE($1, title),
                 avatar_url = COALESCE($2, avatar_url),
                 last_message = $3,
                 last_message_time = NOW(),
                 last_sender_id = $5
             WHERE id = $4`,
            [convTitle, convAvatar, cleanText || resolvedOriginalText, convId, currentUserId]
          );
        } else {
          // Insert with this exact contact/conversation ID
          await pool.query(
            `INSERT INTO conversations (
              id, title, type, avatar_url, recipient_lang, recipient_lang_flag, last_message, last_message_time, last_sender_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
            ON CONFLICT (id) DO UPDATE SET
              title = COALESCE(EXCLUDED.title, conversations.title),
              avatar_url = COALESCE(EXCLUDED.avatar_url, conversations.avatar_url),
              last_message = EXCLUDED.last_message,
              last_message_time = NOW(),
              last_sender_id = EXCLUDED.last_sender_id`,
            [
              convId,
              convTitle,
              "direct",
              convAvatar,
              convLang || "English",
              convFlag || "🌐",
              cleanText || resolvedOriginalText,
              currentUserId,
            ]
          );
          convExists = true;
        }
      }

      if (!convExists) {
        const createConv = await pool.query(
          `INSERT INTO conversations (
            title, type, avatar_url, recipient_lang, recipient_lang_flag, last_message, last_message_time, last_sender_id
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7) RETURNING id`,
          [
            convTitle || senderName || "Direct Chat",
            "direct",
            convAvatar,
            convLang || "English",
            convFlag || "🌐",
            cleanText || resolvedOriginalText,
            currentUserId,
          ]
        );
        convId = createConv.rows[0].id;
      }

      // 1. Insert message
      const insertResult = await pool.query(
        `INSERT INTO messages (
          conversation_id, sender_id, sender_name, sender_username, sender_avatar,
          sender_language, sender_language_flag, original_text,
          translated_text, target_language, target_language_flag,
          message_type, audio_url, audio_duration, media_url, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW()
        ) RETURNING *`,
        [
          convId,
          (req as any).user?.userId || (req as any).user?.id || (req.headers["x-user-id"] as string) || null,
          senderName,
          senderUsername,
          senderAvatar,
          senderLanguage,
          senderLanguageFlag,
          resolvedOriginalText,
          translatedText,
          resolvedTargetLanguage,
          resolvedTargetLanguageFlag,
          messageType,
          finalAudioUrl,
          audioDuration,
          finalMediaUrl,
        ]
      );

      const msgRow = insertResult.rows[0];

      // 2. Update parent conversation last_message and unread count
      await pool.query(
        `UPDATE conversations
         SET last_message = $1, last_message_time = NOW(), unread_count = unread_count + 1
         WHERE id = $2`,
        [cleanText || resolvedOriginalText, convId]
      );

      // 3. Send Push Notification to recipient
      // We try to find the recipient's email from users table or contacts table
      const recipientLookup = await pool.query(
        `SELECT email FROM users WHERE id = $1 OR LOWER(name) = LOWER($2)
         UNION ALL
         SELECT email FROM contacts WHERE id = $1 OR LOWER(name) = LOWER($2)
         LIMIT 1`,
        [convId, recipientName || ""]
      );

      if (recipientLookup.rows[0]?.email) {
        try {
          await sendExpoPushNotification(
            recipientLookup.rows[0].email,
            `New message from ${senderName}`,
            translatedText || cleanText,
            { chatId: convId, type: "new_message" }
          );
        } catch (pushErr) {
          console.error("Push notification error in sendMessage:", pushErr);
        }
      }

      res.status(201).json({
        success: true,
        message: {
          id: msgRow.id,
          conversationId: msgRow.conversation_id,
          senderName: msgRow.sender_name,
          senderUsername: msgRow.sender_username,
          senderAvatar: msgRow.sender_avatar,
          senderLanguage: msgRow.sender_language,
          senderLanguageFlag: msgRow.sender_language_flag,
          text: msgRow.original_text,
          translatedText: msgRow.translated_text,
          targetLanguage: msgRow.target_language,
          targetLanguageFlag: msgRow.target_language_flag,
          messageType: msgRow.message_type,
          audioUrl: msgRow.media_url || msgRow.audio_url,
          audioDuration: msgRow.audio_duration,
          mediaUrl: msgRow.media_url,
          timestamp: new Date(msgRow.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          createdAt: msgRow.created_at,
        },
      });
    } catch (error: any) {
      console.error("ChatController.sendMessage error:", error);
      res.status(500).json({ error: "Failed to send message." });
    }
  },

  /**
   * 5. Delete Conversation
   */
  async deleteConversation(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      if (!isUuid(id)) {
        res.status(200).json({
          success: true,
          message: "Conversation deleted successfully.",
        });
        return;
      }

      await pool.query("DELETE FROM conversations WHERE id = $1", [id]);

      res.status(200).json({
        success: true,
        message: "Conversation deleted successfully.",
      });
    } catch (error: any) {
      console.error("ChatController.deleteConversation error:", error);
      res.status(500).json({ error: "Failed to delete conversation." });
    }
  },

  /**
   * 6. Mark Conversation As Read (Clear unread counter)
   * PATCH /api/chats/:id/read
   */
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      if (isUuid(id)) {
        await pool.query("UPDATE conversations SET unread_count = 0 WHERE id = $1", [id]);
      }

      res.status(200).json({
        success: true,
        message: "Conversation marked as read.",
      });
    } catch (error: any) {
      console.error("ChatController.markAsRead error:", error);
      res.status(500).json({ error: "Failed to mark conversation as read." });
    }
  },
};

export default chatController;
