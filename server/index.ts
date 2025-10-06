// server/index.ts
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { startAutomations } from "./automation";
import { seedAdminUser, seedDemoClient } from "./seed";

const { Pool } = pg;
const PgSession = connectPgSimple(session);

function simpleLog(msg: string) {
  const time = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${time} [express] ${msg}`);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 🚨 CRITICAL for Railway/HTTPS proxies so secure cookies are accepted
app.set("trust proxy", 1);

// Postgres pool for sessions
const sessionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Sessions
app.use(
  session({
    store: new PgSession({
      pool: sessionPool,
      tableName: "session",
      createTableIfMissing: true,
      pruneSessionInterval: 60 * 15,
    }),
    secret:
      process.env.SESSION_SECRET ||
      "operations-hub-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    name: "sessionId",
    cookie: {
      secure: process.env.NODE_ENV === "production", // only over HTTPS in prod
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// Minimal API logger
app.use((req, res, next) => {
  const start = Date.now();
  const p = req.path;
  let captured: Record<string, any> | undefined;

  const origJson = res.json.bind(res);
  (res as any).json = (body: any, ...args: any[]) => {
    captured = body;
    return origJson(body, ...args);
  };

  res.on("finish", () => {
    if (p.startsWith("/api")) {
      const ms = Date.now() - start;
      let line = `${req.method} ${p} ${res.statusCode} in ${ms}ms`;
      if (captured) line += ` :: ${JSON.stringify(captured)}`;
      if (line.length > 80) line = line.slice(0, 79) + "…";
      simpleLog(line);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // Dev vs Prod static serving
  if (app.get("env") === "development") {
    const { setupVite, log } = await import("./vite");
    await setupVite(app, server);
    (globalThis as any).__viteLog = log;
  } else {
    const serverDir =
      typeof import.meta.dirname === "string"
        ? (import.meta as any).dirname
        : path.dirname(fileURLToPath(import.meta.url));
    const distPath = path.resolve(serverDir, "public");

    if (!fs.existsSync(distPath)) {
      throw new Error(
        `Could not find the build directory: ${distPath}, build the client first.`
      );
    }

    app.use(express.static(distPath));
    app.use("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  // Start
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    async () => {
      const logFn = (globalThis as any).__viteLog || simpleLog;
      logFn(`serving on port ${port}`);
      await seedAdminUser();
      await seedDemoClient();
      startAutomations();
    }
  );

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    const logFn = (globalThis as any).__viteLog || simpleLog;
    logFn("SIGTERM: closing HTTP server and DB pool");
    server.close(() => logFn("HTTP server closed"));
    await sessionPool.end();
    logFn("Database pool closed");
    process.exit(0);
  });
})();
