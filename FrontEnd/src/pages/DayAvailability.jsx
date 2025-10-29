// DayAvailability.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getDayAvailability, lockSlot, releaseSlot } from "../services/operations/availabilityAPI";
import { getYachtById } from "../services/operations/yautAPI";

function DayAvailability() {
  const location = useLocation();
  const navigate = useNavigate();
  const { yachtId, yachtName, day } = location.state || {};

  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [yacht, setYacht] = useState(null);

  const token = localStorage.getItem("authToken");

  // SAFETY: ensure we have required state
  if (!day || !yachtId) {
    return (
      <div className="container mt-5 text-center">
        <p>⚠️ No yacht or date selected. Go back to the availability page.</p>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    );
  }

  // ---------- Helpers ----------
  const hhmmToMinutes = (time = "00:00") => {
    // defensive: if time missing or not string, return 0
    if (!time || typeof time !== "string") return 0;
    const parts = time.split(":").map((p) => Number(p));
    if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return 0;
    const [h, m] = parts;
    return h * 60 + m;
  };

  const minutesToHHMM = (minutes) => {
    const m = Number(minutes) || 0;
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };

  // Build slot list for a yacht (handles special slot splitting)
  const buildSlotsForYacht = (yachtObj) => {
    if (!yachtObj) return [];
    console.log("Here is yacht obj ", yachtObj)
    // support both slotDurationMinutes and duration (the backend uses various names)
    const rawDuration = yachtObj.slotDurationMinutes || yachtObj.duration;
    if (!rawDuration) return [];

    // Parse duration (it can be "HH:MM" or a number of minutes)
    let durationMinutes = 0;
    if (typeof rawDuration === "string" && rawDuration.includes(":")) {
      const [dh, dm] = rawDuration.split(":").map(Number);
      durationMinutes = (Number(dh) || 0) * 60 + (Number(dm) || 0);
    } else {
      durationMinutes = Number(rawDuration) || 0;
    }
    if (durationMinutes <= 0) return [];

    // sailing window
    const startMin = hhmmToMinutes(yachtObj.sailStartTime);
    const endMin = hhmmToMinutes(yachtObj.sailEndTime);
    if (endMin <= startMin) return [];

    // special slot (optional) - note property name in your examples: specialSlotTime
    const specialTimeString = yachtObj.specialSlot || yachtObj.specialSlotTime || null;
    const specialMin = specialTimeString ? hhmmToMinutes(specialTimeString) : null;
    const specialIsValid = specialMin !== null && specialMin >= startMin && specialMin < endMin;

    const slots = [];
    let cursor = startMin;

    // iterate creating slots; when special lands inside a slot, split as required
    while (cursor < endMin) {
      const slotEndCandidate = cursor + durationMinutes;
      // If special is inside this candidate interval and not exactly at cursor
      if (
        specialIsValid &&
        specialMin > cursor &&
        specialMin < Math.min(slotEndCandidate, endMin)
      ) {
        // first part: cursor -> specialMin (only if > cursor)
        if (specialMin > cursor) {
          slots.push({ start: minutesToHHMM(cursor), end: minutesToHHMM(specialMin), meta: "regular-split" });
        }

        // special slot: specialMin -> specialMin + duration (may be truncated at endMin)
        const specialEnd = Math.min(specialMin + durationMinutes, endMin);
        slots.push({ start: minutesToHHMM(specialMin), end: minutesToHHMM(specialEnd), meta: "special" });

        // advance cursor to end of special-derived slot
        cursor = specialEnd;

        // continue main loop
        continue;
      }

      // Otherwise produce normal slot (may be truncated at endMin)
      const next = Math.min(slotEndCandidate, endMin);
      slots.push({ start: minutesToHHMM(cursor), end: minutesToHHMM(next), meta: "regular" });
      cursor = next;
    }

    // dedupe and sort just in case
    const seen = new Set();
    const unique = slots.filter((s) => {
      const key = `${s.start}-${s.end}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    unique.sort((a, b) => hhmmToMinutes(a.start) - hhmmToMinutes(b.start));
    return unique; // array of {start, end, meta}
  };

  // combine generated free slots with booked/locked from API
  const buildTimeline = (yachtObj, bookedSlots = [], lockedSlots = []) => {
    const freeSlots = buildSlotsForYacht(yachtObj);
    // Normalize incoming booked/locked slots structure:
    // bookedSlots and lockedSlots from API may be arrays of {startTime,start,endTime,end,...} or {start,end}
    // We'll map them to {start,end,type}
    const normalizedBusy = [
      ...(bookedSlots || []).map((b) => ({ start: b.startTime || b.start, end: b.endTime || b.end, type: "booked" })),
      ...(lockedSlots || []).map((l) => ({ start: l.startTime || l.start, end: l.endTime || l.end, type: "locked" })),
    ];

    // For each generated free slot, check if there is any busy overlap.
    // If any busy record overlaps (partial or full), mark the generated slot as busy with that type.
    // Priority: if both booked & locked overlap same slot choose booked (booked > locked).
    const timelineSlots = freeSlots.map((slot) => {
      // find overlapping busy items
      const overlaps = normalizedBusy.filter((b) => {
        // overlap when: not (b.end <= slot.start || b.start >= slot.end)
        return !(hhmmToMinutes(b.end) <= hhmmToMinutes(slot.start) || hhmmToMinutes(b.start) >= hhmmToMinutes(slot.end));
      });

      if (!overlaps || overlaps.length === 0) {
        return { ...slot, type: "free" };
      }

      // If any overlap is 'booked', prefer that; else 'locked'
      const hasBooked = overlaps.some((o) => o.type === "booked");
      return { ...slot, type: hasBooked ? "booked" : "locked" };
    });

    return timelineSlots;
  };

  // ---------- Data fetch ----------
  const fetchTimeline = async () => {
    try {
      setLoading(true);

      // get yacht details
      const yachtRes = await getYachtById(yachtId, token);
      // support both axios response and helper-returned object
      const yachtData = yachtRes?.data?.yacht ?? yachtRes?.yacht ?? yachtRes;
      setYacht(yachtData);

      // get day availability (bookedSlots, lockedSlots)
      const dayResRaw = await getDayAvailability(yachtId, day.date, token);
      // normalize dayRes: it might be axios response, or plain object
      const dayRes = dayResRaw?.data ?? dayResRaw;

      // if success and yachtData exists, build timeline
      if ((dayRes?.success || dayRes?.bookedSlots !== undefined) && yachtData) {
        const booked = dayRes.bookedSlots || [];
        const locked = dayRes.lockedSlots || [];
        const built = buildTimeline(yachtData, booked, locked);
        setTimeline(built);
      } else {
        setTimeline([]);
      }
    } catch (err) {
      console.error("❌ Failed to fetch timeline:", err);
      setTimeline([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yachtId, day.date]);

  // ---------- Slot interactions ----------
  const handleSlotClick = (slot) => {
    if (slot.isPast) return; // ⛔ disable past slots

    setSelectedSlot(slot);
    document.activeElement?.blur();

    if (slot.type === "free") {
      new window.bootstrap.Modal(document.getElementById("lockModal")).show();
    } else if (slot.type === "locked") {
      new window.bootstrap.Modal(document.getElementById("confirmModal")).show();
    } else {
      // booked
      alert("⛔ This slot is already booked.");
    }
  };

  // Lock a slot (uses fixed slot times; user cannot edit times)
  const handleLockSlot = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    try {
      const res = await lockSlot(yachtId, day.date, selectedSlot.start, selectedSlot.end, token);
      if (res?.success) {
        alert("✅ Slot locked successfully!");
        window.bootstrap.Modal.getInstance(document.getElementById("lockModal"))?.hide();
        fetchTimeline();
      } else {
        alert(res?.message || "Failed to lock slot");
      }
    } catch (err) {
      console.error("Lock error:", err);
      alert("Error locking slot");
    }
  };

  // Release lock
  const handleReleaseLock = async () => {
    if (!selectedSlot) return;
    try {
      const res = await releaseSlot(yachtId, day.date, selectedSlot.start, selectedSlot.end, token);
      if (res?.success) {
        alert("🔓 Slot released successfully!");
        window.bootstrap.Modal.getInstance(document.getElementById("confirmModal"))?.hide();
        fetchTimeline();
      } else {
        alert(res?.message || "Failed to release slot");
      }
    } catch (err) {
      console.error("Release error:", err);
      alert("Error releasing slot");
    }
  };

  // Confirm booking — navigate to CreateBooking with slot times (fixed)
  const handleConfirmBooking = (e) => {
    e.preventDefault();
    if (!selectedSlot) return;
    window.bootstrap.Modal.getInstance(document.getElementById("confirmModal"))?.hide();

    navigate("/create-booking", {
      state: {
        yachtId,
        yachtName,
        yacht,
        date: day.date,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
      },
    });
  };

  // ---------- Render ----------
  return (
    <div className="container mt-4">
      <button
        className="btn btn-outline-secondary mb-3"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <h4>
        {yachtName} — {day.day}, {day.date}
      </h4>
      <hr />
    
      {loading ? (
        <div className="text-center mt-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : timeline.length === 0 ? (
        <div className="text-center text-muted mt-5">No timeline data</div>
      ) : (
        <div className="timeline-container mb-4">
          {timeline.map((slot, idx) => (
            <div
              key={idx}
              onClick={() => handleSlotClick(slot)}
              className={`p-3 mb-2 rounded text-center fw-semibold ${
                slot.type === "booked"
                  ? "bg-danger text-white"
                  : slot.type === "locked"
                  ? "bg-warning text-dark"
                  : "bg-success text-white"
              }`}
              style={{ cursor: slot.type === "booked" ? "not-allowed" : "pointer" }}
            >
              {/* show only times — no textual type label */}
              {slot.start} — {slot.end}
            </div>
          ))}
        </div>
      )}

      {/* Lock Modal */}
      <div className="modal fade" id="lockModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <form onSubmit={handleLockSlot}>
              <div className="modal-header">
                <h5 className="modal-title">Lock Time Slot</h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                ></button>
              </div>
              <div className="modal-body">
                {selectedSlot && (
                  <p>
                    Free slot: <strong>{selectedSlot.start}</strong> — <strong>{selectedSlot.end}</strong>
                  </p>
                )}
                {/* <p className="text-muted small">Slot time is fixed. It will be used as-is for locking.</p> */}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-warning">
                  Lock Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Confirm Booking Modal */}
      <div className="modal fade" id="confirmModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <form onSubmit={handleConfirmBooking}>
              <div className="modal-header">
                <h5 className="modal-title">Confirm Booking</h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                ></button>
              </div>
              <div className="modal-body">
                {selectedSlot && (
                  <p>
                    Locked slot: <strong>{selectedSlot.start}</strong> — <strong>{selectedSlot.end}</strong>
                  </p>
                )}
                {/* <p className="text-muted small">You cannot change slot times here — proceed to create booking to fill customer details.</p> */}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-danger" onClick={handleReleaseLock}>
                  Release Lock
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DayAvailability;
