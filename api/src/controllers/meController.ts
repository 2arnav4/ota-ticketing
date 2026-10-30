import type { Request, Response } from "express";
import { currentUser } from "../middleware/userContext";

// Lets the app show who is selected and whether to offer the staff-only Scan tab. The UI hint only;
// the server enforces roles per route.
export function getMe(req: Request, res: Response): void {
  const { id, name, role } = currentUser(req);
  res.json({ user: { id, name, role } });
}
