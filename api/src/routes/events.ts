import { Router } from "express";
import { getEvents } from "../controllers/eventController";
import { userContext } from "../middleware/userContext";

export const eventsRouter = Router();

eventsRouter.get("/", userContext, getEvents);
