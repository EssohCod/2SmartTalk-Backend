import { Request, Response } from "express";
import { pool } from "../config/db";

export const groupController = {
  /**
   * 1. Get All Multilingual Groups
   */
  async getGroups(req: Request, res: Response): Promise<void> {
    try {
      const result = await pool.query(
        "SELECT * FROM groups ORDER BY created_at DESC"
      );

      const groups = result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category || "Engineering",
        description: row.description || "",
        avatarUrl: row.avatar_url,
        inviteLink: row.invite_link,
        memberCount: Array.isArray(row.members) ? row.members.length : 0,
        members: Array.isArray(row.members) ? row.members : [],
        languages: Array.isArray(row.languages) ? row.languages : [],
        createdAt: row.created_at,
      }));

      res.status(200).json({
        success: true,
        count: groups.length,
        groups,
      });
    } catch (error: any) {
      console.error("GroupController.getGroups error:", error);
      res.status(500).json({ error: "Failed to retrieve groups list." });
    }
  },

  /**
   * 2. Create a New Multilingual Group
   */
  async createGroup(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const {
        name,
        category = "Engineering",
        description = "",
        members = [],
        languages = [],
        avatarUrl = null,
      } = req.body;

      if (!name || typeof name !== "string" || !name.trim()) {
        res.status(400).json({ error: "Group name is required." });
        return;
      }

      const cleanName = name.trim();
      const inviteCode = Math.random().toString(36).substring(2, 9).toUpperCase();
      const inviteLink = `https://2smarttalk.com/g/${inviteCode}`;

      // Derive languages if not provided
      let groupLanguages: string[] = languages;
      if ((!groupLanguages || groupLanguages.length === 0) && Array.isArray(members)) {
        const uniqueLangs = new Set<string>();
        members.forEach((m: any) => {
          if (m.language) uniqueLangs.add(m.language);
        });
        groupLanguages = Array.from(uniqueLangs);
      }

      if (groupLanguages.length === 0) {
        groupLanguages = ["English", "Spanish", "French"];
      }

      const insertResult = await pool.query(
        `INSERT INTO groups (
          name, category, description, avatar_url,
          created_by, created_by_email, invite_link,
          members, languages
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9
        ) RETURNING *`,
        [
          cleanName,
          category,
          description.trim() || `Multilingual ${category} team with active AI dubbing.`,
          avatarUrl,
          user ? user.id : null,
          user ? user.email : null,
          inviteLink,
          JSON.stringify(members),
          JSON.stringify(groupLanguages),
        ]
      );

      const row = insertResult.rows[0];

      res.status(201).json({
        success: true,
        message: "Group created successfully!",
        group: {
          id: row.id,
          name: row.name,
          category: row.category,
          description: row.description,
          avatarUrl: row.avatar_url,
          inviteLink: row.invite_link,
          memberCount: Array.isArray(row.members) ? row.members.length : 0,
          members: Array.isArray(row.members) ? row.members : [],
          languages: Array.isArray(row.languages) ? row.languages : [],
          createdAt: row.created_at,
        },
      });
    } catch (error: any) {
      console.error("GroupController.createGroup error:", error);
      res.status(500).json({ error: "Failed to create group. Please try again." });
    }
  },

  /**
   * 3. Get Group by ID
   */
  async getGroupById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await pool.query("SELECT * FROM groups WHERE id = $1", [id]);

      if (result.rows.length === 0) {
        res.status(404).json({ error: "Group not found." });
        return;
      }

      const row = result.rows[0];

      res.status(200).json({
        success: true,
        group: {
          id: row.id,
          name: row.name,
          category: row.category,
          description: row.description,
          avatarUrl: row.avatar_url,
          inviteLink: row.invite_link,
          memberCount: Array.isArray(row.members) ? row.members.length : 0,
          members: Array.isArray(row.members) ? row.members : [],
          languages: Array.isArray(row.languages) ? row.languages : [],
          createdAt: row.created_at,
        },
      });
    } catch (error: any) {
      console.error("GroupController.getGroupById error:", error);
      res.status(500).json({ error: "Failed to retrieve group details." });
    }
  },

  /**
   * 4. Delete Group
   */
  async deleteGroup(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const deleteResult = await pool.query("DELETE FROM groups WHERE id = $1 RETURNING id", [id]);

      if (deleteResult.rowCount === 0) {
        res.status(404).json({ error: "Group not found." });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Group deleted successfully.",
        deletedId: id,
      });
    } catch (error: any) {
      console.error("GroupController.deleteGroup error:", error);
      res.status(500).json({ error: "Failed to delete group." });
    }
  },
};

export default groupController;
