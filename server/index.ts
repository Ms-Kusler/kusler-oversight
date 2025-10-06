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
const pgSession = connectPgSimple(session);

// --- Simple Log Function ---
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

// ✅ TRUST PROXY (important for Railway HTTPS)
app.set("trust proxy", 1);

// --- Database Session Store ---
const sessionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// --- SESSION CONFIGURATION ---
app.use(
  session({
    store: new pgSession({
      pool: sessionPool,
      tableName: "session",
      createTableIfMissing: true,
      pruneSessionInterval: 60 * 15, // every 15 mins
    }),
    secret:
      process.env.SESSION_SECRET ||
      "operations-hub-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    proxy: true, // ✅ Required for Secure cookies on Railway
    cookie: {
      secure: process.env.NODE_ENV === "production", // true in production
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
    name: "sessionId",
  })
);

// --- LOGGING MIDDLEWARE ---
app.use((req, res, next) => {
  const start = Date.now();
  const pathName = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (pathName.startsWith("/api")) {
      let logLine = `${req.method} ${pathName} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      simpleLog(logLine);
    }
  });

  next();
});

// --- MAIN SERVER SETUP ---
(async () => {
  const server = await registerRoutes(app);

  // --- ERROR HANDLER ---
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // --- DEVELOPMENT vs PRODUCTION SERVE LOGIC ---
  if (app.get("env") === "development") {
    const { setupVite, log } = await import("./vite");
    await setupVite(app, server);
    (globalThis as any).__viteLog = log;
  } else {
    // Serve built frontend (dist/public)
    const serverDir =
      typeof import.meta.dirname === "string"
        ? import.meta.dirname
        : path.dirname(fileURLToPath(import.meta.url));
    const distPath = path.resolve(serverDir, "public");

    if (!fs.existsSync(distPath)) {
      throw new Error(
        `Could not find the build directory: ${distPath}. Make sure to build the client first.`
      );
    }

    app.use(express.static(distPath));
    app.use("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  // --- START SERVER ---
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    async () => {
      const logFn = (globalThis as any).__viteLog || simpleLog;
      logFn(`✅ Server running on port ${port}`);
      await seedAdminUser();
      await seedDemoClient();
      startAutomations();
    }
  );

  // --- GRACEFUL SHUTDOWN ---
  process.on("SIGTERM", async () => {
    const logFn = (globalThis as any).__viteLog || simpleLog;
    logFn("SIGTERM received: closing server and database...");
    server.close(() => logFn("HTTP server closed"));
    await sessionPool.end();
    logFn("Database pool closed");
    process.exit(0);
  });
})();
