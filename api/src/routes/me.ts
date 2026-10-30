import { Router } from "express";
import { getMe } from "../controllers/meController";
import { userContext } from "../middleware/userContext";

export const meRouter = Router();

meRouter.get("/", userContext, getMe);
