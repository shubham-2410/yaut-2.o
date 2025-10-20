import {AvailabilityModel} from '../models/availability.model.js'

export const checkSlotAvailability = async ({ yachtId, date, startTime, endTime, employeeId }) => {
  // Find all slots on the same date
  const slots = await AvailabilityModel.find({ yachtId, date });

  // Convert times to minutes for easy comparison
  const toMinutes = (time) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const newStart = toMinutes(startTime);
  const newEnd = toMinutes(endTime);

  for (const slot of slots) {
    const slotStart = toMinutes(slot.startTime);
    const slotEnd = toMinutes(slot.endTime);

    const overlap = newStart < slotEnd && newEnd > slotStart;

    if (overlap) {
      if (slot.status === "booked") {
        return { available: false, reason: "Slot already booked." };
      }
      if (slot.status === "locked" && String(slot.appliedBy) !== String(employeeId)) {
        return { available: false, reason: "Slot locked by another employee." };
      }
      if (slot.status === "locked" && String(slot.appliedBy) === String(employeeId)) {
        // Overlap with same employee lock → allow booking
        return { available: true, conflictSlot: slot };
      }
    }
  }
  // No overlap → slot is free
  return { available: true };
};


export const getAvailabilitySummary = async (req, res, next) => {
  try {
    const { yachtId } = req.params;
    const { startDate, endDate } = req.query;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get all slots for range
    const slots = await AvailabilityModel.find({
      yachtId,
      date: { $gte: startDate, $lte: endDate },
    });

    // Group by date
    const summary = {};
    slots.forEach((slot) => {
      if (!summary[slot.date]) summary[slot.date] = [];
      summary[slot.date].push(slot);
    });

    // Build per-day summaries
    const days = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const daySlots = summary[dateStr] || [];
      const booked = daySlots.filter((s) => s.status === "booked").length;
      const totalSlots = daySlots.length;

      days.push({
        date: dateStr,
        status: booked ? "busy" : "free",
        booked,
        availableHours: 24 - booked * 2, // Example: each booking = 2h
      });
    }

    res.json({ success: true, yachtId, days });
  } catch (error) {
    next(error);
  }
};

export const lockSlot = async (req, res, next) => {
  try {
    const { yachtId, date, startTime, endTime, lockDurationMinutes = 15 } = req.body;
    const employeeId = req.user.id;

    const { available, conflictSlot, reason } = await checkSlotAvailability({ yachtId, date, startTime, endTime, employeeId });
    if (!available) return res.status(400).json({ success: false, message: reason });
    if (conflictSlot) return res.status(400).json({ success: false, message: "You already have a lock on this slot." });

    const [year, month, day] = date.split("-");
    const [endHour, endMinute] = endTime.split(":");
    const slotEndTime = new Date(year, month - 1, day, endHour, endMinute);
    const deleteAfter = new Date(slotEndTime.getTime() + lockDurationMinutes * 60 * 1000);

    const lockedSlot = await AvailabilityModel.create({
      yachtId, date, startTime, endTime, status: "locked", appliedBy: employeeId, deleteAfter
    });

    res.status(201).json({ success: true, message: "Slot locked successfully.", slot: lockedSlot });
  } catch (error) {
    next(error);
  }
};


export const releaseSlot = async (req, res, next) => {
  try {
    const { yachtId, date, startTime, endTime } = req.body;
    const employeeId = req.user.id;

    // Find the slot
    const slot = await AvailabilityModel.findOne({
      yachtId,
      date,
      startTime,
      endTime,
    });

    if (!slot) {
      return res.status(404).json({ success: false, message: "Slot not found." });
    }

    if (slot.status !== "locked") {
      return res.status(400).json({ success: false, message: "Slot is not locked." });
    }

    if (String(slot.appliedBy) !== String(employeeId)) {
      return res.status(403).json({ success: false, message: "You cannot release a slot locked by another employee." });
    }

    // Delete the slot
    await slot.deleteOne();

    res.json({ success: true, message: "Locked slot released successfully." });
  } catch (error) {
    console.error("Release slot error:", error);
    next(error);
  }
};