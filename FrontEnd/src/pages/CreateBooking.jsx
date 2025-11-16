import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createBookingAPI } from "../services/operations/bookingAPI";
import {
  createCustomerAPI,
  getCustomerByEmailAPI,
} from "../services/operations/customerAPI";
import { getAllYachtsAPI } from "../services/operations/yautAPI";
import { toast } from "react-hot-toast";

function CreateBooking() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state || {};

  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    govtId: "",
    email: "",
    yachtId: prefill.yachtId || "",
    totalAmount: "",
    date: prefill.date || "",
    startTime: prefill.startTime || "",
    endTime: prefill.endTime || "",
    numPeople: "",
  });

  const [yachts, setYachts] = useState([]);
  const [startTimeOptions, setStartTimeOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [runningCost, setRunningCost] = useState(0);

  // Time helpers
  const hhmmToMinutes = (time = "00:00") => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const minutesToHHMM = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  // ✅ Fetch yachts
  useEffect(() => {
    const fetchYachts = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await getAllYachtsAPI(token);
        const yachtList = Array.isArray(res?.data?.yachts)
          ? res.data.yachts
          : [];
        setYachts(yachtList);
      } catch (err) {
        console.error("Failed to fetch yachts:", err);
      }
    };
    fetchYachts();
  }, []);

  // ✅ Slot generator with special slot logic
  const buildSlotsForYacht = (yacht) => {
    if (
      !yacht ||
      !yacht.sailStartTime ||
      !yacht.sailEndTime ||
      !(yacht.slotDurationMinutes || yacht.duration)
    )
      return [];

    const duration = yacht.slotDurationMinutes || yacht.duration;
    let durationMinutes = 0;

    if (typeof duration === "string" && duration.includes(":")) {
      const [dh, dm] = duration.split(":").map(Number);
      durationMinutes = (dh || 0) * 60 + (dm || 0);
    } else {
      durationMinutes = Number(duration) || 0;
    }

    if (durationMinutes <= 0) return [];

    const dayStart = yacht.sailStartTime;
    const dayEnd = yacht.sailEndTime;
    const specialSlotTime = yacht.specialSlot || null;

    const startMin = hhmmToMinutes(dayStart);
    const endMin = hhmmToMinutes(dayEnd);

    if (endMin <= startMin) return [];

    const specialMin = specialSlotTime ? hhmmToMinutes(specialSlotTime) : null;
    const specialIsValid =
      specialMin && specialMin >= startMin && specialMin < endMin;

    const slots = [];
    let cursor = startMin;

    while (cursor < endMin) {
      // handle special slot split
      if (
        specialIsValid &&
        specialMin > cursor &&
        specialMin < cursor + durationMinutes
      ) {
        if (specialMin > cursor) {
          slots.push({
            start: minutesToHHMM(cursor),
            end: minutesToHHMM(specialMin),
          });
        }

        const specialEnd = Math.min(specialMin + durationMinutes, endMin);
        slots.push({
          start: minutesToHHMM(specialMin),
          end: minutesToHHMM(specialEnd),
        });

        cursor = specialEnd;
        continue;
      }

      const next = Math.min(cursor + durationMinutes, endMin);
      slots.push({ start: minutesToHHMM(cursor), end: minutesToHHMM(next) });
      cursor = next;
    }

    // dedupe & sort
    const seen = new Set();
    const unique = slots.filter((s) => {
      const key = `${s.start}-${s.end}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique.sort(
      (a, b) => hhmmToMinutes(a.start) - hhmmToMinutes(b.start)
    );
  };

  // ✅ Update startTimeOptions whenever yacht changes
  useEffect(() => {
    const selectedYacht = yachts.find((y) => y.id === formData.yachtId);
    if (!selectedYacht) {
      setStartTimeOptions([]);
      return;
    }

    setRunningCost(selectedYacht.runningCost || 0);
    const slots = buildSlotsForYacht(selectedYacht);
    setStartTimeOptions(slots);

    // auto-set endTime if startTime exists
    if (formData.startTime) {
      const match = slots.find((s) => s.start === formData.startTime);
      if (match) {
        setFormData((p) => ({ ...p, endTime: match.end }));
      }
    }
  }, [formData.yachtId, yachts]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "yachtId") {
      setFormData((prev) => ({
        ...prev,
        yachtId: value,
        startTime: "",
        endTime: "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleStartSelect = (e) => {
    const start = e.target.value;
    const slot = startTimeOptions.find((s) => s.start === start);
    setFormData((prev) => ({
      ...prev,
      startTime: start,
      endTime: slot ? slot.end : "",
    }));
  };

  const isAmountInvalid =
    formData.totalAmount &&
    runningCost &&
    parseFloat(formData.totalAmount) < runningCost;

  // ✅ Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("authToken");

      const selectedYacht = yachts.find((y) => y.id === formData.yachtId);
      if (!selectedYacht) {
        alert("Please select a yacht first.");
        setLoading(false);
        return;
      }

      if (parseFloat(formData.totalAmount) < selectedYacht.runningCost) {
        alert(
          `Total Amount must be ≥ yacht running cost (₹${selectedYacht.runningCost}).`
        );
        setLoading(false);
        return;
      }

      const { data } = await getCustomerByEmailAPI(formData.email, token);
      let customerId = data.customer?._id;

      if (!data.customer) {
        const payload = new FormData();
        for (let key in formData) payload.append(key, formData[key]);

        const res = await createCustomerAPI(payload, token);
        customerId = res?.data?._id;
      }

      const bookingPayload = {
        customerId,
        employeeId: "replace_with_employee_id",
        yachtId: formData.yachtId,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        quotedAmount: Number(formData.totalAmount),
        numPeople: Number(formData.numPeople),
      };

      await createBookingAPI(bookingPayload, token);

      toast.success("✅ Booking created successfully!", {
        duration: 3000,
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
      navigate("/bookings");
    } catch (err) {
      console.error("Booking failed:", err);
      setError(err.response?.data?.message || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Loader */}
      {loading && (
        <div className="blur-loader-overlay">
          <div className="custom-spinner"></div>
        </div>
      )}

      <style>
        {`
        .blur-loader-overlay {
          position: fixed;
          top: 0; left: 0;
          width: 100%; height: 100%;
          backdrop-filter: blur(6px);
          background: rgba(0,0,0,0.45);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 99999;
        }

        .custom-spinner {
          width: 70px;
          height: 70px;
          border: 6px solid #ffffff90;
          border-top-color: #00c2ff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}
      </style>

      <div className={`container my-4 px-3 ${loading ? "blur" : ""}`}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4>Create Booking</h4>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form className="row g-3" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="col-md-6">
            <label className="form-label fw-bold">Full Name</label>
            <input
              type="text"
              className="form-control border border-dark text-dark"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Contact */}
          <div className="col-md-6">
            <label className="form-label fw-bold">Contact Number</label>
            <input
              type="tel"
              className="form-control border border-dark text-dark"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              required
            />
          </div>

          {/* Email */}
          <div className="col-md-6">
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

          {/* Govt ID */}
          <div className="col-md-6">
            <label className="form-label fw-bold">Govt ID Number</label>
            <input
              type="text"
              className="form-control border border-dark text-dark"
              name="govtId"
              value={formData.govtId}
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
              className={`form-control border text-dark ${
                isAmountInvalid
                  ? "border-danger is-invalid"
                  : "border-dark"
              }`}
              name="totalAmount"
              value={formData.totalAmount}
              onChange={handleChange}
              required
            />
            {isAmountInvalid && (
              <div className="text-danger mt-1">
                ⚠ Total amount must be at least ₹{runningCost}.
              </div>
            )}
          </div>

          {/* Date */}
          <div className="col-md-4">
            <label className="form-label fw-bold">Date of Ride</label>
            <input
              type="date"
              min={new Date().toISOString().split("T")[0]}
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

          <div className="col-12 text-center">
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading || isAmountInvalid}
            >
              {loading ? "Creating..." : "Create Booking"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default CreateBooking;
