import { Pool, PoolConfig, QueryResult, QueryResultRow } from "pg";
import { env } from "./env";

const poolConfig: PoolConfig = {
  connectionString: env.db.connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

export const pool = new Pool(poolConfig);

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
});

export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (!env.isProduction) {
    console.log("Executed query", { text, duration: `${duration}ms`, rows: res.rowCount });
  }
  return res;
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
