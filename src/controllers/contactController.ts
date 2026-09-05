import { Request, Response } from "express";
import { pool } from "../config/db";
import { sendExpoPushNotification } from "./notificationController";

export const contactController = {
  /**
   * 1. Get All Contacts (strictly filtered by authenticated user)
   */
  async getContacts(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      let userId = user?.userId || user?.id || (req.headers["x-user-id"] as string) || (req.query.userId as string);
      const userEmail = user?.email || (req.headers["x-user-email"] as string) || (req.query.email as string);

      if (!userId && userEmail) {
        const u = await pool.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1", [userEmail.trim()]);
        if (u.rows.length > 0) {
          userId = u.rows[0].id;
        }
      }

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
      let userId = user?.userId || user?.id || (req.headers["x-user-id"] as string) || req.body.userId;
      const userEmail = user?.email || (req.headers["x-user-email"] as string) || req.body.userEmail;

      if (!userId && userEmail) {
        const u = await pool.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1", [userEmail.trim()]);
        if (u.rows.length > 0) {
          userId = u.rows[0].id;
        }
      }

      const {
        contactUserId: bodyContactUserId,
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

      // Check if user exists in the platform by username or by contactUserId
      let contactUserId = bodyContactUserId || null;
      let resolvedAvatar = avatarUrl;
      let resolvedLang = nativeLanguage;
      let resolvedFlag = nativeLanguageFlag;
      let resolvedBio = bio;
      let resolvedLoc = location;

      const userCheck = await pool.query(
        `SELECT id, name, username, email, phone, avatar_url, native_language,
                native_language_flag, bio, location
         FROM users
         WHERE LOWER(username) = LOWER($1) OR (id::text = $2)
         LIMIT 1`,
        [cleanUsername, contactUserId || "00000000-0000-0000-0000-000000000000"]
      );

      if (userCheck.rows.length > 0) {
        const row = userCheck.rows[0];
        contactUserId = row.id;
        if (!resolvedAvatar) resolvedAvatar = row.avatar_url;
        if (!resolvedLang || resolvedLang === "English") resolvedLang = row.native_language || "English";
        if (!resolvedFlag || resolvedFlag === "🇺🇸") resolvedFlag = row.native_language_flag || "🇺🇸";
        if (!resolvedBio) resolvedBio = row.bio;
        if (!resolvedLoc || resolvedLoc === "Global") resolvedLoc = row.location || "Global";
      }

      const ensureReciprocalContact = async (): Promise<void> => {
        if (!userId || !contactUserId || userId === contactUserId) return;

        await pool.query(
          `INSERT INTO contacts (
             user_id, contact_user_id, name, username, email, phone,
             avatar_url, native_language, native_language_flag, location,
             is_online, is_favorite, bio
           )
           SELECT
             $1, u.id, u.name, CASE WHEN u.username LIKE '@%' THEN u.username ELSE '@' || u.username END,
             u.email, u.phone, u.avatar_url, u.native_language, u.native_language_flag,
             u.location, true, false, u.bio
           FROM users u
           WHERE u.id = $2
             AND NOT EXISTS (
               SELECT 1 FROM contacts c
               WHERE c.user_id = $1
                 AND (c.contact_user_id = $2 OR LOWER(c.username) = LOWER('@' || u.username))
             )`,
          [contactUserId, userId]
        );

        try {
          const adder = await pool.query("SELECT name FROM users WHERE id = $1", [userId]);
          const target = await pool.query("SELECT email FROM users WHERE id = $1", [contactUserId]);
          const adderName = adder.rows[0]?.name || cleanName || "Someone";
          const targetEmail = target.rows[0]?.email;
          if (targetEmail) {
            await pool.query(
              `INSERT INTO notifications (user_id, user_email, category, title, description, is_unread, created_at)
               VALUES ($1, $2, 'system', 'New Contact Added', $3, true, NOW())`,
              [contactUserId, targetEmail, `${adderName} added you to their contact list.`]
            );
            await sendExpoPushNotification(
              targetEmail,
              "New Contact Added",
              `${adderName} added you to their contact list.`,
              { type: "new_contact" }
            );
          }
        } catch (notifErr) {
          console.warn("Could not send contact push notification:", notifErr);
        }
      };

      // Prevent duplicate contacts
      if (userId) {
        const existing = await pool.query(
          `SELECT * FROM contacts 
           WHERE user_id = $1 AND (LOWER(username) = LOWER($2) OR (contact_user_id IS NOT NULL AND contact_user_id = $3))`,
          [userId, `@${cleanUsername}`, contactUserId]
        );

        if (existing.rows.length > 0) {
          const row = existing.rows[0];
          await ensureReciprocalContact();
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

      await ensureReciprocalContact();

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
      const rawQuery = ((req.query.q as string) || (req.query.username as string) || "").trim();
      const normalizedQuery = rawQuery
        .replace(/^@+/, "")
        .replace(/[_-]+/g, " ")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

      if (!normalizedQuery) {
        res.status(200).json({ success: true, users: [] });
        return;
      }

      const tokens = normalizedQuery
        .split(/\s+/)
        .map((token) => token.replace(/[^a-z0-9]/g, ""))
        .filter(Boolean);

      if (tokens.length === 0) {
        res.status(200).json({ success: true, users: [] });
        return;
      }

      const params: any[] = [currentUserId];
      const matchClauses: string[] = [];

      tokens.forEach((token) => {
        const pattern = `%${token}%`;
        params.push(pattern);
        matchClauses.push(`(
         LOWER(COALESCE(u.username, '')) LIKE $${params.length}
         OR LOWER(COALESCE(u.name, '')) LIKE $${params.length}
         OR LOWER(COALESCE(u.first_name, '')) LIKE $${params.length}
         OR LOWER(COALESCE(u.last_name, '')) LIKE $${params.length}
         OR LOWER(COALESCE(u.email, '')) LIKE $${params.length}
        )`);
      });

      const whereClause = matchClauses.length > 0 ? `(${matchClauses.join(" AND ")})` : "(1 = 0)";
      const exactMatch = tokens[0];
      const prefixMatch = `${tokens[0]}%`;

      const result = await pool.query(
        `SELECT u.id, u.name, u.username, u.email, u.avatar_url, u.native_language, u.native_language_flag, u.bio,
               EXISTS(
                 SELECT 1 FROM contacts c
                 WHERE c.user_id = $1
                   AND (c.contact_user_id = u.id OR LOWER(c.username) = LOWER('@' || u.username))
               ) as is_added
         FROM users u
         WHERE u.id != $1
          AND ${whereClause}
         ORDER BY
          CASE
            WHEN LOWER(u.username) = LOWER($${params.length + 1}) THEN 0
            WHEN LOWER(u.username) LIKE LOWER($${params.length + 2}) THEN 1
            WHEN LOWER(u.name) LIKE LOWER($${params.length + 3}) THEN 2
            ELSE 3
          END,
          u.created_at DESC
         LIMIT 20`,
        [...params, exactMatch, prefixMatch, `%${exactMatch}%`]
      );

      res.status(200).json({
        success: true,
        count: result.rows.length,
        users: result.rows.map((u) => ({
         id: u.id,
         name: u.name,
         username: u.username.startsWith("@") ? u.username : `@${u.username}`,
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
      let currentUserId = user?.userId || user?.id || (req.headers["x-user-id"] as string);
      const userEmail = user?.email || (req.headers["x-user-email"] as string);

      let userLanguage = user?.nativeLanguage || (req.headers["x-user-language"] as string);

      if (!currentUserId && userEmail) {
        const uRes = await pool.query(
          "SELECT id, native_language FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
          [userEmail.trim()]
        );
        if (uRes.rows.length > 0) {
          currentUserId = uRes.rows[0].id;
          if (!userLanguage) userLanguage = uRes.rows[0].native_language;
        }
      }

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
