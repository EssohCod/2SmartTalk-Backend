import { Request, Response } from "express";
import { query } from "../config/db";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

function formatRelativeTime(dateInput: Date | string): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export interface NotificationDbRow {
  id: string;
  user_id: string | null;
  user_email: string | null;
  category: "meetings" | "messages" | "system";
  title: string;
  description: string;
  is_unread: boolean;
  avatar_url: string | null;
  icon_name: string;
  icon_bg_color: string;
  icon_color: string;
  action_type: string | null;
  action_label: string | null;
  contact_data: any;
  meeting_id: string | null;
  chat_id: string | null;
  created_at: Date;
  updated_at: Date;
}

const mapNotificationRowToDto = (row: NotificationDbRow) => {
  let contactData = null;
  if (row.contact_data) {
    if (typeof row.contact_data === "string") {
      try {
        contactData = JSON.parse(row.contact_data);
      } catch {
        contactData = null;
      }
    } else {
      contactData = row.contact_data;
    }
  }

  return {
    id: row.id,
    category: row.category || "system",
    title: row.title,
    description: row.description,
    timestamp: formatRelativeTime(row.created_at),
    isUnread: row.is_unread,
    avatarUrl: row.avatar_url,
    iconName: row.icon_name || "bell",
    iconBgColor: row.icon_bg_color || "#EFF6FF",
    iconColor: row.icon_color || "#3B82F6",
    actionType: row.action_type || undefined,
    actionLabel: row.action_label || undefined,
    contactData: contactData || undefined,
    meetingId: row.meeting_id || undefined,
    chatId: row.chat_id || undefined,
    createdAt: row.created_at,
  };
};

export const notificationController = {
  /**
   * 1. Get all notifications (with optional category filter)
   */
  async getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const email =
        req.user?.email ||
        (req.headers["x-user-email"] as string) ||
        (req.query.email as string) ||
        "";

      const category = (req.query.category as string) || "all";

      let queryStr = `SELECT * FROM notifications WHERE 1=1`;
      const queryParams: any[] = [];

      // Filter by email if present or return global/unassigned notifications
      if (email.trim()) {
        queryParams.push(email.toLowerCase().trim());
        queryStr += ` AND (user_email IS NULL OR LOWER(user_email) = $${queryParams.length})`;
      }

      if (category && category !== "all") {
        queryParams.push(category);
        queryStr += ` AND category = $${queryParams.length}`;
      }

      queryStr += ` ORDER BY created_at DESC LIMIT 60`;

      const result = await query(queryStr, queryParams);
      const notifications = result.rows.map(mapNotificationRowToDto);

      // Count unread
      let unreadCountQuery = `SELECT COUNT(*) as unread_count FROM notifications WHERE is_unread = true`;
      const unreadParams: any[] = [];
      if (email.trim()) {
        unreadParams.push(email.toLowerCase().trim());
        unreadCountQuery += ` AND (user_email IS NULL OR LOWER(user_email) = $1)`;
      }
      const unreadResult = await query(unreadCountQuery, unreadParams);
      const unreadCount = parseInt(unreadResult.rows[0]?.unread_count || "0", 10);

      res.status(200).json({
        success: true,
        notifications,
        unreadCount,
        totalCount: notifications.length,
      });
    } catch (error: any) {
      console.error("NotificationController.getNotifications error:", error);
      res.status(500).json({ error: "Failed to retrieve notifications." });
    }
  },

  /**
   * 2. Create a new notification
   */
  async createNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        userEmail,
        userId,
        category = "system",
        title,
        description,
        avatarUrl,
        iconName = "bell",
        iconBgColor = "#EFF6FF",
        iconColor = "#3B82F6",
        actionType,
        actionLabel,
        contactData,
        meetingId,
        chatId,
      } = req.body;

      if (!title || !description) {
        res.status(400).json({ error: "Title and description are required." });
        return;
      }

      const insertQuery = `
        INSERT INTO notifications (
          user_id, user_email, category, title, description,
          avatar_url, icon_name, icon_bg_color, icon_color,
          action_type, action_label, contact_data, meeting_id, chat_id,
          is_unread, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11, $12, $13, $14,
          true, NOW(), NOW()
        ) RETURNING *;
      `;

      const result = await query(insertQuery, [
        userId || null,
        userEmail ? userEmail.toLowerCase().trim() : null,
        category,
        title,
        description,
        avatarUrl || null,
        iconName,
        iconBgColor,
        iconColor,
        actionType || null,
        actionLabel || null,
        contactData ? JSON.stringify(contactData) : null,
        meetingId || null,
        chatId || null,
      ]);

      const created = mapNotificationRowToDto(result.rows[0]);

      res.status(201).json({
        success: true,
        notification: created,
      });
    } catch (error: any) {
      console.error("NotificationController.createNotification error:", error);
      res.status(500).json({ error: "Failed to create notification." });
    }
  },

  /**
   * 3. Mark single notification as read
   */
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await query(
        `UPDATE notifications SET is_unread = false, updated_at = NOW() WHERE id = $1 RETURNING id`,
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "Notification not found." });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Notification marked as read.",
        id: result.rows[0].id,
      });
    } catch (error: any) {
      console.error("NotificationController.markAsRead error:", error);
      res.status(500).json({ error: "Failed to mark notification as read." });
    }
  },

  /**
   * 4. Mark all notifications as read
   */
  async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const email =
        req.user?.email ||
        (req.headers["x-user-email"] as string) ||
        (req.body?.email as string) ||
        (req.query?.email as string) ||
        "";

      let updateQuery = `UPDATE notifications SET is_unread = false, updated_at = NOW() WHERE is_unread = true`;
      const queryParams: any[] = [];

      if (email.trim()) {
        queryParams.push(email.toLowerCase().trim());
        updateQuery += ` AND (user_email IS NULL OR LOWER(user_email) = $1)`;
      }

      await query(updateQuery, queryParams);

      res.status(200).json({
        success: true,
        message: "All notifications marked as read.",
      });
    } catch (error: any) {
      console.error("NotificationController.markAllAsRead error:", error);
      res.status(500).json({ error: "Failed to mark all notifications as read." });
    }
  },

  /**
   * 5. Delete a single notification
   */
  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await query(
        `DELETE FROM notifications WHERE id = $1 RETURNING id`,
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: "Notification not found." });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Notification deleted.",
        id: result.rows[0].id,
      });
    } catch (error: any) {
      console.error("NotificationController.deleteNotification error:", error);
      res.status(500).json({ error: "Failed to delete notification." });
    }
  },

  /**
   * 6. Clear all notifications
   */
  async clearAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const email =
        req.user?.email ||
        (req.headers["x-user-email"] as string) ||
        (req.body?.email as string) ||
        (req.query?.email as string) ||
        "";

      let deleteQuery = `DELETE FROM notifications WHERE 1=1`;
      const queryParams: any[] = [];

      if (email.trim()) {
        queryParams.push(email.toLowerCase().trim());
        deleteQuery += ` AND (user_email IS NULL OR LOWER(user_email) = $1)`;
      }

      await query(deleteQuery, queryParams);

      res.status(200).json({
        success: true,
        message: "All notifications cleared.",
      });
    } catch (error: any) {
      console.error("NotificationController.clearAll error:", error);
      res.status(500).json({ error: "Failed to clear notifications." });
    }
  },
};

export default notificationController;
