import { pool } from "../config/db";

/**
 * Initializes the database tables if they do not exist
 */
export async function initDb(): Promise<void> {
  const client = await pool.connect();
  try {
    console.log("🛠️  Initializing database schema...");

    await client.query("BEGIN");

    // Enable uuid-ossp extension for UUID generation if supported
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // 1. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        name VARCHAR(200) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        gender VARCHAR(50) DEFAULT 'Other',
        native_language VARCHAR(100) DEFAULT 'English (US)',
        native_language_flag VARCHAR(10) DEFAULT '🇺🇸',
        is_email_verified BOOLEAN DEFAULT false,
        avatar_url TEXT DEFAULT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 2. OTPs Table (Email verification, Password reset)
    await client.query(`
      CREATE TABLE IF NOT EXISTS otps (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(6) NOT NULL,
        type VARCHAR(50) NOT NULL, -- 'email_verification' | 'password_reset'
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        is_used BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 3. Meetings Table (Scheduled & Upcoming Meetings)
    await client.query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        host_id UUID REFERENCES users(id) ON DELETE SET NULL,
        host_email VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        meeting_type VARCHAR(50) DEFAULT 'video',
        meeting_date VARCHAR(100) NOT NULL,
        start_time VARCHAR(50) NOT NULL,
        end_time VARCHAR(50) NOT NULL,
        timezone VARCHAR(100) NOT NULL,
        duration VARCHAR(100),
        shareable_link TEXT NOT NULL,
        participants JSONB DEFAULT '[]'::jsonb,
        dubbing_enabled BOOLEAN DEFAULT true,
        is_host BOOLEAN DEFAULT true,
        mute_all_allowed BOOLEAN DEFAULT true,
        allow_unmute BOOLEAN DEFAULT true,
        waiting_room_enabled BOOLEAN DEFAULT false,
        reminder_10min BOOLEAN DEFAULT true,
        speak_language VARCHAR(100) DEFAULT 'English',
        speak_language_flag VARCHAR(10) DEFAULT '🇺🇸',
        status VARCHAR(50) DEFAULT 'upcoming',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 4. Contacts Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        contact_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(200) NOT NULL,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        avatar_url TEXT,
        native_language VARCHAR(100) DEFAULT 'English',
        native_language_flag VARCHAR(10) DEFAULT '🇺🇸',
        location VARCHAR(100) DEFAULT 'Global',
        is_online BOOLEAN DEFAULT false,
        is_favorite BOOLEAN DEFAULT false,
        bio TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create indexes for fast lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_otps_email_type ON otps(email, type);
      CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_meetings_host ON meetings(host_email);
      CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
      CREATE INDEX IF NOT EXISTS idx_contacts_username ON contacts(username);
    `);

    await client.query("COMMIT");
    console.log("✅ Database schema initialized successfully (users, otps, meetings, contacts tables ready)");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Failed to initialize database schema:", error);
    throw error;
  } finally {
    client.release();
  }
}
