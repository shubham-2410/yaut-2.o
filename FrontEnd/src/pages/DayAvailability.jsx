import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getDayAvailability, lockSlot, releaseSlot } from "../services/operations/availabilityAPI";
// import { createBooking } from "../services/operations/bookingAPI";

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

  // 🧠 Build timeline
  const buildTimeline = (bookedSlots, lockedSlots) => {
    const allBusy = [
      ...(bookedSlots || []).map((b) => ({ ...b, type: "booked" })),
      ...(lockedSlots || []).map((l) => ({ ...l, type: "locked" })),
    ].sort((a, b) => a.start.localeCompare(b.start));

    const result = [];
    let currentStart = "00:00";

    for (const slot of allBusy) {
      if (slot.start > currentStart)
        result.push({ start: currentStart, end: slot.start, type: "free" });

      result.push(slot);
      currentStart = slot.end;
    }

    if (currentStart < "23:59")
      result.push({ start: currentStart, end: "23:59", type: "free" });

    return result;
  };

  // 🧾 Fetch availability
  const fetchTimeline = async () => {
    try {
      setLoading(true);
      console.log("🚤 Yacht:", yachtName, yachtId, day.date);
      const res = await getDayAvailability(yachtId, day.date, token);

      if (res?.success) {
        const timelineData = buildTimeline(res.bookedSlots, res.lockedSlots);
        setTimeline(timelineData);
      }
    } catch (err) {
      console.error("Failed to fetch timeline:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [yachtId, day.date]);

  // 📅 Handle booking time inputs
  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBooking((prev) => ({ ...prev, [name]: value }));
  };

  // 🧭 Handle slot click
  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
    setBooking({ start: "", end: "" });
    document.activeElement?.blur(); // avoid aria-hidden warning

    if (slot.type === "free") {
      const modal = new window.bootstrap.Modal(document.getElementById("lockModal"));
      modal.show();
    } else if (slot.type === "locked") {
      const modal = new window.bootstrap.Modal(document.getElementById("confirmModal"));
      modal.show();
    } else if (slot.type === "booked") {
      alert("⛔ This slot is already booked and cannot be modified.");
    }
  };

  // 🔒 Lock a slot
  const handleLockSlot = async (e) => {
    e.preventDefault();
    try {
      console.log("In handle lock ")
      document.activeElement?.blur();
      const res = await lockSlot(yachtId, day.date, booking.start, booking.end, token);
      console.log("Lock Slot res -- ", res)
      if (res?.success) {
        alert("✅ Slot locked successfully!");
        const modal = window.bootstrap.Modal.getInstance(document.getElementById("lockModal"));
        modal?.hide();
        fetchTimeline();
      } else {
        alert(res?.message || "Failed to lock slot");
      }
    } catch (err) {
      console.error("Lock slot error:", err);
      alert("Error locking slot");
    }
  };

  // 🔓 Release a locked slot
  const handleReleaseLock = async () => {
    try {
      document.activeElement?.blur();
      const res = await releaseSlot( yachtId, day.date, selectedSlot.start, selectedSlot.end, token );
      console.log("Lock response : " , res)
      if (res?.success) {
        alert("🔓 Slot released successfully!");
        const modal = window.bootstrap.Modal.getInstance(document.getElementById("confirmModal"));
        modal?.hide();
        fetchTimeline();
      } else {
        alert(res?.data?.message || "Failed to release slot");
      }
    } catch (err) {
      console.error("Release slot error:", err);
      alert(err?.response?.data?.message);
    }
  };

  // ✅ Confirm booking
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    try {
      document.activeElement?.blur();

      const payload = {
        yachtId,
        date: day.date,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
        quotedAmount: 0,
        customerId: "replace_with_customer_id", // set actual customer ID
      };

      const res = await createBooking(payload, token);

      if (res) {
        alert("🎉 Booking confirmed!");
        const modal = window.bootstrap.Modal.getInstance(document.getElementById("confirmModal"));
        modal?.hide();
        fetchTimeline();
      }
    } catch (err) {
      console.error("Booking confirm error:", err);
      alert("Failed to confirm booking");
    }
  };

  return (
    <div className="container mt-4">
      <button className="btn btn-outline-secondary mb-3" onClick={() => navigate(-1)}>
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
          {timeline.map((slot, i) => (
            <div
              key={i}
              onClick={() => handleSlotClick(slot)}
              className={`p-3 mb-2 rounded text-center fw-semibold cursor-pointer ${slot.type === "booked"
                ? "bg-danger text-white"
                : slot.type === "locked"
                  ? "bg-warning text-dark"
                  : "bg-success text-white"
                }`}
              style={{ cursor: "pointer" }}
            >
              {slot.type.charAt(0).toUpperCase() + slot.type.slice(1)} — {slot.start} to {slot.end}
            </div>
          ))}
        </div>
      )}

      {/* 🔒 Lock Modal */}
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
                    <input
                      type="time"
                      className="form-control mb-2"
                      name="start"
                      value={booking.start}
                      min={selectedSlot.start}
                      max={selectedSlot.end}
                      onChange={handleBookingChange}
                      required
                    />
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
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
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

      {/* ✅ Confirm Booking Modal */}
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
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleReleaseLock}
                >
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
