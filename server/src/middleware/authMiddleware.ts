import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "../models";
import { createAnonClient, createServiceClient } from "../lib/supabase";

export interface AuthedRequest extends Request {
  user?: { id: string; role: UserRole; email: string; name: string };
  accessToken?: string;
}

export function authMiddleware(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization" });
    return;
  }
  const token = header.slice(7);

  void (async () => {
    try {
      const anon = createAnonClient();
      const { data, error } = await anon.auth.getUser(token);
      if (error || !data.user) {
        res.status(401).json({ error: "Invalid or expired token" });
        return;
      }

      // Use service client to bypass RLS for profile lookup
      // (token is already validated above via getUser)
      const svc = createServiceClient();
      const { data: profile, error: pErr } = await svc
        .from("profiles")
        .select("role, full_name, email")
        .eq("id", data.user.id)
        .maybeSingle();

      if (pErr) {
        console.error("profiles query error:", pErr);
        res.status(500).json({ error: pErr.message });
        return;
      }
      if (!profile) {
        console.error("no profile found for user:", data.user.id);
        res.status(401).json({ error: "Profile not found" });
        return;
      }

      req.user = {
        id: data.user.id,
        email: data.user.email ?? profile.email,
        name: profile.full_name,
        role: profile.role as UserRole,
      };
      req.accessToken = token;
      next();
    } catch (err) {
      console.error("authMiddleware error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  })();
}

export function requireRoles(...roles: UserRole[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden for this role" });
      return;
    }
    next();
  };
}
