import { Router } from "express";
import { authMiddleware, type AuthedRequest } from "../middleware/authMiddleware";

const router = Router();

/**
 * Current user + role (from `profiles`). Requires Supabase JWT (same token the client uses).
 * Registration and login are handled by Supabase Auth on the client.
 */
router.get("/me", authMiddleware, (req: AuthedRequest, res) => {
  const u = req.user!;
  res.json({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
  });
});

export default router;
