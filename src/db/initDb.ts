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

    // 5. Groups Table (Multilingual Collaboration Groups)
    await client.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT 'Engineering',
        description TEXT,
        avatar_url TEXT,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_by_email VARCHAR(255),
        invite_link TEXT NOT NULL,
        members JSONB DEFAULT '[]'::jsonb,
        languages JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 6. Conversations Table (Direct & Group Chat Threads)
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        type VARCHAR(50) NOT NULL DEFAULT 'direct', -- 'direct' | 'group'
        title VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
        participants JSONB DEFAULT '[]'::jsonb,
        last_message TEXT,
        last_message_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        unread_count INT DEFAULT 0,
        recipient_lang VARCHAR(100) DEFAULT 'English',
        recipient_lang_flag VARCHAR(10) DEFAULT '🇺🇸',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 7. Messages Table (Real-Time Translated Messages)
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
        sender_name VARCHAR(200) NOT NULL,
        sender_username VARCHAR(100),
        sender_avatar TEXT,
        sender_language VARCHAR(100) DEFAULT 'English',
        sender_language_flag VARCHAR(10) DEFAULT '🇺🇸',
        original_text TEXT NOT NULL,
        translated_text TEXT,
        target_language VARCHAR(100),
        target_language_flag VARCHAR(10),
        message_type VARCHAR(50) DEFAULT 'text', -- 'text' | 'audio' | 'image' | 'video' | 'file'
        audio_url TEXT,
        audio_duration VARCHAR(20),
        media_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
      CREATE INDEX IF NOT EXISTS idx_groups_created ON groups(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON conversations(last_message_time DESC);
      CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at ASC);
    `);

    await client.query("COMMIT");
    console.log("✅ Database schema initialized successfully (users, otps, meetings, contacts, groups, conversations, messages tables ready)");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Failed to initialize database schema:", error);
    throw error;
  } finally {
    client.release();
  }
}
