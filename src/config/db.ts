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

// Wrap pool.query with automatic retry on recoverable network / timeout / termination errors
const rawPoolQuery = pool.query.bind(pool);
(pool as any).query = async function (
  textOrConfig: any,
  paramsOrCallback?: any,
  callback?: any
): Promise<any> {
  if (typeof paramsOrCallback === "function" || typeof callback === "function") {
    return rawPoolQuery(textOrConfig, paramsOrCallback, callback);
  }
  const start = Date.now();
  try {
    const res = await rawPoolQuery(textOrConfig, paramsOrCallback);
    const duration = Date.now() - start;
    if (!env.isProduction) {
      const queryText = typeof textOrConfig === "string" ? textOrConfig : textOrConfig?.text;
      console.log("Executed query", { text: queryText, duration: `${duration}ms`, rows: res?.rowCount });
    }
    return res;
  } catch (err: any) {
    if (
      err?.message?.includes("Connection terminated") ||
      err?.message?.includes("timeout") ||
      err?.message?.includes("ECONNRESET") ||
      err?.code === "57P01"
    ) {
      console.warn("PostgreSQL pool connection retrying query once after:", err.message);
      const retryRes = await rawPoolQuery(textOrConfig, paramsOrCallback);
      return retryRes;
    }
    throw err;
  }
};

export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  return pool.query<T>(text, params);
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
