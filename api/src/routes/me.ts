import { Router } from "express";
import { getMe } from "../controllers/meController";
import { getMyTickets } from "../controllers/ticketController";
import { userContext } from "../middleware/userContext";

export const meRouter = Router();

meRouter.get("/", userContext, getMe);
meRouter.get("/tickets", userContext, getMyTickets);
