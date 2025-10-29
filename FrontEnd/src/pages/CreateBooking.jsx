import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createBookingAPI } from "../services/operations/bookingAPI";
import { getCustomerByEmailAPI } from "../services/operations/customerAPI";
import { getAllYachtsAPI } from "../services/operations/yautAPI";

function CreateBooking() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state || {};

  const [formData, setFormData] = useState({
    email: "",
    yachtId: prefill.yachtId || "",
    totalAmount: "",
    date: prefill.date || "",
    startTime: prefill.startTime || "",
    endTime: prefill.endTime || "",
    numPeople: "",
  });

  const [yachts, setYachts] = useState([]);
  const [startTimeOptions, setStartTimeOptions] = useState([]); // [{start, end}]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hhmmToMinutes = (time) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };
  const minutesToHHMM = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  // Fetch yachts
  useEffect(() => {
    const fetchYachts = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await getAllYachtsAPI(token);
        const yachtList = Array.isArray(res?.data?.yachts) ? res.data.yachts : [];
        setYachts(yachtList);
      } catch (err) {
        console.error("Failed to fetch yachts:", err);
        setYachts([]);
      }
    };
    fetchYachts();
  }, []);

  // Build slot list (avoids overlap)
  const buildSlotsForYacht = (yacht) => {
    if (!yacht || !yacht.sailStartTime || !yacht.sailEndTime || !yacht.slotDurationMinutes)
      return [];

    let durationMinutes = 0;
    if (typeof yacht.slotDurationMinutes === "string" && yacht.slotDurationMinutes.includes(":")) {
      const [dh, dm] = yacht.slotDurationMinutes.split(":").map(Number);
      durationMinutes = dh * 60 + dm;
    } else {
      durationMinutes = Number(yacht.slotDurationMinutes) || 0;
    }
    if (durationMinutes <= 0) return [];

    const startMin = hhmmToMinutes(yacht.sailStartTime);
    const endMin = hhmmToMinutes(yacht.sailEndTime);
    if (endMin <= startMin) return [];

    const specialMin = yacht.specialSlot ? hhmmToMinutes(yacht.specialSlot) : null;
    const specialIsValid = specialMin && specialMin >= startMin && specialMin < endMin;

    const slots = [];
    let cursor = startMin;

    while (cursor < endMin) {
      // Split slot if special falls inside
      if (specialIsValid && specialMin > cursor && specialMin < cursor + durationMinutes) {
        if (specialMin > cursor) {
          slots.push({ start: minutesToHHMM(cursor), end: minutesToHHMM(specialMin) });
        }
        const specialEnd = Math.min(specialMin + durationMinutes, endMin);
        slots.push({ start: minutesToHHMM(specialMin), end: minutesToHHMM(specialEnd) });
        cursor = specialEnd;
        continue;
      }

      // Regular slot or truncated last
      const next = Math.min(cursor + durationMinutes, endMin);
      slots.push({ start: minutesToHHMM(cursor), end: minutesToHHMM(next) });
      cursor = next;
    }

    // Remove duplicates and sort
    const seen = new Set();
    const unique = slots.filter((s) => {
      const key = `${s.start}-${s.end}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    unique.sort((a, b) => hhmmToMinutes(a.start) - hhmmToMinutes(b.start));
    return unique;
  };

  // Update slots when yacht changes
  useEffect(() => {
    const selectedYacht = yachts.find((y) => y.id === formData.yachtId);
    if (!selectedYacht) {
      setStartTimeOptions([]);
      return;
    }

    const slots = buildSlotsForYacht(selectedYacht);
    setStartTimeOptions(slots);

    // auto-update endTime if startTime already selected
    if (formData.startTime) {
      const match = slots.find((s) => s.start === formData.startTime);
      if (match) {
        setFormData((p) => ({ ...p, endTime: match.end }));
      }
    }
  }, [formData.yachtId, yachts]);

  const handleStartSelect = (e) => {
    const start = e.target.value;
    const slot = startTimeOptions.find((s) => s.start === start);
    setFormData((prev) => ({
      ...prev,
      startTime: start,
      endTime: slot ? slot.end : "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "yachtId") {
      setFormData((prev) => ({ ...prev, yachtId: value, startTime: "", endTime: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("authToken");
      const { data: customer } = await getCustomerByEmailAPI(formData.email, token);

      if (!customer?._id) {
        setError("Customer not found. Please check the email.");
        setLoading(false);
        return;
      }

      const payload = {
        customerId: customer._id,
        employeeId: "replace_with_actual_employee_id",
        yachtId: formData.yachtId,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        quotedAmount: parseFloat(formData.totalAmount),
        numPeople: parseInt(formData.numPeople, 10),
      };

      await createBookingAPI(payload, token);
      alert("✅ Booking created successfully!");
      navigate("/bookings");
    } catch (err) {
      console.error("Booking creation failed:", err);
      setError(err.response?.data?.message || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container my-4 px-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Create Booking</h4>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          &larr; Back
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form className="row g-3" onSubmit={handleSubmit}>
        {/* Customer Email */}
        <div className="col-12">
          <label className="form-label fw-bold">Customer Email</label>
          <input
            type="email"
            className="form-control border border-dark text-dark"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        {/* Yacht */}
        <div className="col-12">
          <label className="form-label fw-bold">Select Yacht</label>
          <select
            className="form-select border border-dark text-dark"
            name="yachtId"
            value={formData.yachtId}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Yacht --</option>
            {yachts.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
              </option>
            ))}
          </select>
        </div>

        {/* Total Amount */}
        <div className="col-md-4">
          <label className="form-label fw-bold">Total Amount</label>
          <input
            type="number"
            className="form-control border border-dark text-dark"
            name="totalAmount"
            value={formData.totalAmount}
            onChange={handleChange}
            required
          />
        </div>

        {/* Date */}
        <div className="col-md-4">
          <label className="form-label fw-bold">Date of Ride</label>
          <input
            type="date"
            className="form-control border border-dark text-dark"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        {/* Start Time */}
        <div className="col-md-4">
          <label className="form-label fw-bold">Start Time</label>
          <select
            className="form-select border border-dark text-dark"
            name="startTime"
            value={formData.startTime}
            onChange={handleStartSelect}
            required
          >
            <option value="">-- Select Start Time --</option>
            {startTimeOptions.map((opt, i) => (
              <option key={i} value={opt.start}>
                {opt.start}
              </option>
            ))}
          </select>
        </div>

        {/* End Time */}
        <div className="col-md-4">
          <label className="form-label fw-bold">End Time</label>
          <input
            type="time"
            className="form-control border border-dark text-dark"
            name="endTime"
            value={formData.endTime}
            readOnly
          />
        </div>

        {/* Number of People */}
        <div className="col-md-4">
          <label className="form-label fw-bold">Number of People</label>
          <input
            type="number"
            className="form-control border border-dark text-dark"
            name="numPeople"
            value={formData.numPeople}
            onChange={handleChange}
            required
          />
        </div>

        {/* Submit */}
        <div className="col-12 text-center">
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Creating..." : "Create Booking"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateBooking;
