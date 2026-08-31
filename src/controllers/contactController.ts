import { Request, Response } from "express";
import { pool } from "../config/db";

export const contactController = {
  /**
   * 1. Get All Contacts
   */
  async getContacts(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      let query = "SELECT * FROM contacts ORDER BY is_favorite DESC, name ASC";
      let params: any[] = [];

      if (user && user.id) {
        query = "SELECT * FROM contacts WHERE user_id = $1 OR user_id IS NULL ORDER BY is_favorite DESC, name ASC";
        params = [user.id];
      }

      const result = await pool.query(query, params);

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
        "SELECT id, avatar_url, native_language, native_language_flag FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1",
        [cleanUsername]
      );

      const contactUserId = userCheck.rows.length > 0 ? userCheck.rows[0].id : null;
      const resolvedAvatar = avatarUrl || (userCheck.rows.length > 0 ? userCheck.rows[0].avatar_url : null);
      const resolvedLang = nativeLanguage || (userCheck.rows.length > 0 ? userCheck.rows[0].native_language : "English");
      const resolvedFlag = nativeLanguageFlag || (userCheck.rows.length > 0 ? userCheck.rows[0].native_language_flag : "🇺🇸");

      const insertResult = await pool.query(
        `INSERT INTO contacts (
          user_id, contact_user_id, name, username, email, phone,
          avatar_url, native_language, native_language_flag, location,
          is_online, is_favorite, bio
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        ) RETURNING *`,
        [
          user ? user.id : null,
          contactUserId,
          cleanName,
          `@${cleanUsername}`,
          email.trim(),
          phone.trim(),
          resolvedAvatar,
          resolvedLang,
          resolvedFlag,
          location.trim(),
          true, // newly added demo online
          false,
          bio.trim(),
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

      const deleteResult = await pool.query("DELETE FROM contacts WHERE id = $1 RETURNING id", [id]);

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
   * 4. Get Contact By ID (Profile Details)
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
   * 5. Search Registered Users to Add
   */
  async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const query = (req.query.q as string || "").trim().toLowerCase();

      if (!query || query.length < 2) {
        // Return latest registered users as suggestions
        const recent = await pool.query(
          "SELECT id, name, username, email, avatar_url, native_language, native_language_flag FROM users ORDER BY created_at DESC LIMIT 10"
        );
        res.status(200).json({
          success: true,
          users: recent.rows.map((u) => ({
            id: u.id,
            name: u.name,
            username: `@${u.username}`,
            email: u.email,
            avatarUrl: u.avatar_url,
            language: u.native_language || "English",
            flag: u.native_language_flag || "🇺🇸",
          })),
        });
        return;
      }

      const cleanQuery = query.replace(/^@/, "");

      const result = await pool.query(
        `SELECT id, name, username, email, avatar_url, native_language, native_language_flag
         FROM users
         WHERE LOWER(username) LIKE $1 OR LOWER(name) LIKE $1 OR LOWER(email) LIKE $1
         LIMIT 15`,
        [`%${cleanQuery}%`]
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
          language: u.native_language || "English",
          flag: u.native_language_flag || "🇺🇸",
        })),
      });
    } catch (error: any) {
      console.error("ContactController.searchUsers error:", error);
      res.status(500).json({ error: "Search failed." });
    }
  },
};

export default contactController;
