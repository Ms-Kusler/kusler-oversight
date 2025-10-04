import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    userRole?: string;
  }
}

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.session.userId;
  
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const user = await storage.getUser(userId);
  if (!user || !user.isActive) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: "Invalid or inactive user" });
  }

  req.userId = userId;
  req.userRole = user.role;
  next();
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  await requireAuth(req, res, async () => {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  });
}

export async function logAdminAction(
  adminId: string,
  action: string,
  targetUserId?: string,
  details?: any,
  ipAddress?: string
) {
  await storage.createAuditLog({
    adminId,
    targetUserId,
    action,
    details,
    ipAddress
  });
}
