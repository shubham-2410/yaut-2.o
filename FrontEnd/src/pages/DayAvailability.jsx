// DayAvailability.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./DayAvailability.css";

import {
  getDayAvailability,
  lockSlot,
  releaseSlot,
} from "../services/operations/availabilityAPI";
import { getYachtById } from "../services/operations/yautAPI";

function DayAvailability() {
  const location = useLocation();
  const navigate = useNavigate();
  const { yachtId, yachtName, day } = location.state || {};

  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [yacht, setYacht] = useState(null);
  const [error, setError] = useState("");

  const token = localStorage.getItem("authToken");

  if (!day || !yachtId) {
    return (
      <div className="container mt-5 text-center">
        <p>⚠️ No yacht or date selected. Go back to the availability page.</p>
        <button
          className="btn btn-primary shadow-sm px-4"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
      </div>
    );
  }

  // ---------- Helpers ----------
  const hhmmToMinutes = (time = "00:00") => {
    if (!time || typeof time !== "string") return 0;
    const parts = time.split(":").map((p) => Number(p));
    if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1]))
      return 0;
    const [h, m] = parts;
    return h * 60 + m;
  };

  const minutesToHHMM = (minutes) => {
    const m = Number(minutes) || 0;
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };

  // Convert to 12-hour format
  const to12HourFormat = (time24) => {
    if (!time24) return "";
    const [hour, minute] = time24.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
  };

  // ✅ NEW — Disable past slots for today's date
  const isPastSlot = (slot) => {
    const today = new Date().toISOString().split("T")[0];
    if (day.date !== today) return false; // only restrict today

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const slotEnd = hhmmToMinutes(slot.end);

    return slotEnd <= currentMinutes;
  };

  const buildSlotsForYacht = (yachtObj) => {
    if (!yachtObj) return [];
    const rawDuration = yachtObj.slotDurationMinutes || yachtObj.duration;
    if (!rawDuration) return [];

    let durationMinutes = 0;
    if (typeof rawDuration === "string" && rawDuration.includes(":")) {
      const [dh, dm] = rawDuration.split(":").map(Number);
      durationMinutes = (Number(dh) || 0) * 60 + (Number(dm) || 0);
    } else {
      durationMinutes = Number(rawDuration) || 0;
    }
    if (durationMinutes <= 0) return [];

    const startMin = hhmmToMinutes(yachtObj.sailStartTime);
    const endMin = hhmmToMinutes(yachtObj.sailEndTime);
    if (endMin <= startMin) return [];

    const slots = [];
    for (let cursor = startMin; cursor < endMin; cursor += durationMinutes) {
      const next = Math.min(cursor + durationMinutes, endMin);
      slots.push({
        start: minutesToHHMM(cursor),
        end: minutesToHHMM(next),
        meta: "regular",
      });
    }

    return slots;
  };

  const buildTimeline = (yachtObj, bookedSlots = [], lockedSlots = []) => {
    const freeSlots = buildSlotsForYacht(yachtObj);
    const normalizedBusy = [
      ...(bookedSlots || []).map((b) => ({
        start: b.startTime || b.start,
        end: b.endTime || b.end,
        type: "booked",
      })),
      ...(lockedSlots || []).map((l) => ({
        start: l.startTime || l.start,
        end: l.endTime || l.end,
        type: "locked",
      })),
    ];

    return freeSlots.map((slot) => {
      const overlaps = normalizedBusy.filter(
        (b) =>
          !(
            hhmmToMinutes(b.end) <= hhmmToMinutes(slot.start) ||
            hhmmToMinutes(b.start) >= hhmmToMinutes(slot.end)
          )
      );

      if (overlaps.length === 0) return { ...slot, type: "free" };
      const hasBooked = overlaps.some((o) => o.type === "booked");
      return { ...slot, type: hasBooked ? "booked" : "locked" };
    });
  };

  // ---------- Data Fetch ----------
  const fetchTimeline = async () => {
    try {
      setLoading(true);
      setError("");
      const yachtRes = await getYachtById(yachtId, token);
      const yachtData = yachtRes?.data?.yacht ?? yachtRes?.yacht ?? yachtRes;
      setYacht(yachtData);

      const dayResRaw = await getDayAvailability(yachtId, day.date, token);
      const dayRes = dayResRaw?.data ?? dayResRaw;

      if ((dayRes?.success || dayRes?.bookedSlots !== undefined) && yachtData) {
        const booked = dayRes.bookedSlots || [];
        const locked = dayRes.lockedSlots || [];
        setTimeline(buildTimeline(yachtData, booked, locked));
      } else {
        setTimeline([]);
      }
    } catch (err) {
      console.error("❌ Failed to fetch timeline:", err);
      setError(err.response?.data?.message || "Failed to create booking");
      setTimeline([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [yachtId, day.date]);

  // ---------- Slot Interactions ----------
  const handleSlotClick = (slot) => {
    if (slot.type === "booked") return alert("⛔ This slot is already booked.");
    setSelectedSlot(slot);

    const modalId = slot.type === "locked" ? "confirmModal" : "lockModal";
    new window.bootstrap.Modal(document.getElementById(modalId)).show();
  };

  const handleLockSlot = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;
    try {
      const res = await lockSlot(
        yachtId,
        day.date,
        selectedSlot.start,
        selectedSlot.end,
        token
      );
      if (res?.success) {
        alert("✅ Slot locked successfully!");
        window.bootstrap.Modal.getInstance(
          document.getElementById("lockModal")
        )?.hide();
        fetchTimeline();
      } else alert(res?.message || "Failed to lock slot");
    } catch (err) {
      console.error("Lock error:", err);
      alert("Error locking slot");
    }
  };

  const handleReleaseLock = async () => {
    if (!selectedSlot) return;
    try {
      const res = await releaseSlot(
        yachtId,
        day.date,
        selectedSlot.start,
        selectedSlot.end,
        token
      );
      if (res?.success) {
        alert("🔓 Slot released successfully!");
        window.bootstrap.Modal.getInstance(
          document.getElementById("confirmModal")
        )?.hide();
        fetchTimeline();
      } else alert(res?.message || "Failed to release slot");
    } catch (err) {
      console.error("Release error:", err);
      alert("Error releasing slot");
    }
  };

  const handleConfirmBooking = (e) => {
    e.preventDefault();
    if (!selectedSlot) return;
    window.bootstrap.Modal.getInstance(
      document.getElementById("confirmModal")
    )?.hide();
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
    <div className="container py-4 day-container">
      <button
        className="btn btn-outline-secondary mb-3 shadow-sm"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm mb-4 border-0 rounded-4">
        <div className="card-body text-center bg-light rounded-4 py-3">
          <h4 className="fw-bold text-primary mb-1">{yachtName}</h4>
          <h6 className="text-muted mb-0">
            {day.day}, {day.date}
          </h6>
        </div>
      </div>

      <div className="availability-wrapper">
        {/* LEFT: Calendar */}
        <div className="availability-left">
          <div className="card shadow-sm border-0 p-3 rounded-4">
            <h5 className="text-center fw-semibold text-secondary mb-3">
              📅 Select Date
            </h5>
            <Calendar
              onChange={(selectedDate) => {
                const year = selectedDate.getFullYear();
                const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
                const date = String(selectedDate.getDate()).padStart(2, "0");
                const iso = `${year}-${month}-${date}`;

                const newDay = {
                  date: iso,
                  day: selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                  }),
                };

                location.state.day = newDay;
                fetchTimeline();
              }}
              value={new Date(day.date)}
              minDate={new Date()}
              next2Label={null}
              prev2Label={null}
              className="shadow-sm rounded-4"
            />
          </div>
        </div>

        {/* RIGHT: Slots */}
        <div className="availability-right">
          <div className="card shadow-sm border-0 rounded-4 p-3">
            <h5 className="fw-semibold mb-3 text-center text-secondary">
              🕒 Available Time Slots
            </h5>

            {loading ? (
              <div className="text-center my-5">
                <div className="spinner-border text-primary"></div>
              </div>
            ) : timeline.length === 0 ? (
              <div className="text-center text-muted py-5">
                No available slots for this date.
              </div>
            ) : (
              <>
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  {timeline.map((slot, idx) => {
                    const disabled = isPastSlot(slot);

                    return (
                      <div
                        key={idx}
                        className={`slot-btn px-3 py-2 rounded fw-semibold text-center ${
                          disabled
                            ? "bg-secondary text-white opacity-50"
                            : slot.type === "booked"
                            ? "bg-danger text-white"
                            : slot.type === "locked"
                            ? "bg-warning text-dark"
                            : "bg-success text-white"
                        }`}
                        style={{
                          cursor:
                            slot.type === "booked" || disabled
                              ? "not-allowed"
                              : "pointer",
                        }}
                        onClick={() => {
                          if (!disabled) handleSlotClick(slot);
                        }}
                      >
                        {to12HourFormat(slot.start)} — {to12HourFormat(slot.end)}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 text-center">
                  <span className="badge bg-success me-2">Free</span>
                  <span className="badge bg-warning text-dark me-2">Locked</span>
                  <span className="badge bg-danger me-2">Booked</span>
                  <span className="badge bg-secondary">Past (Today)</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lock Modal */}
      <div className="modal fade" id="lockModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4">
            <form onSubmit={handleLockSlot}>
              <div className="modal-header bg-warning bg-opacity-25">
                <h5 className="modal-title">Lock Time Slot</h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                ></button>
              </div>
              <div className="modal-body text-center">
                {selectedSlot && (
                  <p className="fs-6">
                    Are you sure you want to lock this slot?
                    <br />
                    <strong>{to12HourFormat(selectedSlot.start)}</strong> —{" "}
                    <strong>{to12HourFormat(selectedSlot.end)}</strong>
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-warning text-dark fw-semibold"
                >
                  Lock Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Confirm Booking Modal */}
      <div className="modal fade" id="confirmModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4">
            <form onSubmit={handleConfirmBooking}>
              <div className="modal-header bg-primary bg-opacity-10">
                <h5 className="modal-title">Confirm Booking</h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                ></button>
              </div>
              <div className="modal-body text-center">
                {selectedSlot && (
                  <p className="fs-6">
                    Locked slot:{" "}
                    <strong>{to12HourFormat(selectedSlot.start)}</strong> —{" "}
                    <strong>{to12HourFormat(selectedSlot.end)}</strong>
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={handleReleaseLock}
                >
                  Release Lock
                </button>
                <button type="submit" className="btn btn-primary fw-semibold">
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
