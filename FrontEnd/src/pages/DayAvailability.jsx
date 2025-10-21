// src/pages/DayAvailability.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function DayAvailability() {
  const location = useLocation();
  const navigate = useNavigate();
  const { yachtName, day } = location.state || {};

  const [lockedSlots, setLockedSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState(day.bookedSlots || []);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState({ start: "", end: "" });

  if (!day) {
    return (
      <div className="container mt-5 text-center">
        <p>⚠️ No date selected. Go back to the availability page.</p>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    );
  }

  // Generate timeline: free, booked, locked slots
  const generateTimeline = () => {
    let slots = [{ type: "free", start: "00:00", end: "23:59" }];

    // Remove booked slots from free slots
    bookedSlots.forEach((slot) => {
      const newSlots = [];
      slots.forEach((s) => {
        if (slot.end <= s.start || slot.start >= s.end) newSlots.push(s);
        else {
          if (slot.start > s.start)
            newSlots.push({ type: "free", start: s.start, end: slot.start });
          if (slot.end < s.end)
            newSlots.push({ type: "free", start: slot.end, end: s.end });
        }
      });
      slots = newSlots;
    });

    // Remove locked slots from free slots
    lockedSlots.forEach((locked) => {
      const newSlots = [];
      slots.forEach((s) => {
        if (s.type === "free") {
          if (locked.end <= s.start || locked.start >= s.end) newSlots.push(s);
          else {
            if (locked.start > s.start)
              newSlots.push({ type: "free", start: s.start, end: locked.start });
            if (locked.end < s.end)
              newSlots.push({ type: "free", start: locked.end, end: s.end });
          }
        } else newSlots.push(s);
      });
      slots = newSlots;
    });

    // Add booked and locked slots for display
    slots.push(...bookedSlots.map((s) => ({ ...s, type: "booked" })));
    slots.push(...lockedSlots.map((s) => ({ ...s, type: "locked" })));

    return slots.sort((a, b) => a.start.localeCompare(b.start));
  };

  const timeline = generateTimeline();

  const handleSlotClick = (slot, type = "free") => {
    setSelectedSlot(slot);
    setBooking({ start: slot.start, end: slot.end });

    const modalId = type === "free" ? "lockModal" : "confirmModal";
    const modal = new window.bootstrap.Modal(document.getElementById(modalId));
    modal.show();
  };

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBooking((prev) => ({ ...prev, [name]: value }));
  };

  // Lock slot
  const handleLockSlot = (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setLockedSlots([...lockedSlots, { start: booking.start, end: booking.end }]);

    const modalEl = document.getElementById("lockModal");
    const modal = window.bootstrap.Modal.getInstance(modalEl);
    modal.hide();

    setSelectedSlot(null);
    setBooking({ start: "", end: "" });
  };

  // Confirm booking (convert locked slot to booked)
  const handleConfirmBooking = (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    // Add to booked slots
    setBookedSlots([...bookedSlots, { start: booking.start, end: booking.end }]);

    // Remove from locked slots
    setLockedSlots((prev) =>
      prev.filter(
        (slot) => slot.start !== selectedSlot.start || slot.end !== selectedSlot.end
      )
    );

    const modalEl = document.getElementById("confirmModal");
    const modal = window.bootstrap.Modal.getInstance(modalEl);
    modal.hide();

    setSelectedSlot(null);
    setBooking({ start: "", end: "" });
  };

  // Release lock without booking
  const handleReleaseLock = () => {
    setLockedSlots((prev) =>
      prev.filter(
        (slot) => slot.start !== selectedSlot.start || slot.end !== selectedSlot.end
      )
    );

    const modalEl = document.getElementById("confirmModal");
    const modal = window.bootstrap.Modal.getInstance(modalEl);
    modal.hide();

    setSelectedSlot(null);
    setBooking({ start: "", end: "" });
  };

  return (
    <div className="container mt-4">
      <button className="btn btn-outline-secondary mb-3" onClick={() => navigate(-1)}>
        ← Back
      </button>
      <h4>{yachtName} — {day.day}, {day.date}</h4>
      <hr />

      <div className="timeline-container mb-4">
        {timeline.map((slot, i) => (
          <div
            key={i}
            className={`p-3 mb-2 rounded text-center fw-semibold ${
              slot.type === "booked"
                ? "bg-danger text-white"
                : slot.type === "locked"
                ? "bg-warning text-dark"
                : "bg-success text-white"
            }`}
            style={{ cursor: slot.type === "free" ? "pointer" : "default" }}
            onClick={() => handleSlotClick(slot, slot.type)}
          >
            {slot.type === "booked"
              ? "Booked"
              : slot.type === "locked"
              ? "Locked"
              : "Free"} — {slot.start} to {slot.end}
          </div>
        ))}
      </div>

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
                    <div className="mb-3">
                      <label className="form-label">Start Time</label>
                      <input
                        type="time"
                        className="form-control"
                        name="start"
                        value={booking.start}
                        min={selectedSlot.start}
                        max={selectedSlot.end}
                        onChange={handleBookingChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">End Time</label>
                      <input
                        type="time"
                        className="form-control"
                        name="end"
                        value={booking.end}
                        min={booking.start}
                        max={selectedSlot.end}
                        onChange={handleBookingChange}
                        required
                      />
                    </div>
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
