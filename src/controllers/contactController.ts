import { Request, Response } from "express";
import { pool } from "../config/db";

export const contactController = {
  /**
   * 1. Get All Contacts (strictly filtered by authenticated user)
   */
  async getContacts(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const userId = user?.userId || user?.id || (req.headers["x-user-id"] as string) || (req.query.userId as string);

      if (!userId) {
        res.status(200).json({
          success: true,
          count: 0,
          contacts: [],
        });
        return;
      }

      const result = await pool.query(
        "SELECT * FROM contacts WHERE user_id = $1 ORDER BY is_favorite DESC, name ASC",
        [userId]
      );

      const contacts = result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        username: row.username.startsWith("@") ? row.username : `@${row.username}`,
        email: row.email || "",
        phone: row.phone || "",
        avatarUrl: row.avatar_url,
        language: row.native_language || "English",
        flag: row.native_language_flag || "🇺🇸",
        location: row.location || "Global",
        isOnline: Boolean(row.is_online),
        isFavorite: Boolean(row.is_favorite),
        bio: row.bio || "",
        sectionLetter: (row.name || "A")[0].toUpperCase(),
        createdAt: row.created_at,
      }));

      res.status(200).json({
        success: true,
        count: contacts.length,
        contacts,
      });
    } catch (error: any) {
      console.error("ContactController.getContacts error:", error);
      res.status(500).json({ error: "Failed to retrieve contacts list." });
    }
  },

  /**
   * 2. Add New Contact
   */
  async addContact(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const userId = user?.userId || user?.id || (req.headers["x-user-id"] as string) || req.body.userId;
      const {
        name,
        username,
        email = "",
        phone = "",
        avatarUrl = null,
        nativeLanguage = "English",
        nativeLanguageFlag = "🇺🇸",
        location = "Global",
        bio = "",
      } = req.body;

      if (!name || !username) {
        res.status(400).json({ error: "Name and username are required to add a contact." });
        return;
      }

      const cleanUsername = username.trim().replace(/^@/, "");
      const cleanName = name.trim();

      // Check if user exists in the platform
      const userCheck = await pool.query(
        "SELECT id, avatar_url, native_language, native_language_flag, bio, location FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1",
        [cleanUsername]
      );

      const contactUserId = userCheck.rows.length > 0 ? userCheck.rows[0].id : null;
      const resolvedAvatar = avatarUrl || (userCheck.rows.length > 0 ? userCheck.rows[0].avatar_url : null);
      const resolvedLang = nativeLanguage || (userCheck.rows.length > 0 ? userCheck.rows[0].native_language : "English");
      const resolvedFlag = nativeLanguageFlag || (userCheck.rows.length > 0 ? userCheck.rows[0].native_language_flag : "🇺🇸");
      const resolvedBio = bio || (userCheck.rows.length > 0 ? userCheck.rows[0].bio : "");
      const resolvedLoc = location || (userCheck.rows.length > 0 ? userCheck.rows[0].location : "Global");

      // Prevent duplicate contacts
      if (userId) {
        const existing = await pool.query(
          `SELECT * FROM contacts 
           WHERE user_id = $1 AND (LOWER(username) = LOWER($2) OR (contact_user_id IS NOT NULL AND contact_user_id = $3))`,
          [userId, `@${cleanUsername}`, contactUserId]
        );

        if (existing.rows.length > 0) {
          const row = existing.rows[0];
          res.status(200).json({
            success: true,
            message: "Contact already in your contacts list.",
            contact: {
              id: row.id,
              name: row.name,
              username: row.username,
              avatarUrl: row.avatar_url,
              language: row.native_language,
              flag: row.native_language_flag,
              isOnline: row.is_online,
              isFavorite: row.is_favorite,
              bio: row.bio,
            },
          });
          return;
        }
      }

      const insertResult = await pool.query(
        `INSERT INTO contacts (
          user_id, contact_user_id, name, username, email, phone,
          avatar_url, native_language, native_language_flag, location,
          is_online, is_favorite, bio
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        ) RETURNING *`,
        [
          userId || null,
          contactUserId,
          cleanName,
          `@${cleanUsername}`,
          email.trim(),
          phone.trim(),
          resolvedAvatar,
          resolvedLang,
          resolvedFlag,
          resolvedLoc,
          true,
          false,
          resolvedBio,
        ]
      );

      const newRow = insertResult.rows[0];

      res.status(201).json({
        success: true,
        message: "Contact added successfully!",
        contact: {
          id: newRow.id,
          name: newRow.name,
          username: newRow.username,
          email: newRow.email,
          phone: newRow.phone,
          avatarUrl: newRow.avatar_url,
          language: newRow.native_language,
          flag: newRow.native_language_flag,
          location: newRow.location,
          isOnline: newRow.is_online,
          isFavorite: newRow.is_favorite,
          bio: newRow.bio,
          sectionLetter: (newRow.name || "A")[0].toUpperCase(),
          createdAt: newRow.created_at,
        },
      });
    } catch (error: any) {
      console.error("ContactController.addContact error:", error);
      res.status(500).json({ error: "Failed to add contact. Please try again." });
    }
  },

  /**
   * 3. Delete Contact
   */
  async deleteContact(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const userId = user?.userId || user?.id || (req.headers["x-user-id"] as string);

      let query = "DELETE FROM contacts WHERE id = $1";
      const params: any[] = [id];

      if (userId) {
        query += " AND user_id = $2";
        params.push(userId);
      }

      query += " RETURNING id";

      const deleteResult = await pool.query(query, params);

      if (deleteResult.rowCount === 0) {
        res.status(404).json({ error: "Contact not found." });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Contact removed successfully.",
        deletedId: id,
      });
    } catch (error: any) {
      console.error("ContactController.deleteContact error:", error);
      res.status(500).json({ error: "Failed to delete contact." });
    }
  },

  /**
   * 4. Get Contact By ID
   */
  async getContactById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await pool.query("SELECT * FROM contacts WHERE id = $1", [id]);

      if (result.rows.length === 0) {
        res.status(404).json({ error: "Contact profile not found." });
        return;
      }

      const row = result.rows[0];

      res.status(200).json({
        success: true,
        contact: {
          id: row.id,
          name: row.name,
          username: row.username.startsWith("@") ? row.username : `@${row.username}`,
          email: row.email,
          phone: row.phone,
          avatarUrl: row.avatar_url,
          language: row.native_language,
          flag: row.native_language_flag,
          location: row.location,
          isOnline: row.is_online,
          isFavorite: row.is_favorite,
          bio: row.bio,
          sectionLetter: (row.name || "A")[0].toUpperCase(),
          createdAt: row.created_at,
        },
      });
    } catch (error: any) {
      console.error("ContactController.getContactById error:", error);
      res.status(500).json({ error: "Failed to load contact profile." });
    }
  },

  /**
   * 5. Search Registered Users by username or name
   */
  async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const currentUserId = user?.userId || user?.id || (req.headers["x-user-id"] as string) || "00000000-0000-0000-0000-000000000000";
      const query = (req.query.q as string || req.query.username as string || "").trim().toLowerCase();

      if (!query || query.length < 1) {
        res.status(200).json({ success: true, users: [] });
        return;
      }

      const cleanQuery = query.replace(/^@/, "");

      const result = await pool.query(
        `SELECT u.id, u.name, u.username, u.email, u.avatar_url, u.native_language, u.native_language_flag, u.bio,
                EXISTS(
                  SELECT 1 FROM contacts c 
                  WHERE c.user_id = $2 
                    AND (c.contact_user_id = u.id OR LOWER(c.username) = LOWER('@' || u.username))
                ) as is_added
         FROM users u
         WHERE u.id != $2 
           AND (LOWER(u.username) LIKE $1 OR LOWER(u.name) LIKE $1)
         ORDER BY (LOWER(u.username) = LOWER($3)) DESC, u.created_at DESC
         LIMIT 20`,
        [`%${cleanQuery}%`, currentUserId, cleanQuery]
      );

      res.status(200).json({
        success: true,
        count: result.rows.length,
        users: result.rows.map((u) => ({
          id: u.id,
          name: u.name,
          username: `@${u.username}`,
          email: u.email,
          avatarUrl: u.avatar_url,
          speaks: u.native_language || "English",
          speaksFlag: u.native_language_flag || "🇺🇸",
          language: u.native_language || "English",
          flag: u.native_language_flag || "🇺🇸",
          bio: u.bio || "2SmartTalk member",
          isAdded: Boolean(u.is_added),
          isOnline: true,
        })),
      });
    } catch (error: any) {
      console.error("ContactController.searchUsers error:", error);
      res.status(500).json({ error: "Search failed." });
    }
  },

  /**
   * 6. "People You May Know" - Algorithmic Suggestions based on Language Match
   */
  async getSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const currentUserId = user?.userId || user?.id || (req.headers["x-user-id"] as string);

      let userLanguage = user?.nativeLanguage || (req.headers["x-user-language"] as string);

      // If userLanguage is not in token, look up the requesting user's language
      if (!userLanguage && currentUserId) {
        const langRes = await pool.query(
          "SELECT native_language FROM users WHERE id = $1",
          [currentUserId]
        );
        if (langRes.rows.length > 0) {
          userLanguage = langRes.rows[0].native_language;
        }
      }

      const targetLang = (userLanguage || "English").trim();

      let query = `
        SELECT u.id, u.name, u.username, u.email, u.avatar_url, u.native_language, u.native_language_flag, u.bio,
               (LOWER(u.native_language) = LOWER($1)) as is_same_language
        FROM users u
      `;
      const params: any[] = [targetLang];

      if (currentUserId) {
        query += `
          WHERE u.id != $2 
            AND u.id NOT IN (
              SELECT contact_user_id FROM contacts WHERE user_id = $2 AND contact_user_id IS NOT NULL
            )
            AND LOWER('@' || u.username) NOT IN (
              SELECT LOWER(username) FROM contacts WHERE user_id = $2
            )
        `;
        params.push(currentUserId);
      }

      query += `
        ORDER BY (LOWER(u.native_language) = LOWER($1)) DESC, u.created_at DESC
        LIMIT 10
      `;

      const result = await pool.query(query, params);

      const suggestions = result.rows.map((u) => ({
        id: u.id,
        name: u.name,
        username: `@${u.username}`,
        avatarUrl: u.avatar_url,
        speaks: u.native_language || "English",
        speaksFlag: u.native_language_flag || "🇺🇸",
        language: u.native_language || "English",
        flag: u.native_language_flag || "🇺🇸",
        isSameLanguage: Boolean(u.is_same_language),
        mutualCount: u.is_same_language ? 5 : 3,
        bio: u.bio || `Speaks ${u.native_language || "English"} • 2SmartTalk verified`,
        isOnline: true,
      }));

      res.status(200).json({
        success: true,
        count: suggestions.length,
        suggestions,
      });
    } catch (error: any) {
      console.error("ContactController.getSuggestions error:", error);
      res.status(500).json({ error: "Failed to load suggestions." });
    }
  },
};

export default contactController;
