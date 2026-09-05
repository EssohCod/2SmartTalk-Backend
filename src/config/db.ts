import { Pool, PoolConfig, QueryResult, QueryResultRow } from "pg";
import { env } from "./env";

const poolConfig: PoolConfig = {
  connectionString: env.db.connectionString,
  ssl: { rejectUnauthorized: false },
  max: 15,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

export const pool = new Pool(poolConfig);

pool.on("error", (err) => {
  console.warn("Recoverable PostgreSQL client idle event:", err.message);
});

export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (!env.isProduction) {
      console.log("Executed query", { text, duration: `${duration}ms`, rows: res.rowCount });
    }
    return res;
  } catch (err: any) {
    // Retry once if connection was terminated unexpectedly or timed out
    if (err?.message?.includes("Connection terminated") || err?.message?.includes("timeout")) {
      console.warn("PostgreSQL connection retrying once after:", err.message);
      const res = await pool.query<T>(text, params);
      return res;
    }
    throw err;
  }
};

export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    client.release();
    return true;
  } catch (error) {
    console.warn("Database connection check failed:", (error as Error).message);
    return false;
  }
};
