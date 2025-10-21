// src/pages/DayAvailability.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getDayAvailability } from "../services/operations/availabilityAPI";

function DayAvailability() {
  const location = useLocation();
  const navigate = useNavigate();
  const { yachtId, yachtName, day } = location.state || {};

  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState({ start: "", end: "" });

  const token = localStorage.getItem("authToken");
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

  // Fetch timeline from backend
  const fetchTimeline = async () => {
    console.log("Inside Fetch time line")
    if (!token) return;
    setLoading(true);
    try {
      const res = await getDayAvailability(yachtId, day.date, token);
      if (res?.success) {
        let freeSlots = [{ type: "free", start: "00:00", end: "23:59" }];

        // Function to remove slots that are booked or locked
        const removeSlots = (slots) => {
          let updated = [...freeSlots];
          slots.forEach((slot) => {
            const newSlots = [];
            updated.forEach((s) => {
              if (slot.end <= s.start || slot.start >= s.end) newSlots.push(s);
              else {
                if (slot.start > s.start) newSlots.push({ type: "free", start: s.start, end: slot.start });
                if (slot.end < s.end) newSlots.push({ type: "free", start: slot.end, end: s.end });
              }
            });
            updated = newSlots;
          });
          return updated;
        };

        const freeAfterBooked = removeSlots(res.bookedSlots || []);
        const freeAfterLocked = removeSlots(res.lockedSlots || []);

        const combinedTimeline = [
          ...freeAfterLocked,
          ...(res.bookedSlots || []).map((s) => ({ ...s, type: "booked" })),
          ...(res.lockedSlots || []).map((s) => ({ ...s, type: "locked" })),
        ].sort((a, b) => a.start.localeCompare(b.start));

        setTimeline(combinedTimeline);
      }
    } catch (err) {
      console.error("Failed to fetch timeline:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("🚤 Yacht ID:", yachtId);
    console.log("🛥️ Yacht Name:", yachtName);
    console.log("📅 Selected Date:", day?.date);
    fetchTimeline();
  }, []);

  // yachtId, yachtName, day

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
    setBooking({ start: slot.start, end: slot.end });
    const modalId = slot.type === "free" ? "lockModal" : "confirmModal";
    const modal = new window.bootstrap.Modal(document.getElementById(modalId));
    modal.show();
  };

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBooking((prev) => ({ ...prev, [name]: value }));
  };

  const handleLockSlot = async (e) => {
    e.preventDefault();
    if (!selectedSlot || !token) return;

    try {
      await lockSlot(yachtId, day.date, booking.start, booking.end, token);
      await fetchTimeline(); // refresh timeline
    } catch (err) {
      console.error("Failed to lock slot:", err);
    } finally {
      const modalEl = document.getElementById("lockModal");
      const modal = window.bootstrap.Modal.getInstance(modalEl);
      modal.hide();
      setSelectedSlot(null);
      setBooking({ start: "", end: "" });
    }
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedSlot || !token) return;

    try {
      await confirmBooking(yachtId, day.date, booking.start, booking.end, token);
      await fetchTimeline(); // refresh timeline
    } catch (err) {
      console.error("Failed to confirm booking:", err);
    } finally {
      const modalEl = document.getElementById("confirmModal");
      const modal = window.bootstrap.Modal.getInstance(modalEl);
      modal.hide();
      setSelectedSlot(null);
      setBooking({ start: "", end: "" });
    }
  };

  const handleReleaseLock = async () => {
    if (!selectedSlot || !token) return;

    try {
      await confirmBooking(yachtId, day.date, selectedSlot.start, selectedSlot.end, token, true); // release lock
      await fetchTimeline(); // refresh timeline
    } catch (err) {
      console.error("Failed to release lock:", err);
    } finally {
      const modalEl = document.getElementById("confirmModal");
      const modal = window.bootstrap.Modal.getInstance(modalEl);
      modal.hide();
      setSelectedSlot(null);
      setBooking({ start: "", end: "" });
    }
  };

  return (
    <div className="container mt-4">
      <h1>HI Im</h1>
      <button className="btn btn-outline-secondary mb-3" onClick={() => navigate(-1)}>
        ← Back
      </button>
      <h4>{yachtName} — {day.day}, {day.date}</h4>
      <hr />

      {loading ? (
        <div className="text-center mt-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : (
        <div className="timeline-container mb-4">
          {timeline.map((slot, i) => (
            <div
              key={i}
              className={`p-3 mb-2 rounded text-center fw-semibold ${slot.type === "booked"
                  ? "bg-danger text-white"
                  : slot.type === "locked"
                    ? "bg-warning text-dark"
                    : "bg-success text-white"
                }`}
              style={{ cursor: slot.type === "free" ? "pointer" : "default" }}
              onClick={() => handleSlotClick(slot)}
            >
              {slot.type.charAt(0).toUpperCase() + slot.type.slice(1)} — {slot.start} to {slot.end}
            </div>
          ))}
        </div>
      )}

      {/* Lock Slot Modal */}
      <div className="modal fade" id="lockModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <form onSubmit={handleLockSlot}>
              <div className="modal-header">
                <h5 className="modal-title">Lock Time Slot</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div className="modal-body">
                {selectedSlot && (
                  <>
                    <p>Free slot: {selectedSlot.start} — {selectedSlot.end}</p>
                    <input type="time" className="form-control mb-2" name="start" value={booking.start} min={selectedSlot.start} max={selectedSlot.end} onChange={handleBookingChange} required />
                    <input type="time" className="form-control" name="end" value={booking.end} min={booking.start} max={selectedSlot.end} onChange={handleBookingChange} required />
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-warning">Lock Slot</button>
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
                <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div className="modal-body">
                {selectedSlot && <p>Locked slot: {selectedSlot.start} — {selectedSlot.end}</p>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-danger" onClick={handleReleaseLock}>Release Lock</button>
                <button type="submit" className="btn btn-primary">Confirm Booking</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DayAvailability;
