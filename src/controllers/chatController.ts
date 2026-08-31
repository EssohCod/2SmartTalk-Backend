import { Request, Response } from "express";
import { pool } from "../config/db";
import { translationService, normalizeLanguageCode } from "../services/translationService";

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

      let query = "SELECT * FROM conversations";
      const params: any[] = [];

      if (typeFilter && (typeFilter === "direct" || typeFilter === "group")) {
        query += " WHERE type = $1";
        params.push(typeFilter);
      }

      query += " ORDER BY last_message_time DESC";

      const result = await pool.query(query, params);

      // If conversations table is empty, seed initial conversations
      if (result.rows.length === 0 && !typeFilter) {
        const seedConversations = [
          {
            title: "Sarah Johnson",
            type: "direct",
            lang: "Russian",
            flag: "🇷🇺",
            lastMsg: "Thanks! See you on the call.",
            unread: 2,
          },
          {
            title: "Maria Santos",
            type: "direct",
            lang: "Filipino (Tagalog)",
            flag: "🇵🇭",
            lastMsg: "Salamat! Makakausap kita mamaya.",
            unread: 1,
          },
          {
            title: "Team Sync",
            type: "group",
            lang: "Global",
            flag: "🌐",
            lastMsg: "Alex: I've shared the meeting notes.",
            unread: 5,
          },
          {
            title: "Client Call",
            type: "direct",
            lang: "Spanish",
            flag: "🇪🇸",
            lastMsg: "Perfect, thank you!",
            unread: 1,
          },
        ];

        for (const c of seedConversations) {
          await pool.query(
            `INSERT INTO conversations (
              title, type, recipient_lang, recipient_lang_flag, last_message, unread_count, last_message_time
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW() - interval '10 minutes')`,
            [c.title, c.type, c.lang, c.flag, c.lastMsg, c.unread]
          );
        }
      }

      const refreshedResult = await pool.query(
        typeFilter && (typeFilter === "direct" || typeFilter === "group")
          ? "SELECT * FROM conversations WHERE type = $1 ORDER BY last_message_time DESC"
          : "SELECT * FROM conversations ORDER BY last_message_time DESC",
        typeFilter && (typeFilter === "direct" || typeFilter === "group") ? [typeFilter] : []
      );

      // Also retrieve groups from `groups` table to ensure every group created shows up under the Groups tab
      let groupRows: any[] = [];
      if (!typeFilter || typeFilter === "group" || typeFilter === "all") {
        const groupsRes = await pool.query("SELECT * FROM groups ORDER BY created_at DESC");
        groupRows = groupsRes.rows;
      }

      const dbConversations = refreshedResult.rows.map((row) => ({
        id: row.id,
        name: row.title,
        avatarUrl: row.avatar_url,
        category: row.type, // 'direct' | 'group'
        isGroup: row.type === "group",
        lastMessage: row.last_message || "Start conversation",
        time: row.last_message_time ? new Date(row.last_message_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now",
        unreadCount: row.unread_count || 0,
        recipientLang: row.recipient_lang || "English",
        recipientLangFlag: row.recipient_lang_flag || "🇺🇸",
        participants: row.participants || [],
        createdAt: row.created_at,
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
   * 3. Get Messages for a Conversation
   */
  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

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

      const messages = result.rows.map((row) => ({
        id: row.id,
        conversationId: row.conversation_id,
        senderId: row.sender_id,
        senderName: row.sender_name,
        senderUsername: row.sender_username,
        senderAvatar: row.sender_avatar,
        senderLanguage: row.sender_language || "English",
        senderLanguageFlag: row.sender_language_flag || "🇺🇸",
        text: row.original_text,
        translatedText: row.translated_text || row.original_text,
        targetLanguage: row.target_language,
        targetLanguageFlag: row.target_language_flag,
        messageType: row.message_type || "text",
        audioUrl: row.audio_url,
        audioDuration: row.audio_duration,
        mediaUrl: row.media_url,
        timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        createdAt: row.created_at,
      }));

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
      const {
        text,
        senderName = "Emma Johnson",
        senderUsername = "@emma_johnson",
        senderAvatar = null,
        senderLanguage = "English",
        senderLanguageFlag = "🇺🇸",
        targetLanguage = "Spanish",
        targetLanguageFlag = "🇪🇸",
        messageType = "text",
        audioUrl = null,
        audioDuration = null,
        mediaUrl = null,
      } = req.body;

      if (!text && !audioUrl && !mediaUrl) {
        res.status(400).json({ error: "Message text or media is required." });
        return;
      }

      const cleanText = (text || "").trim();
      let translatedText = cleanText;

      // Perform real-time AI neural translation if target language is different from sender
      if (cleanText && targetLanguage && normalizeLanguageCode(targetLanguage) !== normalizeLanguageCode(senderLanguage)) {
        try {
          const transResult = await translationService.translateText(
            cleanText,
            targetLanguage,
            senderLanguage
          );
          translatedText = transResult.translatedText;
        } catch (transErr) {
          console.warn("Real-time message translation error, using original text:", transErr);
        }
      }

      let convId = id;
      // If conversation id is not a valid UUID, create a real conversation in DB
      if (!isUuid(convId)) {
        const createConv = await pool.query(
          `INSERT INTO conversations (
            title, type, recipient_lang, recipient_lang_flag, last_message, last_message_time
          ) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id`,
          [
            senderName || "Direct Chat",
            "direct",
            targetLanguage,
            targetLanguageFlag,
            cleanText,
          ]
        );
        convId = createConv.rows[0].id;
      }

      // 1. Insert message
      const insertResult = await pool.query(
        `INSERT INTO messages (
          conversation_id, sender_name, sender_username, sender_avatar,
          sender_language, sender_language_flag, original_text,
          translated_text, target_language, target_language_flag,
          message_type, audio_url, audio_duration, media_url, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW()
        ) RETURNING *`,
        [
          convId,
          senderName,
          senderUsername,
          senderAvatar,
          senderLanguage,
          senderLanguageFlag,
          cleanText,
          translatedText,
          targetLanguage,
          targetLanguageFlag,
          messageType,
          audioUrl,
          audioDuration,
          mediaUrl,
        ]
      );

      const msgRow = insertResult.rows[0];

      // 2. Update parent conversation last_message
      await pool.query(
        `UPDATE conversations
         SET last_message = $1, last_message_time = NOW()
         WHERE id = $2`,
        [cleanText, convId]
      );

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
};

export default chatController;
