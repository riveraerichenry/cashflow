
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
}

const globalForPg = globalThis as typeof globalThis & {
    cashflowPool?: Pool;
};

function createPool() {
    const pool = new Pool({
        connectionString,

        ssl: {
            rejectUnauthorized: false,
        },

        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 20000,
        keepAlive: true,
    });

    pool.on("error", (error) => {
        console.error("POSTGRES POOL ERROR:", error.message);
    });

    return pool;
}

export const pool =
    globalForPg.cashflowPool ?? createPool();

globalForPg.cashflowPool = pool;

// Database connection diagnostics
export function getPoolStatus() {
    return {
        totalConnections: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingRequests: pool.waitingCount,
        maxConnections: pool.options.max,
    };
}
