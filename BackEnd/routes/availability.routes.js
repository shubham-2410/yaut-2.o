import express from "express";
import {
  checkSlotAvailability,
  getAvailabilitySummary,
  lockSlot,
  releaseSlot,
} from "../controllers/availability.controller.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Check availability for a specific date
// GET /api/yacht-availability/:yachtId?date=YYYY-MM-DD
router.get("/:yachtId", authMiddleware, checkSlotAvailability);

// Get availability summary for a date range
// GET /api/yacht-availability/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get("/summary/get", authMiddleware, getAvailabilitySummary);

/**
 * Lock a slot for a yacht
 * POST /api/yacht-availability/lock
 * Body: { yachtId, date, startTime, endTime, lockDurationMinutes }
 */
router.post("/lock", authMiddleware, lockSlot);

/**
 * Release a locked slot
 * PUT /api/yacht-availability/release
 * Body: { yachtId, date, startTime, endTime }
 */
router.put("/release", authMiddleware, releaseSlot);


export default router;
