import { AvailabilityModel } from "../models/availability.model.js";
import { BookingModel } from "../models/booking.model.js";
import { YachtModel } from "../models/yacht.model.js";

// -------------------------
// Helper: Convert HH:mm to minutes
// -------------------------
const toMinutes = (time) => {
  if (!time) throw new Error("Invalid time string passed to toMinutes");
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

// -------------------------
// Check if a slot is available
// -------------------------
export const checkSlotAvailability = async ({ yachtId, date, startTime, endTime, employeeId }) => {
  if (!yachtId || !date || !startTime || !endTime) {
    return { available: false, reason: "yachtId, date, startTime, and endTime are required." };
  }

  const slots = await AvailabilityModel.find({ yachtId, date });

  const newStart = toMinutes(startTime);
  const newEnd = toMinutes(endTime);

  for (const slot of slots) {
    const slotStart = toMinutes(slot.startTime);
    const slotEnd = toMinutes(slot.endTime);

    const overlap = newStart < slotEnd && newEnd > slotStart;

    if (overlap) {
      if (slot.status === "booked") return { available: false, reason: "Slot already booked." };
      if (slot.status === "locked" && String(slot.appliedBy) !== String(employeeId)) {
        return { available: false, reason: "Slot locked by another employee." };
      }
      if (slot.status === "locked" && String(slot.appliedBy) === String(employeeId)) {
        return { available: true, conflictSlot: slot };
      }
    }
  }

  return { available: true };
};

// -------------------------
// Lock a slot
// -------------------------
export const lockSlot = async (req, res, next) => {
  try {
    const { yachtId, date, startTime, endTime, lockDurationMinutes = 15 } = req.body;
    const employeeId = req.user.id;

    // Validate input
    if (!yachtId || !date || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: "yachtId, date, startTime, and endTime are required." });
    }

    const { available, conflictSlot, reason } = await checkSlotAvailability({ yachtId, date, startTime, endTime, employeeId });
    if (!available) return res.status(400).json({ success: false, message: reason });
    if (conflictSlot) return res.status(400).json({ success: false, message: "You already have a lock on this slot." });

    const [year, month, day] = date.split("-");
    const [endHour, endMinute] = endTime.split(":");
    const slotEndTime = new Date(year, month - 1, day, endHour, endMinute);
    const deleteAfter = new Date(slotEndTime.getTime() + lockDurationMinutes * 60 * 1000);

    const lockedSlot = await AvailabilityModel.create({
      yachtId,
      date,
      startTime,
      endTime,
      status: "locked",
      appliedBy: employeeId,
      deleteAfter,
    });

    res.status(201).json({ success: true, message: "Slot locked successfully.", slot: lockedSlot });
  } catch (error) {
    console.error("lockSlot error:", error);
    next(error);
  }
};

// -------------------------
// Release a locked slot
// -------------------------
export const releaseSlot = async (req, res, next) => {
  try {
    const { yachtId, date, startTime, endTime } = req.body;
    const employeeId = req.user.id;

    if (!yachtId || !date || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: "yachtId, date, startTime, and endTime are required." });
    }

    const slot = await AvailabilityModel.findOne({ yachtId, date, startTime, endTime });
    if (!slot) return res.status(404).json({ success: false, message: "Slot not found." });
    if (slot.status !== "locked") return res.status(400).json({ success: false, message: "Slot is not locked." });
    if (String(slot.appliedBy) !== String(employeeId)) return res.status(403).json({ success: false, message: "You cannot release a slot locked by another employee." });

    await slot.deleteOne();
    res.json({ success: true, message: "Locked slot released successfully." });
  } catch (error) {
    console.error("releaseSlot error:", error);
    next(error);
  }
};

// -------------------------
// Get availability summary for all yachts
// -------------------------
// export const getAvailabilitySummary = async (req, res, next) => {
//   console.log("Im in")
//   try {
//     const { startDate, endDate } = req.query;
//     const { company } = req.user;

//     if (!startDate || !endDate) return res.status(400).json({ success: false, message: "Start and end dates are required." });

//     const start = new Date(startDate);
//     const end = new Date(endDate);

//     const yachts = await YachtModel.find({ company }).select("_id name");
//     if (!yachts.length) return res.status(404).json({ success: false, message: "No yachts found for this company." });

//     const yachtIds = yachts.map((y) => y._id);

//     const slots = await AvailabilityModel.find({
//       yachtId: { $in: yachtIds },
//       date: { $gte: start, $lte: end },
//     });

//     const summary = {};
//     slots.forEach((slot) => {
//       if (!slot || !slot.date) return;
//       const yachtKey = slot.yachtId.toString();
//       const dateStr = slot.date.toISOString().split("T")[0];

//       if (!summary[yachtKey]) summary[yachtKey] = {};
//       if (!summary[yachtKey][dateStr]) summary[yachtKey][dateStr] = [];
//       summary[yachtKey][dateStr].push(slot);
//     });

//     const yachtSummaries = yachts.map((yacht) => {
//       const yachtData = [];
//       for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
//         const dateStr = d.toISOString().split("T")[0];
//         const daySlots = summary[yacht._id]?.[dateStr] || [];
//         const booked = daySlots.filter((s) => s.status === "booked").length;
//         const locked = daySlots.filter((s) => s.status === "locked").length;

//         yachtData.push({
//           date: dateStr,
//           status: booked ? "busy" : locked ? "locked" : "free",
//           bookedSlots: booked,
//           lockedSlots: locked,
//         });
//       }
//       return {
//         yachtId: yacht._id,
//         yachtName: yacht.name,
//         availability: yachtData,
//       };
//     });

//     res.json({ success: true, company, range: { startDate, endDate }, yachts: yachtSummaries });
//   } catch (error) {
//     console.error("getAvailabilitySummary error:", error);
//     next(error);
//   }
// };

// Helper to safely convert string to Date
const parseDate = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d)) throw new Error(`Invalid date: ${dateStr}`);
  return d;
};

// GET /api/availability/summary
// export const getAvailabilitySummary = async (req, res, next) => {
//   try {
//     const { startDate, endDate } = req.query;
//     const { company } = req.user;

//     if (!startDate || !endDate) {
//       return res.status(400).json({ success: false, message: "Start and end dates are required." });
//     }

//     const start = parseDate(startDate);
//     const end = parseDate(endDate);

//     // Fetch all yachts for the company
//     const yachts = await YachtModel.find({ company }).select("_id name");
//     if (!yachts.length) return res.status(404).json({ success: false, message: "No yachts found for this company." });

//     const yachtIds = yachts.map((y) => y._id);

//     // Fetch all availability slots
//     const slots = await AvailabilityModel.find({
//       yachtId: { $in: yachtIds },
//       date: { $gte: start, $lte: end },
//     });

//     // Fetch all bookings
//     const bookings = await BookingModel.find({
//       yachtId: { $in: yachtIds }, // make sure field is yachtId
//       date: { $gte: start, $lte: end },
//       status: { $in: ["initiated", "booked"] },
//     });

//     // Organize slots & bookings by yacht & date
//     const summary = {};
//     yachts.forEach((y) => (summary[y._id] = {}));

//     // Add availability slots
//     slots.forEach((slot) => {
//       if (!slot || !slot.date || !slot.yachtId) return;
//       const dateStr = slot.date.toISOString().split("T")[0];
//       summary[slot.yachtId][dateStr] = summary[slot.yachtId][dateStr] || { booked: 0, locked: 0 };
//       if (slot.status === "booked") summary[slot.yachtId][dateStr].booked += 1;
//       if (slot.status === "locked") summary[slot.yachtId][dateStr].locked += 1;
//     });

//     // Add bookings
//     bookings.forEach((b) => {
//       if (!b || !b.date || !b.yachtId) return;
//       const dateStr = b.date.toISOString().split("T")[0];
//       summary[b.yachtId][dateStr] = summary[b.yachtId][dateStr] || { booked: 0, locked: 0 };
//       summary[b.yachtId][dateStr].booked += 1; // count booking as busy
//     });

//     // Build response
//     const yachtSummaries = yachts.map((yacht) => {
//       const yachtData = [];
//       for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
//         const dateStr = d.toISOString().split("T")[0];
//         const dayInfo = summary[yacht._id][dateStr] || { booked: 0, locked: 0 };
//         yachtData.push({
//           date: dateStr,
//           status: dayInfo.booked > 0 ? "busy" : dayInfo.locked > 0 ? "locked" : "free",
//           bookedSlots: dayInfo.booked,
//           lockedSlots: dayInfo.locked,
//         });
//       }
//       return {
//         yachtId: yacht._id,
//         yachtName: yacht.name,
//         availability: yachtData,
//       };
//     });

//     console.log("Yacht summaries:", yachtSummaries); // debug
//     res.json({ success: true, company, range: { startDate, endDate }, yachts: yachtSummaries });
//   } catch (error) {
//     console.error("getAvailabilitySummary error:", error);
//     next(error);
//   }
// };

export const getAvailabilitySummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const { company } = req.user;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: "Start and end dates are required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid start or end date" });
    }

    // Fetch yachts
    const yachts = await YachtModel.find({ company }).select("_id name");
    if (!yachts.length) {
      return res.status(404).json({ success: false, message: "No yachts found" });
    }

    const yachtIds = yachts.map((y) => y._id);

    // Fetch bookings
    const bookings = await BookingModel.find({
      yachtId: { $in: yachtIds },
      date: { $gte: start, $lte: end },
      status: { $in: ["initiated", "booked"] },
    });

    // Map yachts -> date -> booked info
    const summary = {};
    yachts.forEach((y) => (summary[y._id] = {}));

    bookings.forEach((b) => {
      if (!b || !b.date || !b.yachtId || !b.startTime || !b.endTime) return;

      const dateStr = b.date.toISOString().split("T")[0];
      summary[b.yachtId][dateStr] = summary[b.yachtId][dateStr] || { bookings: 0, bookedTime: 0 };

      summary[b.yachtId][dateStr].bookings += 1;

      // Calculate duration in hours
      const [startH, startM] = b.startTime.split(":").map(Number);
      const [endH, endM] = b.endTime.split(":").map(Number);

      let duration = endH + endM / 60 - (startH + startM / 60);
      if (duration < 0) duration += 24; // handle overnight bookings
      summary[b.yachtId][dateStr].bookedTime += duration;
    });

    // Build response
    const yachtSummaries = yachts.map((yacht) => {
      const yachtData = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        const dayInfo = summary[yacht._id][dateStr] || { bookings: 0, bookedTime: 0 };

        yachtData.push({
          date: dateStr,
          status: dayInfo.bookings > 3 ? "busy" : "free",
          bookingsCount: dayInfo.bookings,
          bookedTime: dayInfo.bookedTime, // in hours
        });
      }
      return { yachtId: yacht._id, yachtName: yacht.name, availability: yachtData };
    });

    res.json({ success: true, company, range: { startDate, endDate }, yachts: yachtSummaries });
  } catch (err) {
    console.error("Error in getAvailabilitySummary:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDayAvailability = async (req, res, next) => {
  console.log("In Day Avail back")
  try {
    const { yachtId } = req.params;
    const { date } = req.query; // expected format: YYYY-MM-DD

    if (!yachtId || !date) {
      return res
        .status(400)
        .json({ success: false, message: "yachtId and date are required" });
    }

    // ✅ Check if yacht exists
    const yacht = await YachtModel.findById(yachtId).select("name");
    if (!yacht) {
      return res
        .status(404)
        .json({ success: false, message: "Yacht not found" });
    }

    // ✅ Fetch bookings for that yacht & date
    const bookings = await BookingModel.find({
      yachtId,
      date,
      status: { $in: ["initiated", "booked"] },
    }).select("startTime endTime status");

    // ✅ Fetch locked slots from AvailabilityModel
    const lockedSlots = await AvailabilityModel.find({
      yachtId,
      date,
      status: "locked",
    }).select("startTime endTime appliedBy");

    // Format them nicely for frontend
    const bookedSlots = bookings.map((b) => ({
      start: b.startTime,
      end: b.endTime,
      status: b.status,
    }));

    const locked = lockedSlots.map((l) => ({
      start: l.startTime,
      end: l.endTime,
      status: "locked",
      appliedBy: l.appliedBy,
    }));

    // ✅ Send combined availability info
    return res.status(200).json({
      success: true,
      yachtId,
      yachtName: yacht.name,
      date,
      bookedSlots,
      lockedSlots: locked,
    });
  } catch (error) {
    console.error("getDayAvailability error:", error);
    next(error);
  }
};