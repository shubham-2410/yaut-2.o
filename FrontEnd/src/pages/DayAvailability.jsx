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

  const to12HourFormat = (time24) => {
    if (!time24) return "";
    const [hour, minute] = time24.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
  };

  // ✅ NEW — Disable past slots for today's date (used to compute 'disabled' flag)
  const isPastSlot = (slot) => {
    const today = new Date().toISOString().split("T")[0];
    if (day.date !== today) return false; // only restrict today

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const slotEnd = hhmmToMinutes(slot.end);

    return slotEnd <= currentMinutes;
  };

  // ------------------------
  // Version B: CreateBooking's advanced slotting logic (special slot splitting)
  // variable-name mapping requested:
  // durationMinutes = duration
  // startTime = dayStart
  // endTime = dayEnd
  // specialSlot = specialSlotTime
  // ------------------------
  const buildSlotsForYacht = (yachtObj) => {
    if (
      !yachtObj ||
      !yachtObj.sailStartTime ||
      !yachtObj.sailEndTime ||
      !(yachtObj.slotDurationMinutes || yachtObj.duration)
    )
      return [];
    console.log("Here is obj " , yachtObj )
    // duration can be "HH:MM" or a number (minutes or string number)
    const duration = yachtObj.slotDurationMinutes || yachtObj.duration;
    let durationMinutes = 0;
    if (typeof duration === "string" && duration.includes(":")) {
      const [dh, dm] = duration.split(":").map(Number);
      durationMinutes = (Number(dh) || 0) * 60 + (Number(dm) || 0);
    } else {
      durationMinutes = Number(duration) || 0;
    }
    if (durationMinutes <= 0) return [];

    // names per your mapping
    const dayStart = yachtObj.sailStartTime;
    const dayEnd = yachtObj.sailEndTime;
    const specialSlotTime = yachtObj.specialSlotTime  || null;

    const startMin = hhmmToMinutes(dayStart);
    const endMin = hhmmToMinutes(dayEnd);
    if (endMin <= startMin) return [];

    const specialMin = specialSlotTime ? hhmmToMinutes(specialSlotTime) : null;
    const specialIsValid =
      specialMin && specialMin >= startMin && specialMin < endMin;

    const slots = [];
    let cursor = startMin;

    while (cursor < endMin) {
      // if special slot falls inside the next regular block, split
      if (
        specialIsValid &&
        specialMin > cursor &&
        specialMin < cursor + durationMinutes
      ) {
        // add partial slot before the special slot (if any)
        if (specialMin > cursor) {
          slots.push({
            start: minutesToHHMM(cursor),
            end: minutesToHHMM(specialMin),
          });
        }
        // add the special slot (special length = durationMinutes, but clipped to endMin)
        const specialEnd = Math.min(specialMin + durationMinutes, endMin);
        slots.push({
          start: minutesToHHMM(specialMin),
          end: minutesToHHMM(specialEnd),
        });
        cursor = specialEnd;
        continue;
      }

      const next = Math.min(cursor + durationMinutes, endMin);
      slots.push({
        start: minutesToHHMM(cursor),
        end: minutesToHHMM(next),
      });
      cursor = next;
    }

    // dedupe & sort as in CreateBooking
    const seen = new Set();
    const unique = slots.filter((s) => {
      const key = `${s.start}-${s.end}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    unique.sort((a, b) => hhmmToMinutes(a.start) - hhmmToMinutes(b.start));

    console.log("Here are slots" , unique)
    return unique;
  };

  // buildTimeline: preserves custName & empName for booked/locked
  const buildTimeline = (yachtObj, bookedSlots = [], lockedSlots = []) => {
    const freeSlots = buildSlotsForYacht(yachtObj);

    const normalizedBusy = [
      ...(bookedSlots || []).map((b) => ({
        start: b.startTime || b.start,
        end: b.endTime || b.end,
        type: "booked",
        custName: b.custName || b.customerName || b.customer || b.custName || "",
        empName: b.empName || b.employeeName || "",
      })),
      ...(lockedSlots || []).map((l) => ({
        start: l.startTime || l.start,
        end: l.endTime || l.end,
        type: "locked",
        empName: l.empName || l.employeeName || "",
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

      if (overlaps.length === 0) {
        return { ...slot, type: "free" };
      }

      const hasBooked = overlaps.some((o) => o.type === "booked");
      if (hasBooked) {
        const bookedOverlap = overlaps.find((o) => o.type === "booked");
        return {
          ...slot,
          type: "booked",
          custName: bookedOverlap?.custName || "",
          empName: bookedOverlap?.empName || "",
        };
      }

      // locked overlap
      const lockedOverlap = overlaps.find((o) => o.type === "locked");
      return {
        ...slot,
        type: "locked",
        empName: lockedOverlap?.empName || "",
      };
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yachtId, day.date]);

  // ---------- Slot Interactions ----------
  const handleSlotClick = (slot) => {
    // selected slot updated even if booked (we show booked modal)
    setSelectedSlot(slot);

    setTimeout(() => {
      let modalId = "";
      if (slot.type === "booked") modalId = "bookedModal";
      else if (slot.type === "locked") modalId = "confirmModal";
      else modalId = "lockModal";

      const el = document.getElementById(modalId);
      if (el) new window.bootstrap.Modal(el).show();
    }, 50);
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
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm mb-4 border-0 rounded-4 p-3">
        <div className="d-flex align-items-center justify-content-between">
          <button
            className="btn btn-outline-secondary shadow-sm back"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>

          <div className="text-center flex-grow-1">
            <h4 className="fw-bold text-primary mb-1">{yachtName}</h4>
            <h6 className="text-muted mb-0">
              {day.day}, {day.date}
            </h6>
          </div>

          <div style={{ width: "75px" }}></div>
        </div>
      </div>

      <div className="availability-wrapper">
        <div className="availability-left">
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
                <div className="slot-row-container gap-2">
                  {timeline.map((slot, idx) => {
                    const disabled = isPastSlot(slot);

                    // If slot is past and NOT booked, grey/disable it.
                    // Past booked slots must remain red and clickable.
                    const slotClass = disabled
                      ? slot.type === "booked"
                        ? "bg-danger text-white"
                        : "bg-secondary text-white opacity-50"
                      : slot.type === "booked"
                      ? "bg-danger text-white"
                      : slot.type === "locked"
                      ? "bg-warning text-dark"
                      : "bg-success text-white";

                    const cursorStyle =
                      disabled && slot.type !== "booked" ? "not-allowed" : "pointer";

                    return (
                      <div
                        key={idx}
                        className={`slot-btn px-3 py-2 rounded fw-semibold text-center ${slotClass}`}
                        style={{ cursor: cursorStyle }}
                        onClick={() => {
                          // block clicking past free/locked slots
                          if (disabled && slot.type !== "booked") return;
                          handleSlotClick(slot);
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

      {/* Confirm Booking Modal (Locked slot -> confirm booking) */}
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
                  <>
                    <div className="fs-6">
                      Locked slot:{" "}
                      <strong>{to12HourFormat(selectedSlot.start)}</strong> —{" "}
                      <strong>{to12HourFormat(selectedSlot.end)}</strong>
                    </div>

                    <div className="mt-2 fs-6">Locked by: {selectedSlot.empName}</div>
                  </>
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

      {/* Booked Slot Details Modal */}
      <div className="modal fade" id="bookedModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4">
            <div className="modal-header bg-danger bg-opacity-10">
              <h5 className="modal-title">Booked Slot Details</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              ></button>
            </div>

            <div className="modal-body text-center">
              {selectedSlot && (
                <>
                  <div className="fs-6">
                    Time:{" "}
                    <strong>{to12HourFormat(selectedSlot.start)}</strong> —{" "}
                    <strong>{to12HourFormat(selectedSlot.end)}</strong>
                  </div>

                  {selectedSlot.custName && (
                    <div className="mt-2 fw-semibold text-primary">
                      Booked for: {selectedSlot.custName}
                    </div>
                  )}

                  {selectedSlot.empName && (
                    <div className="mt-1 fw-bold text-secondary">
                      Handled by: {selectedSlot.empName}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                data-bs-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DayAvailability;
