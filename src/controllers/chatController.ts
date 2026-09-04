import { Request, Response } from "express";
import { pool } from "../config/db";
import { translationService, normalizeLanguageCode, resolvePreferredLanguage } from "../services/translationService";
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
        let recipientLang = row.recipient_lang || "English";
        let recipientLangFlag = row.recipient_lang_flag || "🇺🇸";

        // Direct-chat language must come from the recipient profile
        if (row.type === "direct" && isUuid(row.id)) {
          const recipient = await pool.query(
            `SELECT native_language, native_language_flag FROM contacts WHERE id = $1 OR LOWER(name) = LOWER($2)
             UNION ALL
             SELECT native_language, native_language_flag FROM users WHERE id = $1 OR LOWER(name) = LOWER($2)
             LIMIT 1`,
            [row.id, row.title]
          );
          if (recipient.rows[0]?.native_language) {
            recipientLang = recipient.rows[0].native_language;
            recipientLangFlag = recipient.rows[0].native_language_flag || recipientLangFlag;
          }
        }

        // 🛡️ FIX: Hide unread badge if the current user is the one who sent the last message
        const isMeTheSender = (userId && row.last_sender_id === userId);
        const unreadCount = isMeTheSender ? 0 : (row.unread_count || 0);

        return {
          id: row.id,
          name: row.title,
          avatarUrl: row.avatar_url,
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

      const result = await pool.query(
        "SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
        [id]
      );

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
          }
else if (userLanguage) {
            targetLang = userLanguage;
            targetFlag = userLanguageFlag || "🇺🇸";
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
            messageType: row.message_type || "text",
            audioUrl: row.audio_url,
            audioDuration: row.audio_duration,
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
              const pId = p.id || p.userId;
              const pEmail = p.email;

              const isMatchById = currentUserId && pId && String(pId) === String(currentUserId);
              const isMatchByEmail = currentUserEmail && pEmail && String(pEmail).toLowerCase() === String(currentUserEmail).toLowerCase();

              return !isMatchById && !isMatchByEmail;
            });

            if (otherParticipant) {
              const profileLookup = await pool.query(
                `SELECT native_language, native_language_flag FROM users WHERE id = $1 OR LOWER(email) = LOWER($2)
                 UNION ALL
                 SELECT native_language, native_language_flag FROM contacts WHERE id = $1 OR LOWER(email) = LOWER($2)
                 LIMIT 1`,
                [otherParticipant.id || otherParticipant.userId || "00000000-0000-0000-0000-000000000000", otherParticipant.email || ""]
              );

              if (profileLookup.rows[0]?.native_language) {
                resolvedTargetLanguage = profileLookup.rows[0].native_language;
                resolvedTargetLanguageFlag = profileLookup.rows[0].native_language_flag || resolvedTargetLanguageFlag;
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
      }

      if (!text && !audioUrl && !mediaUrl) {
        res.status(400).json({ error: "Message text or media is required." });
        return;
      }

      const cleanText = (text || "").trim();
      let resolvedOriginalText = cleanText;
      let translatedText = cleanText;
      let finalAudioUrl = audioUrl;

      // Perform real-time AI translation into recipient's language
      if (cleanText && resolvedTargetLanguage) {
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
      } else if (messageType === "audio" && (req.body.audioBase64 || audioUrl)) {
        // Genesia Audio Speech-to-Speech Integration
        try {
          let audioBuffer: Buffer | null = null;
          if (req.body.audioBase64) {
            audioBuffer = Buffer.from(req.body.audioBase64, "base64");
          } else if (audioUrl && audioUrl.startsWith("http")) {
            const audioRes = await fetch(audioUrl);
            if (audioRes.ok) {
              const arrayBuffer = await audioRes.arrayBuffer();
              audioBuffer = Buffer.from(arrayBuffer);
            }
          }

          if (audioBuffer) {
            const s2sResult = await translationService.translateSpeech(
              audioBuffer,
              senderLanguage,
              resolvedTargetLanguage
            );

            if (s2sResult) {
              translatedText = s2sResult.translation;
              resolvedOriginalText = s2sResult.transcription;
              if (s2sResult.audio_url) {
                finalAudioUrl = s2sResult.audio_url;
              }
            }
          }
        } catch (audioErr) {
          console.warn("Audio translation error:", audioErr);
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
          mediaUrl,
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
          audioUrl: msgRow.audio_url,
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
