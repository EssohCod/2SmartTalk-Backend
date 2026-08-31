import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const DEFAULT_DB_URL = "postgresql://db_2smart_talk_user:Q3Cys44iTHW0bdVrQJCOhMCRwLTffB0z@dpg-daastdp5efls738spkjg-a.oregon-postgres.render.com/db_2smart_talk";

export const env = {
  port: parseInt(process.env.PORT || "5001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  db: {
    host: process.env.DB_HOST || "dpg-daastdp5efls738spkjg-a.oregon-postgres.render.com",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    database: process.env.DB_NAME || "db_2smart_talk",
    user: process.env.DB_USER || "db_2smart_talk_user",
    password: process.env.DB_PASSWORD || "Q3Cys44iTHW0bdVrQJCOhMCRwLTffB0z",
    connectionString: process.env.DATABASE_URL || process.env.EXTERNAL_DB_URL || DEFAULT_DB_URL,
    ssl: true,
  },
  jwt: {
    secret: process.env.JWT_SECRET || "2smarttalk_super_secret_jwt_key_2026_secure",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  },
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "nessoh1007@gmail.com",
    pass: process.env.SMTP_PASS || "mgbzmgxvstibzbwk",
    from: process.env.EMAIL_FROM || '"2SmartTalk" <no-reply@2smarttalk.com>',
  },
};
