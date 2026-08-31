import { Request, Response } from "express";
import { pool } from "../config/db";

export const callController = {
  /**
   * 1. Get All Calls (Supports ?direction=all|missed|incoming|outgoing&search=...)
   */
  async getCalls(req: Request, res: Response): Promise<void> {
    try {
      const { direction, search } = req.query;

      let query = "SELECT * FROM calls";
      const params: any[] = [];
      const conditions: string[] = [];

      if (direction && typeof direction === "string" && direction !== "all") {
        params.push(direction.toLowerCase());
        conditions.push(`LOWER(call_direction) = $${params.length}`);
      }

      if (search && typeof search === "string" && search.trim()) {
        params.push(`%${search.trim().toLowerCase()}%`);
        conditions.push(`(LOWER(contact_name) LIKE $${params.length} OR LOWER(contact_username) LIKE $${params.length} OR LOWER(contact_language) LIKE $${params.length})`);
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY started_at DESC";

      const result = await pool.query(query, params);

      // If calls table is empty, seed initial data for demonstration
      if (result.rows.length === 0 && !direction && !search) {
        const seedCalls = [
          {
            name: "Sarah Johnson",
            username: "@sarahj",
            lang: "Russian",
            flag: "🇷🇺",
            type: "video",
            dir: "outgoing",
            duration: "14 mins 28 secs",
          },
          {
            name: "Alex Martin",
            username: "@alexmartin",
            lang: "Russian",
            flag: "🇷🇺",
            type: "audio",
            dir: "missed",
            duration: "Missed Call (0s)",
          },
          {
            name: "Jessica Brown",
            username: "@jessicab",
            lang: "French",
            flag: "🇫🇷",
            type: "video",
            dir: "incoming",
            duration: "26 mins 10 secs",
          },
          {
            name: "David Williams",
            username: "@davidw",
            lang: "Spanish",
            flag: "🇪🇸",
            type: "audio",
            dir: "outgoing",
            duration: "08 mins 45 secs",
          },
          {
            name: "Michael Scott",
            username: "@mscott",
            lang: "German",
            flag: "🇩🇪",
            type: "video",
            dir: "incoming",
            duration: "45 mins 02 secs",
          },
          {
            name: "Tech Team Sync",
            username: "@team_sync",
            lang: "Global",
            flag: "🌐",
            type: "video",
            dir: "missed",
            duration: "Missed Group Video (0s)",
            isGroup: true,
          },
        ];

        for (const c of seedCalls) {
          await pool.query(
            `INSERT INTO calls (
              contact_name, contact_username, contact_language, contact_language_flag,
              call_type, call_direction, duration, is_group, started_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() - interval '1 hour')`,
            [
              c.name,
              c.username,
              c.lang,
              c.flag,
              c.type,
              c.dir,
              c.duration,
              c.isGroup || false,
            ]
          );
        }

        const refreshed = await pool.query("SELECT * FROM calls ORDER BY started_at DESC");
        res.status(200).json({
          success: true,
          count: refreshed.rows.length,
          calls: formatCallRows(refreshed.rows),
        });
        return;
      }

      res.status(200).json({
        success: true,
        count: result.rows.length,
        calls: formatCallRows(result.rows),
      });
    } catch (error: any) {
      console.error("CallController.getCalls error:", error);
      res.status(500).json({ error: "Failed to retrieve call history." });
    }
  },

  /**
   * 2. Log a New Call
   */
  async logCall(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const {
        contactName,
        contactUsername = "",
        contactAvatar = null,
        contactLanguage = "English",
        contactLanguageFlag = "🇺🇸",
        callType = "video", // 'video' | 'audio'
        callDirection = "outgoing", // 'incoming' | 'outgoing' | 'missed'
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
          user ? user.id : null,
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
   * 3. Delete Single Call
   */
  async deleteCall(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

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
   * 4. Clear All Calls
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
